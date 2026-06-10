"use client"

import { A2UISummaryCard } from "@/lib/types"

const statLabels = {
  criticos_encontrados: "Critical",
  mejorables_encontrados: "Improvable",
  correctos: "Correct",
  acciones_implementadas: "Implemented",
}

export function SummaryCard({ data }: { data: A2UISummaryCard }) {
  return (
    <div className="rounded-xl border border-gdark bg-gsurface p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-white text-sm">✅ {data.title}</h3>
        {data.mode && (
          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-glime/15 text-glime border border-glime/30 shrink-0">
            {data.mode === "auditoria" ? "Audit only" : "Audit + implementation"}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(data.stats).map(([key, value]) => (
          <div key={key} className="bg-gdark rounded-lg px-3 py-3 text-center">
            <div className="text-2xl font-extrabold text-glime leading-none">{value}</div>
            <div className="text-xs text-ggray3 font-bold uppercase tracking-wider mt-1.5">
              {statLabels[key as keyof typeof statLabels] ?? key}
            </div>
          </div>
        ))}
      </div>

      {/* Top wins */}
      {data.top_wins?.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ggray3 uppercase tracking-wider mb-2">
            🏆 Wins
          </div>
          <ul className="space-y-1.5">
            {data.top_wins.map((win, i) => (
              <li key={i} className="text-xs text-ggray2 flex gap-2">
                <span className="text-glime shrink-0">✓</span>
                {win}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pending actions */}
      {data.pending_actions?.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ggray3 uppercase tracking-wider mb-2">
            ⏳ Pending
          </div>
          <ul className="space-y-1.5">
            {data.pending_actions.map((action, i) => (
              <li key={i} className="text-xs text-ggray2 flex gap-2">
                <span className="text-[#FFB347] shrink-0">→</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next steps */}
      {data.next_steps && (
        <div className="bg-gdark rounded-lg px-3 py-2.5">
          <div className="text-xs font-bold text-ggray3 uppercase tracking-wider mb-1">
            Next step
          </div>
          <div className="text-xs text-ggray2 leading-relaxed">{data.next_steps}</div>
        </div>
      )}
    </div>
  )
}
