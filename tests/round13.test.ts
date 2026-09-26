import { exercises, filterExercises, repSeconds } from '../src/features/exercise/exercises'
import { applyPreset, featureCategory, matchPreset, presets } from '../src/settings/featureCatalog'
import { defaultSettings, featureKeys } from '../src/SettingsPage'
import { subFeatures } from '../src/features/subFeatures'
import { forAreas, routines as stRoutines, steps as stSteps, totalSeconds as stTotal } from '../src/features/stretch/stretchModel'
import { isDue } from '../src/components/studio/Nudges'
import { flowSeconds, newStep, poses, presetFlows, stepAt } from '../src/features/yoga/yogaModel'
import { c25kProgram, calories, position, presets as ivPresets, segments, total } from '../src/features/interval/intervalModel'
import { e1rm, plates, progress, prsFor, volume, weeklyMuscleSets, type Workout } from '../src/features/workout/workoutModel'

test('settings: every feature has a category; presets round-trip', () => {
  for (const k of featureKeys) expect(featureCategory[k]).toBeDefined()
  const calm = presets.find((p) => p.id === 'calm')!
  const flags = { ...defaultSettings.features, ...applyPreset(calm, featureKeys) }
  expect(flags.breathe).toBe(true)
  expect(flags.dailySpin).toBe(false)
  expect(matchPreset(flags, featureKeys)?.id).toBe('calm')
  expect(matchPreset({ ...flags, dailySpin: true }, featureKeys)).toBeUndefined()
  expect(matchPreset(defaultSettings.features, featureKeys, defaultSettings.features)?.id).toBe('recommended')
})

test('round 13 features each have at least 10 sub-features', () => {
  for (const k of ['exerciseGuides', 'workoutLog', 'intervalCoach', 'yogaFlow', 'mobility'] as const) expect(subFeatures[k].length).toBeGreaterThanOrEqual(10)
})

test('exercise library: poses, tempo and filters', () => {
  expect(exercises.length).toBeGreaterThanOrEqual(12)
  for (const e of exercises) {
    expect(e.cues.length).toBeGreaterThan(1)
    expect(e.primary.length).toBeGreaterThan(0)
  }
  const squat = exercises.find((e) => e.id === 'squat')!
  expect(repSeconds(squat)).toBe(4)
  expect(repSeconds(squat, 2)).toBe(2)
  expect(filterExercises(exercises, { equipment: 'dumbbells' }).every((e) => e.equipment === 'dumbbells')).toBe(true)
  expect(filterExercises(exercises, { muscle: 'chest' }).map((e) => e.id)).toContain('pushup')
  expect(filterExercises(exercises, { favourites: ['plank'] }).map((e) => e.id)).toEqual(['plank'])
})

test('workout maths: e1RM, PRs, volume, plates and weekly muscle sets', () => {
  expect(e1rm(100, 5)).toBeCloseTo(116.7, 1)
  expect(e1rm(100, 1)).toBe(100)
  const history = [{ liftId: 'bench', weight: 60, reps: 8, at: 1 }]
  expect(prsFor({ liftId: 'bench', weight: 65, reps: 8, at: 2 }, history)).toEqual(['e1rm', 'weight'])
  expect(prsFor({ liftId: 'bench', weight: 60, reps: 10, at: 2 }, history)).toEqual(['e1rm', 'reps'])
  expect(prsFor({ liftId: 'squat', weight: 60, reps: 10, at: 2 }, history)).toEqual([])
  expect(volume([{ liftId: 'pullup', weight: 10, reps: 5, at: 1 }], 70)).toBe(400)
  expect(plates(100)).toEqual({ perSide: [25, 15], leftover: 0 })
  expect(plates(21).leftover).toBe(1)
  const now = Date.now()
  const w: Workout[] = [
    { id: 'a', name: 'Push', templateId: 'push', startedAt: now - 86400000, sets: [{ liftId: 'bench', weight: 60, reps: 8, at: now - 86400000 }] },
    { id: 'b', name: 'Push', templateId: 'push', startedAt: now, sets: [{ liftId: 'bench', weight: 65, reps: 8, at: now }] },
  ]
  expect(progress(w, 'bench').map((p) => p.best)).toEqual([76, 82.3])
  expect(weeklyMuscleSets(w, now).get('chest')).toBe(2)
  expect(weeklyMuscleSets(w, now).get('triceps')).toBe(1)
})

test('intervals: segments, position, C25K progression and calories', () => {
  const tabata = ivPresets.find((p) => p.id === 'tabata')!
  const s = segments(tabata)
  expect(s.filter((x) => x.kind === 'work')).toHaveLength(8)
  expect(s.filter((x) => x.kind === 'rest')).toHaveLength(7)
  expect(total(s)).toBe(120 + 8 * 20 + 7 * 10 + 120)
  expect(total(segments(tabata, false))).toBe(230)
  expect(position(s, 125)).toMatchObject({ segment: { kind: 'work', round: 1 }, into: 5, left: 15 })
  expect(position(s, total(s))).toBeNull()
  expect(c25kProgram(0).name).toBe('C25K W1 D1')
  expect(c25kProgram(4).name).toBe('C25K W2 D2')
  expect(c25kProgram(99).work).toBe(1800)
  expect(calories(s, total(s), 70)).toBeGreaterThan(40)
})

test('yoga: poses, flow length and the live step', () => {
  expect(poses.length).toBeGreaterThanOrEqual(12)
  const sun = presetFlows.find((f) => f.id === 'sunA')!
  const breaths = sun.steps.reduce((t, s) => t + s.breaths, 0)
  expect(flowSeconds(sun, 5)).toBe(breaths * 5)
  expect(stepAt(sun, 5, 0)?.index).toBe(0)
  expect(stepAt(sun, 5, 10)?.index).toBe(1)
  expect(stepAt(sun, 5, flowSeconds(sun, 5))).toBeNull()
  expect(newStep('tree').key).not.toBe(newStep('tree').key)
  for (const f of presetFlows) for (const s of f.steps) expect(poses.some((p) => p.id === s.poseId)).toBe(true)
})

test('stretch: sides expand, areas map to stretches; nudges respect quiet hours', () => {
  const desk = stRoutines.find((r) => r.id === 'desk')!
  const both = stSteps(desk.ids)
  expect(both.length).toBeGreaterThan(desk.ids.length)
  expect(stSteps(desk.ids, false)).toHaveLength(desk.ids.length)
  expect(both.filter((s) => s.stretch.id === 'neckTilt').map((s) => s.side)).toEqual(['left', 'right'])
  expect(stTotal(stSteps(['chinTuck'], false), 2)).toBe(60)
  expect(forAreas(['wrists'])).toEqual(['wristFlex', 'prayer'])
  const base = { id: 'x', title: '', body: '', page: 'stretch' as const, every: 30, enabled: true, lastAt: 0 }
  const noon = new Date('2026-09-26T12:00:00').getTime()
  const night = new Date('2026-09-26T23:00:00').getTime()
  expect(isDue(base, noon)).toBe(true)
  expect(isDue({ ...base, enabled: false }, noon)).toBe(false)
  expect(isDue({ ...base, lastAt: noon - 10 * 60000 }, noon)).toBe(false)
  expect(isDue({ ...base, quietStart: 21, quietEnd: 7 }, night)).toBe(false)
  expect(isDue({ ...base, quietStart: 21, quietEnd: 7 }, noon)).toBe(true)
})
