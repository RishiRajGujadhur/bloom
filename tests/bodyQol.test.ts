import { exactNumber, progressPhotoError } from '../src/features/body/bodyQolModel'
import { display, fromDisplay } from '../src/features/body/bodyModel'
import { supportedBodyExercise } from '../src/features/body/bodyPractice'
import { normalizeProgram, presets } from '../src/features/interval/intervalModel'
import { flowStepStart, presetFlows, searchYogaPoses, stepAt } from '../src/features/yoga/yogaModel'
import { readiness, type Scan } from '../src/features/readiness/readinessModel'
import { readUpper, upperPose, RepCounter } from '../src/features/workout/formModel'

test('exact inputs reject blanks, nonfinite values and out-of-range targets', () => {
  expect(exactNumber('', 1, 30)).toBeNull(); expect(exactNumber('Infinity', 1, 30)).toBeNull(); expect(exactNumber('31', 1, 30)).toBeNull()
  expect(exactNumber('2.25', 1, 30)).toBe(2.25); expect(exactNumber('2.8', 1, 30, true)).toBe(3)
})
test.each(['kg', 'cm', '%'] as const)('display-unit inputs round trip %s without changing stored measurements', unit => {
  for (const units of ['metric', 'imperial'] as const) expect(fromDisplay(display(73.25, unit, units).value, unit, units)).toBeCloseTo(73.25, 8)
})
test('unsupported movements never borrow a form grade from a different exercise', () => {
  expect(supportedBodyExercise('yoga', 'cobra')).toBeNull(); expect(supportedBodyExercise('eyes', '')).toBeNull()
  expect(supportedBodyExercise('workouts', 'seatedtwist')).toBe('seatedTwist'); expect(supportedBodyExercise('taichi', '')).toBe('taiChi')
  const counter = new RepCounter('observe'); for (let i = 0; i < 100; i++) counter.push(readUpper('observe', upperPose('boxing', i / 100)), i * 100)
  expect(counter.reps).toHaveLength(0)
})
test('photo validation rejects unreadable types, empty files and oversized files', () => {
  expect(progressPhotoError({ type: 'image/svg+xml', size: 100 })).toBeTruthy()
  expect(progressPhotoError({ type: 'image/png', size: 0 })).toBeTruthy()
  expect(progressPhotoError({ type: 'image/jpeg', size: 11 * 1024 * 1024 })).toBeTruthy()
  expect(progressPhotoError({ type: 'image/webp', size: 1000 })).toBe('')
})
test('custom intervals clamp malformed timing values to playable bounds', () => {
  const p = normalizeProgram({ work: Infinity, rest: -40, rounds: 1000, warmup: -1, cooldown: 9999, name: '  Custom  ' }, presets[0])
  expect(p.work).toBeGreaterThanOrEqual(5); expect(p.rest).toBe(0); expect(p.rounds).toBe(30); expect(p.warmup).toBe(0); expect(p.cooldown).toBe(600); expect(p.name).toBe('Custom')
})
test('pose navigation starts at the requested step and search includes Sanskrit', () => {
  const f = presetFlows[0]; expect(flowStepStart(f, 8, 0)).toBe(0)
  expect(stepAt(f, 8, flowStepStart(f, 8, 1))?.index).toBe(1)
  expect(searchYogaPoses('tadasana').map(p => p.id)).toContain('mountain')
})
test('simulated scans cannot establish or distort a personal readiness baseline', () => {
  const scans = Array.from({ length: 4 }, (_, i) => ({ source: 'simulated', lnRmssd: 4 + i * .1, hr: 60 })) as Scan[]
  expect(readiness({ lnRmssd: 4, hr: 60 }, scans).score).toBeNull()
  const real = scans.map(s => ({ ...s, source: 'bluetooth' as const }))
  expect(readiness({ lnRmssd: 4, hr: 60 }, [...real, ...scans])).toEqual(readiness({ lnRmssd: 4, hr: 60 }, real))
})
