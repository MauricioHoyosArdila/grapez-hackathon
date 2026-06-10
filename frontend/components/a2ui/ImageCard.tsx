"use client"

import { A2UIImageCard } from "@/lib/types"

interface ImageCardProps {
  data: A2UIImageCard
}

// Colapsa repeticiones en el label: palabras consecutivas idénticas y
// labels espejo ("Growth Scan Growth Scan" → "Growth Scan")
function dedupeWords(label: string): string {
  const words = label.split(/\s+/).filter(Boolean)
  const half = Math.floor(words.length / 2)
  if (
    words.length >= 2 &&
    words.length % 2 === 0 &&
    words.slice(0, half).join(" ").toLowerCase() === words.slice(half).join(" ").toLowerCase()
  ) {
    return words.slice(0, half).join(" ")
  }
  return words.filter((w, i) => i === 0 || w.toLowerCase() !== words[i - 1].toLowerCase()).join(" ")
}

const MAX_CHIPS = 8

export function ImageCard({ data }: ImageCardProps) {
  const cleanElements = (data.elements ?? [])
    .map((el) => ({ ...el, label: dedupeWords(el.label?.trim() ?? "") }))
    .filter((el) => el.label.length > 1)
    .filter(
      (el, i, arr) => arr.findIndex((x) => x.label.toLowerCase() === el.label.toLowerCase()) === i
    )
  const visibleElements = cleanElements.slice(0, MAX_CHIPS)
  const hiddenCount = cleanElements.length - visibleElements.length

  return (
    <div className="bg-gsurface border border-gdark rounded-xl p-4 space-y-3">
      <p className="font-bold text-white text-sm">{data.title}</p>
      <img
        src={data.image_url ?? `data:image/png;base64,${data.image_base64}`}
        alt={data.title}
        className="rounded-lg w-full object-cover max-h-80"
      />
      {data.caption && (
        <p className="text-xs text-ggray3 leading-relaxed">{data.caption}</p>
      )}
      {visibleElements.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {visibleElements.map((el, i) => (
            <span
              key={i}
              className="text-xs bg-gdark text-ggray2 border border-gdark px-2.5 py-1 rounded-full"
            >
              {el.label}
            </span>
          ))}
          {hiddenCount > 0 && (
            <span className="text-xs text-ggray3 px-2.5 py-1">+{hiddenCount} more</span>
          )}
        </div>
      )}
    </div>
  )
}
