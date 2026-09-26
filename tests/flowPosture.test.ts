import { classifyKey, fingerprint, ridgePoints } from '../src/features/flow/flowModel'
import { idleClock, isSlouching, measure, postureTick, score } from '../src/features/posture/postureModel'
import { defaults } from '../src/model'
import { totals } from '../src/rpg/engine'

test('keys are classified by kind only; shortcuts are ignored', () => {
  expect(classifyKey('a', false)).toBe('char')
  expect(classifyKey('Enter', false)).toBe('char')
  expect(classifyKey('Backspace', false)).toBe('delete')
  expect(classifyKey('ArrowLeft', false)).toBeNull()
  expect(classifyKey('b', true)).toBeNull()
})

test('fast steady typing builds peaks; pauses and backspaces carve valleys', () => {
  const strokes = [
    // 3 s of fast typing (~12 chars per 1.5 s window)
    ...Array.from({ length: 24 }, (_, i) => ({ t: i * 125, kind: 'char' as const })),
    // a 4.5 s pause, then heavy editing
    ...Array.from({ length: 6 }, (_, i) => ({ t: 7500 + i * 200, kind: 'delete' as const })),
    ...Array.from({ length: 3 }, (_, i) => ({ t: 8800 + i * 150, kind: 'char' as const })),
  ]
  const fp = fingerprint(strokes)!
  expect(fp.h[0]).toBeGreaterThan(0.8)
  expect(Math.min(...fp.h.slice(2, 4))).toBeLessThan(0.3)
  expect(Math.max(...fp.r)).toBeGreaterThan(0.5)
  expect(fp.wpm).toBeGreaterThan(40)
  expect(fingerprint(strokes.slice(0, 3))).toBeNull()
  const flat = ridgePoints({ h: [0.5, 0.5], r: [0, 0] }, 100, 50)
  const jagged = ridgePoints({ h: [0.5, 0.5], r: [0.9, 0] }, 100, 50)
  expect(jagged.length).toBeGreaterThan(flat.length)
})

const pose = (earY: number, leftShoulderY = 0.6) => {
  const points = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 1 }))
  points[7] = { x: 0.45, y: earY, visibility: 1 }
  points[8] = { x: 0.55, y: earY, visibility: 1 }
  points[11] = { x: 0.35, y: leftShoulderY, visibility: 1 }
  points[12] = { x: 0.65, y: 0.6, visibility: 1 }
  return points
}

test('posture score drops when the head sinks toward the shoulders', () => {
  const base = measure(pose(0.3))!
  expect(score(base, base)).toBe(100)
  const slumped = measure(pose(0.45))!
  expect(isSlouching(score(slumped, base))).toBe(true)
  expect(isSlouching(score(measure(pose(0.31))!, base))).toBe(false)
})

test('slouching warns after 5 minutes, then poisons every 2; good posture earns stamina', () => {
  const min = 60000
  let clock = { ...idleClock }
  const events: string[] = []
  for (let t = 0; t <= 9 * min; t += min) {
    const tick = postureTick(clock, { at: t, score: 40, slouching: true })
    clock = tick.clock
    events.push(...tick.events.map((e) => e.type))
  }
  expect(events).toEqual(['warn', 'poison', 'poison'])
  const good = postureTick(clock, { at: 10 * min, score: 90, slouching: false })
  expect(good.events.map((e) => e.type)).toEqual(['recovered'])
  let c = good.clock
  const staminas: string[] = []
  for (let t = 11 * min; t <= 31 * min; t += min) {
    const tick = postureTick(c, { at: t, score: 90, slouching: false })
    c = tick.clock
    staminas.push(...tick.events.map((e) => e.type))
  }
  expect(staminas).toEqual(['stamina'])
})

test('poison lowers HP and stamina restores it (never above 100)', () => {
  const rpg = defaults().rpg
  rpg.posture = [
    { at: 1, kind: 'poison', amount: 3 },
    { at: 2, kind: 'poison', amount: 3 },
    { at: 3, kind: 'stamina', amount: 1 },
  ]
  expect(totals(rpg).hp).toBe(95)
})
