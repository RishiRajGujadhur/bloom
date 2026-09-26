export type Measure = 'weight' | 'waist' | 'chest' | 'hips' | 'arm' | 'thigh' | 'bodyFat'
export const measures: { id: Measure; label: string; unit: 'kg' | 'cm' | '%'; min: number; max: number; step: number }[] = [
  { id: 'weight', label: 'Weight', unit: 'kg', min: 35, max: 200, step: 0.1 },
  { id: 'waist', label: 'Waist', unit: 'cm', min: 50, max: 160, step: 0.5 },
  { id: 'chest', label: 'Chest', unit: 'cm', min: 60, max: 160, step: 0.5 },
  { id: 'hips', label: 'Hips', unit: 'cm', min: 60, max: 170, step: 0.5 },
  { id: 'arm', label: 'Arm', unit: 'cm', min: 18, max: 60, step: 0.5 },
  { id: 'thigh', label: 'Thigh', unit: 'cm', min: 35, max: 90, step: 0.5 },
  { id: 'bodyFat', label: 'Body fat', unit: '%', min: 3, max: 60, step: 0.5 },
]
export type Entry = { date: string } & Partial<Record<Measure, number>>
export type BodyStore = { entries: Entry[]; heightCm: number; goalWeight: number; units: 'metric' | 'imperial'; blur: boolean }
export const BODY_KEY = 'bloom-body-v1'

export const KG_LB = 2.20462
export const CM_IN = 0.393701
export function display(v: number, unit: 'kg' | 'cm' | '%', units: 'metric' | 'imperial') {
  if (units === 'metric' || unit === '%') return { value: v, unit }
  return unit === 'kg' ? { value: v * KG_LB, unit: 'lb' } : { value: v * CM_IN, unit: 'in' }
}

/** Exponentially smoothed "trend weight": daily noise fades, direction stays. */
export function trend(values: number[], alpha = 0.1) {
  const out: number[] = []
  values.forEach((v, i) => out.push(i === 0 ? v : out[i - 1] + alpha * (v - out[i - 1])))
  return out
}

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / (cm / 100) ** 2 : 0)
export const bmiBand = (b: number) => (b < 18.5 ? 'Below range' : b < 25 ? 'Healthy range' : b < 30 ? 'Above range' : 'Well above range')
export const whtr = (waist: number, cm: number) => (cm > 0 ? waist / cm : 0)
export const whtrBand = (r: number) => (r < 0.4 ? 'Low' : r < 0.5 ? 'Healthy' : r < 0.6 ? 'Increased' : 'High')

/** Weekly rate from the last 28 days of trend, and the date you'd reach goal. */
export function projection(entries: Entry[], goal: number) {
  const w = entries.filter((e) => e.weight != null).sort((a, b) => a.date.localeCompare(b.date))
  if (w.length < 3) return null
  const t = trend(w.map((e) => e.weight!))
  const last = new Date(`${w[w.length - 1].date}T12:00:00`).getTime()
  const idx = w.findIndex((e) => new Date(`${e.date}T12:00:00`).getTime() >= last - 28 * 86400000)
  const firstT = t[Math.max(0, idx)]
  const lastT = t[t.length - 1]
  const days = Math.max(1, (last - new Date(`${w[Math.max(0, idx)].date}T12:00:00`).getTime()) / 86400000)
  const perWeek = ((lastT - firstT) / days) * 7
  const remaining = goal - lastT
  if (Math.abs(perWeek) < 0.01 || Math.sign(perWeek) !== Math.sign(remaining)) return { perWeek, date: null, current: lastT }
  const weeks = remaining / perWeek
  return { perWeek, current: lastT, date: new Date(last + weeks * 7 * 86400000) }
}

export function latest(entries: Entry[], m: Measure) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date)).find((e) => e[m] != null)?.[m]
}
