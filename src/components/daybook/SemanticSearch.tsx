import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import {
  db,
  EMBEDDING_MODEL,
  journalText,
  type SearchEntry,
} from '../../search/db'
import { useAIWorker } from '../../search/useAIWorker'
import { calculateCosineSimilarity } from '../../utils/cosineSimilarity'
import type { JournalEntry } from './types'
import { journalModes } from './mockData'
import styles from './search.module.css'

type Result = SearchEntry & { score: number }
export function SemanticSearch({
  entries,
  onOpen,
}: {
  entries: JournalEntry[]
  onOpen: (modeId: string) => void
}) {
  const [enabled, setEnabled] = useState(false)
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [retry, setRetry] = useState(0)
  const [coach, setCoach] = useState(false)
  const { embed, status } = useAIWorker()
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 350)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    setBusy(true)
    setError('')
    setResults([])
    setReady(false)
    setCoach(false)
    async function run() {
      // Preserve original pages; this database is a rebuildable search index.
      const activeIds = new Set(entries.map((entry) => entry.id))
      const existing = await db.entries.toArray()
      if (cancelled) return
      await db.entries.bulkDelete(
        existing
          .filter((entry) => !activeIds.has(entry.id))
          .map((entry) => entry.id),
      )
      for (const entry of entries) {
        if (cancelled) return
        const text = journalText(entry.content).trim()
        const previous = await db.entries.get(entry.id)
        if (cancelled) return
        if (!text) {
          await db.entries.delete(entry.id)
          continue
        }
        const record: SearchEntry = {
          id: entry.id,
          text,
          timestamp: Date.parse(entry.updatedAt),
          category:
            journalModes.find((mode) => mode.id === entry.modeId)?.category ??
            'reflection',
          title: entry.modeTitle,
          modeId: entry.modeId,
        }
        if (
          previous?.text === text &&
          previous.model === EMBEDDING_MODEL &&
          previous.embedding?.length === 384
        ) {
          await db.entries.put({
            ...record,
            embedding: previous.embedding,
            model: previous.model,
          })
          continue
        }
        await db.entries.put(record)
        const embedding = await embed(text)
        if (cancelled) return
        await db.entries.put({ ...record, embedding, model: EMBEDDING_MODEL })
      }
      if (!debounced || cancelled) return
      const vector = await embed(debounced)
      if (cancelled) return
      const rows = await db.entries.toArray()
      if (cancelled) return
      setResults(
        rows
          .filter(
            (row) =>
              row.embedding?.length === vector.length &&
              row.model === EMBEDDING_MODEL,
          )
          .map((row) => ({
            ...row,
            score: calculateCosineSimilarity(vector, row.embedding!),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5),
      )
    }
    void run()
      .then(() => {
        if (!cancelled) setReady(true)
      })
      .catch(() => {
        if (!cancelled)
          setError(
            'Search could not finish. Check available browser storage and your connection for the first model download. Your original journal pages are unchanged.',
          )
      })
      .finally(() => {
        if (!cancelled) setBusy(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled, entries, debounced, embed, retry])

  return (
    <section className={styles.search} aria-label="Search your journal">
      <div className={styles.heading}>
        <Search size={20} aria-hidden="true" />
        <h3>Find a thought</h3>
        <span>
          <ShieldCheck size={14} aria-hidden="true" /> On your device
        </span>
      </div>
      {!enabled ? (
        <>
          <p>
            Recall a feeling, not just an exact phrase. Enable search to
            download a small AI model from Hugging Face. Your journal text stays
            in this browser. Model files are cached when your browser allows it.
          </p>
          <button type="button" onClick={() => setEnabled(true)}>
            Enable private search
          </button>
        </>
      ) : (
        <>
          <label htmlFor="journal-semantic-query">What’s on your mind?</label>
          <input
            id="journal-semantic-query"
            type="search"
            value={query}
            placeholder="Try “feeling burnt out”"
            onChange={(event) => {
              setQuery(event.target.value)
              setResults([])
              setReady(false)
              setCoach(false)
            }}
          />
          <div role="status" aria-live="polite">
            {busy
              ? `Preparing your memories… ${status}`
              : error ||
                (ready && debounced
                  ? `${results.length} closest reflections · ranked by meaning`
                  : 'New and existing pages become searchable here.')}
          </div>
          {error && (
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
            >
              Retry search
            </button>
          )}
          {!busy && !error && ready && debounced && results.length === 0 && (
            <p>No saved reflections yet. Complete a journal page to begin.</p>
          )}
          <ul className={styles.results}>
            {query.trim() === debounced &&
              results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className={styles.result}
                    onClick={() => onOpen(result.modeId)}
                  >
                    <span>{result.title}</span>
                    <time dateTime={new Date(result.timestamp).toISOString()}>
                      {new Date(result.timestamp).toLocaleDateString()}
                    </time>
                    <p>
                      {result.text.slice(0, 260)}
                      {result.text.length > 260 ? '…' : ''}
                    </p>
                  </button>
                </li>
              ))}
          </ul>
          {query.trim() === debounced && results.length > 0 && (
            <button type="button" onClick={() => setCoach((value) => !value)}>
              Ask Local Coach · Preview
            </button>
          )}
          {coach && (
            <p role="status">
              Coach preview: the top {Math.min(3, results.length)} reflections
              would be used for context. No agent is connected and nothing has
              been sent.
            </p>
          )}
        </>
      )}
    </section>
  )
}
