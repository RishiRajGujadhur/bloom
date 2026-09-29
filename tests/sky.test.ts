import { direction, phaseName, skyAt } from '../src/features/sky/skyModel'

test('sky positions are computed for stars and bodies', () => {
  const s = skyAt(new Date('2026-06-21T22:00:00Z'), 51.5, -0.1)
  // Polaris is about 0.7° from the pole, so its altitude is within a degree of your latitude.
  expect(Math.abs(s.pts.find((p) => p.name === 'Polaris')!.alt - 51.5)).toBeLessThan(1)
  expect(s.pts.some((p) => p.name === 'Jupiter')).toBe(true)
  expect(s.moonLit).toBeGreaterThanOrEqual(0)
})

test('friendly directions and moon phases', () => {
  expect(direction(0)).toBe('north')
  expect(direction(95)).toBe('east')
  expect(phaseName(180)).toBe('Full moon')
  expect(phaseName(5)).toBe('New moon')
})
