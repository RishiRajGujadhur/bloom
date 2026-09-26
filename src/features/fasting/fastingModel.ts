export const protocols = [
  { id: '14:10', fast: 14, label: '14:10', note: 'Gentle start' },
  { id: '16:8', fast: 16, label: '16:8', note: 'Most popular' },
  { id: '18:6', fast: 18, label: '18:6', note: 'Stepping up' },
  { id: '20:4', fast: 20, label: '20:4', note: 'Warrior' },
  { id: 'omad', fast: 23, label: 'OMAD', note: 'One meal a day' },
  { id: '36', fast: 36, label: '36 h', note: 'Monk fast' },
]

/** Approximate metabolic stages by hours fasted (general guidance, not medical advice). */
export const stages = [
  { from: 0, name: 'Fed', emoji: '🍽️', text: 'Digesting; blood sugar rises and settles.' },
  { from: 4, name: 'Early fasting', emoji: '📉', text: 'Insulin falls; the body draws on stored glycogen.' },
  { from: 12, name: 'Fat burning', emoji: '🔥', text: 'Glycogen runs low; fat becomes the main fuel.' },
  { from: 18, name: 'Ketosis', emoji: '⚡', text: 'Ketones rise; many feel clear and steady.' },
  { from: 24, name: 'Autophagy', emoji: '♻️', text: 'Cellular clean-up is thought to ramp up.' },
  { from: 48, name: 'Deep fast', emoji: '🌌', text: 'Long fasts are best done with medical guidance.' },
]
export const stageAt = (hours: number) => [...stages].reverse().find((s) => hours >= s.from) ?? stages[0]

export type Fast = { start: number; end: number; goal: number; feeling?: 'great' | 'ok' | 'hard'; note?: string }
export type FastStore = { protocol: string; current: { start: number; goal: number } | null; history: Fast[]; hydration: boolean; windowReminder: boolean }
export const FAST_KEY = 'bloom-fasting-v1'

export const hours = (ms: number) => ms / 3_600_000
export const fmtH = (h: number) => `${Math.floor(h)}h ${String(Math.floor((h % 1) * 60)).padStart(2, '0')}m`

/** Hours fasted per calendar day (a fast counts on the day it ended). */
export function perDay(history: Fast[]) {
  const map = new Map<string, number>()
  for (const f of history) {
    const d = new Date(f.end)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    map.set(key, Math.max(map.get(key) ?? 0, hours(f.end - f.start)))
  }
  return [...map].map(([date, count]) => ({ date, count: Math.round(count * 10) / 10 }))
}

export function stats(history: Fast[], now = Date.now()) {
  const week = history.filter((f) => f.end >= now - 7 * 86_400_000)
  const avg = week.length ? week.reduce((t, f) => t + hours(f.end - f.start), 0) / week.length : 0
  const longest = history.reduce((m, f) => Math.max(m, hours(f.end - f.start)), 0)
  const reached = history.filter((f) => hours(f.end - f.start) >= f.goal).length
  return { weekCount: week.length, avg, longest, rate: history.length ? reached / history.length : 0 }
}

/** Kind words for ending, whether early or not. */
export function endMessage(h: number, goal: number) {
  if (h >= goal) return `Goal reached: ${fmtH(h)}. Break your fast gently.`
  if (h >= goal * 0.75) return `${fmtH(h)} — so close, and it all counts.`
  return `${fmtH(h)} is still a real fast. Listening to your body is the skill.`
}
