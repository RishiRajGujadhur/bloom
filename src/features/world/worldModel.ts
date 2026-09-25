import type { AppData } from '../../model'
import { previousDay } from '../../dates'
import { activityDays } from '../insights'
import { totals } from '../../rpg/engine'
import { habitStats } from '../habits'
import type { NavKey } from '../../components/layout/Sidebar'

/**
 * Bloom World is a pure projection of AppData: nothing new is stored, so the
 * island can never drift from the activity that built it.
 */
export type DistrictId =
  | 'home'
  | 'garden'
  | 'library'
  | 'town'
  | 'monument'
  | 'trophies'

export type District = {
  id: DistrictId
  name: string
  emoji: string
  /** What feeds it, e.g. "Complete tasks". */
  verb: string
  /** Raw count driving the district (tasks, minutes, entries…). */
  value: number
  unit: string
  stage: number
  maxStage: number
  /** 0–1 progress toward the next stage (1 once maxed). */
  progress: number
  nextHint: string
  go: NavKey
}

export type Decoration = {
  id: 'lanterns' | 'pond' | 'windmill' | 'fountain' | 'balloon' | 'rainbow'
  name: string
  emoji: string
  requirement: string
  unlocked: boolean
}

export type WorldState = {
  level: number
  exp: number
  nextLevel: number
  streak: number
  bestStreak: number
  counts: {
    tasks: number
    focusSessions: number
    focusMinutes: number
    journals: number
    habitCheckins: number
    badges: number
    challenges: number
  }
  /** Items actually placed in the scene, capped to keep the island readable. */
  scene: {
    homeTier: number
    trees: number
    flowers: number
    books: number
    buildings: number
    monumentBlocks: number
    flame: boolean
    trophies: number
  }
  districts: District[]
  decorations: Decoration[]
}

/** Stage from ascending thresholds; progress is measured toward the next one. */
export function staged(value: number, thresholds: number[]) {
  let stage = 0
  while (stage < thresholds.length && value >= thresholds[stage]) stage++
  if (stage === thresholds.length) return { stage, progress: 1, next: null }
  const from = stage ? thresholds[stage - 1] : 0
  const next = thresholds[stage]
  return { stage, progress: (value - from) / (next - from), next }
}

