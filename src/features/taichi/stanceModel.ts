export type Pt = { x: number; y: number; visibility?: number }

/** MediaPipe pose indices. */
const L = { shoulder: 11, hip: 23, knee: 25, ankle: 27 }
const R = { shoulder: 12, hip: 24, knee: 26, ankle: 28 }

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
/** Angle at `b` in degrees (180 = straight leg). */
export function angle(a: Pt, b: Pt, c: Pt) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const cos = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y) || 1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}
const norm = (v: number, lo: number, hi: number) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)))

export type Stance = {
  /** Feet apart, as multiples of shoulder width. */
  width: number
  /** Average knee angle (180 = straight). */
  knee: number
  /** 0 (standing tall) … 1 (deep, wide, rooted). */
  grounding: number
  name: string
}

export function measureStance(p: Pt[]): Stance | null {
  const need = [L.shoulder, R.shoulder, L.hip, R.hip, L.knee, R.knee, L.ankle, R.ankle]
  if (need.some((i) => !p[i] || (p[i].visibility ?? 1) < 0.4)) return null
  const shoulders = dist(p[L.shoulder], p[R.shoulder])
  if (shoulders < 0.02) return null
  const width = Math.abs(p[L.ankle].x - p[R.ankle].x) / shoulders
  const knee = (angle(p[L.hip], p[L.knee], p[L.ankle]) + angle(p[R.hip], p[R.knee], p[R.ankle])) / 2
  const grounding = Math.round((0.45 * norm(width, 1.1, 2.4) + 0.55 * norm(180 - knee, 8, 60)) * 100) / 100
  const name =
    width >= 1.8 && knee < 150
      ? 'Horse stance'
      : width < 1.4 && knee < 155
        ? 'Empty stance'
        : knee < 165
          ? 'Sinking'
          : width >= 1.6
            ? 'Wide stance'
            : 'Standing'
  return { width: Math.round(width * 100) / 100, knee: Math.round(knee), grounding, name }
}

/** Five Elements: each has a scale (Hz roots), timbre and colour. */
export const elements = {
  wood: { name: 'Wood', han: '木', season: 'Spring', color: '#6bbf7a', root: 293.66, scale: [0, 2, 4, 7, 9], timbre: 'chime' },
  fire: { name: 'Fire', han: '火', season: 'Summer', color: '#e2703f', root: 392, scale: [0, 2, 4, 7, 9], timbre: 'bright' },
  earth: { name: 'Earth', han: '土', season: 'Late summer', color: '#c99a4b', root: 261.63, scale: [0, 2, 5, 7, 9], timbre: 'bowl' },
  metal: { name: 'Metal', han: '金', season: 'Autumn', color: '#b8c2cc', root: 440, scale: [0, 3, 5, 7, 10], timbre: 'bell' },
  water: { name: 'Water', han: '水', season: 'Winter', color: '#3f6fb5', root: 329.63, scale: [0, 3, 5, 7, 10], timbre: 'deep' },
} as const
export type ElementId = keyof typeof elements

/** Bass drone for a grounding level: louder and an octave lower as you sink. */
export function bassFor(grounding: number, root: number) {
  const g = Math.max(0, Math.min(1, grounding))
  return { frequency: (root / 4) * (1 - 0.5 * g), volumeDb: -48 + g * 34, cutoff: 180 + g * 520 }
}
