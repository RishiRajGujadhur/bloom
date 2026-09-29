import { cellKey, decisionSchema, parseScore, results, strongest } from '../src/features/decide/decideModel'

test('weighted results and the strongest criterion', () => {
  const d = decisionSchema.parse({})
  d.scores[cellKey('a', 'c1')] = 5
  d.scores[cellKey('b', 'c2')] = 5
  const r = results(d)
  expect(r[0].name).toBe('Option A')
  expect(r[0].pct).toBe(Math.round((25 / 70) * 100))
  expect(strongest(d, 'a')).toBe('Joy')
})
test('scores accept small maths and are clamped', () => {
  expect(parseScore('3+1')).toBe(4)
  expect(parseScore('9')).toBe(5)
  expect(parseScore('nope')).toBeNull()
})
