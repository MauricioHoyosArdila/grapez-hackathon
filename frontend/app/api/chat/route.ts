import { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
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

  const { message, clientId } = await req.json()

  const userId = (session.userEmail ?? "local_dev_user").replace(/[^a-zA-Z0-9_]/g, "_")
  const sessionId = `grapez_${clientId}`
  const tokens = {
    access_token: session.accessToken ?? "",
    refresh_token: session.refreshToken ?? "",
  }

  try {
    const agentMode = process.env.AGENT_MODE ?? "local"
    const stream =
      agentMode === "production"
        ? await callAgentRuntime(userId, sessionId, message, tokens)
        : await callLocalAdk(userId, sessionId, message, tokens)

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

// ─── Local ADK dev server ────────────────────────────────────────────────────

async function callLocalAdk(
  userId: string,
  sessionId: string,
  message: string,
  tokens: { access_token: string; refresh_token: string }
): Promise<ReadableStream<Uint8Array>> {
  const base = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"

  await ensureAdkSession(base, userId, sessionId, tokens)

  const res = await fetch(`${base}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: { parts: [{ text: message }] },
      streaming: false,
    }),
  })

  if (!res.ok || !res.body) {
    throw new Error(`ADK server responded ${res.status}`)
  }

  return transformAdkStream(res.body)
}

async function ensureAdkSession(
  base: string,
  userId: string,
  sessionId: string,
  tokens: { access_token: string; refresh_token: string }
) {
  const sessionsBase = `${base}/apps/${APP_NAME}/users/${userId}/sessions`
  const check = await fetch(`${sessionsBase}/${sessionId}`)

  if (check.ok) {
    // Refresh tokens in existing session so sub-agents always have current credentials
    await fetch(`${sessionsBase}/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state_delta: tokens }),
    })
    return
  }

  // Create new session with tokens in state
  await fetch(sessionsBase, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, state: tokens }),
  })
}

// ─── Agent Runtime (Semana 5) ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function callAgentRuntime(
  _userId: string,
  _sessionId: string,
  _message: string,
  _tokens: { access_token: string; refresh_token: string }
): Promise<ReadableStream<Uint8Array>> {
  // TODO Semana 5: implementar con Vertex AI ReasoningEngine streamQuery API
  // POST https://{AGENT_ENGINE_REGION}-aiplatform.googleapis.com/v1/{PLANNER_AGENT_ENGINE_ID}:streamQuery
  // Auth: GoogleAuth({ scopes: ["https://www.googleapis.com/auth/cloud-platform"] })
  throw new Error(
    "Agent Runtime no configurado — usa AGENT_MODE=local para desarrollo. " +
    "Implementar callAgentRuntime() para producción."
  )
}

// ─── SSE transformer ──────────────────────────────────────────────────────────

// Transforms ADK JSON event stream into plain-text SSE for the frontend.
// Newlines within text chunks are encoded as |NL| so they survive the client's
// line-by-line SSE parser. ChatClient.tsx decodes |NL| back to \n.
function transformAdkStream(body: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = body.getReader()
      let buffer = ""

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue
            const raw = line.slice(6).trim()
            if (!raw) continue

            let event: Record<string, unknown>
            try {
              event = JSON.parse(raw)
            } catch {
              continue
            }

            if (typeof event.error === "string") {
              controller.enqueue(encoder.encode(`data: ⚠️ ${event.error}\n`))
              continue
            }

            type Part = { text?: string; function_call?: unknown; function_response?: unknown }
            const parts =
              (event.content as { parts?: Part[] } | undefined)?.parts ?? []

            // Solo texto del agente raíz — los sub-agentes (ga4_agent, gtm_agent)
            // generan sus propios eventos que el planner ya incorpora en su respuesta.
            if (event.author !== APP_NAME) continue

            for (const part of parts) {
              if (typeof part.text === "string" && part.text) {
                const encoded = part.text.replace(/\n/g, "|NL|")
                controller.enqueue(encoder.encode(`data: ${encoded}\n`))
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
        controller.close()
      }
    },
  })
}
