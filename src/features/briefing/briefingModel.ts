/**
 * Morning Briefing: gathers today's calendar, tasks, habits, readiness,
 * bills and weather into short "segments", then writes a warm, 60–90 second
 * radio script. The template writer is instant and deterministic; the local
 * LLM can optionally rephrase it.
 */
export type Segment = { kind: 'greeting' | 'weather' | 'readiness' | 'calendar' | 'tasks' | 'habits' | 'bills' | 'closing'; icon: string; title: string; text: string }

export type BriefingInput = {
  name?: string
  now: Date
  weather?: { tempC: number; highC: number; lowC: number; code: number; rainChance: number; place?: string } | null
  readiness?: { score: number | null; label: string; hr: number } | null
  events: { title: string; start: Date }[]
  tasks: { title: string; priority: string; overdue: boolean }[]
  habits: { title: string; streak: number; doneToday: boolean }[]
  bills: { biller: string; amount: number | null; days: number; kind: string }[]
  money: (n: number) => string
}

const WMO: Record<number, string> = { 0: 'clear skies', 1: 'mostly clear skies', 2: 'a few clouds', 3: 'grey, overcast skies', 45: 'fog', 48: 'freezing fog', 51: 'light drizzle', 53: 'drizzle', 55: 'heavy drizzle', 61: 'light rain', 63: 'rain', 65: 'heavy rain', 71: 'light snow', 73: 'snow', 75: 'heavy snow', 80: 'passing showers', 81: 'showers', 82: 'heavy showers', 95: 'thunderstorms' }
export const weatherWords = (code: number) => WMO[code] ?? WMO[Math.floor(code / 10) * 10] ?? 'changeable weather'

const list = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const time = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

export function segments(i: BriefingInput): Segment[] {
  const out: Segment[] = []
  const h = i.now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  const day = i.now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  out.push({ kind: 'greeting', icon: '📻', title: 'Good ' + part, text: `Good ${part}${i.name ? `, ${i.name}` : ''}. It's ${day}, and this is your Bloom briefing.` })

  if (i.weather) {
    const w = i.weather
    const rain = w.rainChance >= 50 ? ` There's a ${w.rainChance}% chance of rain, so keep an umbrella handy.` : w.rainChance >= 20 ? ` A small chance of rain, around ${w.rainChance}%.` : ''
    out.push({ kind: 'weather', icon: '🌤️', title: 'Weather', text: `Outside${w.place ? ` in ${w.place}` : ''} it's ${Math.round(w.tempC)} degrees with ${weatherWords(w.code)}, heading for a high of ${Math.round(w.highC)}.${rain}` })
  }

  if (i.readiness && i.readiness.score != null) {
    const r = { ...i.readiness, score: i.readiness.score }
    const tip = r.score >= 70 ? 'a great day to push hard' : r.score >= 45 ? 'train as planned, keep the hardest efforts short' : 'keep it gentle today: a walk, some mobility, an early night'
    out.push({ kind: 'readiness', icon: '💓', title: 'Readiness', text: `Your readiness this morning is ${r.score} — ${r.label.toLowerCase()}, with a resting heart rate of ${Math.round(r.hr)}. It's ${tip}.` })
  }

  const upcoming = i.events.filter((e) => e.start.getTime() >= i.now.getTime() - 15 * 60_000).sort((a, b) => a.start.getTime() - b.start.getTime())
  if (upcoming.length) {
    const first = upcoming[0]
    const more = upcoming.length > 1 ? ` After that, ${list(upcoming.slice(1, 3).map((e) => `${e.title} at ${time(e.start)}`))}${upcoming.length > 3 ? `, plus ${upcoming.length - 3} more` : ''}.` : ''
    out.push({ kind: 'calendar', icon: '📅', title: 'Calendar', text: `You have ${upcoming.length} thing${upcoming.length === 1 ? '' : 's'} on the calendar. First up, ${first.title} at ${time(first.start)}.${more}` })
  } else {
    out.push({ kind: 'calendar', icon: '📅', title: 'Calendar', text: 'Your calendar is clear today — a good chance for some deep work.' })
  }

  if (i.tasks.length) {
    const top = [...i.tasks].sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.priority.localeCompare(b.priority)).slice(0, 3)
    const overdue = i.tasks.filter((t) => t.overdue).length
    out.push({ kind: 'tasks', icon: '✅', title: 'Top tasks', text: `On your list: ${list(top.map((t) => t.title))}.${overdue ? ` ${overdue} ${overdue === 1 ? 'task is' : 'tasks are'} overdue, so maybe start there.` : ''}` })
  }

  const streaks = i.habits.filter((x) => x.streak >= 3).sort((a, b) => b.streak - a.streak)
  if (streaks.length) {
    const s = streaks[0]
    out.push({ kind: 'habits', icon: '🔥', title: 'Streaks', text: `You're on a ${s.streak}-day streak with ${s.title}.${s.doneToday ? ' Already done today — nice.' : ' Keep it alive today.'}` })
  }

  const soon = i.bills.filter((b) => b.days >= -3 && b.days <= 7).sort((a, b) => a.days - b.days)
  if (soon.length) {
    const b = soon[0]
    const when = b.days < 0 ? `was due ${-b.days} day${b.days === -1 ? '' : 's'} ago` : b.days === 0 ? 'is due today' : `is due in ${b.days} day${b.days === 1 ? '' : 's'}`
    out.push({ kind: 'bills', icon: '🧾', title: 'Bills', text: `Money check: ${b.biller}${b.amount != null ? ` for ${i.money(b.amount)}` : ''} ${when}.${soon.length > 1 ? ` ${soon.length - 1} more bill${soon.length > 2 ? 's are' : ' is'} due this week.` : ''}` })
  }

  out.push({ kind: 'closing', icon: '🌱', title: 'Sign-off', text: 'That’s your briefing. Take one deep breath, pick your first thing, and have a good day.' })
  return out
}

/** Sentences, without breaking on decimal points like £84.37 or times like 9.30. */
export const splitSentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-Z0-9“"'])/).map((x) => x.trim()).filter(Boolean)

export const script = (segs: Segment[]) => segs.map((s) => s.text).join(' ')

/** Seconds at ~155 words a minute, a typical radio pace. */
export const readingSeconds = (text: string) => Math.round((text.split(/\s+/).filter(Boolean).length / 155) * 60)

/** Streak length ending today or yesterday. */
export function streak(dates: string[], today: string) {
  const set = new Set(dates)
  const d = new Date(`${today}T12:00:00`)
  if (!set.has(today)) d.setDate(d.getDate() - 1)
  let n = 0
  while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1) }
  return n
}
