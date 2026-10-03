import type { P } from './formModel'
export type PoseFrame = { at: number; pose: P[]; score: number }
export function CoachTrails({ frames, mirror }: { frames: PoseFrame[]; mirror: boolean }) {
  const path = (joint: number) => frames.slice(-24).filter(frame => (frame.pose[joint]?.visibility ?? 0) >= .55).map((frame, i) => `${i ? 'L' : 'M'}${(mirror ? 1 - frame.pose[joint].x : frame.pose[joint].x) * 640},${frame.pose[joint].y * 480}`).join(' ')
  return <svg className="fc-vector-layer" viewBox="0 0 640 480" aria-label="Hand strike trajectories"><path d={path(15)} fill="none" stroke="#ffed55" strokeWidth="4" /><path d={path(16)} fill="none" stroke="#ff78df" strokeWidth="4" /></svg>
}
