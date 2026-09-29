import { readPitch } from '../src/features/tuner/tunerModel'

test('frequency to note and cents', () => {
  expect(readPitch(440)).toMatchObject({ note: 'A4', cents: 0 })
  expect(readPitch(82.41).note).toBe('E2')
  expect(readPitch(446).cents).toBeGreaterThan(20)
  expect(readPitch(436).cents).toBeLessThan(-10)
})
