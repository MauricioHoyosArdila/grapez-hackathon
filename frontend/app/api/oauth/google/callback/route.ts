import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData, sessionOptions } from "@/lib/session"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/?error=${error ?? "oauth_cancelled"}`, req.url)
    )
  }

  // Intercambiar code por tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.OAUTH_REDIRECT_URI!,
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error("Token exchange failed:", err)
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", req.url))
  }

  const tokens = await tokenRes.json()

  // Obtener email del usuario
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const user = await userRes.json()

  // Guardar en iron-session
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.isLoggedIn = true
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token
  session.userEmail = user.email
  await session.save()

  return NextResponse.redirect(new URL("/", req.url))
}
