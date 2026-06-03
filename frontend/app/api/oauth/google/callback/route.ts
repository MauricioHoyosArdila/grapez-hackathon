import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"

function getAppUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  const proto = req.headers.get("x-forwarded-proto") ?? "https"
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000"
  return `${proto}://${host}`
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const appUrl = getAppUrl(req)

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/?error=${error ?? "oauth_cancelled"}`, appUrl)
    )
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:
        process.env.OAUTH_REDIRECT_URI ??
        new URL("/api/oauth/google/callback", appUrl).toString(),
      grant_type: "authorization_code",
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    console.error("Token exchange failed:", err)
    return NextResponse.redirect(new URL("/?error=token_exchange_failed", appUrl))
  }

  const tokens = await tokenRes.json()

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const user = await userRes.json()

  // Use Next.js cookies() API — correct pattern for App Router
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  session.isLoggedIn = true
  session.accessToken = tokens.access_token
  session.refreshToken = tokens.refresh_token
  session.tokenExpiry = Date.now() + ((tokens.expires_in ?? 3600) - 300) * 1000
  session.userEmail = user.email
  await session.save()

  return NextResponse.redirect(new URL("/", appUrl))
}
