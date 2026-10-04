import { upperPose } from '../src/features/workout/formModel'
import { combatTick, cloudGrade, cutEfficiency, newCombat, rhythmHit, ropeMotion, slashTrail, swordGuard, swordPose } from '../src/features/workout/cameraCombatModel'
import { battleDrop, readBattles, saveBattle } from '../src/features/workout/cameraBattleHistory'
import { awardCoachSet } from '../src/features/workout/coachRewards'
import { defaults, dataSchema } from '../src/model'
const pose = () => upperPose('boxing', 0).map(p => ({ ...p, visibility: 1 }))
beforeEach(() => localStorage.clear())
test('lost or stale frames never advance battle time or deal damage', () => {
  const initial = combatTick(newCombat(), 'chain', pose(), 1000)
  expect(combatTick(initial, 'chain', [], 1100).pose).toBeNull()
  const stale = combatTick(initial, 'chain', pose(), 4000)
  expect(stale.elapsed).toBe(0); expect(stale.hits).toBe(0); expect(stale.bossHp).toBe(initial.bossHp)
})
test('completed or lost battles cannot continue farming damage', () => {
  for (const state of [{ ...newCombat(), bossHp: 0 }, { ...newCombat(), hp: 0 }]) expect(combatTick(state, 'boxing', pose(), 2000).damage).toBe(0)
})
test('alternating centre-line punches count once per extension and damage the boss', () => {
  const p = pose(); p[0] = { x: .5, y: .2 }; p[11] = { x: .35, y: .4 }; p[12] = { x: .65, y: .4 }; p[13] = { x: .45, y: .52 }; p[14] = { x: .55, y: .52 }; p[15] = { x: .37, y: .35 }; p[16] = { x: .5, y: .35 }
  const ready = combatTick(newCombat(), 'chain', p, 1000), left = p.map(j => ({ ...j })); left[15] = { x: .55, y: .64 }
  const hit = combatTick(ready, 'chain', left, 1100); expect(hit.hits).toBe(1); expect(hit.damage).toBeGreaterThan(0)
  const right = p.map(j => ({ ...j })); right[15] = { x: .5, y: .35 }; right[16] = { x: .45, y: .64 }
  const combo = combatTick(hit, 'chain', right, 1200); expect(combo.hits).toBe(2); expect(combo.chain).toBe(2)
  expect(combatTick(combo, 'chain', right, 1300).hits).toBe(2)
})
test('double rope slams count a synchronized downward crossing once', () => {
  const p = pose(); p[15].y = .3; p[16].y = .3; p[13].y = .5; p[14].y = .5
  const ready = combatTick(newCombat(), 'doubleRopes', p, 1000), down = p.map(j => ({ ...j })); down[15].y = .55; down[16].y = .55
  const slam = combatTick(ready, 'doubleRopes', down, 1100); expect(slam.hits).toBe(1); expect(slam.power).toBeGreaterThan(0)
  expect(combatTick(slam, 'doubleRopes', down, 1200).hits).toBe(1)
})
test('idle Cloud Hands receive no flow grade; asymmetric speed grades lower', () => {
  const p = pose(), balanced = pose(), uneven = pose()
  balanced[15].x += .005; balanced[16].x += .005; uneven[15].x += .04; uneven[16].x += .005
  expect(cloudGrade(p, p, .1)).toBeNull()
  expect(cloudGrade(p, balanced, .1)).toBeGreaterThan(cloudGrade(p, uneven, .1)!)
})
test('downward rope acceleration produces a bounded proxy, upward movement does not', () => {
  const p = pose(), moved = pose(); moved[15].y += .08; moved[16].y += .08
  const down = ropeMotion(p, moved, [0, 0], .1), up = ropeMotion(moved, p, [0, 0], .1)
  expect(down.power).toBeGreaterThan(0); expect(down.power).toBeLessThanOrEqual(1000); expect(up.power).toBe(0)
})
test('swords require visible wrist/forearm geometry, with either hand supported', () => {
  const p = pose(); expect(swordPose(p, 15)).not.toBeNull(); expect(swordPose(p, 16)).not.toBeNull()
  p[15].visibility = .1; expect(swordPose(p, 15)).toBeNull(); p[16] = { ...p[14] }; expect(swordPose(p, 16)).toBeNull()
})
test('diagonal high guards accept both blade directions and reject lowered guards', () => {
  const p = pose(); p[0] = { x: .5, y: .2 }; p[13] = { x: .3, y: .4, visibility: 1 }; p[15] = { x: .4, y: .3, visibility: 1 }
  expect(swordGuard(p, 15)).toBe(true); p[15].y = .6; expect(swordGuard(p, 15)).toBe(false)
})
test('slash trails expire after one second; straight cuts grade above zigzags', () => {
  const frames = [0, 500, 1600].map(at => ({ at, pose: pose(), score: 100 }))
  expect(slashTrail(frames, 15)).toHaveLength(1)
  expect(cutEfficiency([{ x: 0, y: 0 }, { x: .1, y: .1 }, { x: .2, y: .2 }])).toBe(100)
  expect(cutEfficiency([{ x: 0, y: 0 }, { x: .1, y: .2 }, { x: .2, y: 0 }])).toBeLessThan(100)
})
test('rhythm requires timing and spatial accuracy', () => {
  expect(rhythmHit(0, 80, { x: .5, y: .4 }, .2)).toEqual({ timing: 100, precision: 100 })
  expect(rhythmHit(.25, 80, { x: .5, y: .4 }, .2).timing).toBe(0)
  expect(rhythmHit(0, 80, { x: .9, y: .4 }, .2).precision).toBe(0)
})
test('defence is configurable; missed attacks take ten HP only once per cycle', () => {
  const p = pose(); p[15].y = .9; p[16].y = .9
  const initial = { ...newCombat(), at: 1000, elapsed: 8.45, pose: p }
  const defended = combatTick(initial, 'chain', p, 1100), gentle = combatTick(initial, 'chain', p, 1100, 15, 0, false)
  expect(defended.hp).toBe(90); expect(gentle.hp).toBe(100); expect(combatTick(defended, 'chain', p, 1150).hp).toBe(90)
})
test('demo, unfinished and failed battles cannot yield loot', () => {
  const won = { ...newCombat(), bossHp: 0, hits: 10, elapsed: 12 }
  expect(battleDrop('demo', 'sword', won, 'demo')).toBeNull()
  expect(battleDrop('unfinished', 'chain', newCombat(), 'camera')).toBeNull()
  expect(battleDrop('lost', 'chain', { ...won, hp: 0 }, 'camera')).toBeNull()
  expect(battleDrop('real', 'sword', won, 'camera')?.item).toBe('Moonlit training blade')
})
test('battle journal and inventory award exactly once and survive app validation', () => {
  const drop = battleDrop('win', 'chain', { ...newCombat(), bossHp: 0, hits: 10, elapsed: 12 }, 'camera')!
  saveBattle(drop); saveBattle(drop); expect(readBattles()).toHaveLength(1)
  const reward = { id: drop.id, damage: 0, xp: drop.xp, battle: drop }, data = awardCoachSet(defaults(), reward)
  expect(data.rpg.cameraLoot).toHaveLength(1); expect(awardCoachSet(data, reward)).toBe(data)
  expect(dataSchema.parse(data).rpg.cameraLoot).toHaveLength(1)
})
test('invalid targets fall back to a bounded boss difficulty', () => {
  expect(newCombat(Infinity).bossMax).toBe(350); expect(newCombat(1).bossMax).toBe(175); expect(newCombat(1000).bossMax).toBe(2100)
})
