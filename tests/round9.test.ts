import { defaults } from '../src/model'
import { createEpiphany, dueToday, retention, review } from '../src/features/epiphany/epiphanyModel'
import { eveningSteps, flowProgress, morningSteps, nextStep, defaultPart } from '../src/features/dailyFlow/dailyFlowModel'
import { impactExp, taskWeight } from '../src/features/impact/impactModel'
import { defaultSettings } from '../src/SettingsPage'

test('epiphanies follow SM-2: tomorrow, then 6 days, then longer; forgetting resets', () => {
  let e = createEpiphany('  Rest is productive.  ', { kind: 'manual', title: 'x', date: '2026-09-26' }, '2026-09-26')
  expect(e.text).toBe('Rest is productive.')
  expect(e.due).toBe('2026-09-27')
  e = review(e, 4, '2026-09-27')
  expect(e).toMatchObject({ interval: 1, repetition: 1, due: '2026-09-28' })
  e = review(e, 5, '2026-09-28')
  expect(e).toMatchObject({ interval: 6, due: '2026-10-04' })
  e = review(e, 4, '2026-10-04')
  expect(e.interval).toBeGreaterThan(12)
  const forgot = review(e, 1, '2026-10-20')
  expect(forgot).toMatchObject({ interval: 1, repetition: 0 })
  expect(forgot.efactor).toBeLessThan(e.efactor)
  expect(dueToday([e, forgot], '2026-10-21').map((x) => x.id)).toContain(forgot.id)
  expect(retention({ interval: 1, efactor: 2.5 }, 0)).toBe(1)
  expect(retention({ interval: 20, efactor: 2.5 }, 5)).toBeGreaterThan(retention({ interval: 1, efactor: 2.5 }, 5))
})

test('daily flow detects completion from data the features already store', () => {
  const data = defaults()
  const today = '2026-09-26'
  data.plans = [{ id: 'p', title: 'x', date: today, done: false }]
  const inputs = {
    data,
    today,
    flags: defaultSettings.features,
    moods: [{ at: new Date(2026, 8, 26, 9).getTime() }],
    gratitude: [],
    breaths: [],
    daybook: [],
    epiphaniesDue: 2,
    windDownDay: today,
  }
  const morning = morningSteps(inputs)
  expect(morning.map((s) => [s.id, s.done])).toEqual([
    ['epiphany', false],
    ['mood', true],
    ['intention', true],
    ['habits', false],
    ['focus', false],
  ])
  expect(nextStep(morning)?.id).toBe('epiphany')
  expect(flowProgress(morning)).toBeCloseTo(0.4)
  const evening = eveningSteps({ ...inputs, flags: { ...defaultSettings.features, breathe: false } })
  expect(evening.map((s) => s.id)).toEqual(['gratitude', 'reflect', 'tomorrow', 'winddown'])
  expect(evening.find((s) => s.id === 'winddown')?.done).toBe(true)
  expect(defaultPart(8)).toBe('morning')
  expect(defaultPart(21)).toBe('evening')
})

test('task weight grows with priority, age overdue and size', () => {
  const base = defaults().todos[0] ?? {
    id: 't', title: 't', done: false, due: '2026-09-26', completedAt: null, challengeId: null, rewarded: false,
    priority: 'P3' as const, tags: [], recurrence: 'none' as const, seriesId: null, subtasks: [],
  }
  const task = { ...base, priority: 'P3' as const, due: '2026-09-26', subtasks: [] }
  expect(taskWeight(task, '2026-09-26')).toBe(0)
  expect(taskWeight({ ...task, priority: 'P1' }, '2026-09-26')).toBe(2)
  expect(taskWeight({ ...task, due: '2026-09-01' }, '2026-09-26')).toBe(2)
  expect(taskWeight({ ...task, priority: 'P1', due: '2026-09-01' }, '2026-09-26')).toBe(3)
  expect(impactExp(0)).toBe(0)
  expect(impactExp(3)).toBe(35)
})
