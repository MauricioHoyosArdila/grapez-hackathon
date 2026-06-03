"use client"

import { A2UIImageCard } from "@/lib/types"

interface ImageCardProps {
  data: A2UIImageCard
}

export function ImageCard({ data }: ImageCardProps) {
  return (
    <div className="bg-gsurface border border-gdark rounded-xl p-4 space-y-3">
      <p className="font-bold text-white text-sm">{data.title}</p>
      <img
        src={`data:image/png;base64,${data.image_base64}`}
        alt={data.title}
        className="rounded-lg w-full object-cover max-h-80"
      />
      {data.caption && (
        <p className="text-xs text-ggray3 leading-relaxed">{data.caption}</p>
      )}
      {data.elements && data.elements.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {data.elements.map((el, i) => (
            <span
              key={i}
              className="text-xs bg-gdark text-ggray2 border border-gdark px-2.5 py-1 rounded-full"
            >
              {el.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
