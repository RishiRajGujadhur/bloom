import type { Exercise, P } from './formModel'
import { poseLines } from './coachReplay'
export function CoachGhost({ exercise, pose, mirror = false }: { exercise: Exercise; pose: P[]; mirror?: boolean }) {
  const x = (i: number) => (mirror ? 1 - pose[i].x : pose[i].x) * 640
  return <svg className="fc-vector-layer fc-ghost-pose" viewBox="0 0 640 480" aria-label="Personal best skeletal replay">{poseLines(exercise, pose).map(([a, b]) => <line key={`${a}-${b}`} x1={x(a)} y1={pose[a].y * 480} x2={x(b)} y2={pose[b].y * 480} stroke="#fff" strokeWidth="5" />)}</svg>
}
