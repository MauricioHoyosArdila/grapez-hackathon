import React from "react"

export function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null

  const lines = text.split("\n")
  const nodes: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line === "") {
      nodes.push(<br key={`br-${i}`} />)
      continue
    }

    nodes.push(
      <span key={`line-${i}`}>
        {parseLine(line)}
        {i < lines.length - 1 && line !== "" ? " " : null}
      </span>
    )
  }

  return <>{nodes}</>
}

function parseLine(line: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Match **bold**, `code`, or plain text segments
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith("**")) {
      parts.push(<strong key={match.index}>{token.slice(2, -2)}</strong>)
    } else if (token.startsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-black/10 rounded px-1 font-mono text-xs">
          {token.slice(1, -1)}
        </code>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex))
  }

  return parts
}
