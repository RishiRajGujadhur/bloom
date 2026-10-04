import { RULES, exerciseVisible, visible, type P, type Exercise } from './formModel'
export function exerciseGuide(ex: Exercise) {
  const upper = RULES[ex].upper
  const camera = upper ? 'Position the camera near chest height with your head and both arms visible. Keep your usual seated support.' : ['pushup','plank','lunge'].includes(ex) ? 'Use a side view with the joints needed for this movement visible. Keep the device steady.' : 'Keep your hips, knees and ankles visible. A slight side angle can make depth easier to see.'
  const watch = ex === 'lateralRaise' ? 'Keep shoulders relaxed and return slowly. A smaller personal range is fine.' : ex === 'bicepCurl' ? 'Let the elbows stay near your torso instead of swinging them outward.' : ex === 'boxing' ? 'Return each hand to your comfortable guard before the next punch.' : ex === 'seatedTwist' ? 'Let your shoulders turn gently; avoid leaning to manufacture extra range.' : upper ? 'Keep your torso steady and work within your comfortable arm range.' : ex === 'plank' || ex === 'pushup' ? 'Avoid letting your hips sag or rise sharply.' : 'Move smoothly; let your knees follow your foot direction.'
  return { camera, move: RULES[ex].tip, watch }
}

export type TempoPreset = 'free' | '1:3' | '2:2'
export const supportsTempo = (ex: Exercise) => !RULES[ex].timed && !['boxing','karate'].includes(ex)
export function practicePhase(seconds: number, preset: TempoPreset = 'free', slow = false) {
 const lift = preset === '2:2' ? 2 : preset === '1:3' ? 1 : 2, lower = preset === '1:3' ? 3 : 2
 const t = seconds / (slow ? 2 : 1) % (lift + lower)
 return t < lift ? .5 * t / lift : .5 + .5 * (t - lift) / lower
}
export type TempoResult = { lift: number; lower: number; score: number | null }
export type TempoState = { phase: 'ready' | 'lift' | 'lower'; at: number; metric: number | null; start: number; min: number; turn: number; reached: boolean }
export const emptyTempo = (): TempoState => ({ phase: 'ready', at: 0, metric: null, start: 0, min: 180, turn: 0, reached: false })
export function tempoTick(previous: TempoState, metric: number, at: number, down: number, up: number, preset: TempoPreset) {
 let state = { ...previous, at, metric }, result: TempoResult | null = null
 if (!Number.isFinite(metric) || (previous.at && (at <= previous.at || at - previous.at > 500))) return { state: { ...emptyTempo(), at, metric: Number.isFinite(metric) ? metric : null }, result }
 if (state.phase === 'ready') {
  if (previous.metric !== null && metric < previous.metric - 1) state = { ...state, phase: 'lift', start: previous.at, min: metric, turn: at, reached: metric < down }
 } else {
  if (metric < state.min) { state.min = metric; state.turn = at }
  state.reached ||= metric < down
  if (state.phase === 'lift' && state.reached && metric > state.min + 4) state.phase = 'lower'
  if (metric > up) {
   if (state.phase === 'lower' && state.reached && state.turn > state.start) {
    const lift = (state.turn - state.start) / 1000, lower = (at - state.turn) / 1000
    const target = preset === '1:3' ? [1,3] : [2,2]
    result = { lift, lower, score: preset === 'free' ? null : Math.round(Math.max(0, 100 * (1 - (Math.abs(lift-target[0])/target[0] + Math.abs(lower-target[1])/target[1])/2))) }
   }
   state = { ...emptyTempo(), at, metric }
  }
 }
 return { state, result }
}

export function poseReadiness(ex: Exercise, pose: P[], seated = false) {
 const upper = seated || RULES[ex].upper
 const sides = [[11,13,15,23,27],[12,14,16,24,28]]
 const indices = upper ? [0,11,12,13,14,15,16] : ['squat','chairSquat','lunge'].includes(ex) ? [11,12,23,24,25,26,27,28] : (sides.find(side => (ex === 'plank' ? [side[0],side[3],side[4]] : side).every(i=>visible(pose[i]))) ?? sides[0]).filter(i=>ex !== 'plank' || [11,12,23,24,27,28].includes(i))
 const seen=indices.filter(i=>visible(pose[i])), confidence=seen.length ? Math.round(seen.reduce((sum,i)=>sum+(pose[i].visibility ?? 1),0)/indices.length*100) : 0
 if (seen.length !== indices.length || !exerciseVisible(upper ? 'observe' : ex,pose)) return { ready:false, confidence, message: upper ? 'Show your head and both arms. More light can help tracking.' : 'Keep the exercise joints visible; try the camera angle in the movement guide.' }
 if(indices.some(i=>pose[i].x < .01 || pose[i].x > .99 || pose[i].y < .01 || pose[i].y > .99)) return { ready:false, confidence, message:'Move the camera a little farther back so the moving joints fit inside the picture.' }
 return { ready:true, confidence, message: upper ? 'Upper-body joints visible' : 'Exercise joints visible' }
}
