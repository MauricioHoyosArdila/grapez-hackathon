"use client"

import { useState } from "react"
import { A2UIActionCard } from "@/lib/types"

const impactStyles = {
  high: "bg-gburg/30 border-gburg/60",
  medium: "bg-gsurface border-gdark",
  low: "bg-gsurface border-gdark",
}

const badgeStyles = {
  high: "bg-gburg/60 text-glime",
  medium: "bg-gdark text-ggray2",
  low: "bg-gdark text-ggray3",
}

const badgeLabels = {
  high: "Impacto alto",
  medium: "Impacto medio",
  low: "Impacto bajo",
}

interface ActionCardProps {
  data: A2UIActionCard
  onConfirm?: (actionId: string, title: string) => void
  onCancel?: (actionId: string, title: string) => void
}

export function ActionCard({ data, onConfirm, onCancel }: ActionCardProps) {
  const [status, setStatus] = useState<"idle" | "confirmed" | "skipped">("idle")

  return (
    <div className={`rounded-xl border p-4 ${impactStyles[data.impact]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-sm text-white">{data.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeStyles[data.impact]}`}>
          {badgeLabels[data.impact]}
        </span>
      </div>
      <p className="text-sm text-ggray2 mb-4 leading-relaxed">{data.description}</p>
      {data.requires_confirmation && status === "idle" && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setStatus("confirmed")
              onConfirm?.(data.action_id, data.title)
            }}
            className="px-4 py-1.5 text-sm font-bold bg-glime text-gblack rounded-lg hover:bg-[#c8f070] transition-colors"
          >
            Aplicar cambio
          </button>
          <button
            onClick={() => {
              setStatus("skipped")
              onCancel?.(data.action_id, data.title)
            }}
            className="px-4 py-1.5 text-sm font-medium border border-gdark text-ggray2 rounded-lg hover:border-ggray2 transition-colors"
          >
            Omitir por ahora
          </button>
        </div>
      )}
      {data.requires_confirmation && status === "confirmed" && (
        <span className="inline-block px-3 py-1.5 text-sm font-medium bg-glime/10 text-glime border border-glime/30 rounded-lg">
          ✓ Aprobado — aplicando cambio
        </span>
      )}
      {data.requires_confirmation && status === "skipped" && (
        <span className="inline-block px-3 py-1.5 text-sm font-medium text-ggray3 border border-gdark rounded-lg">
          Omitido — queda como pendiente
        </span>
      )}
    </div>
  )
}
