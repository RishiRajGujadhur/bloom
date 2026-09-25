import { useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  ArrowRight,
  BookOpen,
  Castle,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Leaf,
  ListChecks,
  Pause,
  Play,
  SlidersHorizontal,
  Sun,
  Timer,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { memories } from '../../features/insights'
import { startFocusQuest } from '../../rpg/engine'
import { useOptionalAudioMixer } from '../../contexts/AudioMixerContext'
import { mixerPresets } from '../../types/audio'
import type { NavKey } from '../layout/Sidebar'
import { Menu, Select } from '../ui/Menu'
import focusStones from '../../assets/bloom/focus-stones.webp'
import journalBook from '../../assets/bloom/journal-book.webp'
import landscape from '../../assets/bloom/hero-landscape.webp'
import './overview.css'

type Navigate = (key: NavKey) => void

/** Card shell shared by every overview tile: icon, title, optional link. */
export function OverviewCard({
  icon: Icon,
  tone,
  title,
  action,
  className = '',
  children,
  labelledBy,
}: {
  icon: LucideIcon
  tone: 'sage' | 'sun' | 'rose' | 'clay'
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
  labelledBy: string
}) {
  return (
    <section
      className={`ov-card ${className}`}
      aria-labelledby={labelledBy}
    >
      <header className="ov-card-head">
        <span className={`ov-icon tone-${tone}`}>
          <Icon size={19} aria-hidden="true" />
        </span>
        <h2 id={labelledBy}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  )
}

export function CardLink({
  children,
  onClick,
}: {
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button className="ov-link" onClick={onClick}>
      {children} <ArrowRight size={15} aria-hidden="true" />
    </button>
  )
}

const focusMinutesOn = (data: AppData, day: string) =>
  data.rpg.focusHistory
    .filter((f) => dayKey(new Date(f.completedAt)) === day)
    .reduce((sum, f) => sum + f.minutes, 0)

function lastDays(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (count - 1 - i))
    return dayKey(date)
  })
}

