import { angle, upperVisible, type P } from './formModel'
export type CombatMode = 'chain' | 'boxing' | 'cloud' | 'ropes' | 'doubleRopes'
export const COMBAT_MODES: { id: CombatMode; name: string; cue: string }[] = [
  { id: 'chain', name: 'Wing Chun chain punches', cue: 'Alternate comfortable centre-line punches. Return each hand before striking again.' },
  { id: 'boxing', name: 'Boxing combos & slips', cue: 'Alternate punches and move your head gently sideways within your supported seated range.' },
  { id: 'cloud', name: 'Tai Chi Cloud Hands', cue: 'Trace comfortable circles with both arms. Keep the travel slow, continuous and synchronized.' },
  { id: 'ropes', name: 'Shadow ropes · alternating', cue: 'Lift then lower one hand at a time. Alternate arms without forcing your shoulders.' },
  { id: 'doubleRopes', name: 'Shadow ropes · double slams', cue: 'Raise both empty hands, then lower them together through your comfortable range.' },
]
export type CombatState = { at: number; elapsed: number; pose: P[] | null; hits: number; grade: number | null; slips: number; slipHeld: boolean; centre: number | null; lastHits: number[]; lastSide: number; chain: number; event: boolean; hand: number; speed: number; guard: boolean; velocities: number[]; acceleration: number; power: number }
export const newCombat = (): CombatState => ({ at: 0, elapsed: 0, pose: null, hits: 0, grade: null, slips: 0, slipHeld: false, centre: null, lastHits: [0, 0], lastSide: -1, chain: 0, event: false, hand: 15, speed: 0, guard: false, velocities: [0, 0], acceleration: 0, power: 0 })
export function ropeMotion(previous: P[], pose: P[], oldVelocity: number[], dt: number) {
  const width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  const velocities = [15, 16].map(j => (pose[j].y - previous[j].y) / width * .4 / dt)
  const accelerations = velocities.map((v, i) => Math.max(0, (v - oldVelocity[i]) / dt))
  return { velocities, acceleration: Math.min(100, Math.max(...accelerations)), power: Math.min(1000, velocities.reduce((p, v, i) => p + 1.9 * Math.max(0, v) * accelerations[i], 0)) }
}
export function cloudGrade(previous: P[], pose: P[], dt: number) {
  const width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  const speeds = [15, 16].map(j => Math.hypot(pose[j].x - previous[j].x, pose[j].y - previous[j].y) / width / dt)
  const circular = [0, 1].map(i => {
    const j = 15 + i, sh = 11 + i
    const radius = Math.hypot(pose[j].x - pose[sh].x, pose[j].y - pose[sh].y)
    const oldRadius = Math.hypot(previous[j].x - previous[sh].x, previous[j].y - previous[sh].y)
    return Math.abs(radius - oldRadius) / width / dt
  })
  if (Math.min(...speeds) < .04) return null
  return Math.round(Math.max(0, 100 - Math.abs(speeds[0] - speeds[1]) * 35 - Math.max(0, Math.max(...speeds) - 1.2) * 30 - Math.max(...circular) * 15))
}
/** Projected movement cues, not martial-arts certification or contact-force measurement. */
export function combatTick(state: CombatState, mode: CombatMode, pose: P[], at: number): CombatState {
  const dt = (at - state.at) / 1000
  if (!upperVisible(pose) || pose.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return { ...state, at, pose: null, event: false }
  const centre = state.centre ?? pose[0].x, width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  if (!state.pose || dt <= 0 || dt > .2) return { ...state, at, pose, centre, event: false, speed: 0 }
  const shift = Math.abs(pose[0].x - centre) / width, slipHeld = shift > .22
  const speeds = [15, 16].map(j => Math.hypot(pose[j].x - state.pose![j].x, pose[j].y - state.pose![j].y) / width / dt)
  const guard = [15, 16].some(j => Math.hypot(pose[j].x - pose[0].x, pose[j].y - pose[0].y) < width * 1.15)
  if (mode === 'ropes' || mode === 'doubleRopes') {
    const motion = ropeMotion(state.pose, pose, state.velocities, dt)
    const crossed = [0, 1].map(i => pose[15 + i].y >= pose[13 + i].y && state.pose![15 + i].y < state.pose![13 + i].y && motion.velocities[i] > .12)
    const side = crossed[0] ? 0 : crossed[1] ? 1 : -1
    const event = at - Math.max(...state.lastHits) > 250 && (mode === 'doubleRopes' ? crossed.every(Boolean) : side >= 0 && side !== state.lastSide)
    return { ...state, ...motion, at, pose, centre, elapsed: state.elapsed + dt, speed: Math.max(...speeds), guard, event, grade: event ? mode === 'doubleRopes' ? Math.round(Math.max(50, 100 - Math.abs(motion.velocities[0] - motion.velocities[1]) * 30)) : 90 : state.grade, hand: side >= 0 ? 15 + side : state.hand, hits: state.hits + Number(event), lastSide: event ? side : state.lastSide, lastHits: event ? [at, at] : state.lastHits }
  }
  if (mode === 'cloud') {
    const measured = cloudGrade(state.pose, pose, dt)
    const grade = measured == null ? null : state.grade == null ? measured : Math.round(state.grade * .85 + measured * .15)
    const event = grade != null && grade >= 70 && at - state.lastHits[0] >= 3000
    return { ...state, at, pose, centre, elapsed: state.elapsed + dt, grade, speed: Math.max(...speeds), guard, event, hits: state.hits + Number(event), lastHits: event ? [at, at] : state.lastHits }
  }
  let side = -1
  for (let i = 0; i < 2; i++) {
    const extended = angle(pose[11 + i], pose[13 + i], pose[15 + i]) > 140
    const returned = angle(state.pose[11 + i], state.pose[13 + i], state.pose[15 + i]) < 140
    if (extended && returned && speeds[i] > .25 && at - state.lastHits[i] > 180 && (mode !== 'chain' || Math.abs(pose[15 + i].x - centre) < width)) side = i
  }
  const event = side >= 0, hand = event ? 15 + side : state.hand
  const chain = event ? (side !== state.lastSide && at - Math.max(...state.lastHits) < 1800 ? state.chain + 1 : 1) : state.chain
  const grade = event ? Math.round(Math.max(0, 100 - Math.abs(pose[hand].x - centre) / width * 35 - (guard ? 0 : 20))) : state.grade
  return { ...state, at, pose, centre, elapsed: state.elapsed + dt, slips: state.slips + (mode === 'boxing' && slipHeld && !state.slipHeld ? 1 : 0), slipHeld, hits: state.hits + Number(event), grade, lastHits: state.lastHits.map((t, i) => i === side ? at : t), lastSide: event ? side : state.lastSide, chain, event, hand, speed: Math.max(...speeds), guard }
}
