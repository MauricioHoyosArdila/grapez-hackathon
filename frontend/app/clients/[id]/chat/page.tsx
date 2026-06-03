import { notFound, redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { mockClients } from "@/lib/mock-clients"
import { SessionData, sessionOptions } from "@/lib/session"
import { parseA2UI } from "@/lib/parse-a2ui"
import { Client, ChatMessage } from "@/lib/types"
import { ChatClient } from "./ChatClient"

const APP_NAME = "planner_agent"

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ reset?: string }>
}

export default async function ChatPage({ params, searchParams }: Props) {
  const { id } = await params
  const { reset } = await searchParams

  // Demo clients are public — no login required
  const mockClient = mockClients.find((c) => c.id === id)
  if (mockClient?.isDemo) {
    return (
      <ChatClient
        client={mockClient}
        initialMessages={mockClient.demoConversation ?? []}
        readOnly
      />
    )
  }

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn) redirect("/")

  const storedClient = (session.createdClients ?? []).find((c) => c.id === id)
  const client: Client | undefined = mockClient ?? (storedClient
    ? {
        id: storedClient.id,
        name: storedClient.name,
        websiteUrl: storedClient.websiteUrl,
        industry: storedClient.industry,
        modo: storedClient.modo,
        status: "connected",
        isDemo: false,
      }
    : undefined)

  if (!client) notFound()

  // Live client: real ADK session
  if (reset === "true") {
    await deleteAdkSession(session.userEmail, id)
    return <ChatClient client={client} initialMessages={[]} />
  }

  const initialMessages = await loadSessionHistory(session.userEmail, id)
  return <ChatClient client={client} initialMessages={initialMessages} />
}

async function deleteAdkSession(userEmail: string | undefined, clientId: string) {
  if (process.env.AGENT_MODE === "production") return

  const adkUrl = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"
  const userId = (userEmail ?? "local_dev_user").replace(/[^a-zA-Z0-9_]/g, "_")
  const sessionId = `grapez_${clientId}`

  try {
    await fetch(`${adkUrl}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(3000),
    })
  } catch {
    // ADK server may not be running — session will be recreated on first message
  }
}

async function loadSessionHistory(
  userEmail: string | undefined,
  clientId: string
): Promise<ChatMessage[]> {
  if (process.env.AGENT_MODE === "production") return []

  const adkUrl = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"
  const userId = (userEmail ?? "local_dev_user").replace(/[^a-zA-Z0-9_]/g, "_")
  const sessionId = `grapez_${clientId}`

  try {
    const res = await fetch(
      `${adkUrl}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
      { cache: "no-store", signal: AbortSignal.timeout(3000) }
    )
    if (!res.ok) return []

    const data = await res.json()
    return eventsToMessages(data.events ?? [])
  } catch {
    return []
  }
}

// ─── ADK event → ChatMessage ──────────────────────────────────────────────────

type AdkPart = {
  text?: string
  function_call?: unknown
  function_response?: unknown
}

type AdkEvent = {
  id: string
  author: string
  content?: { parts?: AdkPart[] }
  created_at?: string
}

function eventsToMessages(events: AdkEvent[]): ChatMessage[] {
  const messages: ChatMessage[] = []
  let currentRole: "user" | "assistant" | null = null
  let currentText = ""
  let currentId = ""
  let currentTimestamp = new Date()

  const flush = () => {
    if (!currentText.trim() || currentRole === null) return
    const parsed = parseA2UI(currentText)
    messages.push({
      id: currentId,
      role: currentRole,
      content: parsed.text ?? "",
      components: parsed.components,
      timestamp: currentTimestamp,
    })
    currentText = ""
  }

  for (const event of events) {
    const textParts =
      event.content?.parts?.filter(
        (p) => typeof p.text === "string" && p.text && !p.function_call && !p.function_response
      ) ?? []

    if (textParts.length === 0) continue

    const text = textParts.map((p) => p.text).join("")
    const role: "user" | "assistant" = event.author === "user" ? "user" : "assistant"
    const ts = event.created_at ? new Date(event.created_at) : new Date()

    if (role !== currentRole) {
      flush()
      currentRole = role
      currentId = event.id
      currentTimestamp = ts
    }

    currentText += text
  }

  flush()
  return messages
}
