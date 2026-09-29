import { BREAKPOINT_START, checkBreakpoints, columnsAt, previewCards } from '../src/features/code/breakpointModel'

test('checks phone, tablet, and desktop layouts with safe card widths', () => {
  expect(checkBreakpoints(BREAKPOINT_START).every((item) => item.pass)).toBe(false)
  const points = { twoColumns: 500, threeColumns: 800 }
  expect(checkBreakpoints(points).every((item) => item.pass)).toBe(true)
  expect([390, 620, 1024].map((width) => columnsAt(width, points))).toEqual([1, 2, 3])
})

test('preview places six cards in the selected number of columns', () => {
  const cards = previewCards(620, { twoColumns: 500, threeColumns: 800 })
  expect(cards[0].y).toBe(cards[1].y)
  expect(cards[2].y).toBeGreaterThan(cards[1].y)
})
