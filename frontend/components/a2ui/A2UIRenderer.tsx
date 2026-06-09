"use client"

import { A2UIComponent } from "@/lib/types"
import { DiagnosisTable } from "./DiagnosisTable"
import { ActionCard } from "./ActionCard"
import { ProgressBar } from "./ProgressBar"
import { SummaryCard } from "./SummaryCard"
import { ChoiceCard } from "./ChoiceCard"
import { ImageCard } from "./ImageCard"

interface A2UIRendererProps {
  component: A2UIComponent
  onConfirm?: (actionId: string, title: string) => void
  onCancel?: (actionId: string, title: string) => void
  onChoice?: (label: string) => void
}

export function A2UIRenderer({ component, onConfirm, onCancel, onChoice }: A2UIRendererProps) {
  switch (component.type) {
    case "table":
      return <DiagnosisTable data={component} />
    case "action_card":
      return <ActionCard data={component} onConfirm={onConfirm} onCancel={onCancel} />
    case "progress":
      return <ProgressBar data={component} />
    case "summary_card":
      return <SummaryCard data={component} />
    case "choice_card":
      return <ChoiceCard data={component} onChoice={onChoice} />
    case "image_card":
      return <ImageCard data={component} />
  }
}

export { parseA2UI } from "@/lib/parse-a2ui"
