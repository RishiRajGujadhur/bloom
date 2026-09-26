import { useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'
import { journalText } from '../../search/db'
import { relatedPages, type Scored } from '../../search/hybrid'
import { openDaybookPage } from '../layout/CommandPalette'
import { DAYBOOK_STORAGE_KEY } from './storage'
import type { JournalEntry } from './types'

/** While you write, surface earlier pages that share your words (debounced). */
export function RelatedPages({ text, excludeId }: { text: string; excludeId?: string }) {
  const [found, setFound] = useState<Scored[]>([])
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const list = JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as JournalEntry[]
        const docs = list.map((e) => ({ id: e.id, title: e.modeTitle, text: journalText(e.content).trim(), timestamp: Date.parse(e.createdAt) })).filter((d) => d.text)
        setFound(relatedPages(text, docs, excludeId))
      } catch {
        setFound([])
      }
    }, 900)
    return () => clearTimeout(timer)
  }, [text, excludeId])
  if (!found.length) return null
  return (
    <aside className="related-pages" aria-label="Related pages">
      <span>
        <Link2 size={14} aria-hidden="true" /> You’ve written about this before
      </span>
      {found.map((r) => (
        <button key={r.id} type="button" onClick={() => openDaybookPage(r.id)}>
          <strong>{r.title}</strong>
          <small>{new Date(r.timestamp).toLocaleDateString()}</small>
          <em>{r.text.slice(0, 90)}…</em>
        </button>
      ))}
    </aside>
  )
}
