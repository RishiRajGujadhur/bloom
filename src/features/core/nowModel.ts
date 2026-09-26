import type { AppData } from '../../model'
import type { NavKey } from '../../components/layout/Sidebar'
import { dayKey } from '../../dates'

/**
 * "What should I do now?" — one obvious next action, chosen from the time of
 * day (the app feels different morning, afternoon, evening and Sunday) and
 * what you have and haven't done yet.
 */
export type Mode = 'morning' | 'afternoon' | 'evening' | 'sunday'
export type Goal = 'calm' | 'done' | 'habits' | 'understand'
export type Profile = { goal?: Goal; routine?: 'morning' | 'evening'; onboardedAt?: number }
export const PROFILE_KEY = 'bloom-profile-v1'

export function modeFor(date = new Date()): Mode {
  const h = date.getHours()
  if (date.getDay() === 0 && h >= 12) return 'sunday'
  return h >= 5 && h < 12 ? 'morning' : h >= 12 && h < 18 ? 'afternoon' : 'evening'
}

export const modeCopy: Record<Mode, { greeting: string; kicker: string }> = {
  morning: { greeting: 'Good morning', kicker: 'Morning Bloom · priorities' },
  afternoon: { greeting: 'Good afternoon', kicker: 'Afternoon Bloom · focus' },
  evening: { greeting: 'Good evening', kicker: 'Evening Bloom · reflection' },
  sunday: { greeting: 'Happy Sunday', kicker: 'Sunday Bloom · your week' },
}

export type Action =
  | { type: 'focus'; taskId: string; label: string }
  | { type: 'complete'; taskId: string; label: string }
  | { type: 'habit'; habitId: string; label: string }
  | { type: 'navigate'; page: NavKey; label: string }
  | { type: 'plan'; label: string }
  | { type: 'week'; label: string }

export type Now = {
  title: string
  reason: string
  primary: Action
  secondary?: Action
  chips: { label: string; value: number; of: number }[]
}

const rank = { P1: 0, P2: 1, P3: 2, P4: 3 } as const

export function nextTask(data: AppData, today: string) {
  return data.todos
    .filter((t) => !t.done && t.due <= today && (!t.planning?.deferUntil || t.planning.deferUntil <= today))
    .sort((a, b) => rank[a.priority] - rank[b.priority] || a.due.localeCompare(b.due) || (a.planning?.order ?? 0) - (b.planning?.order ?? 0))[0]
}

export function chipsFor(data: AppData, today: string) {
  const habitsDone = data.habits.filter((h) => h.dates.includes(today)).length
  const dueToday = data.todos.filter((t) => t.due === today || (t.done && t.completedAt && dayKey(new Date(t.completedAt)) === today))
  const chips = []
  if (data.habits.length) chips.push({ label: 'Habits', value: habitsDone, of: data.habits.length })
  if (dueToday.length) chips.push({ label: "Today's plan", value: dueToday.filter((t) => t.done).length, of: dueToday.length })
  const focus = data.rpg.focusHistory.filter((f) => dayKey(new Date(f.completedAt)) === today).reduce((s, f) => s + f.minutes, 0)
  chips.push({ label: 'Focus min', value: focus, of: Math.max(50, focus) })
  return chips
}

