import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, StoredClient, sessionOptions } from "@/lib/session"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40)
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  const body = await req.json()
  const name: string = (body.name ?? "").trim()
  const websiteUrl: string = normalizeUrl(body.websiteUrl ?? "")
  const industry: string = (body.industry ?? "").trim()
  const modo = body.modo === "auditoria_implementacion" ? "auditoria_implementacion" : "auditoria" as const

  if (!name || !websiteUrl || !industry) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 })
  }

  const id = `${slugify(name)}-${Date.now().toString(36)}`

  const newClient: StoredClient = {
    id,
    name,
    websiteUrl,
    industry,
    modo,
    createdAt: new Date().toISOString(),
  }

  if (!session.createdClients) session.createdClients = []
  session.createdClients.push(newClient)
  await session.save()

  return NextResponse.json({ id })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 })
  }

  session.createdClients = (session.createdClients ?? []).filter((c) => c.id !== id)
  await session.save()

  return NextResponse.json({ ok: true })
}
