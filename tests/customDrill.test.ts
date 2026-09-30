import { customDrill } from '../src/features/typing/typingModel'

test('keeps only typeable, unshifted characters', () => {
  expect(customDrill('Hello,   World!\nIt’s “fine” — 100%')).toBe("hello, world it's fine 100")
})
test('trims long text at a word boundary', () => {
  const out = customDrill('word '.repeat(200), 23)
  expect(out).toBe('word word word word')
})
