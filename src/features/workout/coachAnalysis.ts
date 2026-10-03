import { angle, upperVisible, type P } from './formModel'
import type { MotionState } from './coachMetrics'
export type Analysis = { at: number; speed: number; snap: number | null; stopMs: number | null; peakAt: number; peak: number }
export const emptyAnalysis = (): Analysis => ({ at: 0, speed: 0, snap: null, stopMs: null, peakAt: 0, peak: 0 })
/** A sampled deceleration proxy; cannot measure contact force or validate a martial lineage. */
export function analysisTick(previous: Analysis, pose: P[], motion: MotionState, at: number): Analysis {
  if (!upperVisible(pose)) return { ...previous, at, speed: 0, peak: 0, peakAt: 0 }
  const dt = (at - previous.at) / 1000, speed = Math.max(motion.left, motion.right)
  if (dt <= 0 || dt > .25) return { ...previous, at, speed, peak: speed, peakAt: at }
  let { peak, peakAt, snap, stopMs } = previous
  if (speed > peak) { peak = speed; peakAt = at }
  const extension = Math.max(angle(pose[11], pose[13], pose[15]), angle(pose[12], pose[14], pose[16]))
  if (peak > .35 && speed < peak * .4 && extension > 145 && at - peakAt < 1000) {
    stopMs = at - peakAt; snap = Math.round(Math.min(100, (peak - speed) / Math.max(.04, stopMs / 1000) * 12)); peak = 0; peakAt = 0
  }
  if (at - peakAt > 1000) { peak = speed; peakAt = at }
  return { at, speed, peak, peakAt, snap, stopMs }
}

export function rhythmGrade(times: number[]) {
  const gaps = times.slice(1).map((at, i) => at - times[i]).filter(gap => gap > 100 && gap < 4000).slice(-8)
  if (gaps.length < 2) return null
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const deviation = Math.sqrt(gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length)
  return { score: Math.round(Math.max(0, 100 * (1 - deviation / mean))), gap: Math.round(mean) }
}

export type FlowState = { at: number; speed: number; acceleration: number; score: number | null }
export const emptyFlow = (): FlowState => ({ at: 0, speed: 0, acceleration: 0, score: null })
export function flowTick(previous: FlowState, motion: MotionState) {
  const speed = (motion.left + motion.right) / 2, dt = (motion.at - previous.at) / 1000
  if (dt <= 0 || dt > .25 || !motion.points || speed < .025) return { at: motion.at, speed, acceleration: 0, score: null }
  const acceleration = (speed - previous.speed) / dt
  const jerk = Math.abs(acceleration - previous.acceleration) / dt
  const grade = Math.max(0, 100 - jerk * 3)
  return { at: motion.at, speed, acceleration, score: previous.score == null ? grade : previous.score * .9 + grade * .1 }
}

export type BoxingState = { at: number; pose: P[] | null; lastStrike: number; strike: string; guard: boolean; counts: Record<string, number> }
export const emptyBoxing = (): BoxingState => ({ at: 0, pose: null, lastStrike: 0, strike: 'Awaiting strike', guard: true, counts: {} })
export function boxingTick(previous: BoxingState, pose: P[], at: number, lead: 'left' | 'right' = 'left'): BoxingState {
  if (!upperVisible(pose)) return { ...previous, at, pose: null }
  const width = Math.max(.06, Math.abs(pose[11].x - pose[12].x)), dt = (at - previous.at) / 1000
  const elbows = [angle(pose[11], pose[13], pose[15]), angle(pose[12], pose[14], pose[16])]
  const side = elbows[0] > elbows[1] ? 0 : 1, other = 16 - side
  const guard = Math.abs(pose[other].y - pose[0].y) < width * 1.1 && Math.abs(pose[other].x - pose[0].x) < width
  if (!previous.pose || dt <= 0 || dt > .25 || at - previous.lastStrike < 450) return { ...previous, at, pose, guard }
  let strike = previous.strike, lastStrike = previous.lastStrike, counts = previous.counts
  for (let i = 0; i < 2; i++) {
    const wrist = 15 + i, elbow = 13 + i, shoulder = 11 + i
    const oldAngle = angle(previous.pose[shoulder], previous.pose[elbow], previous.pose[wrist])
    const dx = (pose[wrist].x - previous.pose[wrist].x) / width / dt, dy = (pose[wrist].y - previous.pose[wrist].y) / width / dt
    const extended = elbows[i] > 150 && oldAngle <= 150
    const uppercut = dy < -1.5 && Math.abs(dy) > Math.abs(dx) * 1.5 && elbows[i] < 145
    const hook = Math.abs(dx) > 1.5 && Math.abs(dx) > Math.abs(dy) * 1.5 && elbows[i] < 145
    if (!extended && !uppercut && !hook) continue
    const hand = i === 0 ? 'left' : 'right'
    strike = uppercut ? 'Uppercut' : hook ? 'Hook' : hand === lead ? 'Jab' : 'Cross'
    lastStrike = at; counts = { ...counts, [strike]: (counts[strike] ?? 0) + 1 }; break
  }
  return { at, pose, lastStrike, strike, guard, counts }
}
