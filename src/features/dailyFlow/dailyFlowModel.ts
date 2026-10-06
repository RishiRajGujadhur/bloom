import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import type { NavKey } from '../../components/layout/Sidebar'
import type { FeatureFlags } from '../../settings/appSettings'

/**
 * The Daily flow ties features into two gentle routines. Each step knows how
 * to tell whether it's done today from the data the features already store,
 * so nothing extra has to be tracked.
 */
export type FlowStep = {
  id: string
  title: string
  hint: string
  page: NavKey
  done: boolean
}

export type FlowInputs = {
  data: AppData
  today: string
  flags: FeatureFlags
  moods: { at: number }[]
  gratitude: { at: number }[]
  breaths: { at: number }[]
  daybook: { createdAt: string; updatedAt: string }[]
  epiphaniesDue: number
  /** YYYY-MM-DD of the last completed wind-down checklist. */
  windDownDay?: string | null
}

const isToday = (at: number, today: string) => dayKey(new Date(at)) === today
const tomorrow = (today: string) => {
  const d = new Date(`${today}T12:00:00`)
  d.setDate(d.getDate() + 1)
  return dayKey(d)
}

export function morningSteps(i: FlowInputs): FlowStep[] {
  const { data, today, flags } = i
  const steps: (FlowStep & { on: boolean })[] = [
    { id: 'epiphany', title: 'Revisit an insight', hint: 'Recall what you learned', page: 'overview', done: i.epiphaniesDue === 0, on: flags.epiphanies },
    { id: 'mood', title: 'Check in with yourself', hint: 'How are you, really?', page: 'mood', done: i.moods.some((m) => isToday(m.at, today)), on: flags.moodCheckin },
    { id: 'intention', title: 'Set an intention', hint: 'One thing that matters', page: 'planning', done: data.plans.some((p) => p.date === today), on: true },
    { id: 'habits', title: 'Tend a habit', hint: 'A small step counts', page: 'habits', done: data.habits.some((h) => h.dates.includes(today)), on: flags.habitTracker },
    { id: 'focus', title: 'One focused block', hint: 'Protect your best hour', page: flags.focusRoom ? 'focus-room' : 'focus', done: data.rpg.focusHistory.some((f) => isToday(f.completedAt, today)), on: true },
  ]
  return steps.filter((s) => s.on).map((s) => ({ id: s.id, title: s.title, hint: s.hint, page: s.page, done: s.done }))
}

export function eveningSteps(i: FlowInputs): FlowStep[] {
  const { data, today, flags } = i
  const wroteToday =
    i.daybook.some((p) => p.updatedAt.slice(0, 10) === today) ||
    data.sessions.some((s) => dayKey(new Date(s.metadata.date)) === today)
  const steps: (FlowStep & { on: boolean })[] = [
    { id: 'gratitude', title: 'Notice one good thing', hint: 'Drop it in a jar', page: 'gratitude', done: i.gratitude.some((g) => isToday(g.at, today)), on: flags.gratitude },
    { id: 'reflect', title: 'Reflect on the day', hint: 'A few honest lines', page: flags.daybookModes ? 'daybook' : 'journal', done: wroteToday, on: flags.daybookModes || flags.chatJournal },
    { id: 'breathe', title: 'Breathe out the day', hint: 'Two minutes of calm', page: 'breathe', done: i.breaths.some((b) => isToday(b.at, today)), on: flags.breathe },
    { id: 'tomorrow', title: 'Plan tomorrow gently', hint: 'One intention for tomorrow', page: 'planning', done: data.plans.some((p) => p.date === tomorrow(today)), on: true },
    { id: 'winddown', title: 'Wind down for sleep', hint: 'Lights low, screens away', page: 'sleep', done: i.windDownDay === today, on: flags.sleepTracker },
  ]
  return steps.filter((s) => s.on).map((s) => ({ id: s.id, title: s.title, hint: s.hint, page: s.page, done: s.done }))
}

export const flowProgress = (steps: FlowStep[]) =>
  steps.length ? steps.filter((s) => s.done).length / steps.length : 0

export const nextStep = (steps: FlowStep[]) => steps.find((s) => !s.done) ?? null

/** Morning until 3 pm, evening after (the user can switch). */
export const defaultPart = (hour = new Date().getHours()) => (hour >= 5 && hour < 15 ? 'morning' : 'evening')
