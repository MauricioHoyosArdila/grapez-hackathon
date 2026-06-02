import { A2UIComponent } from "./types"

export function parseA2UI(text: string): { text?: string; a2ui?: A2UIComponent } {
  const match = text.match(/```json\n([\s\S]*?)\n```/)
  if (match) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.__a2ui) return { a2ui: parsed as A2UIComponent }
    } catch {}
  }
  return { text }
}