export function whatNow(data: AppData, today: string, mode: Mode, opts: { reflectedToday: boolean; weekSeen: boolean; journalPage: NavKey }): Now {
  const task = nextTask(data, today)
  const habit = data.habits.find((h) => !h.dates.includes(today))
  const planned = data.plans.some((p) => p.date === today)
  const chips = chipsFor(data, today)
  const minutes = data.rpg.focusQuest.durationMinutes

  if (mode === 'sunday' && !opts.weekSeen)
    return { title: 'Your week is ready', reason: 'Bloom gathered what changed this week.', primary: { type: 'week', label: 'Reveal my week' }, chips }
  if (mode === 'morning' && !planned)
    return {
      title: 'Choose one thing that matters today',
      reason: 'A single intention makes the rest of the day easier.',
      primary: { type: 'plan', label: 'Set my intention' },
      secondary: task ? { type: 'focus', taskId: task.id, label: `Or start a ${minutes}-minute focus` } : undefined,
      chips,
    }
  if (mode === 'evening' && !opts.reflectedToday)
    return {
      title: 'Close the day gently',
      reason: task ? `${task.title} can wait for tomorrow.` : 'A few honest lines before rest.',
      primary: { type: 'navigate', page: opts.journalPage, label: 'Reflect for 3 minutes' },
      secondary: habit ? { type: 'habit', habitId: habit.id, label: 'Tick off a habit' } : undefined,
      chips,
    }
  if (task)
    return {
      title: task.title,
      reason: task.due < today ? 'You postponed this one. Today could be the day.' : task.priority === 'P1' ? 'Your most important task.' : 'Next on your list.',
      primary: { type: 'focus', taskId: task.id, label: `Start ${minutes}-minute focus` },
      secondary: { type: 'complete', taskId: task.id, label: 'Already done' },
      chips,
    }
  if (habit)
    return { title: habit.title, reason: 'Your list is clear. Tend a habit.', primary: { type: 'habit', habitId: habit.id, label: 'Done for today' }, chips }
  if (!opts.reflectedToday)
    return { title: 'Everything is done', reason: 'Take a moment to notice what went well.', primary: { type: 'navigate', page: opts.journalPage, label: 'Reflect' }, chips }
  return { title: 'Nothing left to do', reason: 'Rest is part of the work.', primary: { type: 'navigate', page: 'breathe', label: 'Breathe for two minutes' }, chips }
}

/** A different question to carry each day; tomorrow's is always waiting. */
export const seeds = [
  'What would make today feel light?',
  'Who could use a kind word from you today?',
  'What are you avoiding, and what is the smallest step toward it?',
  'What did your body ask for yesterday?',
  'What would future-you thank you for doing today?',
  'Where did you feel most like yourself this week?',
  'What can you stop doing?',
  'What are you quietly proud of?',
  'What deserves less of your worry?',
  'What small beauty did you nearly miss?',
  'If today had a theme, what would it be?',
  'What would you try if it did not have to be perfect?',
  'What is one thing you already have enough of?',
  'What conversation have you been postponing?',
]
export const seedFor = (date: string) => {
  const n = Math.floor(new Date(`${date}T12:00:00`).getTime() / 86_400_000)
  return seeds[((n % seeds.length) + seeds.length) % seeds.length]
}

/** "Day complete" when the day's plan (tasks due today + habits) is all done. */
export function dayComplete(data: AppData, today: string) {
  const tasks = data.todos.filter((t) => t.due === today || (t.done && t.completedAt && dayKey(new Date(t.completedAt)) === today))
  const planned = tasks.length + data.habits.length
  const done = tasks.filter((t) => t.done).length + data.habits.filter((h) => h.dates.includes(today)).length
  const focus = { morning: 0, afternoon: 0, evening: 0 }
  for (const f of data.rpg.focusHistory)
    if (dayKey(new Date(f.completedAt)) === today) {
      const h = new Date(f.completedAt).getHours()
      focus[h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'] += f.minutes
    }
  const best = (Object.entries(focus) as [keyof typeof focus, number][]).sort((a, b) => b[1] - a[1])[0]
  return { planned, done, complete: planned >= 3 && done >= planned, bestFocus: best[1] > 0 ? best[0] : null, focusMinutes: focus.morning + focus.afternoon + focus.evening }
}

/** This week vs last week, for the Sunday reveal. */
export function weekStory(data: AppData, today: string) {
  const end = new Date(`${today}T12:00:00`)
  const range = (from: number, to: number) => {
    const s = new Set<string>()
    for (let i = from; i < to; i++) {
      const d = new Date(end)
      d.setDate(end.getDate() - i)
      s.add(dayKey(d))
    }
    return s
  }
  const count = (days: Set<string>) => ({
    tasks: data.todos.filter((t) => t.done && t.completedAt && days.has(dayKey(new Date(t.completedAt)))).length,
    focus: data.rpg.focusHistory.filter((f) => days.has(dayKey(new Date(f.completedAt)))).reduce((s, f) => s + f.minutes, 0),
    habits: data.habits.reduce((s, h) => s + h.dates.filter((d) => days.has(d)).length, 0),
    reflections: data.sessions.filter((x) => days.has(dayKey(new Date(x.metadata.date)))).length,
  })
  const thisWeek = count(range(0, 7))
  const lastWeek = count(range(7, 14))
  const change = (k: keyof typeof thisWeek) => (lastWeek[k] ? Math.round(((thisWeek[k] - lastWeek[k]) / lastWeek[k]) * 100) : null)
  return { thisWeek, lastWeek, change }
}
