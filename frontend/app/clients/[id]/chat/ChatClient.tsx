"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChatMessage, Client } from "@/lib/types"
import { A2UIRenderer, parseA2UI } from "@/components/a2ui/A2UIRenderer"
import { renderMarkdown } from "@/lib/render-markdown"

interface ChatClientProps {
  client: Client
  initialMessages?: ChatMessage[]
  readOnly?: boolean
}

export function ChatClient({ client, initialMessages = [], readOnly = false }: ChatClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const autoSentRef = useRef(false)

  // Auto-send first message with client context when chat opens fresh
  useEffect(() => {
    if (readOnly || initialMessages.length > 0 || autoSentRef.current) return
    autoSentRef.current = true
    const modoLabel = client.modo === "auditoria_implementacion"
      ? "Auditoría + implementación"
      : "Solo auditoría"
    const firstMessage = [
      `Nuevo análisis para: ${client.name}`,
      `Sitio web: ${client.websiteUrl}`,
      `Modelo de negocio: ${client.industry}`,
      `Modo: ${modoLabel}`,
    ].join("\n")
    submitMessage(firstMessage)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function submitMessage(text: string) {
    if (readOnly || !text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", components: [], timestamp: new Date() },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), clientId: client.id }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        if (res.status === 401 && data.error === "token_expired") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "Tu sesión de Google expiró. [Reconectar cuenta Google](/api/oauth/google/start)",
                  }
                : m
            )
          )
          return
        }
        throw new Error("Error del servidor")
      }
      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            fullText += line.slice(6).replace(/\|NL\|/g, "\n")
            const parsed = parseA2UI(fullText)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: parsed.text ?? "", components: parsed.components }
                  : m
              )
            )
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Error al conectar con el agente. Intenta de nuevo." }
            : m
        )
      )
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(e: { preventDefault(): void }) {
    e.preventDefault()
    const text = input
    setInput("")
    await submitMessage(text)
  }

  async function handleReset() {
    if (loading || resetting) return
    setResetting(true)
    try {
      await fetch(`/api/session/${client.id}`, { method: "DELETE" })
      setMessages([])
    } finally {
      setResetting(false)
    }
  }

  function handleConfirm(actionId: string) {
    submitMessage(`Confirmo: ${actionId}`)
  }

  function handleCancel(actionId: string) {
    submitMessage(`Cancelo: ${actionId}`)
  }

  function handleChoice(label: string) {
    submitMessage(label)
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-gdark bg-gdark/90 backdrop-blur-md px-6 py-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => { router.push("/"); router.refresh() }}
            className="text-ggray3 hover:text-white transition-colors shrink-0 flex items-center gap-1.5"
            aria-label="Volver al inicio"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden="true"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="text-xs hidden sm:inline">Inicio</span>
          </button>
          <span className="text-ggray3/30 text-sm shrink-0">|</span>
          <div className="min-w-0">
            <h2 className="font-semibold text-white text-sm truncate">{client.name}</h2>
            <p className="text-xs text-ggray3 truncate">{client.websiteUrl}</p>
          </div>
        </div>

        {!readOnly && (
          <button
            onClick={handleReset}
            disabled={loading || resetting}
            aria-label="Reiniciar conversación desde cero"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs text-ggray3 border border-gdark px-3 py-1.5 rounded-lg hover:border-ggray3 hover:text-ggray2 disabled:opacity-40 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5"
              aria-hidden="true"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            {resetting ? "Reiniciando…" : "Reiniciar sesión"}
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-gblack">
        {messages.length === 0 && (
          <div className="text-center py-16 text-ggray3 text-sm">
            Escribe un mensaje para iniciar el diagnóstico del ecosistema.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-2xl w-full ${msg.role === "user" ? "ml-12" : "mr-12"}`}>
              {msg.role === "user" ? (
                <div className="bg-glime text-gblack font-medium rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-3">
                  {msg.content && (
                    <div className="text-sm text-ggray2 leading-relaxed">
                      {renderMarkdown(msg.content)}
                      {loading && msg.content === "" && (
                        <span className="inline-block w-2 h-4 bg-glime/60 animate-pulse ml-1" />
                      )}
                    </div>
                  )}
                  {msg.components && msg.components.length > 0 && (
                    <div className="space-y-2">
                      {msg.components.map((comp, i) => (
                        <A2UIRenderer
                          key={i}
                          component={comp}
                          onConfirm={handleConfirm}
                          onCancel={handleCancel}
                          onChoice={handleChoice}
                        />
                      ))}
                    </div>
                  )}
                  {loading && !msg.content && (!msg.components || msg.components.length === 0) && (
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input / Demo banner */}
      {readOnly ? (
        <div className="border-t border-gdark bg-gdark/90 px-6 py-4 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-ggray3 max-w-3xl mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Conversación de ejemplo — solo lectura
          </div>
        </div>
      ) : (
        <form
          onSubmit={sendMessage}
          className="border-t border-gdark bg-gdark/90 px-6 py-4 shrink-0"
        >
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un objetivo o pregunta..."
              disabled={loading}
              className="flex-1 rounded-lg border border-gdark bg-gsurface px-4 py-2.5 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 py-2.5 text-sm font-bold bg-glime text-gblack rounded-lg hover:bg-[#c8f070] disabled:opacity-40 transition-colors"
            >
              Enviar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
