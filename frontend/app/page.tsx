import Link from "next/link"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"
import { mockClients } from "@/lib/mock-clients"

export default async function HomePage() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            Grapez Analytics Agents
          </span>
          {session.isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500">{session.userEmail}</span>
              <a
                href="/api/oauth/google/logout"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                Cerrar sesión
              </a>
            </div>
          ) : (
            <Link
              href="/api/oauth/google/start"
              className="text-sm font-medium px-4 py-1.5 bg-zinc-900 text-white rounded-md hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
            >
              Conectar cuenta Google
            </Link>
          )}
        </div>
      </nav>

      {session.isLoggedIn ? (
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
            Clientes
          </h1>
          <div className="grid gap-3">
            {mockClients.map((client) => (
              <Link
                key={client.id}
                href={`/clients/${client.id}/chat`}
                className="block bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-5 py-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {client.name}
                      </h2>
                      <StatusBadge status={client.status} />
                    </div>
                    <p className="text-sm text-zinc-500 mt-0.5">{client.websiteUrl}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">{client.industry}</p>
                    {client.lastDiagnosed && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Diagnóstico: {client.lastDiagnosed}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center text-center gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              Ecosistema de Medición
            </h1>
            <p className="text-zinc-500 text-sm max-w-md">
              Conecta tu cuenta de Google para diagnosticar y configurar GA4, GTM y el sitio
              web de tus clientes con ayuda de agentes de IA.
            </p>
          </div>
          <Link
            href="/api/oauth/google/start"
            className="px-6 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
          >
            Conectar cuenta Google
          </Link>
        </div>
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  }
  const labels: Record<string, string> = {
    connected: "Conectado",
    pending: "Pendiente",
    error: "Error",
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  )
}
