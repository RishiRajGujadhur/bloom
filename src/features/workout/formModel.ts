/**
 * Form Coach model: joint angles from pose landmarks (MediaPipe's 33-point
 * body model), a rep counter with hysteresis so jitter can't double-count,
 * and per-exercise form checks. Pure, so it's unit-tested with synthetic poses.
 */
export type P = { x: number; y: number; z?: number; visibility?: number }
export type Exercise = 'squat' | 'pushup' | 'lunge' | 'plank'

// MediaPipe pose indices.
export const J = { nose: 0, lSh: 11, rSh: 12, lEl: 13, rEl: 14, lWr: 15, rWr: 16, lHip: 23, rHip: 24, lKn: 25, rKn: 26, lAn: 27, rAn: 28 } as const
export const BONES: [number, number][] = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [27, 31], [28, 32]]

/** Angle ABC in degrees (at B). */
export function angle(a: P, b: P, c: P) {
  const v1 = { x: a.x - b.x, y: a.y - b.y }
  const v2 = { x: c.x - b.x, y: c.y - b.y }
  const d = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y)
  if (!d) return 180
  return (Math.acos(Math.max(-1, Math.min(1, (v1.x * v2.x + v1.y * v2.y) / d))) * 180) / Math.PI
}
const mid = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
const vis = (p: P) => p.visibility ?? 1
/** Use whichever side the camera sees better. */
const side = (lm: P[], l: number, r: number) => (vis(lm[l]) >= vis(lm[r]) ? l : r)

export type Reading = { metric: number; label: string; faults: string[]; line?: number }

export const RULES: Record<Exercise, { name: string; liftId: string; down: number; up: number; unit: string; timed?: boolean; tip: string }> = {
  squat: { name: 'Squat', liftId: 'airsquat', down: 100, up: 160, unit: 'knee°', tip: 'Face the camera, whole body in frame.' },
  pushup: { name: 'Push-up', liftId: 'pushup', down: 95, up: 155, unit: 'elbow°', tip: 'Side-on to the camera, laptop on the floor.' },
  lunge: { name: 'Lunge', liftId: 'lunge', down: 105, up: 155, unit: 'knee°', tip: 'Side-on, step forward and back.' },
  plank: { name: 'Plank', liftId: 'plank', down: 0, up: 0, unit: 'body line°', timed: true, tip: 'Side-on, forearms down, hold a straight line.' },
}

export function read(ex: Exercise, lm: P[]): Reading {
  const faults: string[] = []
  if (ex === 'squat') {
    const kL = angle(lm[J.lHip], lm[J.lKn], lm[J.lAn])
    const kR = angle(lm[J.rHip], lm[J.rKn], lm[J.rAn])
    const knee = (kL + kR) / 2
    const hipW = Math.abs(lm[J.lHip].x - lm[J.rHip].x)
    const kneeW = Math.abs(lm[J.lKn].x - lm[J.rKn].x)
    const ankleW = Math.abs(lm[J.lAn].x - lm[J.rAn].x)
    if (knee < 140 && kneeW < Math.min(hipW, ankleW) * 0.75) faults.push('Knees out')
    const sh = mid(lm[J.lSh], lm[J.rSh])
    const hp = mid(lm[J.lHip], lm[J.rHip])
    const lean = (Math.atan2(Math.abs(sh.x - hp.x), Math.abs(hp.y - sh.y)) * 180) / Math.PI
    if (lean > 40) faults.push('Chest up')
    return { metric: knee, label: `${Math.round(knee)}° knee`, faults }
  }
  if (ex === 'pushup') {
    const s = side(lm, J.lSh, J.rSh)
    const [sh, el, wr, hip, an] = s === J.lSh ? [J.lSh, J.lEl, J.lWr, J.lHip, J.lAn] : [J.rSh, J.rEl, J.rWr, J.rHip, J.rAn]
    const elbow = angle(lm[sh], lm[el], lm[wr])
    const line = angle(lm[sh], lm[hip], lm[an])
    if (line < 160) {
      // Hips below the shoulder–ankle line = sagging, above = piking.
      const t = (lm[hip].x - lm[sh].x) / ((lm[an].x - lm[sh].x) || 1e-6)
      const yOnLine = lm[sh].y + t * (lm[an].y - lm[sh].y)
      faults.push(lm[hip].y > yOnLine ? 'Hips sagging' : 'Hips too high')
    }
    return { metric: elbow, label: `${Math.round(elbow)}° elbow`, faults, line }
  }
  if (ex === 'lunge') {
    const kL = angle(lm[J.lHip], lm[J.lKn], lm[J.lAn])
    const kR = angle(lm[J.rHip], lm[J.rKn], lm[J.rAn])
    const knee = Math.min(kL, kR)
    const sh = mid(lm[J.lSh], lm[J.rSh])
    const hp = mid(lm[J.lHip], lm[J.rHip])
    if ((Math.atan2(Math.abs(sh.x - hp.x), Math.abs(hp.y - sh.y)) * 180) / Math.PI > 25) faults.push('Stay tall')
    return { metric: knee, label: `${Math.round(knee)}° front knee`, faults }
  }
  const s = side(lm, J.lSh, J.rSh)
  const [sh, hip, an] = s === J.lSh ? [J.lSh, J.lHip, J.lAn] : [J.rSh, J.rHip, J.rAn]
  const line = angle(lm[sh], lm[hip], lm[an])
  if (line < 163) {
    const t = (lm[hip].x - lm[sh].x) / ((lm[an].x - lm[sh].x) || 1e-6)
    faults.push(lm[hip].y > lm[sh].y + t * (lm[an].y - lm[sh].y) ? 'Hips sagging' : 'Hips too high')
  }
  return { metric: line, label: `${Math.round(line)}° body line`, faults, line }
}

