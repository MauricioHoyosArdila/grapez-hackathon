import { A2UIComponent } from "./types"

export function parseA2UI(text: string): { text?: string; components: A2UIComponent[] } {
  const components: A2UIComponent[] = []
  let cleanText = text

  // 1. Bloques ```json ... ``` explícitos (formato preferido)
  const codeBlockRegex = /```json\n([\s\S]*?)\n```/g
  for (const match of text.matchAll(codeBlockRegex)) {
    try {
      const parsed = JSON.parse(match[1])
      if (parsed.__a2ui) {
        components.push(parsed as A2UIComponent)
        cleanText = cleanText.replace(match[0], "").trim()
      }
    } catch {}
  }

  // 2. JSON inline — cuando el agente omite los backticks
  // Busca objetos JSON completos usando conteo de llaves
  if (components.length === 0) {
    const { found, cleanText: ct } = extractInlineA2UI(cleanText)
    components.push(...found)
    if (found.length > 0) cleanText = ct
  }

  return { text: cleanText || undefined, components }
}

// Recorta del final del texto cualquier bloque A2UI incompleto, para no mostrar
// JSON crudo mientras el stream todavía está escribiendo el componente.
// Solo afecta la visualización durante el streaming — el parse final usa el texto completo.
export function stripIncompleteA2UI(text: string): string {
  // 1. Bloque ```json sin cierre: cortar desde el último ```json sin ``` de cierre
  const lastFence = text.lastIndexOf("```json")
  if (lastFence !== -1 && !text.slice(lastFence + 7).includes("```")) {
    return text.slice(0, lastFence)
  }

  // 2. JSON inline {"__a2ui" con llaves sin balancear al final: cortar desde ahí
  const lastInline = text.lastIndexOf('{"__a2ui"')
  if (lastInline !== -1 && !isBalancedJson(text.slice(lastInline))) {
    return text.slice(0, lastInline)
  }

  return text
}

// Conteo de llaves con manejo de strings/escapes — mismo patrón que extractInlineA2UI
function isBalancedJson(text: string): boolean {
  let depth = 0
  let inStr = false
  let esc = false

  for (const ch of text) {
    if (esc) { esc = false; continue }
    if (ch === "\\" && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return true
    }
  }
  return false
}

function extractInlineA2UI(
  text: string
): { found: A2UIComponent[]; cleanText: string } {
  const found: A2UIComponent[] = []
  const toRemove: { start: number; end: number }[] = []
  let i = 0

  while (i < text.length) {
    if (text[i] !== "{") { i++; continue }

    // Conteo de llaves para encontrar el JSON completo
    let depth = 0
    let j = i
    let inStr = false
    let esc = false

    while (j < text.length) {
      const ch = text[j]
      if (esc) { esc = false; j++; continue }
      if (ch === "\\" && inStr) { esc = true; j++; continue }
      if (ch === '"') { inStr = !inStr; j++; continue }
      if (inStr) { j++; continue }
      if (ch === "{") depth++
      else if (ch === "}") {
        depth--
        if (depth === 0) {
          try {
            const candidate = text.slice(i, j + 1)
            const parsed = JSON.parse(candidate)
            if (parsed.__a2ui) {
              found.push(parsed as A2UIComponent)
              toRemove.push({ start: i, end: j + 1 })
              i = j + 1
            }
          } catch {}
          break
        }
      }
      j++
    }

    if (depth > 0) i = j + 1
    else if (toRemove.length === 0 || toRemove[toRemove.length - 1].end !== i) i++
  }

  if (toRemove.length === 0) return { found: [], cleanText: text }

  // Reconstruir texto sin los JSON extraídos
  let clean = ""
  let pos = 0
  for (const { start, end } of toRemove) {
    clean += text.slice(pos, start)
    pos = end
  }
  clean += text.slice(pos)

  return { found, cleanText: clean.trim() }
}
