import { angle, upperVisible, type P } from './formModel'
export type CombatMode = 'chain' | 'boxing'
export const COMBAT_MODES: { id: CombatMode; name: string; cue: string }[] = [
  { id: 'chain', name: 'Wing Chun chain punches', cue: 'Alternate comfortable centre-line punches. Return each hand before striking again.' },
  { id: 'boxing', name: 'Boxing combos & slips', cue: 'Alternate punches and move your head gently sideways within your supported seated range.' },
]
export type CombatState = { at: number; elapsed: number; pose: P[] | null; hits: number; grade: number | null; slips: number; slipHeld: boolean; centre: number | null; lastHits: number[]; lastSide: number; chain: number; event: boolean; hand: number; speed: number; guard: boolean }
export const newCombat = (): CombatState => ({ at: 0, elapsed: 0, pose: null, hits: 0, grade: null, slips: 0, slipHeld: false, centre: null, lastHits: [0, 0], lastSide: -1, chain: 0, event: false, hand: 15, speed: 0, guard: false })
/** Projected movement cues, not martial-arts certification or contact-force measurement. */
export function combatTick(state: CombatState, mode: CombatMode, pose: P[], at: number): CombatState {
  const dt = (at - state.at) / 1000
  if (!upperVisible(pose) || pose.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return { ...state, at, pose: null, event: false }
  const centre = state.centre ?? pose[0].x, width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  if (!state.pose || dt <= 0 || dt > .2) return { ...state, at, pose, centre, event: false, speed: 0 }
  const shift = Math.abs(pose[0].x - centre) / width, slipHeld = shift > .22
  const speeds = [15, 16].map(j => Math.hypot(pose[j].x - state.pose![j].x, pose[j].y - state.pose![j].y) / width / dt)
  const guard = [15, 16].some(j => Math.hypot(pose[j].x - pose[0].x, pose[j].y - pose[0].y) < width * 1.15)
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