/** The four "at a glance" tiles under the hero; each opens its full page. */
export function StatsRow({
  data,
  today,
  onNavigate,
}: {
  data: AppData
  today: string
  onNavigate: Navigate
}) {
  const habitsDone = data.habits.filter((h) => h.dates.includes(today)).length
  const plans = data.plans.filter((p) => p.date === today)
  const plansDone = plans.filter((p) => p.done).length
  const reflections = data.sessions.length
  const focusToday = focusMinutesOn(data, today)
  const week = lastDays(7).map((day) => focusMinutesOn(data, day))
  const peak = Math.max(25, ...week)
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0)
  const tiles: {
    key: NavKey
    icon: LucideIcon
    tone: 'sage' | 'sun' | 'rose' | 'clay'
    value: ReactNode
    label: string
    progress?: number
    spark?: boolean
  }[] = [
    {
      key: 'habits',
      icon: ListChecks,
      tone: 'sage',
      value: (
        <>
          {habitsDone}
          <small> / {data.habits.length}</small>
        </>
      ),
      label: 'Habits nurtured today',
      progress: pct(habitsDone, data.habits.length),
    },
    {
      key: 'planning',
      icon: Sun,
      tone: 'sun',
      value: (
        <>
          {plansDone}
          <small> / {plans.length}</small>
        </>
      ),
      label: 'Intentions followed',
      progress: pct(plansDone, plans.length),
    },
    {
      key: 'journal',
      icon: BookOpen,
      tone: 'rose',
      value: reflections,
      label: 'Moments of reflection',
      progress: Math.min(100, reflections * 10),
    },
    {
      key: 'focus',
      icon: Leaf,
      tone: 'sage',
      value: (
        <>
          {focusToday}
          <small>m</small>
        </>
      ),
      label: 'Focused today',
      spark: true,
    },
  ]
  return (
    <div className="ov-stats" role="list">
      {tiles.map((tile) => (
        <button
          key={tile.key}
          role="listitem"
          className="ov-stat"
          onClick={() => onNavigate(tile.key)}
        >
          <span className={`ov-icon ov-icon-lg tone-${tile.tone}`}>
            <tile.icon size={24} aria-hidden="true" />
          </span>
          <span className="ov-stat-copy">
            <strong>{tile.value}</strong>
            <span>{tile.label}</span>
            {tile.progress !== undefined && (
              <span className={`ov-bar tone-${tile.tone}`} aria-hidden="true">
                <i style={{ width: `${tile.progress}%` }} />
              </span>
            )}
          </span>
          {tile.spark && (
            <span className="ov-spark" aria-hidden="true">
              {week.map((minutes, i) => (
                <i
                  key={i}
                  style={{ height: `${18 + (minutes / peak) * 82}%` }}
                  data-empty={minutes === 0}
                />
              ))}
            </span>
          )}
          <ChevronRight className="ov-chevron" size={18} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

/** Journal teaser with illustration, echoing Headspace's "one clear next step". */
export function ReflectionCard({
  onNavigate,
  showJournal,
  showDaybook,
}: {
  onNavigate: Navigate
  showJournal: boolean
  showDaybook: boolean
}) {
  return (
    <OverviewCard
      icon={BookOpen}
      tone="clay"
      title="Reflection journal"
      labelledBy="ov-reflection"
      className="ov-reflection"
      action={
        showDaybook ? (
          <CardLink onClick={() => onNavigate('daybook')}>Daybook</CardLink>
        ) : undefined
      }
    >
      <div className="ov-reflect-body">
        <div>
          <h3>A moment to reflect</h3>
          <p>Choose the space that feels right today.</p>
          {showJournal && (
            <button className="ov-primary" onClick={() => onNavigate('journal')}>
              Write in journal <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
        <img src={journalBook} alt="" aria-hidden="true" />
      </div>
    </OverviewCard>
  )
}

const kindIcon: Record<string, LucideIcon> = {
  journal: BookOpen,
  focus: Timer,
  task: CheckCircle2,
  milestone: Leaf,
}

export function RecentMemories({
  data,
  onViewAll,
}: {
  data: AppData
  onViewAll: () => void
}) {
  const recent = memories(data).slice(0, 3)
  return (
    <OverviewCard
      icon={BookOpen}
      tone="sage"
      title="Recent memories"
      labelledBy="ov-memories"
      action={<CardLink onClick={onViewAll}>View all</CardLink>}
    >
      <ol className="ov-timeline">
        {recent.map((memory) => {
          const Icon = kindIcon[memory.kind] ?? Leaf
          return (
            <li key={memory.id}>
              <time dateTime={memory.date}>
                {new Date(`${memory.date}T12:00:00`).toLocaleDateString(
                  undefined,
                  { month: 'short', day: 'numeric' },
                )}
              </time>
              <span className="ov-icon ov-icon-sm tone-sun">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span>
                <strong>{memory.title}</strong>
                <small>{memory.detail}</small>
              </span>
            </li>
          )
        })}
      </ol>
    </OverviewCard>
  )
}

/** A compact focus timer: pick a length, start, and continue on the Focus page. */
export function FocusCard({
  data,
  setData,
  onNavigate,
}: {
  data: AppData
  setData: Dispatch<SetStateAction<AppData>>
  onNavigate: Navigate
}) {
  const quest = data.rpg.focusQuest
  const running = quest.startedAt !== null && quest.completedAt === null && quest.failedAt === null
  const setMinutes = (durationMinutes: number) =>
    setData((d) => ({
      ...d,
      rpg: { ...d.rpg, focusQuest: { ...d.rpg.focusQuest, durationMinutes } },
    }))
  return (
    <OverviewCard
      icon={Timer}
      tone="clay"
      title="Focus"
      labelledBy="ov-focus"
      className="ov-focus"
      action={<CardLink onClick={() => onNavigate('focus')}>Open full page</CardLink>}
    >
      <div className="ov-focus-body">
        <div>
          <Select
            label="Focus length"
            value={String(quest.durationMinutes)}
            disabled={running}
            onValueChange={(value) => setMinutes(Number(value))}
            options={[5, 15, 25, 50].map((m) => ({
              value: String(m),
              label: `${m} min`,
            }))}
          />
          <p className="ov-clock" aria-live="off">
            {String(quest.durationMinutes).padStart(2, '0')}:00
          </p>
          <button
            className="ov-primary"
            onClick={() => {
              if (!running)
                setData((d) => startFocusQuest(d, d.rpg.focusQuest.soundscape))
              onNavigate('focus')
            }}
          >
            <Play size={16} aria-hidden="true" />
            {running ? 'Continue focus' : 'Start focus'}
          </button>
        </div>
        <img src={focusStones} alt="" aria-hidden="true" />
      </div>
    </OverviewCard>
  )
}

/** Soundscape presets as filter chips, Calm-style: one tap to set the mood. */
export function SoundscapeCard() {
  const mixer = useOptionalAudioMixer()
  if (!mixer) return null
  const active =
    mixerPresets.find((p) => p.id === mixer.activePreset) ?? mixerPresets[0]
  return (
    <OverviewCard
      icon={Headphones}
      tone="clay"
      title="Soundscape"
      labelledBy="ov-sound"
      className="ov-sound"
    >
      <div
        className="ov-sound-player"
        style={{ backgroundImage: `url(${landscape})` }}
      >
        <span>
          <strong>{active.name}</strong>
          <small>{mixer.isPlaying ? 'Playing now' : 'Ambient mix'}</small>
        </span>
        <button
          className="ov-play"
          aria-label={mixer.isPlaying ? 'Pause soundscape' : 'Play soundscape'}
          onClick={() => {
            if (!mixer.activePreset) mixer.applyPreset(active.id)
            mixer.toggleMasterPlay()
          }}
        >
          {mixer.isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
      <div className="ov-chips" aria-label="Soundscape presets">
        {mixerPresets.map((preset) => (
          <button
            key={preset.id}
            aria-pressed={mixer.activePreset === preset.id}
            onClick={() => mixer.applyPreset(preset.id)}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </OverviewCard>
  )
}

/** Which overview modules are visible; remembered per browser. */
export type OverviewModules = Record<
  'stats' | 'focus' | 'reflection' | 'memories' | 'soundscape' | 'world' | 'growth',
  boolean
>
const MODULES_KEY = 'bloom-overview-modules'
const defaultModules: OverviewModules = {
  stats: true,
  focus: true,
  reflection: true,
  memories: true,
  soundscape: true,
  world: true,
  growth: true,
}

export function useOverviewModules() {
  const [modules, setModules] = useState<OverviewModules>(() => {
    try {
      return {
        ...defaultModules,
        ...(JSON.parse(localStorage.getItem(MODULES_KEY) ?? '{}') as Partial<OverviewModules>),
      }
    } catch {
      return defaultModules
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(MODULES_KEY, JSON.stringify(modules))
    } catch {
      /* Preference only. */
    }
  }, [modules])
  return [modules, setModules] as const
}

const moduleLabels: Record<keyof OverviewModules, string> = {
  stats: 'Today at a glance',
  focus: 'Focus timer',
  reflection: 'Reflection journal',
  memories: 'Recent memories',
  soundscape: 'Soundscape',
  world: 'Bloom World',
  growth: 'Your growth',
}

/** "Customize": show only the modules you use (hide what you never touch). */
export function CustomizeMenu({
  modules,
  setModules,
}: {
  modules: OverviewModules
  setModules: Dispatch<SetStateAction<OverviewModules>>
}) {
  return (
    <Menu
      label="Customize your dashboard"
      items={[
        { kind: 'label', label: 'Show on my dashboard' },
        ...(Object.keys(moduleLabels) as (keyof OverviewModules)[]).map(
          (key) => ({
            kind: 'checkbox' as const,
            label: moduleLabels[key],
            checked: modules[key],
            onCheckedChange: (checked: boolean) =>
              setModules((m) => ({ ...m, [key]: checked })),
          }),
        ),
      ]}
      trigger={
        <button type="button" className="ov-secondary ov-customize">
          <SlidersHorizontal size={17} aria-hidden="true" /> Customize
        </button>
      }
    />
  )
}

/** A small window into Bloom World from the dashboard slider. */
export function WorldTeaser({ onOpen }: { onOpen: () => void }) {
  return (
    <OverviewCard
      icon={Castle}
      tone="sage"
      title="Bloom World"
      labelledBy="ov-world"
      className="ov-world"
      action={<CardLink onClick={onOpen}>Visit</CardLink>}
    >
      <p className="ov-muted">
        Every task, focus session and journal entry grows your little island.
      </p>
      <button className="ov-primary" onClick={onOpen}>
        See what grew today <ArrowRight size={16} aria-hidden="true" />
      </button>
    </OverviewCard>
  )
}
