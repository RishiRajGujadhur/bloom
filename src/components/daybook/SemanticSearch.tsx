import { useEffect, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useAIWorker } from '../../search/useAIWorker'
import {
  semanticSearch,
  syncSemanticIndex,
  type SemanticResult,
} from '../../search/semantic'
import type { JournalEntry } from './types'
import styles from './search.module.css'

type Result = SemanticResult
export function SemanticSearch({
  entries,
  onOpen,
}: {
  entries: JournalEntry[]
  onOpen: (id: string) => void
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
      const synced = await syncSemanticIndex(entries, embed, () => cancelled)
      if (!synced || !debounced || cancelled) return
      const found = await semanticSearch(debounced, embed)
      if (!cancelled) setResults(found)
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
    <section
      className={`${styles.search} rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-5`}
      aria-label="Search your journal"
    >
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
                    onClick={() => onOpen(result.id)}
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
