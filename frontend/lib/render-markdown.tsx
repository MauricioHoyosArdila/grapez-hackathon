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

function inlineMarkdown(text: string): React.ReactNode {
  // Split on **bold**, *italic* patterns
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
