"use client"

import { A2UIComponent } from "@/lib/types"
import { DiagnosisTable } from "./DiagnosisTable"
import { ActionCard } from "./ActionCard"
import { ProgressBar } from "./ProgressBar"
import { SummaryCard } from "./SummaryCard"

interface A2UIRendererProps {
  component: A2UIComponent
  onConfirm?: (actionId: string) => void
  onCancel?: (actionId: string) => void
}

export function A2UIRenderer({ component, onConfirm, onCancel }: A2UIRendererProps) {
  switch (component.type) {
    case "table":
      return <DiagnosisTable data={component} />
    case "action_card":
      return <ActionCard data={component} onConfirm={onConfirm} onCancel={onCancel} />
    case "progress":
      return <ProgressBar data={component} />
    case "summary_card":
      return <SummaryCard data={component} />
  }
}

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
