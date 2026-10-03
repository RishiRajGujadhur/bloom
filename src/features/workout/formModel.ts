/**
 * Form Coach model: joint angles from pose landmarks (MediaPipe's 33-point
 * body model), a rep counter with hysteresis so jitter can't double-count,
 * and per-exercise form checks. Pure, so it's unit-tested with synthetic poses.
 */
export type P = { x: number; y: number; z?: number; visibility?: number }
export type Exercise = 'squat' | 'pushup' | 'lunge' | 'plank' | 'seatedTwist' | 'wheelchairDip' | 'chairPushup' | 'seatedPress' | 'chestFly' | 'chairSquat' | 'taiChi' | 'boxing' | 'karate' | 'kungFu'

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

export const RULES: Record<Exercise, { name: string; liftId: string; down: number; up: number; unit: string; timed?: boolean; upper?: boolean; bpm?: number; tip: string }> = {
  squat: { name: 'Squat', liftId: 'airsquat', down: 100, up: 160, unit: 'knee°', tip: 'Face the camera, whole body in frame.' },
  pushup: { name: 'Push-up', liftId: 'pushup', down: 95, up: 155, unit: 'elbow°', tip: 'Side-on to the camera, laptop on the floor.' },
  lunge: { name: 'Lunge', liftId: 'lunge', down: 105, up: 155, unit: 'knee°', tip: 'Side-on, step forward and back.' },
  plank: { name: 'Plank', liftId: 'plank', down: 0, up: 0, unit: 'body line°', timed: true, tip: 'Side-on, forearms down, hold a straight line.' },
  seatedTwist: { name: 'Seated Core Twist', liftId: 'seatedtwist', down: 145, up: 170, unit: 'torso°', upper: true, bpm: 40, tip: 'Sit in your usual supported position. Turn your shoulders gently, then return to centre.' },
  wheelchairDip: { name: 'Wheelchair Dips', liftId: 'wheelchairdip', down: 110, up: 150, unit: 'elbow°', upper: true, bpm: 45, tip: 'Use stable armrests. Bend and straighten your elbows through your comfortable range.' },
  chairPushup: { name: 'Chair Push-up', liftId: 'chairpushup', down: 110, up: 150, unit: 'elbow°', upper: true, bpm: 45, tip: 'Hands on stable chair supports. Press through your arms and return gently.' },
  seatedPress: { name: 'Seated Press', liftId: 'seatedpress', down: 110, up: 150, unit: 'elbow°', upper: true, bpm: 40, tip: 'Press your hands upward within your comfortable shoulder range, then lower.' },
  chestFly: { name: 'Seated Chest Fly', liftId: 'seatedchestfly', down: 100, up: 155, unit: 'reach°', upper: true, bpm: 40, tip: 'Open your arms gently, then bring your hands toward the centre.' },
  chairSquat: { name: 'Chair Squats', liftId: 'chairsquat', down: 100, up: 160, unit: 'knee°', bpm: 40, tip: 'Chair-assisted sit-to-stand; requires visible legs and standing ability.' },
  taiChi: { name: 'Tai Chi (Flow)', liftId: 'taichiflow', down: 0, up: 0, unit: 'flow', upper: true, timed: true, bpm: 30, tip: 'Stay seated and supported. Sweep your arms slowly with the visual rhythm.' },
  boxing: { name: 'Boxing (Jab-Cross)', liftId: 'seatedboxing', down: 115, up: 150, unit: 'elbow°', upper: true, bpm: 80, tip: 'Face the camera with both arms visible. Extend one arm, return to guard, then alternate.' },
  karate: { name: 'Karate (Blocks)', liftId: 'seatedkarate', down: 115, up: 160, unit: 'arm raise', upper: true, bpm: 50, tip: 'Raise a forearm above shoulder level, then return to your comfortable guard.' },
  kungFu: { name: 'Kung Fu (Hand Form)', liftId: 'seatedkungfu', down: 0, up: 0, unit: 'flow', upper: true, timed: true, bpm: 40, tip: 'Use gentle, continuous hand forms with your torso supported.' },
}

