import React from "react"

export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n")
  const result: React.ReactNode[] = []
  let i = 0
  let k = 0

  while (i < lines.length) {
    const line = lines[i]

    // Ordered list block
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""))
        i++
      }
      result.push(
        <ol key={k++} className="list-decimal list-inside space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm">{inlineMarkdown(item)}</li>
          ))}
        </ol>
      )
      continue
    }

    // Unordered list block
    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""))
        i++
      }
      result.push(
        <ul key={k++} className="list-disc list-inside space-y-1 my-1">
          {items.map((item, j) => (
            <li key={j} className="text-sm">{inlineMarkdown(item)}</li>
          ))}
        </ul>
      )
      continue
    }

    // Empty line → spacing
    if (line.trim() === "") {
      result.push(<br key={k++} />)
      i++
      continue
    }

    // Banner de paso: "Step N of M — Name" (o "Paso N de M") con o sin negrita
    const stepMatch = line.trim().match(/^(?:\*\*)?(?:Paso|Step) (\d+) (?:de|of) (\d+) [—-] (.+?)(?:\*\*)?$/)
    if (stepMatch) {
      const n = Number(stepMatch[1])
      const total = Number(stepMatch[2])
      const name = stepMatch[3]
      result.push(
        <div
          key={k++}
          className="flex items-center gap-3 my-3 rounded-lg border border-glime/30 bg-glime/5 px-3 py-2"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-glime shrink-0">
            Step {n} of {total}
          </span>
          <div className="flex gap-1 shrink-0">
            {Array.from({ length: total }).map((_, j) => (
              <span
                key={j}
                className={`h-1.5 w-4 rounded-full ${j < n ? "bg-glime" : "bg-gdark"}`}
              />
            ))}
          </div>
          <span className="text-sm font-bold text-white truncate">{name}</span>
        </div>
      )
      i++
      continue
    }

    // Header (## Título) — bold blanco, sin tipografías gigantes en el chat
    const headerMatch = line.match(/^#{1,6}\s+(.*)$/)
    if (headerMatch) {
      result.push(
        <p key={k++} className="font-bold text-white text-sm mt-2 mb-1">
          {inlineMarkdown(headerMatch[1])}
        </p>
      )
      i++
      continue
    }

    // Normal line
    result.push(
      <span key={k++}>
        {inlineMarkdown(line)}
        {i < lines.length - 1 && lines[i + 1]?.trim() !== "" && <br />}
      </span>
    )
    i++
  }

  return <>{result}</>
}

// Solo esquemas seguros — cualquier otro (javascript:, data:, etc.) se muestra como texto
function isSafeHref(href: string): boolean {
  return (
    href.startsWith("https://") ||
    href.startsWith("http://") ||
    href.startsWith("/") ||
    href.startsWith("mailto:")
  )
}

function inlineMarkdown(text: string): React.ReactNode {
  // Split on [link](url), **bold**, *italic* patterns — el link va primero en la alternancia
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      const [, label, href] = linkMatch
      if (!isSafeHref(href)) return part
      const isExternal = href.startsWith("http")
      return (
        <a
          key={i}
          href={href}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="text-glime underline underline-offset-2 hover:text-[#c8f070] transition-colors"
        >
          {label}
        </a>
      )
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
