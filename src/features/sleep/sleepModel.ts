/**
 * Sleep log maths, kept pure for testing. Times are "HH:MM" strings; a night
 * is keyed by the date you woke up.
 */
export type SleepEntry = {
  id: string
  /** Wake-up date (YYYY-MM-DD). */
  date: string
  bedtime: string
  wake: string
  quality: 1 | 2 | 3 | 4 | 5
  factors: string[]
}
export type SleepSettings = { targetHours: number; bedtime: string; /** Minutes before bedtime to nudge; 0 or missing = off. */ remindBefore?: number }
export const SLEEP_KEY = 'bloom-sleep-v1'
export const SLEEP_SETTINGS_KEY = 'bloom-sleep-settings-v1'
export const defaultSleepSettings: SleepSettings = { targetHours: 8, bedtime: '22:30' }
export const sleepFactors = [
  { id: 'caffeine', label: 'Late caffeine', emoji: '☕' },
  { id: 'screens', label: 'Screens in bed', emoji: '📱' },
  { id: 'exercise', label: 'Exercised', emoji: '🏃' },
  { id: 'stress', label: 'Stressed', emoji: '😣' },
  { id: 'alcohol', label: 'Alcohol', emoji: '🍷' },
  { id: 'late-meal', label: 'Late meal', emoji: '🍝' },
  { id: 'nap', label: 'Napped', emoji: '😴' },
  { id: 'reading', label: 'Read before bed', emoji: '📖' },
] as const

export const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Hours slept, handling bedtimes after midnight. */
export function duration(bedtime: string, wake: string) {
  let minutes = toMinutes(wake) - toMinutes(bedtime)
  if (minutes <= 0) minutes += 24 * 60
  return Math.round((minutes / 60) * 10) / 10
}

/** Bedtime as minutes relative to midnight, so 23:30 → -30 and 00:30 → 30. */
const bedOffset = (time: string) => {
  const m = toMinutes(time)
  return m > 12 * 60 ? m - 24 * 60 : m
}

export function sleepStats(entries: SleepEntry[], settings: SleepSettings) {
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
  if (!recent.length)
    return { average: 0, quality: 0, consistency: 0, debt: 0, count: 0 }
  const hours = recent.map((e) => duration(e.bedtime, e.wake))
  const average = hours.reduce((a, b) => a + b, 0) / hours.length
  const quality = recent.reduce((a, e) => a + e.quality, 0) / recent.length
  const offsets = recent.map((e) => bedOffset(e.bedtime))
  const mean = offsets.reduce((a, b) => a + b, 0) / offsets.length
  const spread = Math.sqrt(
    offsets.reduce((a, b) => a + (b - mean) ** 2, 0) / offsets.length,
  )
  // 100 when bedtimes vary by 0 minutes, 0 when they vary by 2 hours or more.
  const consistency = Math.max(0, Math.round(100 - (spread / 120) * 100))
  const debt = Math.max(
    0,
    Math.round(hours.reduce((a, h) => a + (settings.targetHours - h), 0) * 10) / 10,
  )
  return {
    average: Math.round(average * 10) / 10,
    quality: Math.round(quality * 10) / 10,
    consistency,
    debt,
    count: recent.length,
  }
}

/** How each factor shifts quality versus nights without it (needs data). */
export function factorImpact(entries: SleepEntry[]) {
  return sleepFactors
    .map((factor) => {
      const withIt = entries.filter((e) => e.factors.includes(factor.id))
      const without = entries.filter((e) => !e.factors.includes(factor.id))
      if (withIt.length < 2 || without.length < 2) return null
      const avg = (list: SleepEntry[]) =>
        list.reduce((a, e) => a + e.quality, 0) / list.length
      return { factor, delta: Math.round((avg(withIt) - avg(without)) * 10) / 10 }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
}

/** Minutes until the target bedtime from `now` (wraps past midnight). */
export function minutesUntilBedtime(bedtime: string, now = new Date()) {
  const current = now.getHours() * 60 + now.getMinutes()
  let diff = toMinutes(bedtime) - current
  if (diff < -12 * 60) diff += 24 * 60
  return diff
}

export const windDownSteps = [
  { id: 'dim', label: 'Dim the lights', emoji: '💡', minutes: 1 },
  { id: 'screens', label: 'Put screens away', emoji: '📵', minutes: 1 },
  { id: 'tidy', label: 'Tidy one small thing', emoji: '🧺', minutes: 5 },
  { id: 'tomorrow', label: 'Note tomorrow’s first task', emoji: '📝', minutes: 2 },
  { id: 'breathe', label: '4-7-8 breathing', emoji: '🌙', minutes: 3 },
  { id: 'read', label: 'Read something calm', emoji: '📖', minutes: 15 },
] as const
