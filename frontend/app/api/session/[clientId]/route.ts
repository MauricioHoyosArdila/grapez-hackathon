import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"

const APP_NAME = "planner_agent"

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const userId = (session.userEmail ?? "local_dev_user").replace(/[^a-zA-Z0-9_]/g, "_")
  const sessionId = `grapez_${clientId}`
  const adkUrl = process.env.AGENT_DEV_SERVER_URL ?? "http://127.0.0.1:8000"

  try {
    await fetch(`${adkUrl}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`, {
      method: "DELETE",
    })
  } catch {
    // ADK server may not be running — that's fine, session just won't exist
  }

  return NextResponse.json({ ok: true })
}
