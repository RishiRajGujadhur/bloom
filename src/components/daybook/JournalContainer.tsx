import { useEffect, useMemo, useState } from 'react'
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
  const language = i18n.resolvedLanguage ?? 'en'
  const modes = useMemo(() => localizedJournalModes(language), [language])
  const entry = selected
    ? entries.find((item) => item.modeId === selected.id)
    : undefined
  const save = (next: JournalEntry) => {
    if (initial.error) return
    const updated = [next, ...entries.filter((item) => item.id !== next.id)]
    try {
      localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(updated))
      setEntries(updated)
      setSelected(null)
      setStorageError('')
    } catch {
      setStorageError(t('daybook.storageError'))
    }
  }
  // Search (command palette) can open a saved page directly.
  useEffect(() => {
    const open = (modeId: string | null) => {
      const mode = modeId && modes.find((m) => m.id === modeId)
      if (!mode) return
      try {
        sessionStorage.removeItem(OPEN_DAYBOOK_EVENT)
      } catch {
        /* nothing to clear */
      }
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
            key={selected.id}
            mode={selected}
            entry={entry}
            onBack={() => setSelected(null)}
            onSave={save}
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
              onSelect={setSelected}
            />
          </>
        ) : (
          <div className="journal-direction">
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
            <button className="quiet-button" onClick={() => setBrowse(true)}>
              Browse all pages
            </button>
            <button
              className="quiet-button"
              aria-expanded={libraryOpen}
              onClick={() => setLibraryOpen(!libraryOpen)}
            >
              Saved pages · {entries.length}
            </button>
            {libraryOpen && (
              <SemanticSearch
                entries={entries}
                onOpen={(modeId) =>
                  setSelected(modes.find((mode) => mode.id === modeId) ?? null)
                }
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}
