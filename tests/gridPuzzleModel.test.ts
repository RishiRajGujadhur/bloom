import { checkGridLayout, gridRect, GRID_START, GRID_TARGET } from '../src/features/code/gridPuzzleModel'

test('target layout fills the board without overlap', () => {
  expect(checkGridLayout(GRID_TARGET).every((item) => item.pass)).toBe(true)
  expect(gridRect(GRID_TARGET.gallery)).toEqual({ x: 58, y: 144, width: 208, height: 208 })
})

test('starter gives placement feedback and overlapping tiles fail', () => {
  expect(checkGridLayout(GRID_START).every((item) => item.pass)).toBe(false)
  const overlapping = { ...GRID_TARGET, footer: { ...GRID_TARGET.footer, column: 1 } }
  expect(checkGridLayout(overlapping).find((item) => item.label === 'Tiles do not overlap')?.pass).toBe(false)
})
