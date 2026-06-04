import Link from "next/link"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"
import { mockClients } from "@/lib/mock-clients"
import { DeleteClientButton } from "@/components/home/DeleteClientButton"

export default async function HomePage() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  const demoClients = mockClients.filter((c) => c.isDemo)
  const liveClients = session.createdClients ?? []

  return (
    <main className="min-h-screen bg-gblack">
      {/* Nav */}
      <nav className="sticky top-0 z-10 border-b border-gdark bg-gdark/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-white tracking-tight hover:opacity-80 transition-opacity">
            Grapez <span className="text-ggray3 font-semibold">Analytics</span>
          </Link>

          {session.isLoggedIn ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-ggray3 hidden sm:block">{session.userEmail}</span>
              <a
                href="/api/oauth/google/start"
                className="text-xs border border-gdark px-3 py-1.5 rounded-full text-ggray2 hover:border-glime/50 hover:text-glime transition-colors"
              >
                Reconectar Google
              </a>
              <a
                href="/api/oauth/google/logout"
                className="text-xs text-ggray3 hover:text-white transition-colors"
              >
                Cerrar sesión
              </a>
            </div>
          ) : (
            <a
              href="/api/oauth/google/start"
              className="text-sm font-bold px-4 py-1.5 bg-glime text-gblack rounded-full hover:bg-[#c8f070] transition-colors"
            >
              Conectar Google
            </a>
          )}
        </div>
      </nav>

      {session.isLoggedIn ? (
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

          {/* ── Nuevo análisis ── */}
          <section>
            <p className="text-glime text-xs font-bold tracking-widest uppercase mb-3">
              Nuevo análisis
            </p>
            <Link
              href="/clients/new"
              className="flex items-center justify-between gap-4 bg-glime/10 border border-glime/30 hover:border-glime/70 hover:bg-glime/15 rounded-xl px-6 py-5 transition-colors group"
            >
              <div>
                <h2 className="text-base font-bold text-white group-hover:text-glime transition-colors mb-0.5">
                  Diagnosticar nuevo ecosistema
                </h2>
                <p className="text-xs text-ggray3">
                  Ingresa los datos del cliente y el agente analiza GA4 + GTM en tiempo real.
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-glime text-gblack group-hover:bg-[#c8f070] transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
            </Link>
          </section>

          {/* ── Mis análisis (desde sesión) ── */}
          {liveClients.length > 0 && (
            <section>
              <p className="text-ggray2 text-xs font-bold tracking-widest uppercase mb-3">
                Mis análisis
              </p>
              <div className="grid gap-3">
                {liveClients.map((client) => (
                  <div
                    key={client.id}
                    className="bg-gsurface border border-gdark rounded-xl px-5 py-4 flex items-center justify-between gap-4 hover:border-glime/30 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold text-white text-sm truncate">{client.name}</h2>
                      <p className="text-xs text-ggray3 truncate">{client.websiteUrl}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-ggray3 hidden sm:block">{client.industry}</span>
                      <DeleteClientButton clientId={client.id} />
                      <Link
                        href={`/clients/${client.id}/chat?reset=true`}
                        className="text-xs border border-gdark px-3 py-1.5 rounded-lg text-ggray2 hover:border-ggray3 hover:text-white transition-colors whitespace-nowrap"
                      >
                        Reiniciar
                      </Link>
                      <Link
                        href={`/clients/${client.id}/chat`}
                        className="text-xs font-bold px-4 py-1.5 bg-glime text-gblack rounded-lg hover:bg-[#c8f070] transition-colors whitespace-nowrap"
                      >
                        Continuar →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Demos de ejemplo ── */}
          <section>
            <p className="text-ggray3 text-xs font-bold tracking-widest uppercase mb-3">
              Conversaciones de ejemplo
            </p>
            <div className="grid gap-3">
              {demoClients.map((client) => (
                <div
                  key={client.id}
                  className="bg-gsurface border border-gdark rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h2 className="font-semibold text-white text-sm">{client.name}</h2>
                      <StatusBadge status={client.status} />
                      <DemoBadge />
                    </div>
                    <p className="text-xs text-ggray3 truncate">{client.websiteUrl}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-ggray3">{client.industry}</p>
                      {client.lastDiagnosed && (
                        <p className="text-xs text-ggray3">{client.lastDiagnosed}</p>
                      )}
                    </div>
                    <Link
                      href={`/clients/${client.id}/chat`}
                      className="text-xs font-medium text-ggray2 border border-gdark px-4 py-2 rounded-lg hover:border-ggray3 hover:text-white transition-colors whitespace-nowrap"
                    >
                      Ver demo →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* Hero — no autenticado */
        <div className="max-w-4xl mx-auto px-6 py-28 flex flex-col items-center text-center gap-8">
          <div className="flex flex-col items-center gap-4">
            <span className="text-glime text-xs font-bold tracking-widest uppercase">
              Powered by AI Agents
            </span>
            <h1 className="text-4xl font-extrabold text-white leading-tight max-w-lg">
              Ecosistema de Medición<br />
              <span className="text-glime">automatizado</span>
            </h1>
            <p className="text-ggray2 text-sm max-w-md leading-relaxed">
              Conecta tu cuenta de Google para diagnosticar y configurar GA4, GTM y el sitio
              web de tus clientes con agentes de IA especializados.
            </p>
          </div>
          <a
            href="/api/oauth/google/start"
            className="px-7 py-3 bg-glime text-gblack text-sm font-bold rounded-full hover:bg-[#c8f070] transition-colors"
          >
            Conectar cuenta Google
          </a>
        </div>
      )}
    </main>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    connected: "bg-glime/15 text-glime border border-glime/30",
    pending: "bg-ggray3/15 text-ggray2 border border-ggray3/30",
    error: "bg-gburg/40 text-[#ff8b8b] border border-[#ff8b8b]/30",
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

function DemoBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-ggray3/10 text-ggray3 border border-ggray3/20 rounded-full font-medium">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-2.5 h-2.5"
        aria-hidden="true"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      Demo
    </span>
  )
}
