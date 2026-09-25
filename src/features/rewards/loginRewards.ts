import { previousDay } from '../../dates'

/**
 * Daily visit rewards for the year. Pure functions over a small stored state
 * so the rules are easy to test:
 *
 *  - Each new day you open Bloom earns petals: 5 + the current streak (max +10).
 *  - Milestones (7, 30, 100, 180, 365 days in a row) add a bonus once.
 *  - Every 7-day streak earns a streak freeze (max 3). A single missed day is
 *    covered automatically by a freeze, so one busy day never resets you.
 */
export type LoginState = {
  days: string[]
  frozen: string[]
  petals: number
  freezes: number
  milestones: number[]
}

export const LOGIN_KEY = 'bloom-logins-v1'
export const emptyLogin: LoginState = {
  days: [],
  frozen: [],
  petals: 0,
  freezes: 0,
  milestones: [],
}
export const loginMilestones = [
  { days: 7, bonus: 50, label: 'One week', emoji: '🌱' },
  { days: 30, bonus: 200, label: 'One month', emoji: '🌿' },
  { days: 100, bonus: 750, label: '100 days', emoji: '🌳' },
  { days: 180, bonus: 1500, label: 'Half a year', emoji: '🌸' },
  { days: 365, bonus: 4000, label: 'A full year', emoji: '🏵️' },
] as const
export const MAX_FREEZES = 3

/** Consecutive days ending today (or yesterday), counting frozen days. */
export function loginStreak(state: LoginState, today: string) {
  const covered = new Set([...state.days, ...state.frozen])
  let cursor = covered.has(today) ? today : previousDay(today)
  let count = 0
  while (covered.has(cursor)) {
    if (state.days.includes(cursor)) count++
    cursor = previousDay(cursor)
  }
  return count
}

export type LoginResult = {
  state: LoginState
  reward: { petals: number; streak: number; milestone?: (typeof loginMilestones)[number]; usedFreeze: boolean; earnedFreeze: boolean } | null
}

/** Records today's visit once and returns the reward earned (null if already visited). */
export function recordLogin(state: LoginState, today: string): LoginResult {
  if (state.days.includes(today)) return { state, reward: null }
  let next: LoginState = { ...state, days: [...state.days, today].sort() }
  // A single missed day is forgiven with a freeze, if one is available.
  const yesterday = previousDay(today)
  const dayBefore = previousDay(yesterday)
  let usedFreeze = false
  if (
    state.days.length &&
    !state.days.includes(yesterday) &&
    !state.frozen.includes(yesterday) &&
    (state.days.includes(dayBefore) || state.frozen.includes(dayBefore)) &&
    state.freezes > 0
  ) {
    next = { ...next, frozen: [...next.frozen, yesterday], freezes: next.freezes - 1 }
    usedFreeze = true
  }
  const streak = loginStreak(next, today)
  let petals = 5 + Math.min(streak, 10)
  const milestone = loginMilestones.find(
    (m) => streak >= m.days && !next.milestones.includes(m.days),
  )
  if (milestone) {
    petals += milestone.bonus
    next = { ...next, milestones: [...next.milestones, milestone.days] }
  }
  const earnedFreeze = streak > 0 && streak % 7 === 0 && next.freezes < MAX_FREEZES
  if (earnedFreeze) next = { ...next, freezes: next.freezes + 1 }
  next = { ...next, petals: next.petals + petals }
  return { state: next, reward: { petals, streak, milestone, usedFreeze, earnedFreeze } }
}

export function readLogin(): LoginState {
  try {
    const value = JSON.parse(localStorage.getItem(LOGIN_KEY) ?? 'null') as Partial<LoginState> | null
    return value && Array.isArray(value.days) ? { ...emptyLogin, ...value } : emptyLogin
  } catch {
    return emptyLogin
  }
}

export function saveLogin(state: LoginState) {
  try {
    localStorage.setItem(LOGIN_KEY, JSON.stringify(state))
  } catch {
    /* Rewards still show for this visit. */
  }
}

/** Weeks (Mon-first columns) covering the calendar year of `today`. */
export function yearWeeks(today: string) {
  const year = Number(today.slice(0, 4))
  const start = new Date(year, 0, 1, 12)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const end = new Date(year, 11, 31, 12)
  const weeks: { key: string; inYear: boolean }[][] = []
  for (const cursor = new Date(start); cursor <= end; ) {
    const week: { key: string; inYear: boolean }[] = []
    for (let d = 0; d < 7; d++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`
      week.push({ key, inYear: cursor.getFullYear() === year })
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}
