import { subOn } from '../../features/subFeatures'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Carousel } from '../ui/Carousel'
import { journalText } from '../../search/db'
import { DAYBOOK_STORAGE_KEY } from './storage'
import { OPEN_DAYBOOK_EVENT } from '../layout/navigationHistory'
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalEntry, JournalMode, JournalCategory } from './types'
import { localizedJournalModes } from './mockData'
import { AdaptiveEditor } from './AdaptiveEditor'
import { JournalLibrary } from './JournalLibrary'
import { DaybookQuick } from '../../features/quick/DaybookQuick'
import { Bookshelf } from './Bookshelf'
import { JournalReader } from './JournalReader'
import { usePageActions } from '../ui/PageMenu'
import { SemanticSearch } from './SemanticSearch'
import './daybook.css'
import './selection.css'
import { PixelArt } from './PixelArt'
import { changeDaybookView } from './transition'
import { prefersReducedMotion } from '../../utils/motion'
import { FlowMountain } from '../../features/flow/FlowMountain'
import { capturePlace } from '../../features/places/placesStore'
import { loadSettings } from '../../settings/appSettings'

export { DAYBOOK_STORAGE_KEY }
export function JournalContainer() {
  const { t } = useTranslation(undefined, { i18n })
  const [category, setCategory] = useState<JournalCategory | null>(null)
  const [browse, setBrowse] = useState(false)
  const [selected, setSelected] = useState<JournalMode | null>(null)
  const [viewing, setViewing] = useState<{
    id: string
    source?: DOMRect
  } | null>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(0)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (suggestionsOpen && !selected && !category && !browse) {
      suggestionsRef.current?.scrollIntoView?.({
        block: 'center',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
      suggestionsRef.current?.focus({ preventScroll: true })
    }
  }, [suggestionsOpen, selected, category, browse])
  const [lastModeId, setLastModeId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('bloom-daybook-last-mode')
    } catch {
      return null
    }
  })
  const [storageError, setStorageError] = useState('')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [pageSearch, setPageSearch] = useState('')
  const [sort, setSort] = useState(() => {
    try {
      return localStorage.getItem('bloom-daybook-sort') ?? 'edited'
    } catch {
      return 'edited'
    }
  })
  const changeSort = (v: string) => {
    setSort(v)
    try {
      localStorage.setItem('bloom-daybook-sort', v)
    } catch {
      /* optional */
    }
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
    () => [...entries].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [entries],
  )
  const visiblePages = useMemo(() => {
    const query = pageSearch.trim().toLocaleLowerCase()
    if (!query) return recentPages
    return recentPages.filter((page) =>
      `${page.modeTitle} ${journalText(page.content)}`
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [pageSearch, recentPages])
  const language = i18n.resolvedLanguage ?? 'en'
  const modes = useMemo(() => localizedJournalModes(language), [language])
  // The page types you write most, for one-tap fresh pages.
  const favouriteModes = useMemo(() => {
    const counts = new Map<string, number>()
    for (const e of entries)
      counts.set(e.modeId, (counts.get(e.modeId) ?? 0) + 1)
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
      if (
        loadSettings().features.placesMap &&
        subOn('placesMap', 'daybookCapture')
      )
        capturePlace('daybook', null, { ref: next.id, label: next.modeTitle })
      setSelected(null)
      setEntryId(null)
    } else setEntryId(next.id)
  }
  // A page from at least a week ago (not private), picked once per visit.
  const [memoryId] = useState(() => {
    const old = initial.entries.filter(
      (e) =>
        !e.private &&
        Date.now() - new Date(e.updatedAt).getTime() > 7 * 864e5 &&
        journalText(e.content).trim().length > 20,
    )
    return old.length ? old[Math.floor(Math.random() * old.length)].id : null
  })
  const memory = entries.find((e) => e.id === memoryId) ?? null
  const monthWords = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7)
    return entries
      .filter((e) => e.createdAt.startsWith(month))
      .reduce((n, e) => {
        const text = journalText(e.content).trim()
        return n + (text ? text.split(/\s+/).length : 0)
      }, 0)
  }, [entries])
  // Longest run of consecutive days with a page.
  const bestStreak = useMemo(() => {
    const days = [
      ...new Set(entries.map((e) => e.createdAt.slice(0, 10))),
    ].sort()
    let best = 0
    let run = 0
    let prev = ''
    for (const d of days) {
      const p = new Date(`${d}T12:00:00`)
      p.setDate(p.getDate() - 1)
      run = prev === p.toISOString().slice(0, 10) ? run + 1 : 1
      best = Math.max(best, run)
      prev = d
    }
    return best
  }, [entries])
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
  const openPage = (page: JournalEntry, source?: HTMLElement) => {
    setViewing({ id: page.id, source: source?.getBoundingClientRect() })
  }
  const editPage = (page: JournalEntry) => {
    setViewing(null)
    const mode = modes.find((m) => m.id === page.modeId) ?? {
      ...modes[0],
      id: page.modeId,
      title: page.modeTitle,
    }
    try {
      localStorage.setItem('bloom-daybook-last-mode', mode.id)
    } catch {
      /* optional */
    }
    setLastModeId(mode.id)
    setSession((s) => s + 1)
    setEntryId(page.id)
    setSelected(mode)
  }
  const startPage = (mode: JournalMode | null) => {
    if (mode) {
      try {
        localStorage.setItem('bloom-daybook-last-mode', mode.id)
      } catch {
        /* optional */
      }
      setLastModeId(mode.id)
    }
    changeDaybookView(() => {
      setSession((s) => s + 1)
      setEntryId(null)
      setSelected(mode)
    })
  }
  // Search (command palette) can open a saved page directly.
  useEffect(() => {
    // Accepts a saved page id (preferred) or a mode id (starts a new page).
    const open = (id: string | null) => {
      if (!id) return
      const page = entriesRef.current.find((item) => item.id === id)
      const mode = modes.find((m) => m.id === (page?.modeId ?? id))
      if (!mode && !page) return
      try {
        sessionStorage.removeItem(OPEN_DAYBOOK_EVENT)
      } catch {
        /* nothing to clear */
      }
      if (page) {
        setViewing({ id: page.id })
        return
      }
      setSession((s) => s + 1)
      setEntryId(null)
      if (mode) setSelected(mode)
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
    changeDaybookView(() => {
      setCategory(null)
      setBrowse(false)
    })
  }
  const choices = [
    {
      key: 'planning',
      label: 'Plan',
      description: 'Make room for what matters.',
    },
    {
      key: 'reflection',
      label: 'Reflect',
      description: 'Listen to the day you have lived.',
    },
    {
      key: 'vision',
      label: 'Imagine',
      description: 'Give your possibilities a little space.',
    },
    {
      key: 'gamified',
      label: 'Explore',
      description: 'Follow a prompt somewhere new.',
    },
  ] as const
  usePageActions(
    [
      {
        id: 'daybook-suggest',
        label: 'Not sure what to write?',
        icon: '✨',
        run: () => {
          changeDaybookView(() => {
            setSelected(null)
            setCategory(null)
            setBrowse(false)
            setSuggestionsOpen((request) => request + 1)
          })
        },
      },
      {
        id: 'daybook-browse',
        label: 'Browse every page type',
        icon: '📚',
        run: () => setBrowse(true),
      },
      ...(recentPages[0]
        ? [
            {
              id: 'daybook-continue',
              label: `Read “${recentPages[0].modeTitle}”`,
              icon: '✍️',
              run: () => openPage(recentPages[0]),
            },
          ]
        : []),
    ].filter((action) => action.id !== 'daybook-suggest' || !selected),
  )
  return (
    <section
      className={`card daybook daybook-wizard mx-auto w-full rounded-ui-lg border border-ui-border bg-surface p-4 sm:p-6 ${selected ? 'is-writing max-w-[1180px]' : 'max-w-5xl'}`}
      id="daybook"
    >
      {viewing && (
        <JournalReader
          key={viewing.id}
          pages={entries}
          modes={modes}
          entryId={viewing.id}
          source={viewing.source}
          language={language}
          onClose={() => setViewing(null)}
          onEdit={editPage}
        />
      )}
      <div className="daybook-container">
        <ol
          className="wizard-steps"
          aria-label="Journal steps"
          hidden={Boolean(selected)}
        >
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
            <button
              type="button"
              onClick={() => {
                persist(undoPage, false)
                setEntryId(null)
                setUndoPage(null)
              }}
            >
              Undo
            </button>
          </p>
        )}
        {(storageError || initial.error) && (
          <p role="alert">{storageError || initial.error}</p>
        )}
        <div
          key={
            selected
              ? `editor:${session}`
              : category || (browse ? 'browse' : 'home')
          }
          className="daybook-view"
        >
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
              <header className="daybook-selection-heading">
                <span className="journal-eyebrow">A LITTLE SPACE FOR YOU</span>
                <h2>What do you need today?</h2>
                <p>Choose a direction. Let the words follow.</p>
              </header>
              <div className="choice-grid">
                {choices.map(({ key, label, description }) => (
                  <button
                    className="direction-card"
                    data-category={key}
                    aria-label={label}
                    key={key}
                    onClick={() => changeDaybookView(() => setCategory(key))}
                  >
                    <PixelArt category={key} />
                    <span className="direction-copy">
                      <strong>{label}</strong>
                      <small>{description}</small>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ))}
              </div>
              {Boolean(suggestionsOpen) && (
                <div
                  ref={suggestionsRef}
                  tabIndex={-1}
                  aria-label="Writing suggestions"
                >
                  <DaybookQuick
                    key={suggestionsOpen}
                    modes={modes}
                    onSelect={startPage}
                    initialOpen
                  />
                </div>
              )}
              {subOn('daybookModes', 'savedJournals') && (
                <>
                  {favouriteModes.length > 0 && (
                    <div
                      className="daybook-favs"
                      role="group"
                      aria-label="Your usual page types"
                    >
                      <span>Start a fresh</span>
                      {favouriteModes.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => startPage(m)}
                        >
                          {m.icon} {m.title}
                        </button>
                      ))}
                    </div>
                  )}
                  {lastModeId &&
                    !selected &&
                    (() => {
                      const lastMode = modes.find((m) => m.id === lastModeId)
                      return lastMode ? (
                        <button
                          type="button"
                          className="quiet-button"
                          onClick={() => startPage(lastMode)}
                        >
                          Resume last mode · {lastMode.title}
                        </button>
                      ) : null
                    })()}
                  {subOn('daybookModes', 'bookshelf') && (
                    <Bookshelf
                      pages={recentPages}
                      modes={modes}
                      onOpen={openPage}
                    />
                  )}
                  {recentPages.length > 1 && subOn('daybookModes', 'pages') && (
                    <label className="daybook-sort">
                      Sort pages
                      <select
                        value={sort}
                        onChange={(e) => changeSort(e.target.value)}
                      >
                        <option value="edited">Last edited</option>
                        <option value="created">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="title">By page type</option>
                      </select>
                    </label>
                  )}
                  {memory && (
                    <button
                      type="button"
                      className="daybook-memory"
                      onClick={() => openPage(memory)}
                    >
                      <small>
                        ✦ From{' '}
                        {Math.round(
                          (Date.now() - new Date(memory.updatedAt).getTime()) /
                            864e5,
                        )}{' '}
                        days ago · {memory.modeTitle}
                      </small>
                      <span>
                        {journalText(memory.content).trim().slice(0, 200)}
                      </span>
                    </button>
                  )}
                  {recentPages.length > 0 && subOn('daybookModes', 'pages') && (
                    <>
                      <label className="daybook-search">
                        <BookOpen size={16} aria-hidden="true" />
                        <input
                          type="search"
                          aria-label="Search saved Daybook pages"
                          placeholder="Search page types or writing…"
                          value={pageSearch}
                          onChange={(event) =>
                            setPageSearch(event.target.value)
                          }
                        />
                        {pageSearch && (
                          <button
                            type="button"
                            onClick={() => setPageSearch('')}
                          >
                            Clear
                          </button>
                        )}
                      </label>
                      {visiblePages.length > 0 ? (
                        <Carousel
                          label="Your pages"
                          title={`Your pages · ${visiblePages.length}${monthWords ? ` · ${monthWords.toLocaleString()} words this month` : ''}${bestStreak > 1 ? ` · best streak ${bestStreak} days` : ''}`}
                        >
                          {[...visiblePages]
                            .sort((a, b) =>
                              sort === 'created'
                                ? b.createdAt.localeCompare(a.createdAt)
                                : sort === 'oldest'
                                  ? a.createdAt.localeCompare(b.createdAt)
                                  : sort === 'title'
                                    ? a.modeTitle.localeCompare(b.modeTitle)
                                    : 0,
                            )
                            .sort(
                              (a, b) =>
                                Number(Boolean(b.pinned)) -
                                Number(Boolean(a.pinned)),
                            )
                            .map((page) => {
                              const text = journalText(page.content).trim()
                              const words = text ? text.split(/\s+/).length : 0
                              return (
                                <div
                                  key={page.id}
                                  className="daybook-page-wrap"
                                >
                                  <button
                                    type="button"
                                    className={`daybook-page-card${page.private && revealed !== page.id ? ' is-private' : ''}`}
                                    onClick={(event) => {
                                      if (page.private && revealed !== page.id)
                                        setRevealed(page.id)
                                      else openPage(page, event.currentTarget)
                                    }}
                                  >
                                    <span className="daybook-page-date">
                                      {new Date(
                                        page.updatedAt,
                                      ).toLocaleDateString(language, {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      })}
                                      {page.pinned && ' · 📌'}
                                    </span>
                                    <strong>
                                      {page.mood && (
                                        <span aria-label="Mood">
                                          {page.mood}{' '}
                                        </span>
                                      )}
                                      {page.modeTitle}
                                    </strong>
                                    <span className="daybook-page-preview">
                                      {text.slice(0, 160) || 'Empty page'}
                                    </span>
                                    {page.flow &&
                                      subOn('flowTopography', 'thumbnails') && (
                                        <FlowMountain
                                          fp={page.flow}
                                          compact
                                          label="Writing flow"
                                        />
                                      )}
                                    <small>
                                      {words} {words === 1 ? 'word' : 'words'}
                                    </small>
                                  </button>
                                  <div className="daybook-page-tools">
                                    <button
                                      type="button"
                                      aria-label={`Duplicate ${page.modeTitle}`}
                                      title="Duplicate this page"
                                      onClick={() => {
                                        const now = new Date().toISOString()
                                        persist(
                                          {
                                            ...page,
                                            id: crypto.randomUUID(),
                                            modeTitle: `${page.modeTitle} (copy)`,
                                            createdAt: now,
                                            updatedAt: now,
                                            flow: undefined,
                                          },
                                          false,
                                        )
                                      }}
                                    >
                                      ⧉
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`${page.private ? 'Show' : 'Hide'} ${page.modeTitle} preview on the home screen`}
                                      title={
                                        page.private
                                          ? 'Show on the home screen'
                                          : 'Blur on the home screen'
                                      }
                                      aria-pressed={Boolean(page.private)}
                                      onClick={() =>
                                        persist(
                                          { ...page, private: !page.private },
                                          false,
                                        )
                                      }
                                    >
                                      {page.private ? '🔒' : '🔓'}
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`${page.pinned ? 'Unpin' : 'Pin'} ${page.modeTitle}`}
                                      title={
                                        page.pinned
                                          ? 'Unpin'
                                          : 'Pin to the front'
                                      }
                                      aria-pressed={Boolean(page.pinned)}
                                      onClick={() =>
                                        persist(
                                          { ...page, pinned: !page.pinned },
                                          false,
                                        )
                                      }
                                    >
                                      📌
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Copy text from ${page.modeTitle}`}
                                      title="Copy the text"
                                      onClick={(e) => {
                                        void navigator.clipboard?.writeText(
                                          text,
                                        )
                                        e.currentTarget.textContent = '✓'
                                      }}
                                    >
                                      📋
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Download ${page.modeTitle} as Markdown`}
                                      title="Download as Markdown"
                                      onClick={() => {
                                        const md = `# ${page.modeTitle}\n\n_${new Date(page.createdAt).toLocaleDateString(language, { dateStyle: 'full' })}${page.mood ? ` · ${page.mood}` : ''}_\n\n${text}\n`
                                        const a = document.createElement('a')
                                        a.href = URL.createObjectURL(
                                          new Blob([md], {
                                            type: 'text/markdown',
                                          }),
                                        )
                                        a.download = `${page.modeTitle.replace(/[^\w-]+/g, '-')}-${page.createdAt.slice(0, 10)}.md`
                                        a.click()
                                        setTimeout(
                                          () => URL.revokeObjectURL(a.href),
                                          1000,
                                        )
                                      }}
                                    >
                                      ⬇
                                    </button>
                                    <button
                                      type="button"
                                      aria-label={`Delete ${page.modeTitle}`}
                                      title="Delete this page"
                                      onClick={() => removePage(page)}
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>
                              )
                            })}
                        </Carousel>
                      ) : (
                        <p className="daybook-search-empty" role="status">
                          No saved pages match “{pageSearch}”.
                          <button
                            type="button"
                            onClick={() => setPageSearch('')}
                          >
                            Clear search
                          </button>
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
              <div className="daybook-home-actions">
                <button
                  className="quiet-button"
                  onClick={() => changeDaybookView(() => setBrowse(true))}
                >
                  Browse all pages
                </button>
                {subOn('daybookModes', 'savedJournals') && (
                  <button
                    className="quiet-button"
                    aria-expanded={libraryOpen}
                    onClick={() => setLibraryOpen(!libraryOpen)}
                  >
                    Search pages
                  </button>
                )}
              </div>
              {subOn('daybookModes', 'savedJournals') && libraryOpen && (
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
      </div>
    </section>
  )
}
