import type { AppData } from '../../model'
import { dayKey } from '../../dates'

/**
 * Controlled unpredictability. Rewards stay understandable, but meaningful
 * actions sometimes let Bloom "discover something about you": a real pattern
 * mined from your own history. Chance-based so it stays delightful, with a
 * pity timer so it never feels random or withheld.
 */
export const DISCOVERY_CHANCE = 0.3
export const PITY_AFTER = 4

export type Discovery = { id: string; title: string; text: string; rare: boolean }

const hourOf = (t: number) => new Date(t).getHours()
const weekday = (t: number) => new Date(t).toLocaleDateString('en-GB', { weekday: 'long' })
const pct = (a: number, b: number) => Math.round(((a - b) / Math.max(1e-9, b)) * 100)

type Gen = (d: AppData, moods: { at: number; mood: number }[]) => Discovery | null

const generators: Gen[] = [
  (d) => {
    const done = d.todos.filter((t) => t.done && t.completedAt)
    if (done.length < 6) return null
    const buckets = new Map<number, number>()
    for (const t of done) {
      const b = Math.floor(hourOf(t.completedAt!) / 2) * 2
      buckets.set(b, (buckets.get(b) ?? 0) + 1)
    }
    const [h, n] = [...buckets].sort((a, b) => b[1] - a[1])[0]
    const fmt = (x: number) => new Date(2026, 0, 1, x).toLocaleTimeString([], { hour: 'numeric' })
    return { id: `peak-hour:${h}`, title: 'Your golden hours', text: `${Math.round((n / done.length) * 100)}% of your finished tasks land between ${fmt(h)} and ${fmt(h + 2)}. Protect that window.`, rare: false }
  },
  (d) => {
    if (d.rpg.focusHistory.length < 5) return null
    const by = new Map<string, number>()
    for (const f of d.rpg.focusHistory) by.set(weekday(f.completedAt), (by.get(weekday(f.completedAt)) ?? 0) + f.minutes)
    const [day] = [...by].sort((a, b) => b[1] - a[1])[0]
    return { id: `focus-day:${day}`, title: `${day}s are your deep days`, text: `You focus longer on ${day}s than any other day. Maybe save the big thinking for then.`, rare: false }
  },
  (d) => {
    const done = d.todos.filter((t) => t.done && t.completedAt)
    const late = done.filter((t) => hourOf(t.completedAt!) >= 16)
    const early = done.filter((t) => hourOf(t.completedAt!) < 16)
    if (late.length < 4 || early.length < 4) return null
    const light = (l: typeof done) => l.filter((t) => t.priority === 'P3' || t.priority === 'P4').length / l.length
    if (light(late) - light(early) < 0.15) return null
    return { id: 'light-afternoons', title: 'Lighter after four', text: 'You tend to pick lighter tasks after 4 pm. Plan the heavy ones for earlier and the afternoon will feel easier.', rare: false }
  },
  (d) => {
    const days = new Map<string, { morningFocus: boolean; tasks: number }>()
    for (const f of d.rpg.focusHistory) {
      const k = dayKey(new Date(f.completedAt))
      const v = days.get(k) ?? { morningFocus: false, tasks: 0 }
      if (hourOf(f.completedAt) < 12) v.morningFocus = true
      days.set(k, v)
    }
    for (const t of d.todos)
      if (t.done && t.completedAt) {
        const k = dayKey(new Date(t.completedAt))
        const v = days.get(k) ?? { morningFocus: false, tasks: 0 }
        v.tasks++
        days.set(k, v)
      }
    const withF = [...days.values()].filter((v) => v.morningFocus)
    const without = [...days.values()].filter((v) => !v.morningFocus)
    if (withF.length < 3 || without.length < 3) return null
    const a = withF.reduce((s, v) => s + v.tasks, 0) / withF.length
    const b = without.reduce((s, v) => s + v.tasks, 0) / without.length
    if (a <= b * 1.2) return null
    return { id: 'morning-focus', title: 'Your best days start with focus', text: `On days you begin with a morning focus session you finish ${pct(a, b)}% more tasks.`, rare: true }
  },
  (d, moods) => {
    if (moods.length < 6) return null
    const habitDays = new Set(d.habits.flatMap((h) => h.dates))
    const on = moods.filter((m) => habitDays.has(dayKey(new Date(m.at))))
    const off = moods.filter((m) => !habitDays.has(dayKey(new Date(m.at))))
    if (on.length < 3 || off.length < 3) return null
    const avg = (l: typeof moods) => l.reduce((s, m) => s + m.mood, 0) / l.length
    const diff = avg(on) - avg(off)
    if (diff < 0.3) return null
    return { id: 'habits-mood', title: 'Habits lift you', text: `Your mood is ${diff.toFixed(1)} points higher on days you tend a habit. That's not a coincidence you need to prove; just keep noticing.`, rare: true }
  },
  (d) => {
    const done = d.todos.filter((t) => t.done && t.completedAt && t.due < dayKey(new Date(t.completedAt)))
    if (done.length < 3) return null
    return { id: `postponed:${Math.floor(done.length / 5)}`, title: 'You finish what you postpone', text: `${done.length} tasks you once put off are now done. Delay isn't failure; it's often just timing.`, rare: false }
  },
  (d) => {
    const n = d.sessions.length
    if (n < 5) return null
    const words = d.sessions.flatMap((s) => s.messages.filter((m) => m.sender === 'user').map((m) => m.text)).join(' ').split(/\s+/).length
    return { id: `words:${Math.floor(words / 500)}`, title: 'Your story so far', text: `You've written about ${words.toLocaleString()} words across ${n} reflections. That's a small book about becoming yourself.`, rare: false }
  },
]

export type DiscoveryState = { misses: number; found: { id: string; at: number }[] }
export const DISCOVERY_KEY = 'bloom-discoveries-v1'

/** Deterministic 0–1 from a string, so tests and replays are stable. */
export function roll(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  return ((h >>> 0) % 10000) / 10000
}

/**
 * After a meaningful action: maybe discover something new (not seen before).
 * Returns the discovery and the next state.
 */
export function maybeDiscover(data: AppData, moods: { at: number; mood: number }[], state: DiscoveryState, seed: string, now = Date.now()) {
  const lucky = roll(seed) < DISCOVERY_CHANCE || state.misses + 1 >= PITY_AFTER
  if (!lucky) return { discovery: null, state: { ...state, misses: state.misses + 1 } }
  const seen = new Set(state.found.map((f) => f.id))
  const options = generators.map((g) => g(data, moods)).filter((x): x is Discovery => !!x && !seen.has(x.id))
  if (!options.length) return { discovery: null, state: { ...state, misses: state.misses + 1 } }
  const pick = options[Math.floor(roll(`${seed}:pick`) * options.length)]
  return { discovery: pick, state: { misses: 0, found: [...state.found, { id: pick.id, at: now }] } }
}

/** Moments worth keeping, surfaced in the Memory Timeline. */
export type Moment = { id: string; date: string; kind: 'discovery' | 'stage' | 'day' | 'week'; title: string; detail: string }
export const MOMENTS_KEY = 'bloom-moments-v1'

export function readMoments(): Moment[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(MOMENTS_KEY) ?? '[]')
    return Array.isArray(v) ? (v as Moment[]) : []
  } catch {
    return []
  }
}
export function addMoment(m: Moment) {
  try {
    const list = readMoments().filter((x) => x.id !== m.id)
    localStorage.setItem(MOMENTS_KEY, JSON.stringify([...list, m].slice(-500)))
  } catch {
    /* The moment still plays; it just won't be remembered. */
  }
}
