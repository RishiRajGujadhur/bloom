import { subOn } from '../../features/subFeatures'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Carousel } from '../ui/Carousel'
import { journalText } from '../../search/db'
import { DAYBOOK_STORAGE_KEY } from './storage'
import { OPEN_DAYBOOK_EVENT } from '../layout/CommandPalette'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Compass,
  Sparkles,
  Sun,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalEntry, JournalMode, JournalCategory } from './types'
import { localizedJournalModes } from './mockData'
import { AdaptiveEditor } from './AdaptiveEditor'
import { JournalLibrary } from './JournalLibrary'
import { DaybookQuick } from '../../features/quick/DaybookQuick'
import { Bookshelf } from './Bookshelf'
import { usePageActions } from '../ui/PageMenu'
import { SemanticSearch } from './SemanticSearch'
import './daybook.css'
import { FlowMountain } from '../../features/flow/FlowMountain'
import { capturePlace } from '../../features/places/placesStore'
import { loadSettings } from '../../SettingsPage'

export { DAYBOOK_STORAGE_KEY }
export function JournalContainer() {
  const { t } = useTranslation(undefined, { i18n })
  const [category, setCategory] = useState<JournalCategory | null>(null)
  const [browse, setBrowse] = useState(false)
  const [selected, setSelected] = useState<JournalMode | null>(null)
  const [storageError, setStorageError] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [sort, setSort] = useState(() => {
    try { return localStorage.getItem('bloom-daybook-sort') ?? 'edited' } catch { return 'edited' }
  })
  const changeSort = (v: string) => {
    setSort(v)
    try { localStorage.setItem('bloom-daybook-sort', v) } catch { /* optional */ }
  }
  const [initial] = useState(() => {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]',
      )
      if (
        !Array.isArray(value) ||
        value.some(
          (item) =>
            !item ||
            typeof item.id !== 'string' ||
            typeof item.modeId !== 'string' ||
            typeof item.content !== 'object',
        )
      )
        throw new Error('Invalid journal data')
      return { entries: value as JournalEntry[], error: '' }
    } catch {
      return {
        entries: [] as JournalEntry[],
        error:
          'Your saved pages could not be read. The original data has been kept.',
      }
    }
  })
  const [entries, setEntries] = useState(initial.entries)
  const entriesRef = useRef(entries)
  useEffect(() => {
    entriesRef.current = entries
  }, [entries])
  const recentPages = useMemo(
    () =>
      [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [entries],
  )
  const language = i18n.resolvedLanguage ?? 'en'
  const modes = useMemo(() => localizedJournalModes(language), [language])
  // The page types you write most, for one-tap fresh pages.
  const favouriteModes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries) counts.set(e.modeId, (counts.get(e.modeId) ?? 0) + 1)
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => modes.find((m) => m.id === id))
      .filter((m): m is JournalMode => Boolean(m))
      .slice(0, 4)
  }, [entries, modes])
  // Each page is its own entry: choosing a mode starts a fresh page, while
  // "Your pages" (and search) reopen a specific saved one.
  const [entryId, setEntryId] = useState<string | null>(null)
  // Changes only when a page is opened, so autosaves never remount the editor.
  const [session, setSession] = useState(0)
  const entry = entryId
    ? entries.find((item) => item.id === entryId)
    : undefined
  const persist = (next: JournalEntry, close: boolean) => {
    if (initial.error) return
    setEntries((current) => {
      const updated = [next, ...current.filter((item) => item.id !== next.id)]
      try {
        localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(updated))
        setStorageError('')
      } catch {
        setStorageError(t('daybook.storageError'))
        return current
      }
      return updated
    })
    if (close) {
      if (loadSettings().features.placesMap && subOn('placesMap', 'daybookCapture')) capturePlace('daybook', null, { ref: next.id, label: next.modeTitle })
      setSelected(null)
      setEntryId(null)
    } else setEntryId(next.id)
  }
  // A page from at least a week ago (not private), picked once per visit.
  const [memoryId] = useState(() => {
    const old = initial.entries.filter((e) => !e.private && Date.now() - new Date(e.updatedAt).getTime() > 7 * 864e5 && journalText(e.content).trim().length > 20)
    return old.length ? old[Math.floor(Math.random() * old.length)].id : null
  })
  const memory = entries.find((e) => e.id === memoryId) ?? null
  // Delete with a short Undo window.
  const [undoPage, setUndoPage] = useState<JournalEntry | null>(null)
  const removePage = (page: JournalEntry) => {
    if (initial.error) return
    setEntries((current) => {
      const updated = current.filter((item) => item.id !== page.id)
      try {
        localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(updated))
      } catch {
        return current
      }
      return updated
    })
    setUndoPage(page)
  }
  useEffect(() => {
    if (!undoPage) return
    const t = setTimeout(() => setUndoPage(null), 8000)
    return () => clearTimeout(t)
  }, [undoPage])
  const openPage = (page: JournalEntry) => {
    setSession((s) => s + 1)
    setEntryId(page.id)
    setSelected(
      modes.find((m) => m.id === page.modeId) ?? {
        ...modes[0],
        id: page.modeId,
        title: page.modeTitle,
      },
    )
  }
  const startPage = (mode: JournalMode | null) => {
    setSession((s) => s + 1)
    setEntryId(null)
    setSelected(mode)
  }
  // Search (command palette) can open a saved page directly.
  useEffect(() => {
    // Accepts a saved page id (preferred) or a mode id (starts a new page).
    const open = (id: string | null) => {
      if (!id) return
      const page = entriesRef.current.find((item) => item.id === id)
      const mode = modes.find((m) => m.id === (page?.modeId ?? id))
      if (!mode) return
      try {
        sessionStorage.removeItem(OPEN_DAYBOOK_EVENT)
      } catch {
        /* nothing to clear */
      }
      setSession((s) => s + 1)
      setEntryId(page?.id ?? null)
      setSelected(mode)
    }
    try {
      open(sessionStorage.getItem(OPEN_DAYBOOK_EVENT))
    } catch {
      /* storage unavailable */
    }
    const onOpen = (event: Event) => open((event as CustomEvent<string>).detail)
    window.addEventListener(OPEN_DAYBOOK_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_DAYBOOK_EVENT, onOpen)
  }, [modes])
  const back = () => {
    setCategory(null)
    setBrowse(false)
  }
  const choices = [
    { key: 'planning', label: 'Plan', Icon: Sun },
    { key: 'reflection', label: 'Reflect', Icon: BookOpen },
    { key: 'vision', label: 'Imagine', Icon: Compass },
    { key: 'gamified', label: 'Explore', Icon: Sparkles },
  ] as const
  usePageActions([
    { id: 'daybook-browse', label: 'Browse every page type', icon: '📚', run: () => setBrowse(true) },
    ...(recentPages[0] ? [{ id: 'daybook-continue', label: `Continue “${recentPages[0].modeTitle}”`, icon: '✍️', run: () => openPage(recentPages[0]) }] : []),
  ])
  return (
    <section
      className={`card daybook daybook-wizard mx-auto w-full rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-6 ${selected ? 'is-writing max-w-[1180px]' : 'max-w-5xl'}`}
      id="daybook"
    >
      <div className="daybook-container">
        <ol className="wizard-steps" aria-label="Journal steps" hidden={Boolean(selected)}>
          {['Choose a direction', 'Pick a page', 'Write'].map(
            (label, index) => (
              <li
                key={label}
                aria-current={
                  (selected ? 2 : category || browse ? 1 : 0) === index
                    ? 'step'
                    : undefined
                }
              >
                <span>{index + 1}</span>
                {label}
              </li>
            ),
          )}
        </ol>
        {undoPage && (
          <p className="daybook-undo" role="status">
            Deleted “{undoPage.modeTitle}”.{' '}
            <button type="button" onClick={() => { persist(undoPage, false); setEntryId(null); setUndoPage(null) }}>
              Undo
            </button>
          </p>
        )}
        {(storageError || initial.error) && (
          <p role="alert">{storageError || initial.error}</p>
        )}
        {selected ? (
          <AdaptiveEditor
            key={`${selected.id}:${session}`}
            mode={selected}
            entry={entry}
            onBack={() => startPage(null)}
            onSave={(next) => persist(next, true)}
            onAutosave={(next) => persist(next, false)}
            previous={recentPages.find(
              (page) =>
                page.modeId === selected.id &&
                page.id !== entry?.id &&
                (!entry || page.updatedAt < entry.createdAt),
            )}
          />
        ) : category || browse ? (
          <>
            <button className="quiet-button" onClick={back}>
              <ArrowLeft size={16} /> Back
            </button>
            <JournalLibrary
              modes={
                category
                  ? modes.filter((mode) => mode.category === category)
                  : modes
              }
              onSelect={startPage}
            />
          </>
        ) : (
          <div className="journal-direction">
            <DaybookQuick modes={modes} onSelect={startPage} />
            {favouriteModes.length > 0 && (
              <div className="daybook-favs" role="group" aria-label="Your usual page types">
                <span>Start a fresh</span>
                {favouriteModes.map((m) => (
                  <button key={m.id} type="button" onClick={() => startPage(m)}>
                    {m.icon} {m.title}
                  </button>
                ))}
              </div>
            )}
            {subOn('daybookModes', 'bookshelf') && <Bookshelf pages={recentPages} modes={modes} onEdit={openPage} language={language} />}
            {recentPages.length > 1 && subOn('daybookModes', 'pages') && (
              <label className="daybook-sort">
                Sort pages
                <select value={sort} onChange={(e) => changeSort(e.target.value)}>
                  <option value="edited">Last edited</option>
                  <option value="created">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">By page type</option>
                </select>
              </label>
            )}
            {memory && (
              <button type="button" className="daybook-memory" onClick={() => openPage(memory)}>
                <small>
                  ✦ From {Math.round((Date.now() - new Date(memory.updatedAt).getTime()) / 864e5)} days ago · {memory.modeTitle}
                </small>
                <span>{journalText(memory.content).trim().slice(0, 200)}</span>
              </button>
            )}
            {recentPages.length > 0 && subOn('daybookModes', 'pages') && (
              <Carousel label="Your pages" title={`Your pages · ${recentPages.length}`}>
                {[...recentPages].sort((a, b) =>
                  sort === 'created' ? b.createdAt.localeCompare(a.createdAt)
                  : sort === 'oldest' ? a.createdAt.localeCompare(b.createdAt)
                  : sort === 'title' ? a.modeTitle.localeCompare(b.modeTitle)
                  : 0,
                ).sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))).map((page) => {
                  const text = journalText(page.content).trim()
                  const words = text ? text.split(/\s+/).length : 0
                  return (
                    <div key={page.id} className="daybook-page-wrap">
                    <button
                      type="button"
                      className={`daybook-page-card${page.private && revealed !== page.id ? ' is-private' : ''}`}
                      onClick={() => {
                        if (page.private && revealed !== page.id) setRevealed(page.id)
                        else openPage(page)
                      }}
                    >
                      <span className="daybook-page-date">
                        {new Date(page.updatedAt).toLocaleDateString(language, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {page.pinned && ' · 📌'}
                      </span>
                      <strong>{page.mood && <span aria-label="Mood">{page.mood} </span>}{page.modeTitle}</strong>
                      <span className="daybook-page-preview">
                        {text.slice(0, 160) || 'Empty page'}
                      </span>
                      {page.flow && subOn('flowTopography', 'thumbnails') && (
                        <FlowMountain fp={page.flow} compact label="Writing flow" />
                      )}
                      <small>
                        {words} {words === 1 ? 'word' : 'words'}
                      </small>
                    </button>
                    <div className="daybook-page-tools">
                      <button type="button" title="Duplicate this page" onClick={() => {
                        const now = new Date().toISOString()
                        persist({ ...page, id: crypto.randomUUID(), modeTitle: `${page.modeTitle} (copy)`, createdAt: now, updatedAt: now, flow: undefined }, false)
                      }}>
                        ⧉
                      </button>
                      <button type="button" title={page.private ? 'Show on the home screen' : 'Blur on the home screen'} aria-pressed={Boolean(page.private)} onClick={() => persist({ ...page, private: !page.private }, false)}>
                        {page.private ? '🔒' : '🔓'}
                      </button>
                      <button type="button" title={page.pinned ? 'Unpin' : 'Pin to the front'} aria-pressed={Boolean(page.pinned)} onClick={() => persist({ ...page, pinned: !page.pinned }, false)}>
                        📌
                      </button>
                      <button type="button" title="Copy the text" onClick={(e) => { void navigator.clipboard?.writeText(text); e.currentTarget.textContent = '✓' }}>
                        📋
                      </button>
                      <button type="button" title="Delete this page" onClick={() => removePage(page)}>
                        🗑
                      </button>
                    </div>
                    </div>
                  )
                })}
              </Carousel>
            )}
            <h2>What do you need today?</h2>
            <div className="choice-grid">
              {choices.map(({ key, label, Icon }) => (
                <button
                  className="direction-card"
                  key={key}
                  onClick={() => setCategory(key)}
                >
                  <Icon size={28} />
                  <strong>{label}</strong>
                  <ArrowRight size={17} />
                </button>
              ))}
            </div>
            <div className="daybook-home-actions">
              <button className="quiet-button" onClick={() => setBrowse(true)}>
                Browse all pages
              </button>
              <button
                className="quiet-button"
                aria-expanded={libraryOpen}
                onClick={() => setLibraryOpen(!libraryOpen)}
              >
                Search pages
              </button>
            </div>
            {libraryOpen && (
              <SemanticSearch
                entries={entries}
                onOpen={(id) => {
                  const page = entries.find((item) => item.id === id)
                  if (page) openPage(page)
                }}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
