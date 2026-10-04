import { emptyGesture, gestureTarget, gestureTick } from '../src/features/workout/coachMetrics'
const targets = [{ id: 'log', left: 0, right: 100, top: 0, bottom: 60 }, { id: 'finish', left: 120, right: 220, top: 0, bottom: 60 }]
test('button borders and the gap never activate neighboring actions', () => {
  for (const x of [0, 4, 96, 105, 115, 124, 216]) expect(gestureTarget([{ x, y: 30 }], targets).id).toBeNull()
  expect(gestureTarget([{ x: 50, y: 30 }], targets).id).toBe('log')
})
test('two hands on different buttons are ambiguous regardless of button order', () => {
  const hands = [{ x: 50, y: 30 }, { x: 170, y: 30 }]
  expect(gestureTarget(hands, targets)).toEqual({ id: null, ambiguous: true })
  expect(gestureTarget(hands, [...targets].reverse())).toEqual({ id: null, ambiguous: true })
})
test('either hand may select a target and two hands on the same button remain unambiguous', () => {
  expect(gestureTarget([{ x: 50, y: 30 }, { x: 60, y: 35 }], targets)).toEqual({ id: 'log', ambiguous: false })
  expect(gestureTarget([{ x: -100, y: 30 }, { x: 170, y: 30 }], targets).id).toBe('finish')
})
test('invalid and missing hand positions never select an action', () => {
  expect(gestureTarget([], targets).id).toBeNull()
  expect(gestureTarget([{ x: NaN, y: 30 }, { x: 50, y: Infinity }], targets).id).toBeNull()
})
test('a newly revealed button cannot fire until the hand leaves all buttons', () => {
  const fired = gestureTick(emptyGesture(), 'finish', 3)
  expect(fired.action).toBe('finish')
  expect(gestureTick(fired.state, 'confirmFinish', 5).action).toBeNull()
  const briefExit = gestureTick(fired.state, null, .2)
  expect(gestureTick(briefExit.state, 'confirmFinish', 5).action).toBeNull()
  const rearmed = gestureTick(fired.state, null, .6)
  expect(gestureTick(rearmed.state, 'confirmFinish', 3).action).toBe('confirmFinish')
})
test('custom dwell durations reset when the selected target changes', () => {
  const partial = gestureTick(emptyGesture(), 'log', 1.5, 2)
  expect(partial.action).toBeNull()
  expect(gestureTick(partial.state, 'finish', .6, 2).action).toBeNull()
  expect(gestureTick(partial.state, 'log', .6, 2).action).toBe('log')
  expect(gestureTick(emptyGesture(), 'log', 3, 5).action).toBeNull()
})