export function read(ex: Exercise, lm: P[]): Reading {
  if (RULES[ex].upper) return readUpper(ex, lm)
  const faults: string[] = []
  if (ex === 'squat' || ex === 'chairSquat') {
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

export const UPPER_BONES: [number, number][] = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [15, 19], [16, 20]]
export const visible = (p: P | undefined) => !!p && Number.isFinite(p.x) && Number.isFinite(p.y) && (p.visibility ?? 1) >= .55
export function upperVisible(lm: P[]) { return [0, 11, 12, 13, 14, 15, 16].every((i) => visible(lm[i])) }
export function exerciseVisible(ex: Exercise, lm: P[]) {
  if (RULES[ex].upper) return upperVisible(lm)
  if (ex === 'squat' || ex === 'lunge' || ex === 'chairSquat') return [11, 12, 23, 24, 25, 26, 27, 28].every((i) => visible(lm[i]))
  return [[11, 13, 15, 23, 27], [12, 14, 16, 24, 28]].some((indices) => (ex === 'plank' ? [indices[0], indices[3], indices[4]] : indices).every((i) => visible(lm[i])))
}
export type UpperBaseline = { slope: number; headOffset: number; twist: number; width: number }
export function upperBaseline(lm: P[]): UpperBaseline | null {
  if (!upperVisible(lm)) return null
  const width = Math.abs(lm[11].x - lm[12].x)
  if (width < .06) return null
  return { width, slope: (lm[11].y - lm[12].y) / width, headOffset: (lm[0].x - (lm[11].x + lm[12].x) / 2) / width, twist: ((lm[11].z ?? 0) - (lm[12].z ?? 0)) / width }
}
/** Deviations from the user's own neutral position, not an idealized symmetric body. */
export function alignment(lm: P[], baseline: UpperBaseline | null) {
  const current = upperBaseline(lm)
  if (!baseline || !current) return null
  const shoulder = current.slope - baseline.slope, head = current.headOffset - baseline.headOffset
  return { value: Math.max(-1, Math.min(1, shoulder * 3 + head)), alert: Math.abs(shoulder) > .18 || Math.abs(head) > .3 }
}
export function readUpper(ex: Exercise, lm: P[], baseline?: UpperBaseline | null): Reading {
  if (!upperVisible(lm)) return { metric: 180, label: 'Show head, shoulders and both arms', faults: ['Upper-body tracking lost'] }
  if (ex === 'seatedTwist') {
    const b = upperBaseline(lm)
    if (!b) return { metric: 180, label: 'Face the camera for torso tracking', faults: ['Shoulders not clearly visible'] }
    const twist = Math.atan(Math.abs(b.twist - (baseline?.twist ?? 0))) * 180 / Math.PI
    return { metric: 180 - twist * 2, label: `${Math.round(twist)}° torso turn`, faults: [] }
  }
  if (ex === 'chestFly') {
    const w = Math.max(.06, Math.abs(lm[11].x - lm[12].x))
    const reach = Math.abs(lm[15].x - lm[16].x) / w
    return { metric: Math.max(0, 180 - reach * 60), label: `${reach.toFixed(1)}× shoulder span`, faults: [] }
  }
  if (ex === 'karate') {
    const width = Math.max(.08, Math.abs(lm[11].x - lm[12].x))
    const raise = Math.max(lm[11].y - lm[15].y, lm[12].y - lm[16].y) / width
    return { metric: Math.max(0, Math.min(180, 180 - Math.max(0, raise + .15) * 150)), label: 'Raise, then return to guard', faults: [] }
  }
  const left = angle(lm[11], lm[13], lm[15]), right = angle(lm[12], lm[14], lm[16])
  return { metric: ex === 'boxing' ? Math.max(left, right) : (left + right) / 2, label: RULES[ex].timed ? 'Steady upper-body flow' : `${Math.round(Math.max(left, right))}° elbow`, faults: [] }
}

/** Seated reference poses never rely on knees, feet or pelvis landmarks. */
export function upperPose(ex: Exercise, phase: number): P[] {
  const lm: P[] = Array.from({ length: 33 }, () => ({ x: .5, y: .8, z: 0, visibility: 0 }))
  const cycle = (1 - Math.cos(phase * Math.PI * 2)) / 2
  lm[0] = { x: .5, y: .17, z: 0, visibility: 1 }
  for (const [sh, el, wr, sign] of [[11, 13, 15, -1], [12, 14, 16, 1]]) {
    const shoulder = { x: .5 + sign * .15, y: .32, z: 0, visibility: 1 }
    const elbow = { x: shoulder.x + sign * .06, y: .49, z: 0, visibility: 1 }
    const strike = (1 - Math.cos((phase * 2 % 1) * Math.PI * 2)) / 2
    const bend = ex === 'boxing' ? (Math.floor(phase * 2) % 2 === (sign < 0 ? 0 : 1) ? strike : 0) : cycle
    const theta = (90 + bend * 80) * Math.PI / 180
    const arm = Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x) + sign * theta
    const wrist = { x: elbow.x + .17 * Math.cos(arm), y: elbow.y + .17 * Math.sin(arm), z: 0, visibility: 1 }
    if (ex === 'seatedTwist') shoulder.z = sign * cycle * .15
    if (ex === 'seatedPress') { elbow.x = shoulder.x + sign * .07; elbow.y = .47 - cycle * .26; const phi = Math.atan2(shoulder.y - elbow.y, shoulder.x - elbow.x) + sign * (95 + cycle * 75) * Math.PI / 180; wrist.x = elbow.x + .17 * Math.cos(phi); wrist.y = elbow.y + .17 * Math.sin(phi) }
    if (ex === 'chestFly') { wrist.x = .5 + sign * (.03 + cycle * .34); wrist.y = .4 }
    if (ex === 'karate') wrist.y = .42 - cycle * .3
    if (RULES[ex].timed) { elbow.x += sign * cycle * .04; wrist.x = .5 + sign * (.1 + cycle * .23); wrist.y = .5 - cycle * .25 }
    lm[sh] = shoulder; lm[el] = elbow; lm[wr] = wrist
    lm[wr + 4] = { ...wrist, y: wrist.y - .03 }; lm[wr + 6] = { ...wrist }
  }
  return lm
}

