import { RRule, Weekday } from 'rrule'

export type Step = { id: string; title: string; minutes: number; emoji: string }
export type Repeat = { freq: 'daily' | 'weekly' | 'monthly'; interval: number; days: number[]; time: string }
export type Routine = { id: string; name: string; emoji: string; color: string; steps: Step[]; repeat: Repeat; anchor?: string; paused?: string[]; log: { date: string; done: number }[] }
export type RoutineStore = { routines: Routine[] }
export const ROUTINES_KEY = 'bloom-routines-v1'

const weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA, RRule.SU]
export const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function toRule(r: Repeat, start = new Date('2026-01-01T00:00:00Z')) {
  const [h, m] = r.time.split(':').map(Number)
  return new RRule({
    freq: r.freq === 'daily' ? RRule.DAILY : r.freq === 'weekly' ? RRule.WEEKLY : RRule.MONTHLY,
    interval: Math.max(1, r.interval),
    byweekday: r.freq === 'weekly' && r.days.length ? r.days.map((d) => weekdays[d] as Weekday) : undefined,
    byhour: [h],
    byminute: [m],
    bysecond: [0],
    dtstart: start,
  })
}

/** Human description, e.g. "every weekday at 7" / "every 2 weeks on Monday". */
export function describe(r: Repeat) {
  const base = new RRule({
    freq: r.freq === 'daily' ? RRule.DAILY : r.freq === 'weekly' ? RRule.WEEKLY : RRule.MONTHLY,
    interval: Math.max(1, r.interval),
    byweekday: r.freq === 'weekly' && r.days.length ? r.days.map((d) => weekdays[d] as Weekday) : undefined,
  }).toText()
  return `${base.charAt(0).toUpperCase()}${base.slice(1)} at ${r.time}`
}

/** Next occurrences after `from`, skipping paused dates. */
export function upcoming(routine: Routine, from: Date, count = 5) {
  const rule = toRule(routine.repeat, new Date(from.getTime() - 400 * 86400000))
  const out: Date[] = []
  let cursor = from
  while (out.length < count) {
    const next = rule.after(cursor, false)
    if (!next) break
    if (!routine.paused?.includes(next.toISOString().slice(0, 10))) out.push(next)
    cursor = next
  }
  return out
}

/** Does the routine occur on this date (UTC day of rrule time)? */
export function occursOn(routine: Routine, date: string) {
  const d0 = new Date(`${date}T00:00:00Z`)
  const d1 = new Date(`${date}T23:59:59Z`)
  if (routine.paused?.includes(date)) return false
  return toRule(routine.repeat, new Date(d0.getTime() - 400 * 86400000)).between(d0, d1, true).length > 0
}

export const totalMinutes = (r: Routine) => r.steps.reduce((t, s) => t + s.minutes, 0)

const s = (title: string, minutes: number, emoji: string): Step => ({ id: crypto.randomUUID(), title, minutes, emoji })
export const templates: Omit<Routine, 'id' | 'log'>[] = [
  { name: 'Morning launch', emoji: '🌅', color: '#f2a65a', steps: [s('Glass of water', 1, '💧'), s('Stretch', 5, '🧘'), s('Plan my day', 5, '📝'), s('Get dressed', 5, '👕')], repeat: { freq: 'weekly', interval: 1, days: [0, 1, 2, 3, 4], time: '07:00' }, anchor: 'After I wake up' },
  { name: 'Evening wind-down', emoji: '🌙', color: '#8f7ae5', steps: [s('Tidy for 5 minutes', 5, '🧹'), s('Screens off', 1, '📵'), s('Read', 15, '📖'), s('Gratitude', 3, '🙏')], repeat: { freq: 'daily', interval: 1, days: [], time: '21:30' }, anchor: 'After dinner' },
  { name: 'Workout prep', emoji: '💪', color: '#e2553f', steps: [s('Change', 3, '👟'), s('Warm up', 5, '🔥'), s('Main set', 30, '🏋️'), s('Cool down', 5, '🧊')], repeat: { freq: 'weekly', interval: 1, days: [0, 2, 4], time: '18:00' }, anchor: 'After work' },
  { name: 'Weekly reset', emoji: '🧺', color: '#3f8a76', steps: [s('Laundry', 10, '🧺'), s('Plan the week', 15, '🗓️'), s('Clear inbox', 15, '📥')], repeat: { freq: 'weekly', interval: 1, days: [6], time: '10:00' }, anchor: 'After Sunday coffee' },
]

/** Streak of scheduled days completed, counting back from today. */
export function streak(r: Routine, today: string) {
  let n = 0
  const d = new Date(`${today}T12:00:00Z`)
  for (let i = 0; i < 120; i++) {
    const key = d.toISOString().slice(0, 10)
    if (occursOn(r, key)) {
      const done = r.log.find((l) => l.date === key)?.done ?? 0
      if (done >= r.steps.length) n++
      else if (key !== today) break
    }
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return n
}
