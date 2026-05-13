"use client"

import { A2UISummaryCard } from "@/lib/types"

export function SummaryCard({ data }: { data: A2UISummaryCard }) {
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-4">
      <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-3">
        ✅ {data.title}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {data.sections.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-zinc-900 rounded-md px-3 py-2 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</div>
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {s.items_fixed} cambios aplicados
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
