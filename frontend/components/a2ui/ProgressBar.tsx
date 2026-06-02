"use client"

import { A2UIProgress } from "@/lib/types"

export function ProgressBar({ data }: { data: A2UIProgress }) {
  const pct = Math.round((data.current / data.total) * 100)

  return (
    <div className="rounded-xl border border-gdark bg-gsurface p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm text-white">{data.title}</h3>
        <span className="text-xs text-ggray3 font-medium">
          {data.current}/{data.total}
        </span>
      </div>
      <div className="w-full bg-gdark rounded-full h-2 mb-3">
        <div
          className="bg-glime h-2 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-ggray3">{data.current_step}</p>
    </div>
  )
}
