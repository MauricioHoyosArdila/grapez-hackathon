import { notFound } from "next/navigation"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"
import Link from "next/link"
import { CopyButton } from "./CopyButton"

export default async function DevTokensPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-xs px-2 py-0.5 bg-yellow-500 text-black rounded font-bold">
            DEV ONLY
          </span>
          <h1 className="text-lg font-semibold">Token Inspector</h1>
        </div>

        {!session.isLoggedIn ? (
          <div className="border border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-zinc-400 mb-4">No hay sesión activa.</p>
            <Link
              href="/api/oauth/google/start"
              className="px-4 py-2 bg-zinc-100 text-zinc-900 rounded-md text-sm font-medium hover:bg-white transition-colors"
            >
              Conectar cuenta Google
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-zinc-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Email</span>
              </div>
              <p className="text-sm text-green-400">{session.userEmail}</p>
            </div>

            <TokenField label="ACCESS_TOKEN" value={session.accessToken} envKey="TEST_ACCESS_TOKEN" />
            <TokenField label="REFRESH_TOKEN" value={session.refreshToken} envKey="TEST_REFRESH_TOKEN" />

            <div className="border border-zinc-700 rounded-lg p-4 bg-zinc-900">
              <p className="text-xs text-zinc-500 mb-3">Copia esto en el .env del proyecto:</p>
              <pre className="text-xs text-zinc-300 whitespace-pre-wrap break-all">
{`TEST_ACCESS_TOKEN=${session.accessToken ?? ""}
TEST_REFRESH_TOKEN=${session.refreshToken ?? ""}`}
              </pre>
              <CopyButton
                text={`TEST_ACCESS_TOKEN=${session.accessToken ?? ""}\nTEST_REFRESH_TOKEN=${session.refreshToken ?? ""}`}
              />
            </div>

            <p className="text-xs text-zinc-600 mt-4">
              Esta página no existe en producción (devuelve 404 cuando NODE_ENV=production).
            </p>
          </div>
        )}
      </div>
    </main>
  )
}

function TokenField({
  label,
  value,
  envKey,
}: {
  label: string
  value?: string
  envKey: string
}) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
        {value && <CopyButton text={value} small />}
      </div>
      <p className="text-xs text-zinc-300 break-all">{value ?? "—"}</p>
      <p className="text-xs text-zinc-600 mt-1">→ {envKey}</p>
    </div>
  )
}
