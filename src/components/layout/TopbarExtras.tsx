import { useMemo } from 'react'
import {
  BookOpen,
  CheckSquare,
  ChevronDown,
  Flame,
  ListChecks,
  Search,
  Sun,
  Timer,
} from 'lucide-react'
import { Menu, type MenuItem } from '../ui/Menu'
import { LottieIcon } from '../ui/LottieIcon'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { activityDays } from '../../features/insights'
import { activityStreak } from '../../features/world/worldModel'
import type { NavKey } from './Sidebar'

type Navigate = (key: NavKey) => void

/** Looks like a search field; opens the command palette (autocomplete). */
export function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  const mac =
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
  return (
    <button type="button" className="topbar-search" onClick={onOpen}>
      <Search size={18} aria-hidden="true" />
      <span>Search your space…</span>
      <kbd className="kbd" aria-hidden="true">
        {mac ? '⌘' : 'Ctrl'} K
      </kbd>
    </button>
  )
}

export function QuickAdd({
  onHabit,
  onIntention,
  onNavigate,
}: {
  onHabit: () => void
  onIntention: () => void
  onNavigate: Navigate
}) {
  const items: MenuItem[] = [
    { label: 'A small habit', icon: <ListChecks size={17} />, onSelect: onHabit },
    { label: 'An intention for today', icon: <Sun size={17} />, onSelect: onIntention },
    { label: 'A to-do', icon: <CheckSquare size={17} />, onSelect: () => onNavigate('todos') },
    { kind: 'separator' },
    { label: 'A journal entry', icon: <BookOpen size={17} />, onSelect: () => onNavigate('journal') },
    { label: 'A focus session', icon: <Timer size={17} />, onSelect: () => onNavigate('focus') },
  ]
  return (
    <Menu
      label="Quick add"
      items={items}
      trigger={
        <button type="button" className="quick-add">
          <LottieIcon name="plus" size={18} /> Quick add
          <ChevronDown className="quick-add-chevron" size={16} aria-hidden="true" />
        </button>
      }
    />
  )
}

/** Day streak across all activity, with the last seven days as dots. */
export function StreakPill({ data, today }: { data: AppData; today: string }) {
  const { streak, week } = useMemo(() => {
    const active = new Set(
      activityDays(data)
        .filter((d) => d.tasks || d.focus || d.journals || d.habits)
        .map((d) => d.date),
    )
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(`${today}T12:00:00`)
      date.setDate(date.getDate() - (6 - i))
      return dayKey(date)
    })
    return {
      streak: activityStreak(active, today).current,
      week: days.map((day) => active.has(day)),
    }
  }, [data, today])
  return (
    <span className="streak-pill" title="Days in a row with any activity">
      <Flame size={18} color="#e8743b" aria-hidden="true" />
      {streak} day streak
      <span className="streak-dots" aria-hidden="true">
        {week.map((on, i) => (
          <i key={i} data-on={on} />
        ))}
      </span>
    </span>
  )
}
