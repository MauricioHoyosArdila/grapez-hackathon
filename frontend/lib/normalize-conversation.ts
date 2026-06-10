import type { A2UIComponent, ChatMessage } from "./types"

const STEP_LINE = /^(?:\*\*)?(?:Paso|Step) (\d+) (?:de|of) \d+ [—-] .+?(?:\*\*)?$/

// Normaliza la conversación para la VISTA (el estado y el historial no se tocan):
// 1. Encabezados de paso: solo la PRIMERA aparición de cada paso se conserva en toda
//    la conversación — el modelo a veces repite "Paso N de 5" en varios mensajes.
// 2. Progress cards: se filtran las idénticas (mismo título y valor) a la última vista.
export function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
  let lastStep = -1
  let lastProgressKey = ""

  return messages.map((msg) => {
    if (msg.role !== "assistant") return msg

    let content = msg.content
    if (content) {
      const lines = content.split("\n")
      const kept: string[] = []
      for (const line of lines) {
        const match = line.trim().match(STEP_LINE)
        if (match) {
          const step = Number(match[1])
          // Repeticiones y retrocesos se eliminan — la vista solo muestra avance
          if (step <= lastStep) continue
          lastStep = step
        }
        kept.push(line)
      }
      content = kept.join("\n")
    }

    let components = msg.components
    if (components && components.length > 0) {
      const filtered: A2UIComponent[] = []
      for (const comp of components) {
        if (comp.type === "progress") {
          const key = `${comp.title}|${comp.current}|${comp.total}`
          if (key === lastProgressKey) continue // progress idéntica a la anterior
          lastProgressKey = key
        }
        filtered.push(comp)
      }
      components = filtered
    }

    if (content === msg.content && components === msg.components) return msg
    return { ...msg, content, components }
  })
}
