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
