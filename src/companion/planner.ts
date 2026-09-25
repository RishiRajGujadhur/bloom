import { z } from 'zod'
import { dayKey } from '../dates'
import type { AppData, Todo } from '../model'
import { planningOf, taskAvailability } from '../features/planning'

export const intentSchema = z.object({
  intent: z.enum(['plan', 'reflect', 'progress', 'chat']),
  minutes: z.number().int().min(5).max(240),
  energy: z.enum(['low', 'medium', 'high']),
  message: z.string().max(600),
})
export type Intent = z.infer<typeof intentSchema>
export type Proposal = {
  day: string
  minutes: number
  energy: Intent['energy']
  tasks: { id: string; title: string; minutes: number }[]
  pause: number
}

export function understandRequest(text: string): Intent {
  const amount = text.match(/(\d+)\s*(minutes?|mins?|hours?|hrs?)\b/i)
  const minutes = amount
    ? Number(amount[1]) * (/^h/i.test(amount[2]) ? 60 : 1)
    : /half an hour/i.test(text)
      ? 30
      : /\b(an?|one) hour\b/i.test(text)
        ? 60
        : 40
  return {
    intent: /\b(journal|reflect|reflection)\b/i.test(text)
      ? 'reflect'
      : /\b(progress|week|memory|memories|doing well)\b/i.test(text)
        ? 'progress'
        : /\b(plan|minutes?|mins?|hours?|tired|exhausted|overwhelmed|lighter|focus|today|start)\b/i.test(
              text,
            )
          ? 'plan'
          : 'chat',
    minutes: Math.max(5, Math.min(240, minutes)),
    energy: /\b(tired|exhausted|overwhelmed|low|lighter|easy|gentle)\b/i.test(
      text,
    )
      ? 'low'
      : /\b(energized|high)\b/i.test(text)
        ? 'high'
        : 'medium',
    message: '',
  }
}

function eligible(
  data: AppData,
  task: Todo,
  energy: Intent['energy'],
  now: Date,
) {
  return (
    taskAvailability(data, task, now) === 'available' &&
    (energy !== 'low' || ['low', 'any'].includes(planningOf(task).energy)) &&
    !data.calendarBlocks.some(
      (b) => b.taskId === task.id && Date.parse(b.end) > +now,
    )
  )
}

export function proposePlan(
  data: AppData,
  request: Intent,
  now = new Date(),
): Proposal {
  const pause = request.minutes >= 15 ? 5 : 0
  let remaining = request.minutes - pause
  const tasks: Proposal['tasks'] = []
  const candidates = data.todos
    .filter((task) => eligible(data, task, request.energy, now))
    .sort(
      (a, b) =>
        a.priority.localeCompare(b.priority) ||
        (a.due || '9999').localeCompare(b.due || '9999') ||
        planningOf(a).minutes - planningOf(b).minutes,
    )
  for (const task of candidates) {
    const minutes = planningOf(task).minutes
    if (minutes > remaining || tasks.length >= 3) continue
    tasks.push({ id: task.id, title: task.title, minutes })
    remaining -= minutes
  }
  return {
    day: dayKey(now),
    minutes: request.minutes,
    energy: request.energy,
    tasks,
    pause,
  }
}

export function proposalIsCurrent(
  data: AppData,
  proposal: Proposal,
  now = new Date(),
) {
  return (
    proposal.day === dayKey(now) &&
    proposal.tasks.every((item) => {
      const task = data.todos.find((t) => t.id === item.id)
      return (
        task &&
        eligible(data, task, proposal.energy, now) &&
        task.title === item.title &&
        planningOf(task).minutes === item.minutes
      )
    })
  )
}

// Stable IDs keep repeated accepts idempotent. All changes flow through useCoach.
export function applyProposal(
  data: AppData,
  proposal: Proposal,
  now = new Date(),
): AppData {
  if (!proposalIsCurrent(data, proposal, now)) return data
  const additions = proposal.tasks
    .map((task) => ({
      id: `companion:${proposal.day}:${task.id}`,
      title: task.title,
      date: proposal.day,
      done: false,
    }))
    .filter(
      (plan) =>
        !data.plans.some(
          (p) =>
            p.id === plan.id ||
            (p.date === plan.date && p.title === plan.title),
        ),
    )
  return additions.length
    ? { ...data, plans: [...data.plans, ...additions] }
    : data
}

export function weeklyMemory(data: AppData, now = new Date()) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - 6)
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(date.getDate() + index)
    return dayKey(date)
  })
  const rituals = data.habits.reduce(
    (sum, habit) =>
      sum + new Set(habit.dates.filter((d) => days.includes(d))).size,
    0,
  )
  const reflections = data.sessions.filter(
    (s) =>
      s.flow.complete &&
      +new Date(s.metadata.date) >= +start &&
      +new Date(s.metadata.date) <= +now,
  ).length
  const focus = data.rpg.focusHistory
    .filter((s) => s.completedAt >= +start && s.completedAt <= +now)
    .reduce((sum, s) => sum + s.minutes, 0)
  return {
    rituals,
    reflections,
    focus,
    start: days[0],
    end: days[6],
    text:
      rituals || reflections || focus
        ? `Over the last seven days, you recorded ${rituals} habit check-ins, ${reflections} reflections, and ${focus} minutes of focus. Each is a little part of your story.`
        : 'Your story has room to begin. One small task or a few words in your journal is enough for today.',
  }
}
