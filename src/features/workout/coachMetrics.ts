import { J, upperVisible, type P } from './formModel'

export type MotionState = { at: number; points: P[] | null; left: number; right: number; arm: number; watts: number; kcal: number; seconds: number; source: 'world' | 'scaled'; joules: number; kinetic: number; leftWork: number; rightWork: number; peak: number }
export const emptyMotion = (): MotionState => ({ at: 0, points: null, left: 0, right: 0, arm: 0, watts: 0, kcal: 0, seconds: 0, source: 'scaled', joules: 0, kinetic: 0, leftWork: 0, rightWork: 0, peak: 0 })
/** Camera-relative arm motion. World landmarks use metres; fallback uses a supplied shoulder span. */
export function motionTick(previous: MotionState, lm: P[], world: P[] | undefined, at: number, mass: number, span: number, seated = false): MotionState {
  if (!upperVisible(lm)) return { ...previous, at, points: null, left: 0, right: 0, arm: 0, watts: 0 }
  const useWorld = world && [11, 12, 13, 14, 15, 16].every((i) => world[i] && Number.isFinite(world[i].x) && Number.isFinite(world[i].y))
  const pose = useWorld ? world! : lm
  const width = Math.max(.06, Math.hypot(lm[11].x - lm[12].x, lm[11].y - lm[12].y))
  const scale = useWorld ? 1 : Math.max(.2, Math.min(.7, span)) / width
  const centre = { x: (pose[11].x + pose[12].x) / 2, y: (pose[11].y + pose[12].y) / 2, z: ((pose[11].z ?? 0) + (pose[12].z ?? 0)) / 2 }
  const points = [J.lWr, J.rWr, J.lEl, J.rEl].map((i) => ({ x: (pose[i].x - centre.x) * scale, y: (pose[i].y - centre.y) * scale, z: ((pose[i].z ?? 0) - centre.z) * scale }))
  const source = useWorld ? 'world' : 'scaled'
  const dt = (at - previous.at) / 1000
  if (!previous.points || previous.source !== source || dt <= 0 || dt > .25) return { ...previous, at, points, left: 0, right: 0, arm: 0, watts: 0, source }
  const speed = (i: number) => { const value = Math.min(5, Math.hypot(points[i].x - previous.points![i].x, points[i].y - previous.points![i].y, (points[i].z ?? 0) - (previous.points![i].z ?? 0)) / dt); return value < .01 ? 0 : value }
  const smooth = 1 - Math.exp(-dt * 8)
  const left = previous.left + (speed(0) - previous.left) * smooth
  const right = previous.right + (speed(1) - previous.right) * smooth
  const arm = previous.arm + ((speed(2) + speed(3)) / 2 - previous.arm) * smooth
  const effort = Math.max(0, Math.min(1, ((left + right) / 2 + arm * .5 - .025) / 1.5))
  // A heuristic effort-to-energy proxy. These are estimates, never measured calories or strike power.
  const bodyMass = Math.max(20, Math.min(250, mass)), limbMass = bodyMass * .05
  const leftWork = Math.max(0, .5 * limbMass * (left * left - previous.left * previous.left))
  const rightWork = Math.max(0, .5 * limbMass * (right * right - previous.right * previous.right))
  const kinetic = .5 * limbMass * (left * left + right * right)
  const work = leftWork + rightWork
  const watts = previous.watts + (work / dt - previous.watts) * smooth
  // Net activity MET proxy excludes resting energy and full-body stepping assumptions.
  const activityMET = effort * (seated ? 3.5 : 6.5)
  return { at, points, left, right, arm, watts, kcal: previous.kcal + activityMET * 3.5 * bodyMass / 200 * dt / 60, seconds: previous.seconds + dt, source, joules: previous.joules + work, kinetic, leftWork: previous.leftWork + leftWork, rightWork: previous.rightWork + rightWork, peak: Math.max(previous.peak, left, right) }
}
export type GestureState = { id: string | null; elapsed: number; latched: boolean; away: number }
export const emptyGesture = (): GestureState => ({ id: null, elapsed: 0, latched: false, away: 0 })
export function gestureTick(previous: GestureState, id: string | null, dt: number, duration = 2.8) {
  if (!id) {
    const away = previous.away + dt
    return { state: { id: null, elapsed: 0, latched: previous.latched && away < .5, away } as GestureState, action: null as string | null, progress: 0 }
  }
  if (previous.latched) return { state: { ...previous, id, away: 0 }, action: null, progress: 0 }
  const elapsed = previous.id === id ? previous.elapsed + dt : dt
  return { state: { id, elapsed, latched: elapsed >= duration, away: 0 }, action: elapsed >= duration ? id : null, progress: Math.min(1, elapsed / duration) }
}

/** Border dead zones and conflicting hands never choose the first button arbitrarily. */
export function gestureTarget(hands: { x: number; y: number }[], targets: { id: string; left: number; right: number; top: number; bottom: number }[]) {
  const hits = new Set<string>()
  for (const target of targets) if (hands.some(hand => Number.isFinite(hand.x) && Number.isFinite(hand.y) && hand.x >= target.left + 7 && hand.x <= target.right - 7 && hand.y >= target.top + 7 && hand.y <= target.bottom - 7)) hits.add(target.id)
  return { id: hits.size === 1 ? [...hits][0] : null, ambiguous: hits.size > 1 }
}
