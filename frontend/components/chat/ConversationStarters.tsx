"use client"

import { Client } from "@/lib/types"

interface Props {
  client: Client
  onSelect: (message: string) => void
  onFocusInput: () => void
}

const starters = [
  {
    label: "Start diagnostic",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
      </svg>
    ),
    getMessage: (c: Client) =>
      `I want to run a diagnostic of ${c.name}'s measurement ecosystem.\nWebsite: ${c.websiteUrl}\nIndustry: ${c.industry}`,
    action: "select" as const,
  },
  {
    label: "Ask a question",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    getMessage: () => "",
    action: "focus" as const,
  },
  {
    label: "Implement changes",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    getMessage: (c: Client) =>
      `I want to implement improvements to ${c.name}'s measurement ecosystem.\nWebsite: ${c.websiteUrl}\nIndustry: ${c.industry}`,
    action: "select" as const,
  },
]

export function ConversationStarters({ client, onSelect, onFocusInput }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-16">
      <p className="text-ggray3 text-sm">Where do we start?</p>
      <div className="flex flex-wrap justify-center gap-3">
        {starters.map((s) => (
          <button
            key={s.label}
            onClick={() => s.action === "focus" ? onFocusInput() : onSelect(s.getMessage(client))}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gdark bg-gsurface text-sm text-ggray2 hover:border-glime/50 hover:text-white transition-colors"
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
