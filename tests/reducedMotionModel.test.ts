import { checkReducedMotion, REDUCED_MOTION_START } from '../src/features/code/reducedMotionModel'

test('reduced version keeps the result while removing long repeated motion', () => {
  expect(checkReducedMotion(REDUCED_MOTION_START).map((item) => item.pass)).toEqual([false, false, false])
  expect(checkReducedMotion({ durationMs: 80, repeats: false, keepsResult: true }).every((item) => item.pass)).toBe(true)
  expect(checkReducedMotion({ durationMs: 300, repeats: false, keepsResult: true })[0].pass).toBe(false)
})
