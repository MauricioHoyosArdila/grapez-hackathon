import { notFound, redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { mockClients } from "@/lib/mock-clients"
import { SessionData, sessionOptions } from "@/lib/session"
import { parseA2UI } from "@/lib/parse-a2ui"
import { ChatMessage } from "@/lib/types"
import { ChatClient } from "./ChatClient"

const APP_NAME = "planner_agent"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const client = mockClients.find((c) => c.id === id)
  if (!client) notFound()

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) redirect("/")

  const initialMessages = await loadSessionHistory(session.userEmail, id)

  return <ChatClient client={client} initialMessages={initialMessages} />
}

async function loadSessionHistory(
  userEmail: string | undefined,
  clientId: string
): Promise<ChatMessage[]> {
  const adkUrl = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"
  const userId = (userEmail ?? "local_dev_user").replace(/[^a-zA-Z0-9_]/g, "_")
  const sessionId = `grapez_${clientId}`

  try {
    const res = await fetch(
      `${adkUrl}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
      { cache: "no-store" }
    )
    if (!res.ok) return [] // 404 = sesión aún no existe

    const data = await res.json()
    return eventsToMessages(data.events ?? [])
  } catch {
    return [] // ADK server no disponible
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
      a2ui: parsed.a2ui,
      timestamp: currentTimestamp,
    })
    currentText = ""
  }

  for (const event of events) {
    // Extraer solo partes de texto (skip function_call / function_response)
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
