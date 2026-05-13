import { notFound } from "next/navigation"
import { mockClients, mockDiagnosisTable, mockActionCard } from "@/lib/mock-clients"
import { ChatMessage } from "@/lib/types"
import { ChatClient } from "./ChatClient"

interface Props {
  params: Promise<{ id: string }>
}

export default async function ChatPage({ params }: Props) {
  const { id } = await params
  const client = mockClients.find((c) => c.id === id)
  if (!client) notFound()

  // Conversaciones quemadas para clientes mock (excepto grapez-studio que es real)
  const mockConversations: Record<string, ChatMessage[]> = {
    "tienda-demo": [
      {
        id: "1",
        role: "user",
        content: "Diagnostica el ecosistema de medición completo",
        timestamp: new Date("2026-05-10T10:00:00"),
      },
      {
        id: "2",
        role: "assistant",
        content: "Diagnóstico completado. Encontré 4 problemas críticos en GA4:",
        a2ui: mockDiagnosisTable,
        timestamp: new Date("2026-05-10T10:01:30"),
      },
    ],
    "retail-colombia": [
      {
        id: "1",
        role: "user",
        content: "Configura la conversión de purchase en GA4",
        timestamp: new Date("2026-05-08T14:00:00"),
      },
      {
        id: "2",
        role: "assistant",
        content: "Voy a crear el evento de conversión 'purchase'. Confirma para continuar:",
        a2ui: mockActionCard,
        timestamp: new Date("2026-05-08T14:00:45"),
      },
    ],
  }

  const initialMessages = mockConversations[id] ?? []

  return <ChatClient client={client} initialMessages={initialMessages} />
}
