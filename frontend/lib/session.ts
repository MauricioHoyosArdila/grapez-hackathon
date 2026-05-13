import { SessionOptions } from "iron-session"

export interface SessionData {
  accessToken?: string
  refreshToken?: string
  userEmail?: string
  isLoggedIn: boolean
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "grapez-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 3600,
  },
}
