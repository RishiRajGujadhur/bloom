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
import { SemanticSearch } from './SemanticSearch'
import './daybook.css'
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
  // Each page is its own entry: choosing a mode starts a fresh page, while
  // "Your pages" (and search) reopen a specific saved one.
  const [entryId, setEntryId] = useState<string | null>(null)
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
      if (loadSettings().features.placesMap) capturePlace('daybook')
      setSelected(null)
      setEntryId(null)
    } else setEntryId(next.id)
  }
  const openPage = (page: JournalEntry) => {
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
        {(storageError || initial.error) && (
          <p role="alert">{storageError || initial.error}</p>
        )}
        {selected ? (
          <AdaptiveEditor
            key={`${selected.id}:${entry?.id ?? 'new'}`}
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
            {recentPages.length > 0 && (
              <Carousel label="Your pages" title={`Your pages · ${recentPages.length}`}>
                {recentPages.map((page) => {
                  const text = journalText(page.content).trim()
                  const words = text ? text.split(/\s+/).length : 0
                  return (
                    <button
                      key={page.id}
                      type="button"
                      className="daybook-page-card"
                      onClick={() => openPage(page)}
                    >
                      <span className="daybook-page-date">
                        {new Date(page.updatedAt).toLocaleDateString(language, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <strong>{page.modeTitle}</strong>
                      <span className="daybook-page-preview">
                        {text.slice(0, 160) || 'Empty page'}
                      </span>
                      <small>
                        {words} {words === 1 ? 'word' : 'words'}
                      </small>
                    </button>
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
