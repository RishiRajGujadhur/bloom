import { earQuestion, keyFor, keys, norm, songs } from '../src/features/piano/pianoModel'

test('two octaves with keyboard mapping', () => {
  expect(keys[0]).toBe('C3')
  expect(keys).toHaveLength(24)
  expect(keyFor.C4).toBe('q')
  expect(keyFor.C3).toBe('z')
})
test('every song note is on the keyboard', () => {
  for (const s of songs) for (const n of s.notes) expect(keys).toContain(norm(n))
})
test('ear questions include their answer', () => {
  for (const k of ['interval', 'chord'] as const) {
    const q = earQuestion(k, 'seed')
    expect(q.options).toContain(q.answer)
    expect(q.notes.length).toBeGreaterThanOrEqual(2)
  }
})
