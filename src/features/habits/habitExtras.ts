import { useCallback, useEffect, useState } from 'react'

/**
 * Habit extras kept beside the main data (QoL 292, 293, 296, 297, 298):
 * archive, custom order and a short note per habit per day.
 */
export type HabitExtras = { archived: string[]; order: string[]; notes: Record<string, Record<string, string>> }
export const EXTRAS_KEY = 'bloom-habit-extras'
const empty: HabitExtras = { archived: [], order: [], notes: {} }

const read = (): HabitExtras => {
  try { return { ...empty, ...(JSON.parse(localStorage.getItem(EXTRAS_KEY) ?? '{}') as Partial<HabitExtras>) } } catch { return empty }
}

export function useHabitExtras() {
  const [x, setX] = useState<HabitExtras>(read)
  useEffect(() => {
    const on = (e: StorageEvent) => { if (e.key === EXTRAS_KEY) setX(read()) }
    window.addEventListener('storage', on)
    return () => window.removeEventListener('storage', on)
  }, [])
  const update = useCallback((f: (x: HabitExtras) => HabitExtras) => setX((cur) => {
    const next = f(cur)
    try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(next)) } catch { /* optional */ }
    return next
  }), [])
  return [x, update] as const
}

/** Sort ids by the saved order; unknown ids keep their original position at the end. */
export function ordered<T extends { id: string }>(items: T[], order: string[]) {
  const pos = new Map(order.map((id, i) => [id, i]))
  return [...items].sort((a, b) => (pos.get(a.id) ?? 1e6 + items.indexOf(a)) - (pos.get(b.id) ?? 1e6 + items.indexOf(b)))
}

/** Move one id by `delta` places within the visible list, returning the new order. */
export function move(ids: string[], id: string, delta: number) {
  const i = ids.indexOf(id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= ids.length) return ids
  const next = [...ids]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/**
 * Habit strength 0–100: an exponentially weighted average of the last 60 days,
 * so a single missed day dents it a little and a long run builds it slowly.
 */
export function strength(dates: string[], today: string) {
  const set = new Set(dates)
  const d = new Date(`${today}T12:00:00`)
  let s = 0
  let w = 0
  for (let i = 0; i < 60; i++) {
    const k = d.toISOString().slice(0, 10)
    const weight = Math.pow(0.93, i)
    if (set.has(k)) s += weight
    w += weight
    d.setDate(d.getDate() - 1)
  }
  return Math.round((s / w) * 100)
}
