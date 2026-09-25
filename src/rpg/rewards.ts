import type { AppData } from '../model'
import { dayKey } from '../dates'
import { totals } from './engine'
import type { Rpg } from './schema'

export function weeklyGoals(data: AppData, today: string) {
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
