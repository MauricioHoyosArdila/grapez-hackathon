"use client"

import { A2UIChoiceCard } from "@/lib/types"

interface ChoiceCardProps {
  data: A2UIChoiceCard
  onChoice?: (label: string) => void
}

export function ChoiceCard({ data, onChoice }: ChoiceCardProps) {
  return (
    <div className="rounded-xl border border-gdark bg-gsurface p-4">
      <h3 className="font-bold text-white text-sm mb-1">{data.title}</h3>
      {data.description && (
        <p className="text-xs text-ggray3 mb-3">{data.description}</p>
      )}
      <div className="flex flex-col gap-2 mt-3">
        {data.choices.map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoice?.(choice.label)}
            className="text-left rounded-lg border border-gdark px-4 py-3 hover:border-glime/50 hover:bg-glime/5 transition-colors group"
          >
            <div className="text-sm font-semibold text-white group-hover:text-glime transition-colors">
              {choice.label}
            </div>
            {choice.description && (
              <div className="text-xs text-ggray3 mt-0.5 leading-relaxed">
                {choice.description}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
