import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { activityDays, type ActivityDay } from '../insights'

/**
 * Bloom Growth: one meaningful progression instead of many counters.
 *
 * It reflects real things (tasks, habits, focus, reflection, mood check-ins),
 * weighs consistency over intensity, and never collapses when you're away:
 * half of it is your lifetime of active days (it only grows), half is your
 * rhythm over the last 28 days (which recovers as soon as you return).
 */
export const stages = [
  { id: 'seed', name: 'Seed', min: 0, line: 'Every garden starts underground.' },
  { id: 'sprout', name: 'Sprout', min: 15, line: 'Something is breaking through.' },
  { id: 'growing', name: 'Growing', min: 35, line: 'Roots deepening, leaves opening.' },
  { id: 'thriving', name: 'Thriving', min: 60, line: 'A rhythm that holds you up.' },
  { id: 'blooming', name: 'Blooming', min: 85, line: 'Fully yourself, in full colour.' },
] as const
export type StageId = (typeof stages)[number]['id']

export type DayExtras = {
  /** Dates (YYYY-MM-DD) with a mood check-in, gratitude note or breath session. */
  wellbeing: string[]
  /** Dates with Daybook pages. */
  daybook: string[]
}

/** A day counts as active when you did at least one meaningful thing. */
export function activeDates(days: ActivityDay[], extras: DayExtras) {
  const set = new Set<string>()
  for (const d of days) if (d.tasks + d.habits + d.journals > 0 || d.focus >= 10) set.add(d.date)
  for (const d of [...extras.wellbeing, ...extras.daybook]) set.add(d)
  return set
}

const lastN = (today: string, n: number) => {
  const end = new Date(`${today}T12:00:00`)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    return dayKey(d)
  })
}

export type Growth = {
  score: number
  stage: (typeof stages)[number]
  next: (typeof stages)[number] | null
  toNext: number
  lifetimeDays: number
  recentDays: number
  /** 0–1 balance of the four pillars this week. */
  pillars: { do: number; focus: number; reflect: number; care: number }
}

export function growth(data: AppData, today: string, extras: DayExtras): Growth {
  const days = activityDays(data)
  const active = activeDates(days, extras)
  const lifetimeDays = [...active].filter((d) => d <= today).length
  const recent = lastN(today, 28)
  const recentDays = recent.filter((d) => active.has(d)).length
  // Lifetime: 50 points over the first 60 active days, then it's banked.
  const lifetime = Math.min(50, (lifetimeDays / 60) * 50)
  // Rhythm: active days in the last four weeks (5 a week is "full").
  const rhythm = Math.min(50, (recentDays / 20) * 50)
  const score = Math.round(lifetime + rhythm)
  let index = 0
  stages.forEach((s, i) => {
    if (score >= s.min) index = i
  })
  const stage = stages[index]
  const next = stages[index + 1] ?? null

  const week = new Set(lastN(today, 7))
  const w = days.filter((d) => week.has(d.date))
  const sum = (k: 'tasks' | 'habits' | 'journals' | 'focus') => w.reduce((s, d) => s + d[k], 0)
  const careDays = extras.wellbeing.filter((d) => week.has(d)).length
  return {
    score,
    stage,
    next,
    toNext: next ? next.min - score : 0,
    lifetimeDays,
    recentDays,
    pillars: {
      do: Math.min(1, (sum('tasks') + sum('habits')) / 14),
      focus: Math.min(1, sum('focus') / 150),
      reflect: Math.min(1, (sum('journals') + extras.daybook.filter((d) => week.has(d)).length) / 4),
      care: Math.min(1, careDays / 5),
    },
  }
}

/** Days since the last active day before today (0 = active yesterday or today). */
export function daysAway(data: AppData, today: string, extras: DayExtras) {
  const active = [...activeDates(activityDays(data), extras)].filter((d) => d < today).sort()
  const last = active[active.length - 1]
  if (!last) return null
  const ms = new Date(`${today}T12:00:00`).getTime() - new Date(`${last}T12:00:00`).getTime()
  return Math.round(ms / 86_400_000) - 1
}

/** One flower per active day: a garden that only grows. */
export function garden(data: AppData, today: string, extras: DayExtras, max = 84) {
  const active = activeDates(activityDays(data), extras)
  return [...active]
    .filter((d) => d <= today)
    .sort()
    .slice(-max)
}