/** Consecutive active days ending today (or yesterday, so today isn't lost yet). */
export function activityStreak(activeDays: Set<string>, today: string) {
  let cursor = activeDays.has(today) ? today : previousDay(today)
  let current = 0
  while (activeDays.has(cursor)) {
    current++
    cursor = previousDay(cursor)
  }
  const sorted = [...activeDays].sort()
  let best = 0
  let chain = 0
  sorted.forEach((day, i) => {
    chain = i > 0 && sorted[i - 1] === previousDay(day) ? chain + 1 : 1
    best = Math.max(best, chain)
  })
  return { current, best }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

export function buildWorld(data: AppData, today: string): WorldState {
  const days = activityDays(data)
  const active = new Set(
    days
      .filter((d) => d.tasks || d.focus || d.journals || d.habits)
      .map((d) => d.date),
  )
  const streak = activityStreak(active, today)
  const bestHabit = Math.max(
    0,
    ...data.habits.map((h) => habitStats(h.dates, today).best),
  )
  const { level, exp, nextLevel } = totals(data.rpg)
  const counts = {
    tasks: data.todos.filter((t) => t.done).length,
    focusSessions: data.rpg.focusHistory.length,
    focusMinutes: data.rpg.focusHistory.reduce((s, f) => s + f.minutes, 0),
    journals: data.sessions.filter(
      (s) => s.flow.complete || s.messages.some((m) => m.sender === 'user'),
    ).length,
    habitCheckins: data.habits.reduce(
      (s, h) => s + new Set(h.dates).size,
      0,
    ),
    badges: data.rpg.badges.length,
    challenges: data.challenges.filter((c) => c.rewarded).length,
  }
  const achievements = counts.badges + counts.challenges

  const home = staged(level, [3, 6, 10, 15])
  const garden = staged(counts.focusSessions, [1, 5, 12, 25, 50])
  const library = staged(counts.journals, [1, 5, 15, 30, 60])
  const town = staged(counts.tasks, [5, 15, 30, 60, 100])
  const monument = staged(streak.current, [1, 3, 7, 14, 30])
  const trophies = staged(achievements, [1, 3, 6, 10])

  const hint = (
    s: { next: number | null },
    value: number,
    unit: string,
    done: string,
  ) => (s.next === null ? done : `${plural(s.next - value, unit)} to grow`)

  const districts: District[] = [
    {
      id: 'home',
      name: 'Your Home',
      emoji: '🏡',
      verb: 'Level up by completing anything',
      value: level,
      unit: 'level',
      ...home,
      maxStage: 4,
      nextHint:
        home.next === null
          ? 'A manor fit for your journey'
          : `Reach level ${home.next} to upgrade`,
      go: 'growth',
    },
    {
      id: 'garden',
      name: 'Garden',
      emoji: '🌳',
      verb: 'Focus & meditate',
      value: counts.focusSessions,
      unit: 'session',
      ...garden,
      maxStage: 5,
      nextHint: hint(garden, counts.focusSessions, 'session', 'An ancient grove'),
      go: 'focus',
    },
    {
      id: 'library',
      name: 'Journal Library',
      emoji: '📚',
      verb: 'Journal',
      value: counts.journals,
      unit: 'entry',
      ...library,
      maxStage: 5,
      nextHint: hint(library, counts.journals, 'entry', 'Shelves full of you'),
      go: 'journal',
    },
    {
      id: 'town',
      name: 'Little Town',
      emoji: '🏘️',
      verb: 'Complete tasks',
      value: counts.tasks,
      unit: 'task',
      ...town,
      maxStage: 5,
      nextHint: hint(town, counts.tasks, 'task', 'A thriving town'),
      go: 'todos',
    },
    {
      id: 'monument',
      name: 'Streak Monument',
      emoji: '🔥',
      verb: 'Show up daily',
      value: streak.current,
      unit: 'day',
      ...monument,
      maxStage: 5,
      nextHint: hint(monument, streak.current, 'day', 'An eternal flame'),
      go: 'habits',
    },
    {
      id: 'trophies',
      name: 'Achievement Hall',
      emoji: '🏆',
      verb: 'Earn badges & finish challenges',
      value: achievements,
      unit: 'achievement',
      ...trophies,
      maxStage: 4,
      nextHint: hint(trophies, achievements, 'achievement', 'A legendary hall'),
      go: 'challenges',
    },
  ]

  const decorations: Decoration[] = [
    {
      id: 'lanterns',
      name: 'Glow lanterns',
      emoji: '🏮',
      requirement: 'Reach level 3',
      unlocked: level >= 3,
    },
    {
      id: 'pond',
      name: 'Lily pond',
      emoji: '🪷',
      requirement: '10 focus sessions',
      unlocked: counts.focusSessions >= 10,
    },
    {
      id: 'windmill',
      name: 'Windmill',
      emoji: '🌬️',
      requirement: '25 tasks done',
      unlocked: counts.tasks >= 25,
    },
    {
      id: 'fountain',
      name: 'Fountain',
      emoji: '⛲',
      requirement: '7-day streak (best)',
      unlocked: Math.max(streak.best, bestHabit) >= 7,
    },
    {
      id: 'balloon',
      name: 'Hot-air balloon',
      emoji: '🎈',
      requirement: 'Reach level 10',
      unlocked: level >= 10,
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      emoji: '🌈',
      requirement: '30 journal entries',
      unlocked: counts.journals >= 30,
    },
  ]

  return {
    level,
    exp,
    nextLevel,
    streak: streak.current,
    bestStreak: streak.best,
    counts,
    scene: {
      homeTier: home.stage,
      trees: Math.min(counts.focusSessions, 18),
      flowers: Math.min(counts.habitCheckins, 40),
      books: Math.min(counts.journals, 48),
      buildings: Math.min(Math.floor(counts.tasks / 5), 9),
      monumentBlocks: Math.min(streak.current, 14),
      flame: streak.current > 0,
      trophies: Math.min(achievements, 8),
    },
    districts,
    decorations,
  }
}

/** What grew since a stored snapshot; used for the "while you were away" note. */
export function growthSince(
  previous: WorldState['scene'] | null,
  next: WorldState['scene'],
) {
  if (!previous) return []
  const notes: string[] = []
  const diff = (key: keyof WorldState['scene'], word: string) => {
    const delta = Number(next[key]) - Number(previous[key])
    if (delta > 0) notes.push(`+${plural(delta, word)}`)
  }
  diff('trees', 'tree')
  diff('flowers', 'flower')
  diff('books', 'book')
  diff('buildings', 'building')
  diff('monumentBlocks', 'monument stone')
  diff('trophies', 'trophy')
  if (next.homeTier > previous.homeTier) notes.push('Home upgraded')
  return notes
}

/** A fully grown island, shown by "Peek at the future" as something to aim for. */
export function futureWorld(world: WorldState): WorldState {
  return {
    ...world,
    scene: {
      homeTier: 4,
      trees: 18,
      flowers: 40,
      books: 48,
      buildings: 9,
      monumentBlocks: 14,
      flame: true,
      trophies: 8,
    },
    decorations: world.decorations.map((d) => ({ ...d, unlocked: true })),
  }
}
