import { referencePose, type Lineage } from './formModel'
import type { CombatMode } from './cameraCombatModel'
export function arcadeReferencePose(activity: CombatMode, phase: number, lineage: Lineage = 'Yang') {
  const pose = referencePose(activity === 'cloud' ? 'taiChi' : activity === 'boxing' || activity === 'chain' ? 'boxing' : 'seatedPress', activity === 'chain' ? phase * 2 % 1 : phase, lineage)
  const wave = (offset: number) => (1 - Math.cos((phase + offset) * Math.PI * 2)) / 2
  if (activity === 'ropes' || activity === 'doubleRopes') for (let i = 0; i < 2; i++) {
    pose[13 + i] = { x: i ? .68 : .32, y: .46, z: 0, visibility: 1 }
    pose[15 + i] = { x: i ? .7 : .3, y: .28 + .33 * wave(activity === 'ropes' ? i / 2 : 0), z: 0, visibility: 1 }
  }
  if (activity === 'sword') { pose[13] = { x: .4, y: .39, z: 0, visibility: 1 }; pose[15] = { x: .43 + .1 * Math.sin(phase * Math.PI * 2), y: pose[0].y - .1 + .48 * wave(0), z: 0, visibility: 1 } }
  if (["ropes", "doubleRopes", "sword"].includes(activity)) for (const wrist of [15, 16]) for (const offset of [2, 4, 6]) pose[wrist + offset] = { ...pose[wrist], y: pose[wrist].y + .015 }
  return pose
}
