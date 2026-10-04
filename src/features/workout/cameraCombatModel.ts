import { angle, upperVisible, type P } from './formModel'
import type { PoseFrame } from './CoachTrails'
export type CombatMode = 'chain' | 'boxing' | 'cloud' | 'ropes' | 'doubleRopes' | 'sword'
export const COMBAT_MODES: { id: CombatMode; name: string; cue: string }[] = [
  { id: 'chain', name: 'Wing Chun chain punches', cue: 'Alternate comfortable centre-line punches. Return each hand before striking again.' },
  { id: 'boxing', name: 'Boxing combos & slips', cue: 'Alternate punches and move your head gently sideways within your supported seated range.' },
  { id: 'cloud', name: 'Tai Chi Cloud Hands', cue: 'Trace comfortable circles with both arms. Keep the travel slow, continuous and synchronized.' },
  { id: 'ropes', name: 'Shadow ropes · alternating', cue: 'Lift then lower one hand at a time. Alternate arms without forcing your shoulders.' },
  { id: 'doubleRopes', name: 'Shadow ropes · double slams', cue: 'Raise both empty hands, then lower them together through your comfortable range.' },
  { id: 'sword', name: 'Empty-hand seated sword', cue: 'No physical prop is required or recognized. Your wrist and forearm orient the virtual blade.' },
]
export type CombatState = { at: number; elapsed: number; pose: P[] | null; hits: number; grade: number | null; slips: number; slipHeld: boolean; centre: number | null; lastHits: number[]; lastSide: number; chain: number; event: boolean; hand: number; speed: number; guard: boolean; velocities: number[]; acceleration: number; power: number; parries: number; projectile: number; move: string; bossHp: number; bossMax: number; damage: number; hp: number; attack: number; neutralSlope: number | null; shield: boolean }
export const newCombat = (goal = 10): CombatState => ({ at: 0, elapsed: 0, pose: null, hits: 0, grade: null, slips: 0, slipHeld: false, centre: null, lastHits: [0, 0], lastSide: -1, chain: 0, event: false, hand: 15, speed: 0, guard: false, velocities: [0, 0], acceleration: 0, power: 0, parries: 0, projectile: -1, move: 'Awaiting movement', bossHp: Math.max(5, Math.min(60, Number.isFinite(goal) ? goal : 10)) * 35, bossMax: Math.max(5, Math.min(60, Number.isFinite(goal) ? goal : 10)) * 35, damage: 0, hp: 100, attack: -1, neutralSlope: null, shield: false })
export function ropeMotion(previous: P[], pose: P[], oldVelocity: number[], dt: number) {
  const width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  const velocities = [15, 16].map(j => (pose[j].y - previous[j].y) / width * .4 / dt)
  const accelerations = velocities.map((v, i) => Math.max(0, (v - oldVelocity[i]) / dt))
  return { velocities, acceleration: Math.min(100, Math.max(...accelerations)), power: Math.min(1000, velocities.reduce((p, v, i) => p + 1.9 * Math.max(0, v) * accelerations[i], 0)) }
}
export function swordPose(pose: P[], hand: 15 | 16 = 15) {
  const wrist = pose[hand], elbow = pose[hand - 2]
  if (!wrist || !elbow || (wrist.visibility ?? 1) < .65 || (elbow.visibility ?? 1) < .65) return null
  const dx = wrist.x - elbow.x, dy = wrist.y - elbow.y, length = Math.hypot(dx, dy)
  if (length < .03) return null
  const span = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  return { hilt: wrist, tip: { x: wrist.x + dx / length * span * 1.4, y: wrist.y + dy / length * span * 1.4 }, angle: Math.atan2(-dy, dx) * 180 / Math.PI }
}
export function swordGuard(pose: P[], hand: 15 | 16) {
  const blade = swordPose(pose, hand), width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  return !!blade && pose[hand].y < pose[0].y + width * .6 && Math.min(Math.abs(blade.angle - 45), Math.abs(blade.angle - 135)) <= 20
}
export function slashTrail(frames: PoseFrame[], hand: 15 | 16) {
  const at = frames.at(-1)?.at ?? 0
  return frames.filter(f => at - f.at <= 1000).map(f => swordPose(f.pose, hand)?.tip ?? null)
}
export function cutEfficiency(points: (P | null)[]) {
  const visible = points.filter((p): p is P => p !== null)
  if (visible.length < 3) return null
  const travelled = visible.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - visible[i].x, p.y - visible[i].y), 0)
  if (travelled < .02) return null
  const start = visible[0], end = visible.at(-1)!
  return Math.round(Math.min(100, Math.hypot(end.x - start.x, end.y - start.y) / travelled * 100))
}
export function rhythmTarget(seconds: number, bpm: number) {
  const period = 60 / Math.max(40, Math.min(140, Number.isFinite(bpm) ? bpm : 80))
  const beat = Math.round(seconds / period)
  return { x: .5 + Math.sin(beat * Math.PI / 2) * .12, y: .4, beat, errorMs: Math.abs(seconds - beat * period) * 1000, period }
}
export function rhythmHit(seconds: number, bpm: number, point: P, span: number) {
  const target = rhythmTarget(seconds, bpm)
  return { timing: Math.round(Math.max(0, 100 - target.errorMs / 160 * 100)), precision: Math.round(Math.max(0, 100 - Math.hypot(point.x - target.x, point.y - target.y) / Math.max(.08, span) * 100)) }
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
function movementTick(state: CombatState, mode: CombatMode, pose: P[], at: number, swordHand: 15 | 16 = 15, slipRange = .22): CombatState {
  const dt = (at - state.at) / 1000
  if (!upperVisible(pose) || pose.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) return { ...state, at, pose: null, event: false, damage: 0 }
  const centre = state.centre ?? pose[0].x, width = Math.max(.08, Math.abs(pose[11].x - pose[12].x))
  if (!state.pose || dt <= 0 || dt > .2) return { ...state, at, pose, centre, event: false, speed: 0 }
  const shift = Math.abs(pose[0].x - centre) / width, slipHeld = shift > Math.max(.1, Math.min(.4, slipRange))
  const speeds = [15, 16].map(j => Math.hypot(pose[j].x - state.pose![j].x, pose[j].y - state.pose![j].y) / width / dt)
  const guard = [15, 16].some(j => Math.hypot(pose[j].x - pose[0].x, pose[j].y - pose[0].y) < width * 1.15)
  if (mode === 'sword') {
    const i = swordHand - 15, elbow = angle(pose[11 + i], pose[13 + i], pose[swordHand]), oldElbow = angle(state.pose[11 + i], state.pose[13 + i], state.pose[swordHand])
    const overhead = state.pose[swordHand].y < pose[0].y && pose[swordHand].y >= pose[0].y && pose[swordHand].y > state.pose[swordHand].y
    const thrust = oldElbow < 150 && elbow >= 150
    const event = (overhead || thrust) && speeds[i] > .3 && at - state.lastHits[i] >= 450
    const highGuard = swordGuard(pose, swordHand), elapsed = state.elapsed + dt, cycle = Math.floor(elapsed / 4)
    const resolve = elapsed % 4 >= 2.8 && cycle > state.projectile
    return { ...state, at, pose, centre, elapsed, speed: speeds[i], event, grade: event ? highGuard || overhead ? 95 : 85 : state.grade, hand: swordHand, guard: highGuard, hits: state.hits + Number(event), lastHits: state.lastHits.map((t, side) => event && side === i ? at : t), parries: state.parries + Number(resolve && highGuard), projectile: resolve ? cycle : state.projectile, move: event ? overhead ? 'Overhead strike' : 'Projected thrust' : resolve && highGuard ? 'High-guard parry' : state.move }
  }
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
    const returned = angle(state.pose[11 + i], state.pose[13 + i], state.pose[15 + i]) <= 140
    if (extended && returned && speeds[i] > .25 && at - state.lastHits[i] > 180 && (mode !== 'chain' || Math.abs(pose[15 + i].x - centre) < width)) side = i
  }
  const event = side >= 0, hand = event ? 15 + side : state.hand
  const chain = event ? (side !== state.lastSide && at - Math.max(...state.lastHits) < 1800 ? state.chain + 1 : 1) : state.chain
  const grade = event ? Math.round(Math.max(0, 100 - Math.abs(pose[hand].x - centre) / width * 35 - (guard ? 0 : 20))) : state.grade
  return { ...state, at, pose, centre, elapsed: state.elapsed + dt, slips: state.slips + (mode === 'boxing' && slipHeld && !state.slipHeld ? 1 : 0), slipHeld, hits: state.hits + Number(event), grade, lastHits: state.lastHits.map((t, i) => i === side ? at : t), lastSide: event ? side : state.lastSide, chain, event, hand, speed: Math.max(...speeds), guard }
}
export function combatTick(state: CombatState, mode: CombatMode, pose: P[], at: number, swordHand: 15 | 16 = 15, bpm = 0, defence = true, slipRange = .22): CombatState {
  if (state.bossHp <= 0 || state.hp <= 0) return { ...state, event: false, damage: 0 }
  const next = movementTick(state, mode, pose, at, swordHand, slipRange)
  if (!next.pose) return next
  const width = Math.max(.08, Math.abs(pose[11].x - pose[12].x)), slope = (pose[12].y - pose[11].y) / width
  const neutralSlope = state.neutralSlope ?? slope, aligned = Math.abs(slope - neutralSlope) < .2
  const cycle = Math.floor(next.elapsed / 5), resolve = next.elapsed >= 5 && next.elapsed % 5 >= 3.5 && cycle > state.attack
  const shield = aligned && (mode === 'sword' || mode === 'chain' ? next.guard : mode === 'boxing' ? cycle % 2 ? next.slipHeld : next.guard : true)
  const swordMiss = mode === 'sword' && next.projectile > state.projectile && !next.guard
  const hurt = defence && ((resolve && mode !== 'sword' && !shield) || swordMiss)
  const targetPoint = mode === 'sword' ? swordPose(pose, swordHand)?.tip : pose[next.hand]
  const rhythm = bpm > 0 && next.event && targetPoint ? rhythmHit(next.elapsed, bpm, targetPoint, Math.abs(pose[11].x - pose[12].x)) : null
  const damage = next.event && (next.grade ?? 0) >= 70 && (!rhythm || rhythm.timing >= 50 && rhythm.precision >= 50) ? Math.round(35 * Math.min(2, 1 + next.chain * .05) * (1 + Math.min(.5, next.speed * .1)) * ((next.grade ?? 0) >= 90 ? 1.5 : 1)) : 0
  return { ...next, damage, bossHp: Math.max(0, state.bossHp - damage), hp: Math.max(0, state.hp - (hurt ? 10 : 0)), attack: resolve ? cycle : state.attack, neutralSlope, shield }
}
