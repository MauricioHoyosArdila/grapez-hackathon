"use client"

import { useState, useRef, useEffect } from "react"
import { ChatMessage, Client } from "@/lib/types"
import { A2UIRenderer, parseA2UI } from "@/components/a2ui/A2UIRenderer"

interface ChatClientProps {
  client: Client
  initialMessages?: ChatMessage[]
}

export function ChatClient({ client, initialMessages = [] }: ChatClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function submitMessage(text: string) {
    if (!text.trim() || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    // Placeholder del asistente mientras espera respuesta
    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: new Date() },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), clientId: client.id }),
      })

      if (!res.ok) throw new Error("Error del servidor")
      if (!res.body) throw new Error("No stream")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        // SSE: cada línea es "data: <texto>", |NL| codifica newlines reales
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data: ")) {
            fullText += line.slice(6).replace(/\|NL\|/g, "\n")
            const parsed = parseA2UI(fullText)
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: parsed.text ?? "", a2ui: parsed.a2ui }
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

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input
    setInput("")
    await submitMessage(text)
  }

  function handleConfirm(actionId: string) {
    submitMessage(`Confirmo: ${actionId}`)
  }

  function handleCancel(actionId: string) {
    submitMessage(`Cancelo: ${actionId}`)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-3">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{client.name}</h2>
        <p className="text-xs text-zinc-500">{client.websiteUrl}</p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12 text-zinc-400 text-sm">
            Escribe un mensaje para iniciar el diagnóstico del ecosistema.
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-2xl w-full ${msg.role === "user" ? "ml-12" : "mr-12"}`}>
              {msg.role === "user" ? (
                <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="space-y-3">
                  {msg.content && (
                    <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                      {loading && msg.content === "" && (
                        <span className="inline-block w-2 h-4 bg-zinc-400 animate-pulse ml-1" />
                      )}
                    </div>
                  )}
                  {msg.a2ui && (
                    <A2UIRenderer
                      component={msg.a2ui}
                      onConfirm={handleConfirm}
                      onCancel={handleCancel}
                    />
                  )}
                  {loading && !msg.content && !msg.a2ui && (
                    <div className="flex gap-1 py-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
                      <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4"
      >
        <div className="flex gap-3 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un objetivo o pregunta..."
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  )
}
