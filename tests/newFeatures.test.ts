import { defaults } from '../src/model'
import { duration, sleepStats, factorImpact, minutesUntilBedtime, type SleepEntry } from '../src/features/sleep/sleepModel'
import { buy, emptyShop, petalBalance, toggleEquip } from '../src/features/rewards/shop'
import { dueReminders, markFired, emptyReminders, type Remindable } from '../src/features/reminders/reminderRules'
import { weeklyGoals } from '../src/rpg/rewards'

const night = (date: string, bedtime: string, wake: string, quality: SleepEntry['quality'], factors: string[] = []): SleepEntry => ({
  id: date,
  date,
  bedtime,
  wake,
  quality,
  factors,
})

test('sleep duration handles bedtimes before and after midnight', () => {
  expect(duration('23:00', '07:00')).toBe(8)
  expect(duration('00:30', '06:30')).toBe(6)
  expect(duration('22:15', '06:45')).toBe(8.5)
})

test('sleep stats report average, consistency and debt against the goal', () => {
  const stats = sleepStats(
    [night('2026-09-20', '23:00', '07:00', 4), night('2026-09-21', '23:00', '06:00', 3)],
    { targetHours: 8, bedtime: '23:00' },
  )
  expect(stats).toMatchObject({ average: 7.5, quality: 3.5, consistency: 100, debt: 1, count: 2 })
})

test('factor impact compares quality with and without a factor', () => {
  const impact = factorImpact([
    night('a', '23:00', '07:00', 2, ['screens']),
    night('b', '23:00', '07:00', 2, ['screens']),
    night('c', '23:00', '07:00', 5),
    night('d', '23:00', '07:00', 4),
  ])
  expect(impact[0]).toMatchObject({ factor: { id: 'screens' }, delta: -2.5 })
})

test('bedtime countdown wraps past midnight', () => {
  expect(minutesUntilBedtime('22:30', new Date(2026, 8, 26, 21, 0))).toBe(90)
  expect(minutesUntilBedtime('00:30', new Date(2026, 8, 26, 23, 30))).toBe(60)
})

test('the shop only sells what you can afford, once, and equips wearables', () => {
  expect(buy(emptyShop, 30, 'cherry-tree')).toBeNull()
  const bought = buy(emptyShop, 200, 'hat-straw')!
  expect(bought.spent).toBe(40)
  expect(bought.equipped.hat).toBe('hat-straw')
  expect(petalBalance(200, bought)).toBe(160)
  expect(buy(bought, 200, 'hat-straw')).toBeNull()
  expect(toggleEquip(bought, 'hat-straw').equipped.hat).toBeNull()
  const decor = buy(bought, 200, 'bench')!
  expect(decor.owned).toContain('bench')
  expect(decor.equipped).toEqual(bought.equipped)
})

test('reminders fire once, after their time, only for open scheduled items', () => {
  const state = {
    ...emptyReminders,
    items: {
      a: { time: '08:00', enabled: true },
      b: { time: '08:00', enabled: true },
      c: { time: '20:00', enabled: true },
      d: { time: '08:00', enabled: true },
    },
  }
  const items: Remindable[] = [
    { id: 'a', title: 'A', kind: 'habit', done: false, scheduled: true },
    { id: 'b', title: 'B', kind: 'habit', done: true, scheduled: true },
    { id: 'c', title: 'C', kind: 'habit', done: false, scheduled: true },
    { id: 'd', title: 'D', kind: 'routine', done: false, scheduled: false },
  ]
  const at = new Date(2026, 8, 26, 9, 0)
  const due = dueReminders(state, items, '2026-09-26', at)
  expect(due.map((d) => d.id)).toEqual(['a'])
  const fired = markFired(state, ['a'], '2026-09-26')
  expect(dueReminders(fired, items, '2026-09-26', at)).toEqual([])
  // Stale by more than 3 hours: skipped.
  expect(dueReminders(state, items, '2026-09-26', new Date(2026, 8, 26, 12, 30))).toEqual([])
})

test('adaptive goals stretch to recent pace and fall back without history', () => {
  const data = defaults()
  data.rpg.focusHistory = [7, 14, 21].flatMap((daysAgo, w) =>
    Array.from({ length: 8 + w }, (_, i) => ({
      id: `${daysAgo}-${i}`,
      completedAt: new Date(2026, 8, 25 - daysAgo, 10).getTime(),
      minutes: 25,
      taskTitle: '',
    })),
  )
  const fixed = weeklyGoals(data, '2026-09-25')
  const adaptive = weeklyGoals(data, '2026-09-25', true)
  const sessions = adaptive.find((g) => g.id === 'deep-focus')!
  expect(fixed.find((g) => g.id === 'deep-focus')!.target).toBe(5)
  // Average of 8, 9, 10 sessions → 9 × 1.1 → 10.
  expect(sessions).toMatchObject({ target: 10, adapted: true, baseTarget: 5 })
  expect(adaptive.find((g) => g.id === 'journal')).toMatchObject({ target: 3, adapted: false })
})
