"use client"

import { A2UIProgress } from "@/lib/types"

// Mismo lenguaje visual que el banner de pasos (render-markdown.tsx): los segmentos
// representan el sub-progreso del paso (1/3, 2/3, 3/3) y la caption indica qué se revisa.
export function ProgressBar({ data }: { data: A2UIProgress }) {
  // Si el título trae "Step N of M — Name" (o "Paso N de M"), se separa para replicar el banner
  const m = data.title.match(/^(?:Paso|Step) (\d+) (?:de|of) (\d+) [—-] (.+)$/)
  const label = m ? `Step ${m[1]} of ${m[2]}` : null
  const name = m ? m[3] : data.title

  return (
    <div className="rounded-lg border border-glime/30 bg-glime/5 px-3 py-2 space-y-1.5">
      <div className="flex items-center gap-3">
        {label && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-glime shrink-0">
            {label}
          </span>
        )}
        <div className="flex gap-1 shrink-0">
          {Array.from({ length: data.total }).map((_, j) => (
            <span
              key={j}
              className={`h-1.5 w-4 rounded-full transition-colors duration-500 ${j < data.current ? "bg-glime" : "bg-gdark"}`}
            />
          ))}
        </div>
        <span className="text-sm font-bold text-white truncate">{name}</span>
        <span className="text-xs text-ggray3 ml-auto shrink-0">
          {data.current}/{data.total}
        </span>
      </div>
      {data.current_step && <p className="text-xs text-ggray3">{data.current_step}</p>}
    </div>
  )
}
