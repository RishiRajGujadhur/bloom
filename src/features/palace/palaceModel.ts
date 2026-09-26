import type { AppData } from '../../model'
import { activityDays } from '../insights'

export type PalaceDay = {
  date: string
  /** 0–1 activity intensity, drives block height and glow. */
  intensity: number
  mood: number | null
  tasks: number
  focus: number
  journals: number
  habits: number
  pages: string[]
}

/** Every day of `year` with its activity, ready to render as a ring. */
export function palaceDays(data: AppData, year: number, daybook: { date: string; title: string }[]): PalaceDay[] {
  const byDate = new Map(activityDays(data).map((d) => [d.date, d]))
  const days: PalaceDay[] = []
  for (const d = new Date(year, 0, 1, 12); d.getFullYear() === year; d.setDate(d.getDate() + 1)) {
    const date = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const a = byDate.get(date)
    const pages = daybook.filter((p) => p.date === date).map((p) => p.title)
    const score = a ? a.tasks + a.journals * 2 + a.habits + a.focus / 25 + pages.length * 2 : pages.length * 2
    days.push({
      date,
      intensity: Math.min(1, score / 8),
      mood: a?.mood ?? null,
      tasks: a?.tasks ?? 0,
      focus: a?.focus ?? 0,
      journals: a?.journals ?? 0,
      habits: a?.habits ?? 0,
      pages,
    })
  }
  return days
}

/** Index of the day facing the camera for a ring rotation `angle` (radians). */
export function facingIndex(angle: number, count: number) {
  const step = (Math.PI * 2) / count
  return ((Math.round(angle / step) % count) + count) % count
}

/** Nearest snapped angle for an index, continuing from the current angle. */
export function angleForIndex(index: number, count: number, from: number) {
  const step = (Math.PI * 2) / count
  const base = index * step
  const turns = Math.round((from - base) / (Math.PI * 2))
  return base + turns * Math.PI * 2
}