export function demoPose(ex: Exercise, phase: number): P[] {
  if (RULES[ex].upper) return upperPose(ex, phase)
  const depth = (1 - Math.cos(phase * Math.PI * 2)) / 2
  if (ex === 'squat' || ex === 'lunge' || ex === 'chairSquat') return squatPose(depth)
  const lm = squatPose(0)
  for (const [sh, el, wr, hip, an] of [[11, 13, 15, 23, 27], [12, 14, 16, 24, 28]]) {
    lm[sh] = { x: .2, y: .4, visibility: 1 }; lm[hip] = { x: .5, y: .4, visibility: 1 }; lm[an] = { x: .8, y: .4, visibility: 1 }
    lm[el] = { x: .22, y: .55, visibility: 1 }
    const phi = Math.atan2(-.15, -.02) + (170 - depth * 90) * Math.PI / 180
    lm[wr] = { x: .22 + .15 * Math.cos(phi), y: .55 + .15 * Math.sin(phi), visibility: 1 }
  }
  lm[0] = { x: .13, y: .36, visibility: 1 }
  return lm
}

export type Rep = { depth: number; faults: string[]; score: number; at: number }

/** Counts a rep on the way back up after going below `down`; scores depth and faults. */
export class RepCounter {
  phase: 'up' | 'down' = 'up'
  reps: Rep[] = []
  private low = 180
  private seen = new Set<string>()
  ex: Exercise
  range: { down: number; up: number; low: number } | null = null
  constructor(ex: Exercise) {
    this.ex = ex
  }
  push(r: Reading, t: number): Rep | null {
    const rule = { ...RULES[this.ex], ...this.range }
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
      const depthBonus = Math.max(0, Math.min(1, (rule.down - this.low) / (this.range ? Math.max(1, rule.down - this.range.low) : 25)))
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

export function personalRange(low: number, high: number) {
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high > 180 || high - low < 12) return null
  return { low, high, down: low + (high - low) * .3, up: low + (high - low) * .8 }
}

export type Lineage = 'Yang' | 'Chen'
export function referencePose(ex: Exercise, phase: number, lineage: Lineage = 'Yang') {
  const pose = demoPose(ex, phase)
  if (ex === 'taiChi' && lineage === 'Chen') {
    for (const [el, wr, sign] of [[13, 15, -1], [14, 16, 1]]) {
      pose[el].x += sign * .03 * Math.sin(phase * Math.PI * 2)
      pose[wr].y += .06 * Math.sin(phase * Math.PI * 4)
      pose[wr].z = sign * .12 * Math.sin(phase * Math.PI * 2)
    }
  }
  return pose
}

export function loadPersonalRanges(): Partial<Record<Exercise, ReturnType<typeof personalRange>>> {
  try {
    const value = JSON.parse(localStorage.getItem('bloom-coach-ranges-v1') ?? '{}')
    return Object.fromEntries(Object.entries(value).filter(([key, range]) => { const r = range as { low: number; high: number; down: number; up: number }; return Object.hasOwn(RULES, key) && r && [r.low, r.high, r.down, r.up].every(Number.isFinite) && r.low >= 0 && r.high <= 180 && r.low <= r.down && r.down + 5 < r.up && r.up <= r.high }))
  } catch { return {} }
}

export function jointCallouts(pose: P[]) {
  const measured = (a: number, b: number, c: number) => [a,b,c].every(i => visible(pose[i])) ? Math.round(angle(pose[a], pose[b], pose[c])) : null
  return { left: measured(11,13,15), right: measured(12,14,16), leftWrist: measured(13,15,19), rightWrist: measured(14,16,20), leftKnee: measured(23,25,27), rightKnee: measured(24,26,28) }
}
