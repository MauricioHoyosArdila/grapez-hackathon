"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const INDUSTRIES = [
  "E-commerce",
  "Lead Generation",
  "SaaS",
  "Retail",
  "Local services",
  "Education",
  "Media & content",
  "Healthcare",
  "Fintech",
  "Other",
]

const MODO_OPTIONS = [
  {
    value: "auditoria" as const,
    label: "Audit only",
    description: "Full ecosystem diagnostic (GA4 + GTM + website). You get the analysis and recommendations without applying any changes.",
  },
  {
    value: "auditoria_implementacion" as const,
    label: "Audit + implementation",
    description: "Full diagnostic, then I apply the changes you confirm, one by one, with your explicit approval before each action.",
  },
]

export function NewClientForm() {
  const [name, setName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [industry, setIndustry] = useState("")
  const [modo, setModo] = useState<"auditoria" | "auditoria_implementacion">("auditoria")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (!name.trim() || !websiteUrl.trim() || !industry) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), websiteUrl: websiteUrl.trim(), industry, modo }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error === "missing_fields" ? "Please fill in all fields." : "Error creating the analysis. Please try again.")
        return
      }

      const { id } = await res.json()
      router.push(`/clients/${id}/chat?reset=true`)
    } catch {
      setError("Could not connect. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gsurface border border-gdark rounded-xl p-6 space-y-5">
      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Company name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="E.g.: Fashion Store Co."
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Website
        </label>
        <input
          id="url"
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="E.g.: fashionstore.com"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
        />
        <p className="text-xs text-ggray3 mt-1.5">No need to include https:// — we add it automatically.</p>
      </div>

      {/* Industria */}
      <div>
        <label htmlFor="industry" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Business model
        </label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled>Select the business model...</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {/* Modo de análisis */}
      <div>
        <p className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-3">
          Analysis mode
        </p>
        <div className="space-y-2">
          {MODO_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                modo === opt.value
                  ? "border-glime/60 bg-glime/5"
                  : "border-gdark hover:border-ggray3/50"
              } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input
                type="radio"
                name="modo"
                value={opt.value}
                checked={modo === opt.value}
                onChange={() => setModo(opt.value)}
                disabled={loading}
                className="mt-0.5 accent-[#D9FF8B] shrink-0"
              />
              <div>
                <p className={`text-sm font-semibold ${modo === opt.value ? "text-glime" : "text-white"}`}>
                  {opt.label}
                </p>
                <p className="text-xs text-ggray3 mt-0.5 leading-relaxed">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-[#ff8b8b] bg-gburg/20 border border-[#ff8b8b]/20 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !name.trim() || !websiteUrl.trim() || !industry}
        className="w-full py-3 text-sm font-bold bg-glime text-gblack rounded-lg hover:bg-[#c8f070] disabled:opacity-40 transition-colors"
      >
        {loading ? "Creating analysis…" : "Start diagnostic →"}
      </button>
    </form>
  )
}
