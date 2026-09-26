import type { AppData } from '../../model'
import { dayKey } from '../../dates'

/**
 * Human recognition instead of mechanical praise. Compares the state before
 * and after an action and says something true and specific about it, usually
 * measured against past-you (never against other people).
 */
export type Recognition = {
  id: string
  kind: 'task' | 'habit' | 'focus' | 'journal'
  headline: string
  detail: string
  /** Meaningful actions can lead to a discovery. */
  meaningful: boolean
}

const day = (t: number) => dayKey(new Date(t))
const ordinal = (n: number) => ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh'][n] ?? `${n}th`

function daysBack(today: string, n: number) {
  const end = new Date(`${today}T12:00:00`)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end)
    d.setDate(end.getDate() - i)
    return dayKey(d)
  })
}

/** Average per active day over the previous 30 days (excluding today). */
function average(values: Map<string, number>, today: string) {
  const past = daysBack(today, 31).slice(1)
  const active = past.map((d) => values.get(d) ?? 0).filter((v) => v > 0)
  return active.length >= 3 ? active.reduce((a, b) => a + b, 0) / active.length : null
}

export function recognise(prev: AppData, next: AppData, today: string): Recognition | null {
  // Tasks
  const before = new Set(prev.todos.filter((t) => t.done).map((t) => t.id))
  const task = next.todos.find((t) => t.done && t.completedAt && !before.has(t.id))
  if (task) {
    const week = new Set(daysBack(today, 7))
    const postponed = (t: typeof task) => t.due < day(t.completedAt!)
    const perDay = new Map<string, number>()
    for (const t of next.todos) if (t.done && t.completedAt) perDay.set(day(t.completedAt), (perDay.get(day(t.completedAt)) ?? 0) + 1)
    const todayCount = perDay.get(today) ?? 0
    const avg = average(perDay, today)
    const hard = task.priority === 'P1' || task.planning?.deepWork || task.subtasks.length >= 3
    let headline = `${task.title}, done.`
    let detail = 'One less thing to carry.'
    if (postponed(task)) {
      const n = next.todos.filter((t) => t.done && t.completedAt && week.has(day(t.completedAt)) && postponed(t)).length
      headline = n >= 2 ? `That's the ${ordinal(n)} task you'd been putting off that you've finished this week.` : 'You finally tackled the one you kept postponing.'
      detail = 'The hardest part was starting. You did.'
    } else if (hard) {
      headline = 'The hardest thing on your list, done.'
      detail = task.priority === 'P1' ? 'You chose the important over the easy.' : 'Deep work pays off quietly.'
    } else if (avg && todayCount >= 3 && todayCount > avg * 1.15) {
      headline = `${todayCount} tasks today, ${Math.round(((todayCount - avg) / avg) * 100)}% more than your 30-day average.`
      detail = 'Your main rival is yesterday-you, and you are ahead.'
    }
    return { id: `task:${task.id}`, kind: 'task', headline, detail, meaningful: Boolean(hard || postponed(task)) }
  }

  // Habits
  for (const h of next.habits) {
    const was = prev.habits.find((p) => p.id === h.id)
    if (!h.dates.includes(today) || was?.dates.includes(today)) continue
    const last7 = daysBack(today, 7).filter((d) => h.dates.includes(d)).length
    const previous = [...h.dates].filter((d) => d < today).sort().pop()
    const gap = previous ? Math.round((new Date(`${today}T12:00`).getTime() - new Date(`${previous}T12:00`).getTime()) / 86_400_000) : null
    let headline = `${h.title}: ${last7} of the last 7 days.`
    let detail = last7 >= 5 ? 'This is becoming part of who you are.' : 'Small, repeated, real.'
    if (gap && gap >= 4) {
      headline = `Welcome back to ${h.title}.`
      detail = 'Picking a habit up again is the skill that matters most.'
    } else if (!previous) {
      headline = `First time: ${h.title}.`
      detail = 'Every rhythm starts with a single beat.'
    }
    return { id: `habit:${h.id}:${today}`, kind: 'habit', headline, detail, meaningful: last7 === 7 || (gap ?? 0) >= 4 }
  }

  // Focus
  const seen = new Set(prev.rpg.focusHistory.map((f) => f.id))
  const focus = next.rpg.focusHistory.find((f) => !seen.has(f.id))
  if (focus) {
    const perDay = new Map<string, number>()
    for (const f of next.rpg.focusHistory) perDay.set(day(f.completedAt), (perDay.get(day(f.completedAt)) ?? 0) + f.minutes)
    const avg = average(perDay, today)
    const todayMin = perDay.get(today) ?? 0
    const delta = avg ? Math.round(((todayMin - avg) / avg) * 100) : null
    return {
      id: `focus:${focus.id}`,
      kind: 'focus',
      headline: `${focus.minutes} minutes of real focus${focus.taskTitle ? ` on ${focus.taskTitle}` : ''}.`,
      detail: delta !== null && delta > 10 ? `Focus today is ${delta}% above your 30-day average.` : 'Attention is the rarest thing you can give.',
      meaningful: focus.minutes >= 25,
    }
  }

  // Journal
  if (next.sessions.length > prev.sessions.length) {
    const s = next.sessions[next.sessions.length - 1]
    const days = new Set(next.sessions.map((x) => day(new Date(x.metadata.date).getTime())))
    const k = daysBack(today, 7).filter((d) => days.has(d)).length
    return {
      id: `journal:${s.metadata.id}`,
      kind: 'journal',
      headline: `Reflection number ${next.sessions.length}.`,
      detail: k >= 3 ? `You've reflected on ${k} of the last 7 days. You're getting to know yourself.` : 'A little clearer than this morning.',
      meaningful: true,
    }
  }
  return null
}
