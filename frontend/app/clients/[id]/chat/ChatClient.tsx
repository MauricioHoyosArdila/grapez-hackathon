"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChatMessage, Client } from "@/lib/types"
import { A2UIRenderer, parseA2UI } from "@/components/a2ui/A2UIRenderer"
import { stripIncompleteA2UI } from "@/lib/parse-a2ui"
import { renderMarkdown } from "@/lib/render-markdown"
import { ConversationStarters } from "@/components/chat/ConversationStarters"

interface ChatClientProps {
  client: Client
  initialMessages?: ChatMessage[]
  readOnly?: boolean
}

interface AttachedImage {
  dataUrl: string
  mimeType: string
}

const MAX_IMAGE_BYTES = 4 * 1024 * 1024 // 4MB — límite del payload hacia el agente

export function ChatClient({ client, initialMessages = [], readOnly = false }: ChatClientProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [workingStatus, setWorkingStatus] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, workingStatus])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setImageError("Solo se pueden adjuntar imágenes (PNG, JPG, WebP…).")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("La imagen supera 4MB. Usa una captura más liviana.")
      return
    }
    setImageError(null)
    const reader = new FileReader()
    reader.onload = () => {
      setAttachedImage({ dataUrl: reader.result as string, mimeType: file.type })
    }
    reader.readAsDataURL(file)
  }

  async function submitMessage(text: string, image: AttachedImage | null = null) {
    if (readOnly || (!text.trim() && !image) || loading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      imageUrl: image?.dataUrl,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)
    setWorkingStatus(null)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", components: [], timestamp: new Date() },
    ])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          clientId: client.id,
          // data URL = "data:image/png;base64,<data>" — el agente recibe solo el base64
          image: image
            ? { mimeType: image.mimeType, data: image.dataUrl.split(",")[1] ?? "" }
            : undefined,
        }),
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
            const payload = line.slice(6)
            if (payload.startsWith("|STATUS|")) {
              setWorkingStatus(payload.slice(8))
              continue
            }
            setWorkingStatus(null)
            fullText += payload.replace(/\|NL\|/g, "\n")
            // Durante el stream: ocultar bloques A2UI incompletos (evita JSON crudo parpadeando)
            const parsed = parseA2UI(stripIncompleteA2UI(fullText))
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

      // Stream cerrado: parse final con el texto completo, sin recortes
      const finalParsed = parseA2UI(fullText)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: finalParsed.text ?? "", components: finalParsed.components }
            : m
        )
      )
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
      setWorkingStatus(null)
    }
  }

  async function sendMessage(e: { preventDefault(): void }) {
    e.preventDefault()
    const text = input
    const image = attachedImage
    setInput("")
    setAttachedImage(null)
    await submitMessage(text, image)
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

  function handleConfirm(actionId: string, title: string) {
    submitMessage(`Confirmo: ${title}`)
  }

  function handleCancel(actionId: string, title: string) {
    submitMessage(`Prefiero no aplicar: ${title}`)
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
        {messages.length === 0 && !readOnly && (
          <ConversationStarters
            client={client}
            onSelect={(msg) => submitMessage(msg)}
            onFocusInput={() => inputRef.current?.focus()}
          />
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div className={`max-w-2xl w-full ${msg.role === "user" ? "ml-12" : "mr-12"}`}>
              {msg.role === "user" ? (
                <div className="bg-glime text-gblack font-medium rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm">
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.imageUrl}
                      alt="Imagen adjunta"
                      className={`rounded-lg max-h-48 object-contain ${msg.content ? "mb-2" : ""}`}
                    />
                  )}
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
                  {loading && msg.id === messages[messages.length - 1]?.id && (
                    <div className="flex items-center gap-2 py-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 rounded-full bg-glime/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span className="text-xs text-ggray3">
                        {workingStatus ?? "Trabajando…"}
                      </span>
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
          <div className="max-w-3xl mx-auto space-y-2">
            {imageError && (
              <p className="text-xs text-red-400">{imageError}</p>
            )}
            {attachedImage && (
              <div className="inline-flex items-center gap-2 border border-gdark bg-gsurface rounded-lg p-1.5 pr-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={attachedImage.dataUrl}
                  alt="Imagen adjunta"
                  className="h-12 w-12 object-cover rounded-md"
                />
                <span className="text-xs text-ggray3">Imagen lista para enviar</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  aria-label="Quitar imagen"
                  className="text-ggray3 hover:text-white transition-colors px-1"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                aria-label="Adjuntar imagen"
                title="Adjuntar imagen (captura de tu sitio, GA4, GTM…)"
                className="shrink-0 px-3 py-2.5 rounded-lg border border-gdark text-ggray3 hover:border-glime/60 hover:text-glime disabled:opacity-40 transition-colors"
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
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="m21 15-5-5L5 21" />
                </svg>
              </button>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu respuesta… o pregunta lo que quieras"
                disabled={loading}
                className="flex-1 rounded-lg border border-gdark bg-gsurface px-4 py-2.5 text-sm text-white placeholder:text-ggray3 focus:outline-none focus:border-glime/60 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && !attachedImage)}
                className="px-5 py-2.5 text-sm font-bold bg-glime text-gblack rounded-lg hover:bg-[#c8f070] disabled:opacity-40 transition-colors"
              >
                Enviar
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
