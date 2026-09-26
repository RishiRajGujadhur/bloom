import { exercises, filterExercises, repSeconds } from '../src/features/exercise/exercises'
import { applyPreset, featureCategory, matchPreset, presets } from '../src/settings/featureCatalog'
import { defaultSettings, featureKeys } from '../src/SettingsPage'
import { subFeatures } from '../src/features/subFeatures'

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
  for (const k of ['exerciseGuides'] as const) expect(subFeatures[k].length).toBeGreaterThanOrEqual(10)
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
