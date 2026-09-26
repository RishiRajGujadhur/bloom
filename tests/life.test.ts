import { rankDecision } from '../src/features/life/tools/decision'
import { parseLife, LIFE_KEY, updateLife } from '../src/features/life/store'

describe('Life tools decisions and persistence', () => {
  const values = {
    alternatives: 'A\nB',
    criteria: 'Cost | 1\nAccess | 3',
    scores: '10, 2\n4, 8',
  }
  test('weights ratings and excludes a must-have failure without hiding it', () => {
    expect(rankDecision(values).map((r) => r.score)).toEqual([70, 40])
    expect(rankDecision({ ...values, excluded: 'B' })[0].name).toBe('A')
    expect(rankDecision({ ...values, excluded: 'B' })[1].excluded).toBe(true)
  })
  test('sensitivity changes ranking without changing the source inputs', () => {
    expect(
      rankDecision({ ...values, sensitive: 'Access', sensitivity: '0' })[0]
        .name,
    ).toBe('A')
    expect(values.criteria).toBe('Cost | 1\nAccess | 3')
  })
  test.each(['10,\n4, 8', '11, 2\n4, 8', '10, 2', 'NaN, 2\n4, 8'])(
    'rejects incomplete or invalid ratings: %s',
    (scores) => {
      expect(() => rankDecision({ ...values, scores })).toThrow()
    },
  )
  test('rejects zero weights, duplicate alternatives, and invalid sensitivity', () => {
    expect(() =>
      rankDecision({ ...values, criteria: 'Cost | 0\nAccess | 0' }),
    ).toThrow()
    expect(() => rankDecision({ ...values, alternatives: 'A\nA' })).toThrow()
    expect(() => rankDecision({ ...values, sensitivity: 'Infinity' })).toThrow()
  })
  test('corrupted storage is preserved instead of overwritten', () => {
    localStorage.setItem(LIFE_KEY, '{broken')
    expect(updateLife((s) => s)).toBe(false)
    expect(localStorage.getItem(LIFE_KEY)).toBe('{broken')
    localStorage.removeItem(LIFE_KEY)
  })
  test('validates backups and preserves record data', () => {
    const record = {
      id: 'a',
      tool: 'decision',
      title: 'Choose',
      values: { note: '<script>plain text</script>' },
      created: 1,
      updated: 2,
      done: false,
      next: 'Try a small step',
    }
    expect(
      parseLife(
        JSON.stringify({ version: 1, records: [record], preferences: {} }),
      ).records[0],
    ).toEqual(record)
    expect(() => parseLife('{"version":2}')).toThrow()
  })
})
