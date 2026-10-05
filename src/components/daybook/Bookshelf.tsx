import { useId, type CSSProperties } from 'react'
import { subOn } from '../../features/subFeatures'
import type { JournalEntry, JournalMode } from './types'
import './bookshelf.css'

export const journalColors: Record<string, string> = {
  planning: '#8f684c',
  reflection: '#755766',
  vision: '#4d686b',
  gamified: '#597153',
}

export function JournalCover({
  title,
  category,
  count,
}: {
  title: string
  category: string
  count: number
}) {
  const gradient = useId()
  return (
    <span
      className="journal-cover"
      style={
        {
          '--journal-cover': journalColors[category] ?? '#597153',
        } as CSSProperties
      }
    >
      <span className="journal-cover-spine" aria-hidden="true" />
      <span className="journal-cover-title">{title}</span>
      <span className="journal-cover-subtitle">A BLOOM DAYBOOK</span>
      {subOn('daybookModes', 'bookFaces') && (
        <svg
          className="journal-cover-art"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f5deb0" />
              <stop offset="1" stopColor="#b39162" />
            </linearGradient>
          </defs>
          <g
            fill="none"
            stroke={`url(#${gradient})`}
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <circle cx="50" cy="50" r="37" opacity=".35" />
            <path d="M50 79V35M50 60C29 60 28 40 28 40s22 0 22 20ZM50 51c20 0 22-20 22-20S50 31 50 51ZM50 36C37 26 50 12 50 12s13 14 0 24Z" />
            <path d="M37 49 50 60m12-20L50 51" opacity=".6" />
          </g>
        </svg>
      )}
      <span className="journal-cover-count">
        {count} {count === 1 ? 'saved page' : 'saved pages'}
      </span>
      <span className="journal-cover-ribbon" aria-hidden="true" />
    </span>
  )
}

export function Bookshelf({
  pages,
  modes,
  onOpen,
}: {
  pages: JournalEntry[]
  modes: JournalMode[]
  onOpen: (page: JournalEntry, source: HTMLElement) => void
}) {
  const groups = new Map<string, JournalEntry[]>()
  for (const page of pages)
    groups.set(page.modeId, [...(groups.get(page.modeId) ?? []), page])
  if (!groups.size) return null
  return (
    <section className="journal-shelf" aria-label="Your journal books">
      <header>
        <div>
          <span className="journal-eyebrow">YOUR WORDS, KEPT CLOSE</span>
          <h3>Your books</h3>
        </div>
        <p>Select a journal. Open a page.</p>
      </header>
      <div className="journal-shelf-books">
        {[...groups.entries()].map(([modeId, entries]) => {
          const mode = modes.find((item) => item.id === modeId)
          const latest = entries[0]
          return (
            <button
              key={modeId}
              type="button"
              className={`journal-book${subOn('daybookModes', 'bookFloat') ? ' can-lift' : ''}`}
              aria-label={`Open ${mode?.title ?? latest.modeTitle} journal, ${entries.length} saved ${entries.length === 1 ? 'page' : 'pages'}`}
              onClick={(event) => onOpen(latest, event.currentTarget)}
            >
              <span className="journal-book-pages" aria-hidden="true" />
              <JournalCover
                title={mode?.title ?? latest.modeTitle}
                category={mode?.category ?? 'reflection'}
                count={entries.length}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
