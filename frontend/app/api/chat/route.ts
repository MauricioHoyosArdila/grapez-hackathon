import { NextRequest } from "next/server"
import { getIronSession } from "iron-session"
import { SessionData, sessionOptions } from "@/lib/session"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  if (!session.isLoggedIn) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { message, clientId } = await req.json()

  // TODO Semana 3: conectar con Agent Engine real
  // const agentRes = await callAgentEngine({
  //   message,
  //   clientId,
  //   initialState: {
  //     access_token: session.accessToken,
  //     refresh_token: session.refreshToken,
  //   },
  // })

  // Stub SSE para desarrollo — simula respuesta del agente
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      const stub = `Recibí tu mensaje: "${message}" para el cliente ${clientId}. El agente estará disponible en Semana 3.`

      for (const char of stub) {
        controller.enqueue(encoder.encode(`data: ${char}\n`))
        await new Promise((r) => setTimeout(r, 15))
      }
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
