import { supermemo, type SuperMemoGrade } from 'supermemo'

/**
 * Epiphanies: insights you extract from your own writing, scheduled with the
 * SM-2 spaced-repetition algorithm so they resurface right before the
 * forgetting curve says you'd lose them (1 day → 6 days → ~15 days → …).
 */
export type Epiphany = {
  id: string
  text: string
  source: { kind: 'daybook' | 'journal' | 'manual'; title: string; date: string }
  createdAt: number
  interval: number
  repetition: number
  efactor: number
  /** YYYY-MM-DD of the next review. */
  due: string
  reviews: { at: number; grade: number }[]
  /** Favourite: listed first and filterable. */
  starred?: boolean
}
export const EPIPHANY_KEY = 'bloom-epiphanies-v1'
export const EPIPHANY_EVENT = 'bloom:epiphanies-changed'

export const grades = [
  { grade: 1, label: 'Forgot', hint: 'Back tomorrow' },
  { grade: 3, label: 'Hard', hint: 'Remembered with effort' },
  { grade: 4, label: 'Good', hint: 'Remembered' },
  { grade: 5, label: 'Easy', hint: 'Knew it instantly' },
] as const

const addDays = (day: string, n: number) => {
  const d = new Date(`${day}T12:00:00`)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export function createEpiphany(text: string, source: Epiphany['source'], today: string, now = Date.now()): Epiphany {
  return {
    id: crypto.randomUUID(),
    text: text.trim().slice(0, 600),
    source,
    createdAt: now,
    interval: 0,
    repetition: 0,
    efactor: 2.5,
    // First look-back tomorrow, when the forgetting curve is steepest.
    due: addDays(today, 1),
    reviews: [],
  }
}

export function review(item: Epiphany, grade: number, today: string, now = Date.now()): Epiphany {
  const next = supermemo(
    { interval: item.interval, repetition: item.repetition, efactor: item.efactor },
    grade as SuperMemoGrade,
  )
  return { ...item, ...next, due: addDays(today, next.interval), reviews: [...item.reviews, { at: now, grade }] }
}

export const dueToday = (items: Epiphany[], today: string) => items.filter((e) => e.due <= today)

/**
 * Estimated recall (0–1) `days` after the last review, using the classic
 * exponential forgetting curve R = e^(−t/S). Stability S grows with each
 * successful interval, so later curves decay more slowly.
 */
export function retention(item: Pick<Epiphany, 'interval' | 'efactor'>, days: number) {
  const stability = Math.max(1, item.interval || 1) * (item.efactor / 2.5) * 1.5
  return Math.exp(-days / stability)
}
