"use client"

import { A2UIActionCard } from "@/lib/types"

const impactColors = {
  high: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
  medium: "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800",
  low: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
}

const impactBadge = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
}

interface ActionCardProps {
  data: A2UIActionCard
  onConfirm?: (actionId: string) => void
  onCancel?: (actionId: string) => void
}

export function ActionCard({ data, onConfirm, onCancel }: ActionCardProps) {
  return (
    <div className={`rounded-lg border p-4 ${impactColors[data.impact]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          {data.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${impactBadge[data.impact]}`}>
          Impacto {data.impact === "high" ? "alto" : data.impact === "medium" ? "medio" : "bajo"}
        </span>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
        {data.description}
      </p>
      {data.requires_confirmation && (
        <div className="flex gap-2">
          <button
            onClick={() => onConfirm?.(data.action_id)}
            className="px-4 py-1.5 text-sm font-medium bg-zinc-900 text-white rounded-md hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors"
          >
            Confirmar
          </button>
          <button
            onClick={() => onCancel?.(data.action_id)}
            className="px-4 py-1.5 text-sm font-medium border border-zinc-300 dark:border-zinc-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
