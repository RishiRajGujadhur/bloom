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
