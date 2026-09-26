/**
 * Keystroke flow model. Typing is sampled into short windows; each window
 * becomes one point of a mountain range:
 *   - fast, steady typing  → high, smooth peaks
 *   - pauses               → valleys
 *   - backspacing          → jagged ravines (roughness)
 * Only timings and counts are kept — never which keys were pressed.
 */
export type Keystroke = { t: number; kind: 'char' | 'delete' }
export type FlowFingerprint = {
  /** Elevation 0–1 per window. */
  h: number[]
  /** Roughness 0–1 per window (share of deletions). */
  r: number[]
  /** Words per minute while actively typing. */
  wpm: number
  /** Share of time spent in flow (elevation ≥ 0.6). */
  flow: number
}

export const WINDOW_MS = 1500
const MAX_POINTS = 96

export function classifyKey(key: string, ctrl: boolean): Keystroke['kind'] | null {
  if (ctrl) return null
  if (key === 'Backspace' || key === 'Delete') return 'delete'
  if (key.length === 1 || key === 'Enter') return 'char'
  return null
}

/** Averages a series down to at most `max` points. */
function compress(values: number[], max: number) {
  if (values.length <= max) return values
  const size = values.length / max
  return Array.from({ length: max }, (_, i) => {
    const slice = values.slice(Math.floor(i * size), Math.floor((i + 1) * size))
    return slice.reduce((a, b) => a + b, 0) / Math.max(slice.length, 1)
  })
}

export function fingerprint(strokes: Keystroke[]): FlowFingerprint | null {
  if (strokes.length < 8) return null
  const start = strokes[0].t
  const end = strokes[strokes.length - 1].t
  const windows = Math.max(1, Math.ceil((end - start + 1) / WINDOW_MS))
  const chars = Array(windows).fill(0)
  const deletes = Array(windows).fill(0)
  for (const s of strokes) {
    const i = Math.min(windows - 1, Math.floor((s.t - start) / WINDOW_MS))
    if (s.kind === 'char') chars[i]++
    else deletes[i]++
  }
  // ~9 chars per 1.5 s window ≈ 72 WPM, which reads as full flow.
  const raw = chars.map((c, i) => Math.max(0, Math.min(1, (c - deletes[i] * 1.5) / 9)))
  // Light smoothing so single slow windows don't look like cliffs.
  const smooth = raw.map((v, i) => (raw[i - 1] ?? v) * 0.25 + v * 0.5 + (raw[i + 1] ?? v) * 0.25)
  const rough = chars.map((c, i) => (c + deletes[i] ? deletes[i] / (c + deletes[i]) : 0))
  const activeWindows = chars.filter((c) => c > 0).length
  const totalChars = chars.reduce((a, b) => a + b, 0)
  const minutes = (activeWindows * WINDOW_MS) / 60000
  return {
    h: compress(smooth, MAX_POINTS).map((v) => Math.round(v * 100) / 100),
    r: compress(rough, MAX_POINTS).map((v) => Math.round(v * 100) / 100),
    wpm: minutes > 0 ? Math.round(totalChars / 5 / minutes) : 0,
    flow: Math.round((smooth.filter((v) => v >= 0.6).length / smooth.length) * 100) / 100,
  }
}

/** Mountain ridge points; rough windows get a zig-zag to read as ravines. */
export function ridgePoints(fp: Pick<FlowFingerprint, 'h' | 'r'>, width: number, height: number, jagged = true) {
  const n = Math.max(fp.h.length, 2)
  const step = width / (n - 1)
  const points: [number, number][] = []
  fp.h.forEach((h, i) => {
    const x = i * step
    const y = height - 6 - h * (height - 14)
    points.push([x, y])
    const r = fp.r[i] ?? 0
    if (jagged && r > 0.15 && i < fp.h.length - 1) {
      // A ravine: dip, spike, dip within the window.
      const depth = r * (height * 0.35)
      points.push([x + step * 0.33, Math.min(height - 2, y + depth)])
      points.push([x + step * 0.5, y - depth * 0.3])
      points.push([x + step * 0.66, Math.min(height - 2, y + depth * 0.8)])
    }
  })
  return points
}
