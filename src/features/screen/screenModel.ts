/** Active seconds per hour of each day: { '2026-09-26': number[24] }. */
export type Usage = Record<string, number[]>
export type ScreenSettings = { dailyLimit: number; breakEvery: number; detox: boolean; windDownFrom: number; windDown: boolean; pauseGate: boolean; focusOnly: boolean }
export type ScreenStore = { usage: Usage; settings: ScreenSettings; challenges: { start: number; end?: number; goal: number }[] }
export const SCREEN_KEY = 'bloom-screen-v1'
export const SCREEN_EVENT = 'bloom:screen-settings'

export const defaultScreen: ScreenStore = {
  usage: {},
  settings: { dailyLimit: 180, breakEvery: 50, detox: false, windDownFrom: 22, windDown: false, pauseGate: false, focusOnly: false },
  challenges: [],
}

export const dayOf = (t: number) => {
  const d = new Date(t)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addActive(usage: Usage, at: number, seconds: number): Usage {
  const key = dayOf(at)
  const hours = [...(usage[key] ?? Array(24).fill(0))]
  hours[new Date(at).getHours()] += seconds
  const next = { ...usage, [key]: hours }
  // Keep ~60 days.
  const keys = Object.keys(next).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete next[k]
  return next
}

export const minutesOn = (usage: Usage, day: string) => Math.round((usage[day] ?? []).reduce((a, b) => a + b, 0) / 60)

export function week(usage: Usage, today: string) {
  const d = new Date(`${today}T12:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d)
    x.setDate(d.getDate() - 6 + i)
    const key = dayOf(x.getTime())
    return { day: key, label: x.toLocaleDateString([], { weekday: 'narrow' }), minutes: minutesOn(usage, key) }
  })
}

/** Wind-down applies from `from` o'clock until 5 am. */
export const inWindDown = (from: number, hour = new Date().getHours()) => hour >= from || hour < 5

export const challengeMinutes = (c: { start: number; end?: number }, now = Date.now()) => Math.floor(((c.end ?? now) - c.start) / 60000)
