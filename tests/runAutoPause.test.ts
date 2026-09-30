import { isStationary, metresBetween } from '../src/features/run/runModel'

const at = (lat: number, lng: number, t: number) => ({ lat, lng, t })
test('metresBetween is about 111 m per 0.001° latitude', () => {
  expect(Math.round(metresBetween(at(51.5, 0, 0), at(51.501, 0, 0)))).toBe(111)
})
test('stationary only after the window with no real movement', () => {
  const still = [at(51.5, 0, 0), at(51.50001, 0, 10_000), at(51.5, 0.00001, 25_000)]
  expect(isStationary(still, 26_000)).toBe(true)
  expect(isStationary(still.slice(0, 1), 5_000)).toBe(false)
  const moving = [at(51.5, 0, 0), at(51.5005, 0, 10_000), at(51.501, 0, 25_000)]
  expect(isStationary(moving, 26_000)).toBe(false)
  expect(isStationary([at(51.5, 0, 0), at(51.5005, 0, 1_000)], 40_000)).toBe(true)
})
