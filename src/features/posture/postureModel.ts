/**
 * Posture rules, pure and testable. The camera loop feeds a sample every
 * second; `postureTick` turns the stream into game events:
 *   - slouching for `warnAfter` minutes → a warning
 *   - still slouching `graceAfter` minutes later → "poison" (−HP), repeating
 *   - every `staminaEvery` minutes of good posture → "stamina" (+HP, buff)
 */
export type Landmark = { x: number; y: number; visibility?: number }
export type PostureSample = { at: number; score: number; slouching: boolean } | { at: number; absent: true }
export type Baseline = { ratio: number; tilt: number }

export type PostureClock = {
  slouchSince: number | null
  warnedAt: number | null
  lastPoisonAt: number | null
  goodSince: number | null
}
export const idleClock: PostureClock = { slouchSince: null, warnedAt: null, lastPoisonAt: null, goodSince: null }

export type PostureRules = { warnAfter: number; graceAfter: number; staminaEvery: number; poison: number }
export const defaultRules: PostureRules = { warnAfter: 5, graceAfter: 2, staminaEvery: 20, poison: 3 }

const EAR_L = 7
const EAR_R = 8
const SH_L = 11
const SH_R = 12

/** Head height above the shoulders (scaled by shoulder width) and shoulder tilt. */
export function measure(landmarks: Landmark[]) {
  const [el, er, sl, sr] = [landmarks[EAR_L], landmarks[EAR_R], landmarks[SH_L], landmarks[SH_R]]
  if (!el || !er || !sl || !sr) return null
  const seen = [el, er, sl, sr].every((p) => (p.visibility ?? 1) > 0.5)
  if (!seen) return null
  const width = Math.hypot(sl.x - sr.x, sl.y - sr.y)
  if (width < 0.05) return null
  const earY = (el.y + er.y) / 2
  const shoulderY = (sl.y + sr.y) / 2
  return { ratio: (shoulderY - earY) / width, tilt: Math.abs(sl.y - sr.y) / width }
}

/** 0–100 posture score against the calibrated baseline. */
export function score(m: { ratio: number; tilt: number }, base: Baseline, sensitivity = 1) {
  const drop = Math.max(0, (base.ratio - m.ratio) / base.ratio) // head sinking toward shoulders
  const lean = Math.max(0, m.tilt - base.tilt)
  const penalty = (drop * 2.2 + lean * 2.5) * sensitivity
  return Math.round(Math.max(0, Math.min(1, 1 - penalty)) * 100)
}
export const isSlouching = (value: number) => value < 65

export type PostureEvent = { type: 'warn' | 'poison' | 'stamina' | 'recovered'; at: number }

export function postureTick(clock: PostureClock, sample: PostureSample, rules: PostureRules = defaultRules) {
  const min = 60000
  const events: PostureEvent[] = []
  if ('absent' in sample) return { clock: { ...idleClock }, events }
  const next = { ...clock }
  if (sample.slouching) {
    next.goodSince = null
    next.slouchSince ??= sample.at
    const slouched = sample.at - next.slouchSince
    if (!next.warnedAt && slouched >= rules.warnAfter * min) {
      next.warnedAt = sample.at
      events.push({ type: 'warn', at: sample.at })
    }
    if (next.warnedAt) {
      const since = sample.at - (next.lastPoisonAt ?? next.warnedAt)
      if (since >= rules.graceAfter * min) {
        next.lastPoisonAt = sample.at
        events.push({ type: 'poison', at: sample.at })
      }
    }
  } else {
    if (next.warnedAt) events.push({ type: 'recovered', at: sample.at })
    next.slouchSince = null
    next.warnedAt = null
    next.lastPoisonAt = null
    next.goodSince ??= sample.at
    if (sample.at - next.goodSince >= rules.staminaEvery * min) {
      next.goodSince = sample.at
      events.push({ type: 'stamina', at: sample.at })
    }
  }
  return { clock: next, events }
}
