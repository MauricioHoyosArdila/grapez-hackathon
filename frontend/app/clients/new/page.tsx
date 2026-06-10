import Link from "next/link"
import { redirect } from "next/navigation"
import { getIronSession } from "iron-session"
import { cookies } from "next/headers"
import { SessionData, sessionOptions } from "@/lib/session"
import { NewClientForm } from "./NewClientForm"

export default async function NewClientPage() {
  const cookieStore = await cookies()
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions)
  if (!session.isLoggedIn) redirect("/")

  return (
    <main className="min-h-screen bg-gblack">
      <nav className="sticky top-0 z-10 border-b border-gdark bg-gdark/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-extrabold text-white tracking-tight hover:opacity-80 transition-opacity">
            Grapez <span className="text-ggray3 font-semibold">Analytics</span>
          </Link>
          <span className="text-xs text-ggray3">{session.userEmail}</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-14">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-ggray3 hover:text-white transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <p className="text-glime text-xs font-bold tracking-widest uppercase mb-2">New analysis</p>
          <h1 className="text-2xl font-extrabold text-white">Who are we diagnosing?</h1>
          <p className="text-ggray3 text-sm mt-2 leading-relaxed">
            The agent will use this information to personalize the GA4 + GTM diagnostic.
          </p>
        </div>

        <NewClientForm />
      </div>
    </main>
  )
}
