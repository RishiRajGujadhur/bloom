import { gardenTick, handPoints, hoverPause, multiplier, newGarden, overPause, touchesBubble, type GardenState, type VisionBubble } from '../src/features/arcade/games/visionModel'

test('hand coordinates mirror into the same space as the camera preview', () => {
  const hand = Array.from({ length: 21 }, () => ({ x: .25, y: .5 }))
  expect(handPoints([hand, hand])).toHaveLength(12)
  expect(handPoints([hand])[0]).toEqual({ x: 600, y: 300 })
  expect(handPoints([])).toEqual([])
  const otherHand = Array.from({ length: 21 }, () => ({ x: .75, y: .5 }))
  expect(handPoints([hand, otherHand])[6]).toEqual({ x: 200, y: 300 })
})

test('touches include the fingertip radius and do not hit distant bubbles', () => {
  const bubble: VisionBubble = { id: 1, x: 200, y: 300, radius: 40, colour: 0, speed: 50, phase: 0 }
  expect(touchesBubble([{ x: 262, y: 300 }], bubble)).toBe(true)
  expect(touchesBubble([{ x: 263, y: 300 }], bubble)).toBe(false)
  expect(touchesBubble([], bubble)).toBe(false)
  expect(touchesBubble([{ x: 0, y: 0 }, { x: 200, y: 300 }], bubble)).toBe(true)
})

const bubble = (id: number, kind: VisionBubble['kind'] = 'colour', colour = 0, x = 300): VisionBubble => ({ id, kind, colour, x, y: 300, radius: 48, speed: 23, phase: 0 })
const withBubbles = (bubbles: VisionBubble[], update: Partial<GardenState> = {}): GardenState => ({ ...newGarden('colour'), spawn: 99, bubbles, ...update })
const touch = [{ x: 300, y: 300 }]

test('new bubbles are reachable immediately but have a short grace before accidental touches', () => {
  const start = gardenTick(newGarden('colour'), .1, [{ x: 400, y: 500 }], () => .5)
  expect(start.state.bubbles[0].radius).toBe(48)
  expect(start.state.bubbles[0].y).toBeLessThan(500)
  expect(start.state.score).toBe(0)
  expect(gardenTick(start.state, .61, [{ x: 400, y: 500 }], () => .5).state.score).toBe(35)
})

test('matches yield 35 points; quick streaks raise the multiplier to a capped ×4', () => {
  let state = newGarden('colour')
  for (let i = 1; i <= 14; i++) state = gardenTick({ ...state, spawn: 99, bubbles: [bubble(i, 'colour', state.target)] }, 1, touch).state
  expect(state.hits).toBe(14)
  expect(state.combo).toBe(14)
  expect(state.score).toBe(4 * 35 + 4 * 70 + 4 * 105 + 2 * 140)
  expect(multiplier(100)).toBe(4)
  state = gardenTick(state, 7, []).state
  expect(state.combo).toBe(0)
  state = gardenTick({ ...state, bubbles: [bubble(15, 'colour', state.target)] }, .1, touch).state
  expect(state.combo).toBe(1)
})

test('nonmatching colours remain intact; thorns subtract points and reset the streak', () => {
  const safe = gardenTick(withBubbles([bubble(1, 'colour', 1)], { score: 140, combo: 5, lastMatch: 0 }), .1, touch).state
  expect(safe.score).toBe(140)
  expect(safe.combo).toBe(5)
  expect(safe.bubbles).toHaveLength(1)
  const thorn = gardenTick({ ...safe, bubbles: [bubble(2, 'thorn')] }, .1, touch).state
  expect(thorn.score).toBe(105)
  expect(thorn.combo).toBe(0)
  expect(gardenTick(withBubbles([bubble(2, 'thorn')]), .1, touch).state.score).toBe(0)
})

test('pollen storms pop nearby matches and prisms but preserve distant and wrong colours', () => {
  const tick = gardenTick(withBubbles([bubble(1, 'pollen'), bubble(2, 'colour', 0, 450), bubble(3, 'prism', 2, 500), bubble(4, 'colour', 1, 420), bubble(5, 'colour', 0, 650)]), .01, touch)
  expect(tick.popped.map((b) => b.id)).toEqual([1, 2, 3])
  expect(tick.state.score).toBe(70)
  expect(tick.state.bubbles.map((b) => b.id)).toEqual([4, 5])
})

test('freeze slows motion to a quarter for eight seconds without consuming round time differently', () => {
  const frozen = gardenTick(withBubbles([bubble(1, 'freeze'), bubble(2, 'colour', 0, 600)]), .01, touch).state
  expect(frozen.freeze).toBe(8)
  const next = gardenTick(frozen, 1, []).state
  expect(frozen.bubbles[0].y - next.bubbles[0].y).toBeCloseTo(23 / 4)
  expect(next.freeze).toBe(7)
  expect(next.elapsed - frozen.elapsed).toBeCloseTo(1)
  expect(gardenTick(next, 8, []).state.freeze).toBe(0)
})

test('garden orders advance only in sequence; prisms fulfil the next colour', () => {
  let state = withBubbles([bubble(1)], { mode: 'order' })
  state = gardenTick(state, .1, touch).state
  expect(state.target).toBe(2)
  state = gardenTick({ ...state, bubbles: [bubble(2, 'colour', 1)] }, .1, touch).state
  expect(state.orderStep).toBe(1)
  state = gardenTick({ ...state, bubbles: [bubble(3, 'prism')] }, .1, touch).state
  expect(state.target).toBe(1)
  state = gardenTick({ ...state, bubbles: [bubble(4, 'colour', 1)] }, .1, touch).state
  expect(state.orders).toBe(1)
  expect(state.orderStep).toBe(0)
  expect(state.score).toBe(3 * 35 + 105)
})

test('pollen storms respect order changes instead of skipping requested colours', () => {
  const tick = gardenTick(withBubbles([bubble(1, 'pollen'), bubble(2, 'colour', 0, 420), bubble(3, 'colour', 0, 450)], { mode: 'order' }), .01, touch)
  expect(tick.state.orderStep).toBe(1)
  expect(tick.state.bubbles.map((b) => b.id)).toEqual([3])
})

test('misses reset streaks but keep points, while Zen has no timer or spawned thorns', () => {
  const state = gardenTick(withBubbles([{ ...bubble(1), y: 115 }], { score: 70, combo: 2, lastMatch: 0 }), .1, []).state
  expect(state.score).toBe(70)
  expect(state.combo).toBe(0)
  expect(gardenTick(newGarden('colour'), 90, []).state.finished).toBe(true)
  const zen = gardenTick({ ...newGarden('zen'), elapsed: 100, nextId: 12 }, .1, [], () => .5).state
  expect(zen.finished).toBe(false)
  expect(zen.bubbles[0].kind).toBe('prism')
})

test('pause hover needs a dwell, latches after one press, and rearms only after leaving', () => {
  expect(overPause([{ x: 700, y: 40 }])).toBe(true)
  expect(overPause([{ x: 600, y: 40 }])).toBe(false)
  const initial = { progress: 0, latched: false, away: 0 }
  const partial = hoverPause(initial, true, .45)
  expect(partial.toggle).toBe(false)
  expect(partial.state.progress).toBe(.5)
  const pressed = hoverPause(partial.state, true, .45)
  expect(pressed.toggle).toBe(true)
  expect(hoverPause(pressed.state, true, 5).toggle).toBe(false)
  const away = hoverPause(pressed.state, false, .5)
  expect(hoverPause(away.state, true, .91).toggle).toBe(true)
})
