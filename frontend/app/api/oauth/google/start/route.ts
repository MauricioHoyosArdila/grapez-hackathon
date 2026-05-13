import { NextRequest, NextResponse } from "next/server"

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.edit",
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/tagmanager.edit.containers",
  "https://www.googleapis.com/auth/tagmanager.publish",
  "openid",
  "email",
  "profile",
]

export async function GET(_req: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.OAUTH_REDIRECT_URI!,
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  })

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  return NextResponse.redirect(url)
}
