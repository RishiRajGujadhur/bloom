import { linearRegression, linearRegressionLine, sampleCorrelation } from 'simple-statistics'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { duration, type SleepEntry } from '../sleep/sleepModel'
import type { DietState } from '../diet/dietModel'
import type { TimeLog } from '../energy/energyModel'

export type MetricId =
  | 'sleepHours'
  | 'sleepQuality'
  | 'mood'
  | 'habits'
  | 'tasks'
  | 'focus'
  | 'water'
  | 'kcal'
  | 'gratitude'
  | 'screens'

export const metrics: { id: MetricId; label: string; unit: string }[] = [
  { id: 'sleepHours', label: 'Sleep', unit: 'h' },
  { id: 'sleepQuality', label: 'Sleep quality', unit: '/5' },
  { id: 'mood', label: 'Mood', unit: '/5' },
  { id: 'habits', label: 'Habits done', unit: '' },
  { id: 'tasks', label: 'Tasks done', unit: '' },
  { id: 'focus', label: 'Focus', unit: 'min' },
  { id: 'water', label: 'Water', unit: 'glasses' },
  { id: 'kcal', label: 'Calories', unit: 'kcal' },
  { id: 'gratitude', label: 'Gratitude notes', unit: '' },
  { id: 'screens', label: 'Scrolling', unit: 'h' },
]

export type LabInputs = {
  data: AppData
  today: string
  days: number
  sleep: SleepEntry[]
  moods: { at: number; mood: number }[]
  gratitude: { at: number }[]
  diet: DietState
  energy: TimeLog[]
}

export type Row = { date: string } & Record<MetricId, number | null>

/** One row per day; null where that day has no data (not zero). */
export function dailyRows(i: LabInputs): Row[] {
  const end = new Date(`${i.today}T12:00:00`)
  const rows: Row[] = []
  for (let k = i.days - 1; k >= 0; k--) {
    const d = new Date(end)
    d.setDate(end.getDate() - k)
    const date = dayKey(d)
    const sleep = i.sleep.find((s) => s.date === date)
    const moods = i.moods.filter((m) => dayKey(new Date(m.at)) === date)
    const meals = i.diet.meals.filter((m) => m.date === date)
    const focus = i.data.rpg.focusHistory.filter((f) => dayKey(new Date(f.completedAt)) === date)
    const screens = i.energy.filter((e) => e.date === date && e.category === 'screens')
    rows.push({
      date,
      sleepHours: sleep ? duration(sleep.bedtime, sleep.wake) : null,
      sleepQuality: sleep ? sleep.quality : null,
      mood: moods.length ? moods.reduce((s, m) => s + m.mood, 0) / moods.length : null,
      habits: i.data.habits.filter((h) => h.dates.includes(date)).length,
      tasks: i.data.todos.filter((t) => t.done && t.completedAt && dayKey(new Date(t.completedAt)) === date).length,
      focus: focus.reduce((s, f) => s + f.minutes, 0),
      water: i.diet.water[date] ?? (meals.length ? 0 : null),
      kcal: meals.length ? meals.reduce((s, m) => s + m.kcal, 0) : null,
      gratitude: i.gratitude.filter((g) => dayKey(new Date(g.at)) === date).length,
      screens: screens.length ? screens.reduce((s, e) => s + e.hours, 0) : null,
    })
  }
  return rows
}

export const MIN_PAIRS = 5

export function pairs(rows: Row[], a: MetricId, b: MetricId) {
  return rows.filter((r) => r[a] != null && r[b] != null).map((r) => [r[a] as number, r[b] as number] as [number, number])
}

/** Pearson r, or null when there are too few days or no variation. */
export function pearson(rows: Row[], a: MetricId, b: MetricId): { r: number; n: number } | null {
  const p = pairs(rows, a, b)
  if (p.length < MIN_PAIRS) return null
  const xs = p.map((x) => x[0])
  const ys = p.map((x) => x[1])
  if (new Set(xs).size < 2 || new Set(ys).size < 2) return null
  const r = sampleCorrelation(xs, ys)
  return Number.isFinite(r) ? { r, n: p.length } : null
}

export function matrix(rows: Row[]) {
  return metrics.map((a) => metrics.map((b) => (a.id === b.id ? { r: 1, n: rows.length } : pearson(rows, a.id, b.id))))
}

export function regression(rows: Row[], a: MetricId, b: MetricId) {
  const p = pairs(rows, a, b)
  if (p.length < 2) return null
  const fit = linearRegression(p)
  return { ...fit, line: linearRegressionLine(fit), points: p }
}

export const strength = (r: number) => {
  const a = Math.abs(r)
  return a >= 0.7 ? 'strong' : a >= 0.4 ? 'moderate' : a >= 0.2 ? 'weak' : 'no clear'
}

/** The strongest relationships, phrased plainly. */
export function findings(rows: Row[], limit = 5) {
  const out: { a: MetricId; b: MetricId; r: number; n: number; text: string }[] = []
  for (let x = 0; x < metrics.length; x++)
    for (let y = x + 1; y < metrics.length; y++) {
      const a = metrics[x]
      const b = metrics[y]
      const c = pearson(rows, a.id, b.id)
      if (!c || Math.abs(c.r) < 0.3) continue
      const dir = c.r > 0 ? 'goes up' : 'goes down'
      out.push({
        a: a.id,
        b: b.id,
        ...c,
        text: `On days with more ${a.label.toLowerCase()}, ${b.label.toLowerCase()} ${dir} (${strength(c.r)}, r = ${c.r.toFixed(2)}, ${c.n} days).`,
      })
    }
  return out.sort((p, q) => Math.abs(q.r) - Math.abs(p.r)).slice(0, limit)
}
