import { NextRequest } from "next/server"
import { getIronSession, type IronSession } from "iron-session"
import { SessionData, sessionOptions } from "@/lib/session"
import { cookies } from "next/headers"

const APP_NAME = "planner_agent"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    await refreshTokensIfNeeded(session)
  } catch (err) {
    if ((err as { code?: string }).code === "token_expired") {
      return new Response(JSON.stringify({ error: "token_expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }
    throw err
  }

  const { message, clientId, image } = (await req.json()) as {
    message: string
    clientId: string
    image?: { mimeType: string; data: string }
  }

  const userId = (session.userEmail ?? "local-dev-user").replace(/[^a-z0-9-]/g, "-")
  const localSessionId = `grapez-${clientId.replace(/[^a-z0-9-]/g, "-")}`
  const tokens = {
    access_token: session.accessToken ?? "",
    refresh_token: session.refreshToken ?? "",
    token_expiry: session.tokenExpiry ? Math.floor(session.tokenExpiry / 1000) : 0,
  }

  try {
    const agentMode = process.env.AGENT_MODE ?? "local"
    let stream: ReadableStream<Uint8Array>

    if (agentMode === "production") {
      // For Agent Runtime, sessions are server-assigned. We store the server ID in
      // iron-session so subsequent messages reuse the same conversation history.
      // streamQuery only accepts a text message — images can't travel by this channel.
      const productionMessage = image
        ? `${message}\n\n[Nota: el consultor adjuntó una imagen que este canal no puede transmitir — pídele que la describa en texto.]`
        : message
      const storedAgentSessionId = session.agentSessions?.[clientId]
      const { stream: agentStream, sessionId: assignedSessionId } =
        await callAgentRuntime(userId, storedAgentSessionId ?? null, productionMessage, tokens)

      // Persist the server-assigned session ID if it's new
      if (assignedSessionId && assignedSessionId !== storedAgentSessionId) {
        session.agentSessions = { ...session.agentSessions, [clientId]: assignedSessionId }
        await session.save()
      }

      stream = agentStream
    } else {
      stream = await callLocalAdk(userId, localSessionId, message, tokens, image)
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error del agente"
    return new Response(JSON.stringify({ error: msg }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// ─── Token refresh ───────────────────────────────────────────────────────────

async function refreshTokensIfNeeded(session: IronSession<SessionData>): Promise<void> {
  if (!session.refreshToken) {
    throw Object.assign(new Error("no_refresh_token"), { code: "token_expired" })
  }
  const notExpired = session.tokenExpiry && Date.now() < session.tokenExpiry
  if (notExpired) return

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    const errBody = await res.text().catch(() => "")
    console.error("[token refresh] failed:", res.status, errBody.slice(0, 200))
    throw Object.assign(new Error("token_refresh_failed"), { code: "token_expired" })
  }

  const data = await res.json()
  session.accessToken = data.access_token
  session.tokenExpiry = Date.now() + ((data.expires_in ?? 3600) - 300) * 1000
  await session.save()
  console.log("[token refresh] refreshed successfully, new expiry in", data.expires_in ?? 3600, "s")
}

// ─── Local ADK dev server ────────────────────────────────────────────────────

async function callLocalAdk(
  userId: string,
  sessionId: string,
  message: string,
  tokens: { access_token: string; refresh_token: string; token_expiry: number },
  image?: { mimeType: string; data: string }
): Promise<ReadableStream<Uint8Array>> {
  const base = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"

  await ensureAdkSession(base, userId, sessionId, tokens)

  // Gemini is multimodal: images travel as inline_data parts alongside the text.
  const parts: Array<Record<string, unknown>> = []
  if (image) {
    parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } })
  }
  if (message) {
    parts.push({ text: message })
  }

  const res = await fetch(`${base}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: { parts },
      streaming: true,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`ADK server responded ${res.status}`)
  }

  return transformStream(res.body, "sse")
}

async function ensureAdkSession(
  base: string,
  userId: string,
  sessionId: string,
  tokens: { access_token: string; refresh_token: string; token_expiry: number }
) {
  const sessionsBase = `${base}/apps/${APP_NAME}/users/${userId}/sessions`
  const check = await fetch(`${sessionsBase}/${sessionId}`)

  if (check.ok) {
    await fetch(`${sessionsBase}/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state_delta: tokens }),
    })
    return
  }

  await fetch(sessionsBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, state: tokens }),
  })
}

// ─── Agent Runtime (production) ──────────────────────────────────────────────

