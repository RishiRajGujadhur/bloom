import { useId, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronDown, Flame, ListChecks, Plus, Search, Sun, Timer } from 'lucide-react'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { activityDays } from '../../features/insights'
import { activityStreak } from '../../features/world/worldModel'
import { pageDetails } from './FeatureGuide'
import type { NavKey } from './Sidebar'

type Navigate = (key: NavKey) => void

/** "Search your space": jump straight to any page by name. */
export function PageSearch({
  pages,
  onNavigate,
}: {
  pages: NavKey[]
  onNavigate: Navigate
}) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const titles = pages.map((key) => ({ key, title: pageDetails[key].title }))
  const go = (value: string) => {
    const needle = value.trim().toLowerCase()
    if (!needle) return
    const match =
      titles.find((p) => p.title.toLowerCase() === needle) ??
      titles.find(
        (p) => p.title.toLowerCase().includes(needle) || p.key.includes(needle),
      )
    if (match) {
      onNavigate(match.key)
      setQuery('')
    }
  }
  return (
    <form
      className="topbar-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        go(query)
      }}
    >
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        aria-label="Search your space"
        placeholder="Search your space…"
        list={listId}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          // Picking a suggestion from the list navigates immediately.
          if (titles.some((p) => p.title === e.target.value)) go(e.target.value)
        }}
      />
      <datalist id={listId}>
        {titles.map((p) => (
          <option key={p.key} value={p.title} />
        ))}
      </datalist>
    </form>
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
  const menu = useRef<HTMLDetailsElement>(null)
  const pick = (action: () => void) => () => {
    menu.current?.removeAttribute('open')
    action()
  }
  return (
    <details className="quick-add" ref={menu}>
      <summary>
        <Plus size={18} aria-hidden="true" /> Quick add
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div className="quick-add-menu">
        <button onClick={pick(onHabit)}>
          <ListChecks size={17} aria-hidden="true" /> A small habit
        </button>
        <button onClick={pick(onIntention)}>
          <Sun size={17} aria-hidden="true" /> An intention for today
        </button>
        <button onClick={pick(() => onNavigate('todos'))}>
          <Plus size={17} aria-hidden="true" /> A to-do
        </button>
        <button onClick={pick(() => onNavigate('journal'))}>
          <BookOpen size={17} aria-hidden="true" /> A journal entry
        </button>
        <button onClick={pick(() => onNavigate('focus'))}>
          <Timer size={17} aria-hidden="true" /> A focus session
        </button>
      </div>
    </details>
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