export type Rep = { depth: number; faults: string[]; score: number; at: number }

/** Counts a rep on the way back up after going below `down`; scores depth and faults. */
export class RepCounter {
  phase: 'up' | 'down' = 'up'
  reps: Rep[] = []
  private low = 180
  private seen = new Set<string>()
  ex: Exercise
  constructor(ex: Exercise) {
    this.ex = ex
  }
  push(r: Reading, t: number): Rep | null {
    const rule = RULES[this.ex]
    if (rule.timed) return null
    if (this.phase === 'down') {
      this.low = Math.min(this.low, r.metric)
      r.faults.forEach((f) => this.seen.add(f))
    }
    if (this.phase === 'up' && r.metric < rule.down) {
      this.phase = 'down'
      this.low = r.metric
      this.seen = new Set(r.faults)
    } else if (this.phase === 'down' && r.metric > rule.up) {
      this.phase = 'up'
      const depthBonus = Math.max(0, Math.min(1, (rule.down - this.low) / 25))
      const score = Math.round(Math.max(0, 70 + depthBonus * 30 - this.seen.size * 25))
      const rep = { depth: Math.round(this.low), faults: [...this.seen], score, at: t }
      this.reps.push(rep)
      return rep
    }
    return null
  }
}

/**
 * Synthetic athlete for the demo and tests: a side-on squat at depth 0..1
 * (0 = standing, 1 = bottom). `lean` tips the chest forward (a common fault).
 */
export function squatPose(depth: number, lean = 0): P[] {
  const lm: P[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0.99 }))
  const rad = (d: number) => (d * Math.PI) / 180
  const theta = rad(175 - depth * 95) // knee angle
  const shin = (Math.PI - theta) * 0.42 // shin tips forward
  const L = 0.2
  const ankle = { x: 0.52, y: 0.9 }
  const knee = { x: ankle.x + L * Math.sin(shin), y: ankle.y - L * Math.cos(shin) }
  // Thigh direction: rotate the knee→ankle direction by the knee angle, towards the back.
  const phi = Math.atan2(ankle.y - knee.y, ankle.x - knee.x) + theta
  const hip = { x: knee.x + L * Math.cos(phi), y: knee.y + L * Math.sin(phi) }
  const torso = rad(8 + depth * 22 + lean * 40)
  const sh = { x: hip.x + 0.26 * Math.sin(torso), y: hip.y - 0.26 * Math.cos(torso) }
  const reach = depth * 0.9
  const el = { x: sh.x + 0.13 * Math.sin(rad(10) + reach * 1.5), y: sh.y + 0.13 * Math.cos(rad(10) + reach * 1.5) }
  const wr = { x: el.x + 0.12 * Math.sin(rad(10) + reach * 1.6), y: el.y + 0.12 * Math.cos(rad(10) + reach * 1.6) }
  // Near and far limbs sit a hair apart so the figure reads as two legs.
  const put = (l: number, r: number, p: { x: number; y: number }) => { lm[l] = { x: p.x - 0.012, y: p.y, visibility: 0.99 }; lm[r] = { x: p.x + 0.012, y: p.y, visibility: 0.99 } }
  put(J.lAn, J.rAn, ankle); put(J.lKn, J.rKn, knee); put(J.lHip, J.rHip, hip); put(J.lSh, J.rSh, sh); put(J.lEl, J.rEl, el); put(J.lWr, J.rWr, wr)
  put(31, 32, { x: ankle.x + 0.05, y: 0.92 })
  lm[J.nose] = { x: sh.x + 0.05 * Math.sin(torso) + 0.02, y: sh.y - 0.08, visibility: 0.99 }
  return lm
}
