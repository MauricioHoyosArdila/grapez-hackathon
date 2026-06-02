"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const INDUSTRIES = [
  "E-commerce",
  "Lead Generation",
  "SaaS",
  "Retail",
  "Servicios locales",
  "Educación",
  "Medios y contenido",
  "Salud",
  "Fintech",
  "Otro",
]

export function NewClientForm() {
  const [name, setName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [industry, setIndustry] = useState("")
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
        body: JSON.stringify({ name: name.trim(), websiteUrl: websiteUrl.trim(), industry }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error === "missing_fields" ? "Completa todos los campos." : "Error al crear el análisis. Intenta de nuevo.")
        return
      }

      const { id } = await res.json()
      router.push(`/clients/${id}/chat?reset=true`)
    } catch {
      setError("No se pudo conectar. Revisa tu conexión e intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gsurface border border-gdark rounded-xl p-6 space-y-5">
      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Nombre de la empresa
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Tienda Moda Colombia"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
        />
      </div>

      {/* URL */}
      <div>
        <label htmlFor="url" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Sitio web
        </label>
        <input
          id="url"
          type="text"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          placeholder="Ej: tiendamoda.co"
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
        />
        <p className="text-xs text-ggray3 mt-1.5">No necesitas incluir https:// — lo agregamos automáticamente.</p>
      </div>

      {/* Industria */}
      <div>
        <label htmlFor="industry" className="block text-xs font-bold text-ggray2 uppercase tracking-wider mb-2">
          Modelo de negocio
        </label>
        <select
          id="industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-lg border border-gdark bg-gblack px-4 py-3 text-sm text-white focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled>Selecciona el modelo de negocio...</option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
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
        {loading ? "Creando análisis…" : "Iniciar diagnóstico →"}
      </button>
    </form>
  )
}
