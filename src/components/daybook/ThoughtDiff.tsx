import { diffWords } from 'diff'
import { journalText } from '../../search/db'
import type { JournalEntry } from './types'

/** Word-level changes between two pages, plus simple counts for a summary. */
export function thoughtDiff(before: string, after: string) {
  const parts = diffWords(before, after)
  const count = (kind: 'added' | 'removed') =>
    parts
      .filter((p) => p[kind])
      .reduce((n, p) => n + p.value.trim().split(/\s+/).filter(Boolean).length, 0)
  return { parts, added: count('added'), removed: count('removed') }
}

/**
 * Git-style comparison of this page with the previous page of the same mode:
 * struck-through red for thoughts that faded, green for what is new.
 */
export function ThoughtDiffPanel({
  previous,
  content,
}: {
  previous: JournalEntry
  content: Record<string, unknown>
}) {
  const { parts, added, removed } = thoughtDiff(
    journalText(previous.content).trim(),
    journalText(content).trim(),
  )
  return (
    <section className="thought-diff" aria-label="Compared with your previous page">
      <header>
        <strong>
          Compared with{' '}
          {new Date(previous.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
        </strong>
        <span className="thought-diff-stat is-added">+{added} new</span>
        <span className="thought-diff-stat is-removed">−{removed} faded</span>
      </header>
      <p className="thought-diff-body">
        {parts.map((part, i) =>
          part.added ? (
            <ins key={i}>{part.value}</ins>
          ) : part.removed ? (
            <del key={i}>{part.value}</del>
          ) : (
            <span key={i}>{part.value}</span>
          ),
        )}
      </p>
    </section>
  )
}
