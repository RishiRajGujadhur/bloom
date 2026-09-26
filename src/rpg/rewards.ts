import type { AppData } from '../model'
import { dayKey } from '../dates'
import { totals } from './engine'
import type { Rpg } from './schema'

function goalsForWeek(data: AppData, today: string) {
  const start = new Date(`${today}T12:00:00`)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const from = dayKey(start)
  const inWeek = (day: string) => day >= from && day <= today
  return [
    {
      id: 'journal',
      title: 'Make room for reflection',
      unit: 'journal entries',
      target: 3,
      current: data.sessions.filter(
        (s) => s.flow.complete && inWeek(dayKey(new Date(s.metadata.date))),
      ).length,
      page: 'journal' as const,
    },
    {
      id: 'habits',
      title: 'Small steps, steady roots',
      unit: 'habit check-ins',
      target: 7,
      current: data.habits.reduce(
        (sum, h) => sum + new Set(h.dates.filter(inWeek)).size,
        0,
      ),
      page: 'habits' as const,
    },
    {
      id: 'focus',
      title: 'Give your attention space',
      unit: 'focus minutes',
      target: 60,
      current: (data.rpg.focusHistory ?? [])
        .filter((s) => inWeek(dayKey(new Date(s.completedAt))))
        .reduce((sum, s) => sum + s.minutes, 0),
      page: 'focus' as const,
    },
    {
      id: 'tasks',
      title: 'Clear the path',
      unit: 'tasks done',
      target: 8,
      current: data.todos.filter(
        (t) => t.done && t.completedAt && inWeek(dayKey(new Date(t.completedAt))),
      ).length,
      page: 'todos' as const,
    },
    {
      id: 'intentions',
      title: 'Follow through gently',
      unit: 'intentions kept',
      target: 5,
      current: data.plans.filter((p) => p.done && inWeek(p.date)).length,
      page: 'planning' as const,
    },
    {
      id: 'routines',
      title: 'Rituals that hold you',
      unit: 'routine runs',
      target: 3,
      current: (data.routines ?? []).reduce(
        (sum, r) => sum + new Set(r.dates.filter(inWeek)).size,
        0,
      ),
      page: 'habits' as const,
    },
    {
      id: 'deep-focus',
      title: 'Go a little deeper',
      unit: 'focus sessions',
      target: 5,
      current: (data.rpg.focusHistory ?? []).filter((s) =>
        inWeek(dayKey(new Date(s.completedAt))),
      ).length,
      page: 'focus' as const,
    },
    {
      id: 'show-up',
      title: 'Show up most days',
      unit: 'active days',
      target: 5,
      current: new Set([
        ...data.habits.flatMap((h) => h.dates.filter(inWeek)),
        ...data.sessions
          .map((s) => dayKey(new Date(s.metadata.date)))
          .filter(inWeek),
        ...data.todos
          .filter((t) => t.done && t.completedAt)
          .map((t) => dayKey(new Date(t.completedAt!)))
          .filter(inWeek),
        ...(data.rpg.focusHistory ?? [])
          .map((s) => dayKey(new Date(s.completedAt)))
          .filter(inWeek),
      ]).size,
      page: 'overview' as const,
    },
  ]
}

/**
 * Weekly goals. With `adaptive`, each target scales to your recent pace:
 * about 10% above your average over the previous three weeks, never below
 * half the default nor above triple it. With no history the default applies.
 */
export function weeklyGoals(data: AppData, today: string, adaptive = false) {
  const goals = goalsForWeek(data, today)
  if (!adaptive) return goals.map((g) => ({ ...g, baseTarget: g.target, adapted: false }))
  const monday = new Date(`${today}T12:00:00`)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  const history = [1, 2, 3].map((weeksAgo) => {
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() - 7 * weeksAgo + 6)
    return goalsForWeek(data, dayKey(sunday))
  })
  return goals.map((goal, index) => {
    const average = history.reduce((sum, week) => sum + week[index].current, 0) / history.length
    if (average <= 0) return { ...goal, baseTarget: goal.target, adapted: false }
    const target = Math.min(
      goal.target * 3,
      Math.max(Math.ceil(goal.target / 2), Math.ceil(average * 1.1)),
    )
    return { ...goal, baseTarget: goal.target, target, adapted: target !== goal.target }
  })
}

// Existing ledger identities prevent undo/redo and page visits from replaying rewards.
export function earnedFeedback(previous: Rpg, next: Rpg) {
  const fresh = Object.entries(next.ledger).filter(
    ([key, event]) => event.active && event.exp > 0 && !previous.ledger[key],
  )
  const xp = fresh.reduce((sum, [, event]) => sum + event.exp, 0)
  const badges = next.badges.filter((badge) => !previous.badges.includes(badge))
  const level = totals(next).level
  const leveledUp = xp > 0 && level > totals(previous).level
  return {
    xp,
    badges,
    level,
    leveledUp,
    celebrate:
      leveledUp ||
      badges.length > 0 ||
      fresh.some(([, event]) => event.kind === 'boss'),
  }
}
