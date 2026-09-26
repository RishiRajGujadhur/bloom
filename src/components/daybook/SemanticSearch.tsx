import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShieldCheck } from 'lucide-react'
import { useAIWorker } from '../../search/useAIWorker'
import { semanticSearch, syncSemanticIndex } from '../../search/semantic'
import { db, journalText } from '../../search/db'
import {
  autoTags,
  hybridMerge,
  keywordIndex,
  keywordSearch,
  tagPrototypes,
  type Scored,
} from '../../search/hybrid'
import { loadSettings } from '../../SettingsPage'
import { subOn } from '../../features/subFeatures'
import type { JournalEntry } from './types'
import styles from './search.module.css'

type Result = Scored
const smart = (id: string) => loadSettings().features.smartSearch && subOn('smartSearch', id)
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
  const [cloud, setCloud] = useState<[string, number][]>([])
  const prototypes = useRef<Record<string, Float32Array> | null>(null)
  const docs = useMemo(
    () =>
      entries
        .map((e) => ({ id: e.id, title: e.modeTitle, text: journalText(e.content).trim(), timestamp: Date.parse(e.updatedAt) }))
        .filter((d) => d.text),
    [entries],
  )
  const index = useMemo(() => keywordIndex(docs), [docs])
  // Instant keyword matches while the meaning model is off or still loading.
  const instant = useMemo(
    () => (smart('instantKeyword') ? keywordSearch(index, query, 5) : []),
    [index, query],
  )
  const tagsFor = async () => {
    if (!prototypes.current) {
      const out: Record<string, Float32Array> = {}
      for (const [tag, text] of Object.entries(tagPrototypes)) out[tag] = await embed(text)
      prototypes.current = out
    }
    return prototypes.current
  }
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
      if (!synced || cancelled) return
      const wantTags = smart('autoTags') || smart('tagCloud')
      const protos = wantTags ? await tagsFor() : null
      if (protos && smart('tagCloud') && !cancelled) {
        const counts = new Map<string, number>()
        for (const row of await db.entries.toArray())
          if (row.embedding) for (const t of autoTags(row.embedding, protos)) counts.set(t, (counts.get(t) ?? 0) + 1)
        setCloud([...counts].sort((a, b) => b[1] - a[1]))
      }
      if (!debounced || cancelled) return
      const found = await semanticSearch(debounced, embed, 8)
      const meaning: Scored[] = found.map((f) => ({
        id: f.id,
        title: f.title,
        text: f.text,
        timestamp: f.timestamp,
        score: f.score,
        tags: protos && f.embedding && smart('autoTags') ? autoTags(f.embedding, protos) : undefined,
      }))
      const merged = smart('hybrid') ? hybridMerge(meaning, keywordSearch(index, debounced, 8)) : meaning.slice(0, 5)
      if (!cancelled) setResults(merged)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tagsFor reads a ref-cached value
  }, [enabled, entries, debounced, embed, retry, index])

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
      {!enabled && smart('instantKeyword') && (
        <>
          <label htmlFor="journal-keyword-query">Quick find</label>
          <input
            id="journal-keyword-query"
            type="search"
            value={query}
            placeholder="Type a word or phrase"
            onChange={(event) => setQuery(event.target.value)}
          />
          <ul className={styles.results}>
            {instant.map((r) => (
              <li key={r.id}>
                <button type="button" className={styles.result} onClick={() => onOpen(r.id)}>
                  <span>{r.title}</span>
                  <time dateTime={new Date(r.timestamp).toISOString()}>{new Date(r.timestamp).toLocaleDateString()}</time>
                  <p>{r.text.slice(0, 200)}{r.text.length > 200 ? '…' : ''}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
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
          {cloud.length > 0 && (
            <div className={styles.cloud} aria-label="Themes in your pages">
              {cloud.map(([tag, n]) => (
                <button key={tag} type="button" style={{ fontSize: `${0.8 + Math.min(n, 8) * 0.06}rem` }} onClick={() => setQuery(tagPrototypes[tag])}>
                  #{tag} <small>{n}</small>
                </button>
              ))}
            </div>
          )}
          <div role="status" aria-live="polite">
            {busy
              ? `Preparing your memories… ${status}`
              : error ||
                (ready && debounced
                  ? `${results.length} closest reflections · ranked by ${smart('hybrid') ? 'meaning and words' : 'meaning'}`
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
                    {result.tags && result.tags.length > 0 && (
                      <em className={styles.tags}>{result.tags.map((t) => `#${t}`).join(' ')}</em>
                    )}
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
