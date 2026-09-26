/**
 * Turns microphone breath noise into a smooth 0–1 "lung" signal.
 *
 * Breathing through the nose or mouth is broadband noise: loud enough (RMS)
 * and spectrally flat (like white noise), unlike speech or music. Each burst
 * of breath noise is one half-breath, so bursts alternate between inhale
 * (the signal rises) and exhale (it falls), at a speed set by how strong the
 * breath is. Pure logic here so it can be tested without a microphone.
 */
export type BreathFrame = { rms: number; flatness: number; dt: number }
export type BreathState = {
  value: number
  inhaling: boolean
  inBurst: boolean
  quiet: number
  floor: number
  peak: number
  breaths: number
}

export const initialBreath = (): BreathState => ({ value: 0.2, inhaling: true, inBurst: false, quiet: 0, floor: 0.004, peak: 0.05, breaths: 0 })

export const FLATNESS_MIN = 0.28

export function stepBreath(s: BreathState, f: BreathFrame): BreathState {
  const n = { ...s }
  // Track the room's noise floor and the loudest recent breath.
  n.floor = f.rms < n.floor ? f.rms : n.floor + (f.rms - n.floor) * 0.002
  n.peak = Math.max(n.floor * 3, f.rms > n.peak ? f.rms : n.peak * (1 - 0.1 * f.dt))
  const level = Math.max(0, Math.min(1, (f.rms - n.floor * 1.6) / Math.max(1e-6, n.peak - n.floor * 1.6)))
  const breathy = f.flatness >= FLATNESS_MIN && level > 0.12
  if (breathy) {
    if (!n.inBurst && n.quiet > 0.35) {
      // A new burst after a pause: switch direction.
      n.inhaling = !n.inhaling
      if (n.inhaling) n.breaths += 1
    }
    n.inBurst = true
    n.quiet = 0
    const speed = 0.25 + level * 0.6
    n.value = Math.max(0, Math.min(1, n.value + (n.inhaling ? 1 : -1) * speed * f.dt))
  } else {
    n.quiet += f.dt
    if (n.quiet > 0.2) n.inBurst = false
    // Holding: drift very slowly toward the middle.
    n.value += (0.5 - n.value) * 0.02 * f.dt
  }
  return n
}

/** Paced fallback: a smooth in/out cycle (seconds). */
export function pacer(t: number, inhale = 4, exhale = 6) {
  const cycle = inhale + exhale
  const x = t % cycle
  return x < inhale ? 0.5 - 0.5 * Math.cos((Math.PI * x) / inhale) : 0.5 + 0.5 * Math.cos((Math.PI * (x - inhale)) / exhale)
}
