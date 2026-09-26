import { useEffect, useMemo, useState } from 'react'
import { Command } from 'cmdk'
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckSquare,
  Clock,
  CornerDownLeft,
  ListChecks,
  Moon,
  NotebookPen,
  Plus,
  Search,
  Sparkles,
  Sun,
  Terminal,
  Timer,
} from 'lucide-react'
import type { AppData } from '../../model'
import type { FeatureFlags } from '../../SettingsPage'
import { journalText } from '../../search/db'
import { useAIWorker } from '../../search/useAIWorker'
import {
  semanticSearch,
  syncSemanticIndex,
  type SemanticResult,
} from '../../search/semantic'
import { DAYBOOK_STORAGE_KEY } from '../daybook/storage'
import type { JournalEntry } from '../daybook/types'
import { pageDetails } from './FeatureGuide'
import { commandGroup, isCommand, parseCommand, type OmniAction } from './omnibox'
import { subOn } from '../../features/subFeatures'
import type { NavKey } from './Sidebar'
import '../ui/ui.css'

const RECENT_KEY = 'bloom-recent-pages'

/** Pages that disappear when their feature is switched off. */
export const pageFlags: Partial<Record<NavKey, keyof FeatureFlags>> = {
  habits: 'habitTracker',
  journal: 'chatJournal',
  daybook: 'daybookModes',
  calendar: 'fullCalendar',
  urges: 'urgeTracker',
  collectibles: 'collectibles',
  growth: 'rpgSkillTree',
  'vision-board': 'visionBoard',
  world: 'bloomWorld',
  breathe: 'breathe',
  mood: 'moodCheckin',
  gratitude: 'gratitude',
  sleep: 'sleepTracker',
  posture: 'postureGuard',
  epiphanies: 'epiphanies',
  diet: 'dietTracker',
  monk: 'monkMode',
  voice: 'voiceMemos',
  energy: 'energySankey',
  lab: 'insightsLab',
  taichi: 'wuXing',
  'routines': 'routineScheduler',
  'roadmap': 'goalRoadmap',
  'games': 'brainGames',
  'cards': 'flashcards',
  'mindmaps': 'mindMaps',
  'mirror': 'moodMirror',
  'ink': 'inkJournal',
  'mala': 'mala',
  'breathwork': 'breathwork',
  'meditate': 'meditation',
  'mixer': 'soundMixer',
  'sounds': 'focusSounds',
  'fasting': 'fasting',
  'scan': 'foodScanner',
  'body': 'bodyProgress',
  'run': 'runTracker',
  'stretch': 'mobility',
  'yoga': 'yogaFlow',
  'intervals': 'intervalCoach',
  'workouts': 'workoutLog',
  'exercises': 'exerciseGuides',
  shop: 'petalShop',
  'release': 'burnRelease',
  'focus-room': 'focusRoom',
  'explore': 'queryBuilder',
  'yearbook': 'yearbook',
  'palace': 'memoryPalace',
  'journey': 'streakJourney',
  'places': 'placesMap',
}

export function readRecentPages(): NavKey[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(value)
      ? value.filter((key): key is NavKey => typeof key === 'string' && key in pageDetails)
      : []
  } catch {
    return []
  }
}

/** Remembers the last few destinations for the palette's "Recent" group. */
export function rememberPage(key: NavKey) {
  try {
    const next = [key, ...readRecentPages().filter((k) => k !== key)].slice(0, 5)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* Recents are a convenience only. */
  }
}

/** Opens a saved Daybook page; the Daybook listens for this. */
export const OPEN_DAYBOOK_EVENT = 'bloom:open-daybook'
export function openDaybookPage(id: string) {
  try {
    sessionStorage.setItem(OPEN_DAYBOOK_EVENT, id)
  } catch {
    /* The event below still works while the Daybook is mounted. */
  }
  window.dispatchEvent(new CustomEvent(OPEN_DAYBOOK_EVENT, { detail: id }))
}

