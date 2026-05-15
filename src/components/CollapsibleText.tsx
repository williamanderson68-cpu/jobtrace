'use client'

import { useMemo, useState } from 'react'

type CollapsibleTextProps = {
  text?: string | null
  emptyLabel?: string
  previewCharacters?: number
  className?: string
}

export default function CollapsibleText({
  text,
  emptyLabel = 'No details available',
  previewCharacters = 220,
  className = '',
}: CollapsibleTextProps) {
  const [expanded, setExpanded] = useState(false)
  const cleanText = (text || '').trim()

  const isLong = cleanText.length > previewCharacters

  const displayText = useMemo(() => {
    if (!cleanText) return emptyLabel
    if (expanded || !isLong) return cleanText
    return `${cleanText.slice(0, previewCharacters).trim()}…`
  }, [cleanText, emptyLabel, expanded, isLong, previewCharacters])

  return (
    <div className={className}>
      <p className="whitespace-pre-line text-sm leading-6 text-zinc-300">{displayText}</p>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-cyan-400 hover:text-cyan-300"
        >
          {expanded ? 'Show less' : 'See more'}
        </button>
      )}
    </div>
  )
}
