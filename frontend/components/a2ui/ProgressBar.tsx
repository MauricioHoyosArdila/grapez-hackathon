"use client"

import { A2UIProgress } from "@/lib/types"

export function ProgressBar({ data }: { data: A2UIProgress }) {
  const pct = Math.round((data.current / data.total) * 100)

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          {data.title}
        </h3>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {data.current}/{data.total}
        </span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mb-2">
        <div
          className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{data.current_step}</p>
    </div>
  )
}