function readDaybook(): JournalEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? (value as JournalEntry[]) : []
  } catch {
    return []
  }
}

const snippet = (text: string, length = 90) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text

const shortDate = (value: string | number) =>
  new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export function CommandPalette({
  open,
  onOpenChange,
  data,
  flags,
  isDark,
  onNavigate,
  onAddHabit,
  onAddIntention,
  onToggleTheme,
  onTalk,
  onCommand,
  today = new Date().toISOString().slice(0, 10),
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: AppData
  flags: FeatureFlags
  isDark: boolean
  onNavigate: (key: NavKey) => void
  onAddHabit: () => void
  onAddIntention: () => void
  onToggleTheme: () => void
  onTalk: () => void
  /** Runs an Omnibox command (">" prefix). */
  onCommand?: (action: OmniAction) => void
  today?: string
}) {
  const [search, setSearch] = useState('')
  const [daybook, setDaybook] = useState<JournalEntry[]>([])
  const [meaning, setMeaning] = useState<SemanticResult[] | null>(null)
  const [meaningBusy, setMeaningBusy] = useState(false)
  const [meaningError, setMeaningError] = useState('')
  const { embed, status } = useAIWorker()
  const [selected, setSelected] = useState('')

  // Global shortcut: Ctrl/Cmd + K toggles, "/" opens when not typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const typing =
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        onOpenChange(!open)
      } else if (event.key === '/' && !typing && !open) {
        event.preventDefault()
        onOpenChange(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    // Refresh on every open so newly saved pages are findable.
    setDaybook(readDaybook())
    setSearch('')
    setMeaning(null)
    setMeaningError('')
  }, [open])

  const pages = (Object.keys(pageDetails) as NavKey[]).filter((key) => {
    const need = pageFlags[key]
    return !need || flags[need]
  })
  const recent = open ? readRecentPages().filter((key) => pages.includes(key)) : []
  const sessions = useMemo(
    () =>
      data.sessions
        .map((session) => ({
          id: session.metadata.id,
          date: session.metadata.date,
          text: session.messages
            .filter((m) => m.sender === 'user')
            .map((m) => m.text)
            .join(' ')
            .trim(),
          tags: session.metadata.tags,
        }))
        .filter((s) => s.text)
        .reverse(),
    [data.sessions],
  )
  const query = search.trim()
  const commandMode = Boolean(onCommand) && flags.omnibox && isCommand(search)
  const commands = commandMode ? parseCommand(search, data, today).filter((c) => subOn('omnibox', commandGroup(c.id))) : []
  const previewOn = flags.omnibox && subOn('omnibox', 'previews')
  const preview = (() => {
    if (!previewOn || commandMode) return null
    const [kind, id] = selected.split(' ')
    if (kind === 'daybook' || kind === 'meaning') {
      const entry = daybook.find((e) => e.id === id)
      return entry ? { title: entry.modeTitle, date: entry.updatedAt, text: journalText(entry.content).trim() } : null
    }
    if (kind === 'journal') {
      const session = sessions.find((x) => x.id === id)
      return session ? { title: 'Reflection', date: session.date, text: session.text } : null
    }
    return null
  })()
  const go = (action: () => void) => {
    onOpenChange(false)
    action()
  }
  const searchByMeaning = async () => {
    setMeaningBusy(true)
    setMeaningError('')
    try {
      await syncSemanticIndex(daybook, embed)
      setMeaning(await semanticSearch(query, embed))
    } catch {
      setMeaningError('Search by meaning could not finish. Try again in a moment.')
    } finally {
      setMeaningBusy(false)
    }
  }

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search your space"
      overlayClassName="cmdk-overlay"
      contentClassName={`cmdk-panel${preview ? ' has-preview' : ''}`}
      loop
      shouldFilter={!commandMode}
      value={selected}
      onValueChange={setSelected}
    >
      <div className="cmdk-input-row">
        <Search size={20} aria-hidden="true" />
        <Command.Input
          value={search}
          onValueChange={(value) => {
            setSearch(value)
            setMeaning(null)
          }}
          placeholder={flags.omnibox ? 'Search, or type > for commands…' : 'Search pages, journal entries, habits, tasks…'}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="cmdk-body">
      <Command.List>
        {commandMode && (
          <Command.Group heading="Commands">
            {commands.map((c) => (
              <Command.Item
                key={c.id}
                value={`cmd ${c.id}`}
                disabled={!c.action}
                onSelect={() => c.action && go(() => onCommand?.(c.action!))}
              >
                <Terminal size={17} aria-hidden="true" />
                <span className="cmdk-item-text">
                  {c.label}
                  <small>{c.hint}</small>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {!commandMode && (<>
        <Command.Empty>

          Nothing matches “{query}”. Try fewer words, or search by meaning.
        </Command.Empty>

        {!query && recent.length > 0 && (
          <Command.Group heading="Recent">
            {recent.map((key) => (
              <Command.Item
                key={`recent-${key}`}
                value={`recent ${pageDetails[key].title}`}
                onSelect={() => go(() => onNavigate(key))}
              >
                <Clock size={17} aria-hidden="true" />
                <span className="cmdk-item-text">{pageDetails[key].title}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        <Command.Group heading="Actions">
          {flags.habitTracker && (
            <Command.Item value="add new habit" onSelect={() => go(onAddHabit)}>
              <ListChecks size={17} aria-hidden="true" />
              <span className="cmdk-item-text">Add a small habit</span>
            </Command.Item>
          )}
          <Command.Item value="add intention plan today" onSelect={() => go(onAddIntention)}>
            <Sun size={17} aria-hidden="true" />
            <span className="cmdk-item-text">Set an intention for today</span>
          </Command.Item>
          <Command.Item value="start focus timer session" onSelect={() => go(() => onNavigate('focus'))}>
            <Timer size={17} aria-hidden="true" />
            <span className="cmdk-item-text">Start a focus session</span>
          </Command.Item>
          {flags.daybookModes && (
            <Command.Item value="write journal daybook page" onSelect={() => go(() => onNavigate('daybook'))}>
              <NotebookPen size={17} aria-hidden="true" />
              <span className="cmdk-item-text">Write in your Daybook</span>
            </Command.Item>
          )}
          <Command.Item value="talk to bloom companion plan" onSelect={() => go(onTalk)}>
            <Sparkles size={17} aria-hidden="true" />
            <span className="cmdk-item-text">Talk to Bloom</span>
          </Command.Item>
          <Command.Item value="change theme dark light mode" onSelect={() => go(onToggleTheme)}>
            {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            <span className="cmdk-item-text">
              Switch to {isDark ? 'light' : 'dark'} mode
            </span>
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Go to">
          {pages.map((key) => (
            <Command.Item
              key={key}
              value={`${pageDetails[key].title} ${key}`}
              keywords={[pageDetails[key].description]}
              onSelect={() => go(() => onNavigate(key))}
            >
              <ArrowRight size={17} aria-hidden="true" />
              <span className="cmdk-item-text">
                {pageDetails[key].title}
                <small>{pageDetails[key].description}</small>
              </span>
            </Command.Item>
          ))}
        </Command.Group>

        {query && flags.daybookModes && daybook.length > 0 && (
          <Command.Group heading="Daybook pages">
            {daybook.map((entry) => {
              const text = journalText(entry.content).trim()
              return (
                <Command.Item
                  key={entry.id}
                  value={`daybook ${entry.id} ${entry.modeTitle}`}
                  keywords={[text.slice(0, 600)]}
                  onSelect={() =>
                    go(() => {
                      onNavigate('daybook')
                      openDaybookPage(entry.id)
                    })
                  }
                >
                  <NotebookPen size={17} aria-hidden="true" />
                  <span className="cmdk-item-text">
                    {entry.modeTitle}
                    <small>{snippet(text) || 'Empty page'}</small>
                  </span>
                  <span className="cmdk-item-meta">{shortDate(entry.updatedAt)}</span>
                </Command.Item>
              )
            })}
          </Command.Group>
        )}

        {query && flags.chatJournal && sessions.length > 0 && (
          <Command.Group heading="Journal entries">
            {sessions.map((session) => (
              <Command.Item
                key={session.id}
                value={`journal ${session.id}`}
                keywords={[session.text.slice(0, 600), ...session.tags]}
                onSelect={() => go(() => onNavigate('journal'))}
              >
                <BookOpen size={17} aria-hidden="true" />
                <span className="cmdk-item-text">
                  {snippet(session.text, 60)}
                  <small>{session.tags.join(' ') || 'Guided reflection'}</small>
                </span>
                <span className="cmdk-item-meta">{shortDate(session.date)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {query && flags.habitTracker && data.habits.length > 0 && (
          <Command.Group heading="Habits">
            {data.habits.map((habit) => (
              <Command.Item
                key={habit.id}
                value={`habit ${habit.id} ${habit.title}`}
                keywords={[habit.detail]}
                onSelect={() => go(() => onNavigate('habits'))}
              >
                <ListChecks size={17} aria-hidden="true" />
                <span className="cmdk-item-text">
                  {habit.title}
                  {habit.detail && <small>{habit.detail}</small>}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        {query && data.todos.length > 0 && (
          <Command.Group heading="Tasks">
            {data.todos.map((task) => (
              <Command.Item
                key={task.id}
                value={`task ${task.id} ${task.title}`}
                onSelect={() => go(() => onNavigate('todos'))}
              >
                <CheckSquare size={17} aria-hidden="true" />
                <span className="cmdk-item-text">
                  {task.title}
                  <small>{task.done ? 'Done' : `Due ${task.due}`}</small>
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        )}

        </>)}
        {!commandMode && meaning && meaning.length > 0 && (
          <Command.Group heading="Closest in meaning" forceMount>
            {meaning.map((result) => (
              <Command.Item
                key={`meaning-${result.id}`}
                value={`meaning ${result.id}`}
                forceMount
                onSelect={() =>
                  go(() => {
                    onNavigate('daybook')
                    openDaybookPage(result.id)
                  })
                }
              >
                <Brain size={17} aria-hidden="true" />
                <span className="cmdk-item-text">
                  {result.title}
                  <small>{snippet(result.text)}</small>
                </span>
                <span className="cmdk-item-meta">{Math.round(result.score * 100)}%</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
      {preview && (
        <aside className="cmdk-preview" aria-label="Preview">
          <strong>{preview.title}</strong>
          <time>{new Date(preview.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</time>
          <p>{preview.text.slice(0, 900) || 'Empty page'}</p>
        </aside>
      )}
      </div>

      {query.length >= 3 && flags.daybookModes && (
        <div className="cmdk-semantic" role="status" aria-live="polite">
          <Brain size={16} aria-hidden="true" />
          {meaningBusy
            ? `Searching by meaning… ${status}`
            : meaningError ||
              (meaning
                ? meaning.length
                  ? `${meaning.length} pages close in meaning`
                  : 'No saved pages are close in meaning yet.'
                : 'Recall a feeling, not just a phrase. Runs privately on your device.')}
          {!meaningBusy && (
            <button type="button" onClick={searchByMeaning}>
              <Plus size={13} aria-hidden="true" /> Search by meaning
            </button>
          )}
        </div>
      )}
      <div className="cmdk-footer" aria-hidden="true">
        <span>
          <span className="kbd">↑</span>
          <span className="kbd">↓</span> to move
        </span>
        <span>
          <span className="kbd">
            <CornerDownLeft size={11} />
          </span>{' '}
          to open
        </span>
        <span>
          <span className="kbd">Ctrl K</span> anywhere
        </span>
        {flags.omnibox && (
          <span>
            <span className="kbd">&gt;</span> commands
          </span>
        )}
      </div>
    </Command.Dialog>
  )
}