async function callAgentRuntime(
  userId: string,
  storedSessionId: string | null,
  message: string,
  tokens: { access_token: string; refresh_token: string; token_expiry: number }
): Promise<{ stream: ReadableStream<Uint8Array>; sessionId: string | null }> {
  const region = process.env.AGENT_ENGINE_REGION ?? "us-central1"
  const project = process.env.AGENT_ENGINE_PROJECT
  const engineId = process.env.PLANNER_AGENT_ENGINE_ID

  if (!project || !engineId) {
    throw new Error("AGENT_ENGINE_PROJECT y PLANNER_AGENT_ENGINE_ID deben estar configurados")
  }

  const { GoogleAuth } = await import("google-auth-library")
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  if (!tokenResponse.token) {
    throw new Error("No se pudo obtener token de Google Cloud — verifica Application Default Credentials")
  }

  // streamQuery is only available in v1beta1 — v1 returns 200 with empty body for unknown methods
  const baseUrl =
    `https://${region}-aiplatform.googleapis.com/v1beta1/projects/${project}/locations/${region}` +
    `/reasoningEngines/${engineId}`

  const gcpToken = tokenResponse.token

  // Get or create a server-assigned session ID.
  // Agent Runtime assigns session IDs — we can't use our own custom IDs.
  const sessionId = storedSessionId ?? await createAgentRuntimeSession(baseUrl, gcpToken, userId)
  console.log(`[Agent Runtime] using session=${sessionId ?? "none (will auto-create)"}`)

  // Tokens embedded in message — the agent reads [Sistema: ...] and calls
  // load_client_tokens(access_token, refresh_token) on its first turn.
  const messageWithTokens = tokens.access_token
    ? `[Sistema: access_token=${tokens.access_token} refresh_token=${tokens.refresh_token} token_expiry=${tokens.token_expiry}]\n\n${message}`
    : message

  const body: Record<string, unknown> = {
    input: { user_id: userId, message: messageWithTokens },
  }
  if (sessionId) (body.input as Record<string, unknown>).session_id = sessionId

  const res = await fetch(`${baseUrl}:streamQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gcpToken}`,
    },
    body: JSON.stringify(body),
  })

  console.log(`[Agent Runtime streamQuery] status=${res.status} content-type=${res.headers.get("content-type")} content-length=${res.headers.get("content-length")}`)

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Agent Runtime ${res.status}: ${errText.slice(0, 500)}`)
  }

  if (!res.body) throw new Error("Agent Runtime returned no body")

  return {
    stream: transformStream(res.body, "auto"),
    sessionId,
  }
}

// Creates a new Agent Runtime session and returns the server-assigned session ID.
// Agent Runtime assigns its own IDs — custom IDs are not supported.
// Returns null if creation fails (streamQuery will attempt to auto-create a session).
async function createAgentRuntimeSession(
  baseUrl: string,
  gcpToken: string,
  userId: string
): Promise<string | null> {
  const createRes = await fetch(`${baseUrl}/sessions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${gcpToken}`,
    },
    body: JSON.stringify({ user_id: userId }),
    signal: AbortSignal.timeout(10000),
  })

  const createBody = await createRes.text()
  console.log(`[Agent Runtime session] create ${createRes.status}: ${createBody.slice(0, 300)}`)

  if (!createRes.ok) return null

  try {
    const data = JSON.parse(createBody) as Record<string, unknown>
    // Response is a Long Running Operation (LRO):
    // { "name": "projects/.../sessions/{sessionId}/operations/{operationId}", ... }
    // The session ID is the segment AFTER "sessions/", not the last segment.
    const name = typeof data.name === "string" ? data.name : ""
    const parts = name.split("/")
    const sessionsIdx = parts.indexOf("sessions")
    const serverId = sessionsIdx !== -1 ? parts[sessionsIdx + 1] : undefined
    if (serverId) {
      console.log(`[Agent Runtime session] assigned id="${serverId}"`)
      return serverId
    }
  } catch { /* ignore */ }

  return null
}

// ─── ndjson → SSE (Agent Runtime production response) ────────────────────────

// Agent Runtime streamQuery returns ndjson OR SSE (with "data: " prefix).
// We handle both: strip the prefix if present, then parse JSON.
function ndjsonToSseStream(body: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  let matchedAuthor = 0
  let otherAuthors: string[] = []

  for (const line of body.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Strip "data: " prefix if present (SSE format) — otherwise treat as raw JSON (ndjson)
    const raw = trimmed.startsWith("data: ") ? trimmed.slice(6).trim() : trimmed
    if (!raw || raw === "[DONE]") continue

    let event: Record<string, unknown>
    try { event = JSON.parse(raw) } catch { continue }

    const author = typeof event.author === "string" ? event.author : null

    if (author !== APP_NAME) {
      if (author && !otherAuthors.includes(author)) otherAuthors.push(author)
      continue
    }

    matchedAuthor++
    type Part = { text?: string }
    const parts = (event.content as { parts?: Part[] } | undefined)?.parts ?? []
    for (const part of parts) {
      if (typeof part.text === "string" && part.text) {
        chunks.push(encoder.encode(`data: ${part.text.replace(/\n/g, "|NL|")}\n`))
      }
    }
  }

  console.log(`[Agent Runtime] matched author="${APP_NAME}" × ${matchedAuthor}, other authors: ${otherAuthors.join(",")||"none"}, text chunks: ${chunks.length}`)

  // Fallback: if the planner_agent produced no text but other agents did, show their text.
  // This handles cases where the agent name in the deployed runtime differs from APP_NAME.
  if (chunks.length === 0 && otherAuthors.length > 0) {
    console.log(`[Agent Runtime] fallback: re-parsing without author filter`)
    for (const line of body.split("\n")) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const raw = trimmed.startsWith("data: ") ? trimmed.slice(6).trim() : trimmed
      if (!raw || raw === "[DONE]") continue
      let event: Record<string, unknown>
      try { event = JSON.parse(raw) } catch { continue }
      type Part = { text?: string }
      const parts = (event.content as { parts?: Part[] } | undefined)?.parts ?? []
      for (const part of parts) {
        if (typeof part.text === "string" && part.text) {
          chunks.push(encoder.encode(`data: ${part.text.replace(/\n/g, "|NL|")}\n`))
        }
      }
    }
  }

  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk)
      controller.close()
    },
  })
}

// ─── Stream transformer ───────────────────────────────────────────────────────

// Friendly labels for tool calls — shown in the chat as "working" status while
// the agent runs long operations. Unknown tools fall back to a generic label.
const TOOL_STATUS_LABELS: Record<string, string> = {
  ga4_agent: "Revisando Google Analytics…",
  gtm_agent: "Revisando Google Tag Manager…",
  web_analyzer_agent: "Analizando tu sitio web…",
  brave_web_search: "Investigando tu negocio en internet…",
  crawl_site: "Explorando tu sitio web…",
  screenshot_site: "Tomando una captura de tu sitio…",
}
const DEFAULT_TOOL_STATUS = "Trabajando…"

// Handles SSE and ndjson formats:
//   "sse"  — local ADK: lines prefixed with "data: " (skip lines without prefix)
//   "auto" — Agent Runtime: "data: " prefix stripped when present, raw JSON otherwise
//
// Output: plain-text SSE for the frontend. Newlines in text are encoded as |NL|
// so they survive the client's line-by-line SSE parser. Tool calls are emitted
// as "data: |STATUS|<label>" lines so the chat can show a working indicator.
function transformStream(
  body: ReadableStream<Uint8Array>,
  format: "sse" | "auto"
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader()
      let buffer = ""
      let linesProcessed = 0
      let eventsSeen = 0
      let authorMismatches = 0
      // Con streaming:true el ADK emite eventos parciales (delta por token) y al final
      // un evento agregado con el texto completo del turno — hay que saltar el agregado
      // para no duplicar el texto.
      let sawPartial = false

      const processLine = (line: string) => {
        const trimmed = line.trim()
        if (!trimmed) return
        linesProcessed++

        let raw: string
        if (format === "auto") {
          // handle both "data: {...}" and raw "{...}"
          raw = trimmed.startsWith("data: ") ? trimmed.slice(6).trim() : trimmed
        } else {
          // "sse": only process lines with "data: " prefix
          raw = trimmed.startsWith("data: ") ? trimmed.slice(6).trim() : ""
        }

        if (!raw || raw === "[DONE]") return

        let event: Record<string, unknown>
        try {
          event = JSON.parse(raw)
        } catch {
          return
        }

        if (typeof event.error === "string") {
          controller.enqueue(encoder.encode(`data: ⚠️ ${event.error}\n`))
          return
        }

        eventsSeen++
        if (event.author !== APP_NAME) {
          authorMismatches++
          return
        }

        type FunctionCall = { name?: string }
        type Part = {
          text?: string
          function_call?: FunctionCall
          functionCall?: FunctionCall
          function_response?: unknown
        }
        const parts = (event.content as { parts?: Part[] } | undefined)?.parts ?? []

        const isPartial = event.partial === true

        for (const part of parts) {
          if (typeof part.text === "string" && part.text) {
            if (isPartial) {
              sawPartial = true
              controller.enqueue(encoder.encode(`data: ${part.text.replace(/\n/g, "|NL|")}\n`))
            } else if (sawPartial) {
              // Evento agregado al final del turno streameado — ya emitimos sus deltas
              sawPartial = false
            } else {
              // Turno sin partials (ej: respuesta corta no streameada) — emitir completo
              controller.enqueue(encoder.encode(`data: ${part.text.replace(/\n/g, "|NL|")}\n`))
            }
          }
          const toolName = part.functionCall?.name ?? part.function_call?.name
          if (toolName) {
            const label = TOOL_STATUS_LABELS[toolName] ?? DEFAULT_TOOL_STATUS
            controller.enqueue(encoder.encode(`data: |STATUS|${label}\n`))
          }
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            if (buffer.trim()) processLine(buffer)
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) processLine(line)
        }
      } finally {
        reader.releaseLock()
        console.log(`[transformStream format=${format}] lines=${linesProcessed} events=${eventsSeen} authorMismatches=${authorMismatches}`)
        controller.close()
      }
    },
  })
}
