export type TapResult = { offsetMs: number; accuracy: number; hint: 'On beat' | 'A little early' | 'A little late' | 'Early' | 'Late' }

/** Score a tap against the nearest metronome beat. Negative offset is early. */
export function scoreTap(atMs: number, startedAtMs: number, bpm: number): TapResult {
  const period = 60000 / Math.max(40, Math.min(240, bpm))
  const beat = Math.round((atMs - startedAtMs) / period)
  const offsetMs = Math.round(atMs - (startedAtMs + beat * period))
  const accuracy = Math.max(0, Math.round(100 * (1 - Math.abs(offsetMs) / (period / 2))))
  const hint = Math.abs(offsetMs) <= 80 ? 'On beat' : offsetMs < 0 ? (offsetMs >= -170 ? 'A little early' : 'Early') : (offsetMs <= 170 ? 'A little late' : 'Late')
  return { offsetMs, accuracy, hint }
}
