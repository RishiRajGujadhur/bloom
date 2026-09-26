import { subFeatures, subOn } from '../src/features/subFeatures'
import { defaultSettings, SETTINGS_STORAGE_KEY } from '../src/SettingsPage'
import { counterParts, flapString } from '../src/features/timeSince/timeSinceModel'

beforeEach(() => localStorage.clear())

test('every feature offers at least two sub-features with unique ids', () => {
  for (const key of Object.keys(defaultSettings.features)) {
    const options = subFeatures[key as keyof typeof subFeatures]
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(new Set(options.map((o) => o.id)).size).toBe(options.length)
  }
})

test('sub-features default on, follow their switch and their parent feature', () => {
  expect(subOn('breathe', 'soundCue')).toBe(true)
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ features: { ...defaultSettings.features }, sub: { 'breathe.soundCue': false } }),
  )
  expect(subOn('breathe', 'soundCue')).toBe(false)
  expect(subOn('breathe', 'vibrate')).toBe(true)
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ features: { ...defaultSettings.features, breathe: false }, sub: {} }),
  )
  expect(subOn('breathe', 'vibrate')).toBe(false)
  expect(subOn('breathe', 'vibrate', { ignoreParent: true })).toBe(true)
})

test('time-since counters count up, count down and stop at arrival', () => {
  const start = new Date(2026, 0, 1, 0, 0, 0).getTime()
  const now = start + ((2 * 24 + 3) * 3600 + 4 * 60 + 5) * 1000
  const since = counterParts({ at: start, kind: 'since' }, now)
  expect(since).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5, done: false })
  expect(flapString(since)).toBe('02:03:04:05')
  expect(counterParts({ at: now, kind: 'until' }, start)).toMatchObject({ days: 2, done: false })
  expect(counterParts({ at: start, kind: 'until' }, now)).toMatchObject({ days: 0, done: true })
})
