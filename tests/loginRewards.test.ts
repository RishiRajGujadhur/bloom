import {
  emptyLogin,
  loginStreak,
  recordLogin,
  yearWeeks,
} from '../src/features/rewards/loginRewards'
import { jarTotals, defaultJars } from '../src/features/wellbeing/store'
import { habitTemplates, routineTemplates } from '../src/features/library'

const days = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => `2026-09-${String(from + i).padStart(2, '0')}`)

test('each new day rewards petals once and grows the streak', () => {
  const first = recordLogin(emptyLogin, '2026-09-01')
  expect(first.reward).toMatchObject({ petals: 6, streak: 1 })
  expect(recordLogin(first.state, '2026-09-01').reward).toBeNull()
  const second = recordLogin(first.state, '2026-09-02')
  expect(second.reward).toMatchObject({ petals: 7, streak: 2 })
  expect(second.state.petals).toBe(13)
})

test('a 7-day streak pays the milestone bonus and earns a freeze', () => {
  let state = emptyLogin
  let last = null
  for (const day of days(1, 7)) {
    const result = recordLogin(state, day)
    state = result.state
    last = result.reward
  }
  expect(last).toMatchObject({ streak: 7, earnedFreeze: true })
  expect(last?.milestone?.days).toBe(7)
  expect(state.freezes).toBe(1)
  expect(state.milestones).toEqual([7])
})

test('a freeze forgives one missed day; without one the streak resets', () => {
  const base = { ...emptyLogin, days: days(1, 5) }
  const saved = recordLogin({ ...base, freezes: 1 }, '2026-09-07')
  expect(saved.reward?.usedFreeze).toBe(true)
  expect(saved.state.frozen).toEqual(['2026-09-06'])
  expect(loginStreak(saved.state, '2026-09-07')).toBe(6)
  const reset = recordLogin(base, '2026-09-07')
  expect(reset.reward?.usedFreeze).toBe(false)
  expect(loginStreak(reset.state, '2026-09-07')).toBe(1)
})

test('the year grid covers every day of the year in Monday-first weeks', () => {
  const weeks = yearWeeks('2026-09-26')
  const inYear = weeks.flat().filter((d) => d.inYear)
  expect(inYear).toHaveLength(365)
  expect(weeks.every((w) => w.length === 7)).toBe(true)
})

test('jars compare by fill, legacy notes land in Little moments', () => {
  const totals = jarTotals(defaultJars, [
    { id: '1', at: 1, text: 'a' },
    { id: '2', at: 2, text: 'b', jarId: 'people' },
    { id: '3', at: 3, text: 'c', jarId: 'people' },
  ])
  expect(totals[0]).toMatchObject({ jar: { id: 'people' }, count: 2 })
  expect(totals[1]).toMatchObject({ jar: { id: 'moments' }, count: 1 })
})

test('library templates are unique and complete', () => {
  expect(new Set(habitTemplates.map((h) => h.id)).size).toBe(habitTemplates.length)
  expect(habitTemplates.length).toBeGreaterThanOrEqual(20)
  expect(routineTemplates.every((r) => r.steps.length > 0 && r.days.length > 0)).toBe(true)
})
