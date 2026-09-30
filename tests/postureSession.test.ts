import { summarizeSession } from '../src/features/posture/postureModel'

test('summarises a guard session', () => {
  expect(summarizeSession({ startedAt: 0, endedAt: 30 * 60000, samples: 1800, upright: 1350, scoreSum: 1800 * 80, warnings: 2 })).toEqual({ minutes: 30, uprightPct: 75, avgScore: 80, warnings: 2 })
  expect(summarizeSession({ startedAt: 0, endedAt: 1000, samples: 0, upright: 0, scoreSum: 0, warnings: 0 }).minutes).toBe(1)
})
