import { lifeTools } from '../src/features/life/catalog'
import {
  boundaries,
  boundaryScenarios,
} from '../src/features/life/tools/boundaries'

test('every shipped life tool has twenty distinct configurable fields and an analysis implementation', () => {
  expect(new Set(lifeTools.map((t) => t.id)).size).toBe(lifeTools.length)
  for (const tool of lifeTools) {
    expect(tool.fields.length).toBeGreaterThanOrEqual(20)
    expect(new Set(tool.fields.map((f) => f.key)).size).toBe(tool.fields.length)
    expect(tool.library).toBeTruthy()
    expect(typeof tool.analyze).toBe('function')
  }
})
test('boundary messages include the request but keep private preparation out', async () => {
  expect(boundaryScenarios).toHaveLength(20)
  const result = await boundaries.analyze(
    {
      request: 'Please ask before moving my chair.',
      private: 'PRIVATE PREPARATION',
      need: 'space & choice',
      scenario: 'Mobility assistance',
      tone: 'Direct',
    },
    [],
  )
  expect(result.download?.text).toContain('Please ask before moving my chair.')
  expect(result.download?.text).toContain('space & choice')
  expect(result.download?.text).not.toContain('PRIVATE PREPARATION')
})

import { connections } from '../src/features/life/tools/connections'
test('connection cadence handles month boundaries without inventing urgency', async () => {
  const r = await connections.analyze(
    {
      name: 'A friend',
      cadence: '14',
      last: '2026-09-26',
      today: '2026-10-01',
      limit: '5',
    },
    [],
  )
  expect(r.lines[0]).toContain('2026-10-10')
  expect(r.title).toContain('9 days')
})

import { seatedExercises } from '../src/features/exercise/seated'
test('seated library keeps both legs supported through all movement poses', () => {
  expect(seatedExercises).toHaveLength(8)
  for (const e of seatedExercises) {
    expect(e.wheelchair).toBe(true)
    expect(e.equipment).toBe('none')
    expect(e.a.hipL).toBe(-90)
    expect(e.b.hipL).toBe(-90)
    expect(e.a.knR).toBe(90)
    expect(e.b.knR).toBe(90)
  }
})

import { practiceSchedule } from '../src/features/life/tools/practice'
test('practice scheduler produces a future review and rejects out-of-order history', async () => {
  const card = await practiceSchedule('2026-09-20 | Good\n2026-09-26 | Easy')
  expect(card.reps).toBe(2)
  expect(card.due.getTime()).toBeGreaterThan(
    new Date('2026-09-26T12:00:00Z').getTime(),
  )
  await expect(
    practiceSchedule('2026-09-26 | Good\n2026-09-20 | Easy'),
  ).rejects.toThrow('increasing order')
})
