"use client"

import { useState } from "react"

interface CopyButtonProps {
  text: string
  small?: boolean
}

export function CopyButton({ text, small }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className={`${
        small
          ? "text-xs px-2 py-0.5"
          : "text-sm px-3 py-1.5 mt-3"
      } rounded border border-zinc-600 text-zinc-400 hover:text-zinc-100 hover:border-zinc-400 transition-colors`}
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  )
}
