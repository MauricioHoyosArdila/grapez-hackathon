import { SessionOptions } from "iron-session"

export interface StoredClient {
  id: string
  name: string
  websiteUrl: string
  industry: string
  createdAt: string
}

export interface SessionData {
  accessToken?: string
  refreshToken?: string
  userEmail?: string
  isLoggedIn: boolean
  createdClients?: StoredClient[]
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "grapez-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 86400, // 24h — enough for a full demo day
  },
}
