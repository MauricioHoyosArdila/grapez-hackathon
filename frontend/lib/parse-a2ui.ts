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

  // 2. JSON inline — SIEMPRE: rescata componentes válidos aunque un bloque
  // malformado anterior haya roto el matching de fences
  const { found, cleanText: ct } = extractInlineA2UI(cleanText)
  components.push(...found)
  if (found.length > 0) cleanText = ct

  // 3. Saneamiento: el usuario nunca debe ver JSON A2UI crudo — se descarta
  // cualquier bloque malformado o resto de fence que haya quedado en el texto
  cleanText = removeA2UIGarbage(cleanText)

  return { text: cleanText || undefined, components }
}

// Elimina del texto visible la basura A2UI que no se pudo extraer como componente:
// bloques ```json malformados o sin cerrar, fragmentos inline inválidos y fences huérfanos.
function removeA2UIGarbage(text: string): string {
  let clean = text

  // Bloques ```json (cerrados o no) que aún contienen "__a2ui" — son bloques
  // malformados o restos de extracción: se descartan completos.
  let idx = clean.indexOf("```json")
  while (idx !== -1) {
    // El cierre válido es ``` en su propia línea (no el inicio de otro ```json)
    const closeMatch = /\n```(?:\n|$)/.exec(clean.slice(idx + 7))
    const end = closeMatch ? idx + 7 + closeMatch.index + closeMatch[0].length : clean.length
    const segment = clean.slice(idx, end)
    if (segment.includes("__a2ui")) {
      console.warn("[parseA2UI] bloque A2UI malformado descartado del texto visible")
      clean = clean.slice(0, idx) + clean.slice(end)
      idx = clean.indexOf("```json")
    } else {
      idx = clean.indexOf("```json", end)
    }
  }

  // Fragmentos inline {"__a2ui" que no se extrajeron: JSON inválido (balanceado pero
  // no parseable) se elimina por span; sin cerrar se corta hasta el final del texto.
  const inlineRe = /\{\s*"__a2ui"/g
  let m: RegExpExecArray | null
  while ((m = inlineRe.exec(clean)) !== null) {
    const end = findJsonEnd(clean, m.index)
    console.warn("[parseA2UI] fragmento A2UI inválido descartado del texto visible")
    if (end === -1) {
      clean = clean.slice(0, m.index)
      break
    }
    clean = clean.slice(0, m.index) + clean.slice(end)
    inlineRe.lastIndex = m.index
  }

  // Fences huérfanos que quedaron en líneas sueltas
  clean = clean
    .split("\n")
    .filter((line) => line.trim() !== "```" && line.trim() !== "```json")
    .join("\n")

  return clean.trim()
}

// Índice siguiente al cierre del objeto JSON que empieza en `start`, o -1 si nunca balancea.
function findJsonEnd(text: string, start: number): number {
  let depth = 0
  let inStr = false
  let esc = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (esc) { esc = false; continue }
    if (ch === "\\" && inStr) { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === "{") depth++
    else if (ch === "}") {
      depth--
      if (depth === 0) return i + 1
    }
  }
  return -1
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

    // Si la llave nunca balanceó (bloque roto antes de un objeto válido), avanzar de a
    // un carácter — así los objetos internos válidos sí se escanean por separado.
    if (depth > 0) i++
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
