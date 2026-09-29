import { checkFlexTask, flexPositions, FLEX_TASKS } from '../src/features/code/flexboxModel'

test('space-between spreads a row to both ends and centers across the row', () => {
  const settings = FLEX_TASKS[0].target
  const points = flexPositions(settings)
  expect(points[0]).toEqual({ x: 16, y: 89 })
  expect(points[2]).toEqual({ x: 368, y: 89 })
  expect(checkFlexTask(FLEX_TASKS[0], settings).every((item) => item.pass)).toBe(true)
})

test('column swaps main and cross axes', () => {
  const points = flexPositions(FLEX_TASKS[1].target)
  expect(points.map((point) => point.x)).toEqual([192, 192, 192])
  expect(points[0].y).toBeLessThan(points[1].y)
})
