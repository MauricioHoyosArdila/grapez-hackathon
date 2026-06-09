export interface Client {
  id: string
  name: string
  websiteUrl: string
  industry: string
  modo?: "auditoria" | "auditoria_implementacion"
  status: "connected" | "pending" | "error"
  lastDiagnosed?: string
  isDemo?: boolean
  demoConversation?: ChatMessage[]
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  components?: A2UIComponent[]
  imageUrl?: string
  timestamp: Date
}

// A2UI protocol types
export type A2UIComponent =
  | A2UITable
  | A2UIActionCard
  | A2UIProgress
  | A2UISummaryCard
  | A2UIChoiceCard
  | A2UIImageCard

export interface A2UITable {
  __a2ui: true
  type: "table"
  title: string
  columns: string[]
  rows: string[][]
}

export interface A2UIActionCard {
  __a2ui: true
  type: "action_card"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  requires_confirmation: boolean
  action_id: string
}

export interface A2UIProgress {
  __a2ui: true
  type: "progress"
  title: string
  current: number
  total: number
  current_step: string
}

export interface A2UISummaryCard {
  __a2ui: true
  type: "summary_card"
  title: string
  mode: "auditoria" | "auditoria_implementacion"
  stats: {
    criticos_encontrados: number
    mejorables_encontrados: number
    correctos: number
    acciones_implementadas: number
  }
  top_wins: string[]
  pending_actions: string[]
  next_steps: string
}

export interface A2UIChoiceCard {
  __a2ui: true
  type: "choice_card"
  title: string
  description?: string
  choices: { id: string; label: string; description?: string }[]
}

export interface A2UIImageCard {
  __a2ui: true
  type: "image_card"
  title: string
  image_url?: string
  image_base64?: string
  caption?: string
  elements?: Array<{ label: string; selector: string }>
}
