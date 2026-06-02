import { NextRequest, NextResponse } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData, sessionOptions } from "@/lib/session"

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL!))
  const session = await getIronSession<SessionData>(req, response, sessionOptions)
  session.destroy()
  return response
}
