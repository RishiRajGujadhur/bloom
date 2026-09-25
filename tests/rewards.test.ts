import { defaults } from '../src/model'
import { initialRpg } from '../src/rpg/schema'
import { earnedFeedback, weeklyGoals } from '../src/rpg/rewards'

const award = {
  day: '2026-09-25',
  at: 1,
  exp: 20,
  stat: null,
  points: 0,
  gold: 0,
  active: true,
  kind: 'journal' as const,
  sourceId: 'entry',
}
test('rewards only new awards, with level and achievement celebrations', () => {
  const before = initialRpg(1)
  before.ledger.old = { ...award, exp: 90 }
  const after = {
    ...before,
    ledger: { ...before.ledger, new: award },
    badges: ['fog-breaker'],
  }
  expect(earnedFeedback(before, after)).toMatchObject({
    xp: 20,
    level: 2,
    leveledUp: true,
    celebrate: true,
    badges: ['fog-breaker'],
  })
  expect(earnedFeedback(after, after)).toMatchObject({
    xp: 0,
    celebrate: false,
  })
})
test('undo and redo cannot replay a reward', () => {
  const before = initialRpg(1)
  before.ledger.old = { ...award, active: false }
  const after = { ...before, ledger: { old: award } }
  expect(earnedFeedback(before, after)).toMatchObject({
    xp: 0,
    leveledUp: false,
    celebrate: false,
  })
})
test('weekly goals use local Monday boundaries, unique habit dates and completed focus sessions', () => {
  const data = defaults()
  data.habits = [
    {
      ...data.habits[0],
      dates: [
        '2026-09-20',
        '2026-09-21',
        '2026-09-21',
        '2026-09-25',
        '2026-09-26',
      ],
    },
  ]
  data.sessions = []
  data.rpg.focusHistory = [
    {
      id: 'focus',
      completedAt: new Date(2026, 8, 21, 12).getTime(),
      minutes: 25,
      taskTitle: 'Reading',
    },
  ]
  expect(weeklyGoals(data, '2026-09-25').map((g) => g.current)).toEqual([
    0, 2, 25,
  ])
  expect(weeklyGoals(data, '2026-09-28').map((g) => g.current)).toEqual([
    0, 0, 0,
  ])
})
