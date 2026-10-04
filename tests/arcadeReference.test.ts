import { arcadeReferencePose } from '../src/features/workout/arcadeReference'
import { combatTick, newCombat, type CombatMode } from '../src/features/workout/cameraCombatModel'

test.each(['ropes', 'doubleRopes', 'sword'] as CombatMode[])('the %s reference demonstrates countable movement', mode => {
  let state = newCombat(60)
  for (let i = 0; i < 80; i++) state = combatTick(state, mode, arcadeReferencePose(mode, i / 40 % 1), 1000 + i * 100, 15, 0, false)
  expect(state.hits).toBeGreaterThan(0)
  expect(state.bossHp).toBeLessThan(state.bossMax)
})

test('rope guides distinguish alternating hands from synchronized double slams', () => {
  const alternating = arcadeReferencePose('ropes', 0), synchronized = arcadeReferencePose('doubleRopes', 0)
  expect(Math.abs(alternating[15].y - alternating[16].y)).toBeGreaterThan(.2)
  expect(synchronized[15].y).toBe(synchronized[16].y)
  for (const pose of [alternating, synchronized]) for (const index of [15, 16]) expect(Math.abs(pose[index + 4].y - pose[index].y)).toBeLessThan(.03)
})
