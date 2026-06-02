"use client"

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
  onConfirm?: (actionId: string) => void
  onCancel?: (actionId: string) => void
}

export function ActionCard({ data, onConfirm, onCancel }: ActionCardProps) {
  return (
    <div className={`rounded-xl border p-4 ${impactStyles[data.impact]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-sm text-white">{data.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${badgeStyles[data.impact]}`}>
          {badgeLabels[data.impact]}
        </span>
      </div>
      <p className="text-sm text-ggray2 mb-4 leading-relaxed">{data.description}</p>
      {data.requires_confirmation && (
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm?.(data.action_id)}
            className="px-4 py-1.5 text-sm font-bold bg-glime text-gblack rounded-lg hover:bg-[#c8f070] transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={() => onCancel?.(data.action_id)}
            className="px-4 py-1.5 text-sm font-medium border border-gdark text-ggray2 rounded-lg hover:border-ggray2 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
