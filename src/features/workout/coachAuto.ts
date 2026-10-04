import { angle, type Exercise, type P } from './formModel'

export type AutoSample = { at: number; elbow: number; elevation: number; wrist: number }
export type AutoState = { samples: AutoSample[]; detected: Exercise | null }
export const emptyAuto = (): AutoState => ({ samples: [], detected: null })
/** Conservative movement recognition; static poses and overlapping forms remain unclassified. */
export function autoTick(state: AutoState, pose: P[], at: number): AutoState {
  const required = [11, 12, 13, 14, 15, 16]
  if (required.some(i => !pose[i] || (pose[i].visibility ?? 1) < .7 || !Number.isFinite(pose[i].x) || !Number.isFinite(pose[i].y) || pose[i].x < .01 || pose[i].x > .99 || pose[i].y < .01 || pose[i].y > .99)) return { ...state, samples: [] }
  if (state.detected) return state
  const width = Math.abs(pose[11].x - pose[12].x)
  if (width < .08) return { ...state, samples: [] }
  const sides = [[11, 13, 15], [12, 14, 16]].map(([s, e, w]) => ({ elbow: angle(pose[s], pose[e], pose[w]), elevation: (pose[s].y - pose[e].y) / width, wrist: (pose[s].y - pose[w].y) / width }))
  const current = { at, elbow: Math.min(...sides.map(s => s.elbow)), elevation: Math.max(...sides.map(s => s.elevation)), wrist: Math.max(...sides.map(s => s.wrist)) }
  const previous = state.samples.at(-1)
  const samples = [...(previous && at - previous.at > 500 ? [] : state.samples.filter(s => at - s.at < 5000)), current]
  if (samples.length < 12 || at - samples[0].at < 2200) return { samples, detected: null }
  const range = (key: 'elbow' | 'elevation' | 'wrist') => Math.max(...samples.map(s => s[key])) - Math.min(...samples.map(s => s[key]))
  const highElbow = Math.max(...samples.map(s => s.elbow)), lowElbow = Math.min(...samples.map(s => s.elbow))
  let detected: Exercise | null = null
  // Require excursion and return to neutral; the identification movement is not counted.
  if (highElbow > 145 && lowElbow < 90 && range('elevation') < .25 && current.elbow > 145 && Math.max(...samples.map(s => s.elevation)) < -.15) detected = 'bicepCurl'
  else if (lowElbow > 140 && range('elevation') > .4 && current.elevation < -.25 && Math.max(...samples.map(s => s.elevation)) > -.1) detected = 'lateralRaise'
  else if (range('elbow') > 45 && range('elevation') > .4 && Math.max(...samples.map(s => s.wrist)) > .65 && current.wrist < .2 && current.elbow < 125) detected = 'seatedPress'
  return { samples, detected }
}
