import { BONES, RULES, UPPER_BONES, visible, type Exercise, type P } from './formModel'
import type { PoseFrame } from './CoachTrails'
export type Ghost = { score: number; power: number; frames: PoseFrame[] }
export function readGhost(exercise: Exercise, kind: 'form' | 'power'): Ghost | null {
  try {
    const value = JSON.parse(localStorage.getItem(`bloom-coach-ghost-${exercise}-${kind}`) ?? 'null')
    if (!value || !Number.isFinite(value.score) || !Number.isFinite(value.power) || !Array.isArray(value.frames) || value.frames.length > 80) return null
    if (!value.frames.every((frame: PoseFrame) => Number.isFinite(frame.at) && Array.isArray(frame.pose) && frame.pose.length === 33 && frame.pose.every(p => Number.isFinite(p.x) && Number.isFinite(p.y)))) return null
    return value
  } catch { return null }
}
export function saveGhost(exercise: Exercise, frames: PoseFrame[], score: number, power: number) {
  if (!frames.length) return
  const start = frames[0].at, step = Math.max(1, Math.ceil(frames.length / 80))
  const compact = frames.filter((_, i) => i % step === 0).slice(0, 80).map(frame => ({ ...frame, at: frame.at - start, pose: frame.pose.map(p => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4), z: +(p.z ?? 0).toFixed(4), visibility: +(p.visibility ?? 1).toFixed(2) })) }))
  for (const kind of ['form', 'power'] as const) {
    const previous = readGhost(exercise, kind)
    if (!previous || (kind === 'form' ? score > previous.score : power > previous.power)) localStorage.setItem(`bloom-coach-ghost-${exercise}-${kind}`, JSON.stringify({ score, power, frames: compact }))
  }
}
export function ghostFrame(ghost: Ghost, seconds: number) {
  const duration = ghost.frames.at(-1)?.at ?? 0
  const at = duration > 0 ? seconds * 1000 % duration : 0
  return ghost.frames.findLast(frame => frame.at <= at)?.pose ?? ghost.frames[0]?.pose
}
export function poseLines(exercise: Exercise, pose: P[]) {
  return (RULES[exercise].upper ? UPPER_BONES : BONES).filter(([a, b]) => visible(pose[a]) && visible(pose[b]))
}
