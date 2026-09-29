import { buildLoopFrames, checkLoop, LOOP_START } from '../src/features/code/loopDebuggerModel'

test('step-through frames expose checks, visits, and a final state', () => {
  const fixed = { start: 0 as const, comparison: '<' as const, step: 1 as const }
  const frames = buildLoopFrames(fixed)
  expect(frames.map((item) => item.phase)).toEqual(['check', 'visit', 'check', 'visit', 'check', 'visit', 'check', 'done'])
  expect(frames[frames.length - 1].visited).toEqual([0, 1, 2])
  expect(checkLoop(fixed).pass).toBe(true)
  expect(checkLoop(LOOP_START).actual).toEqual([0, 1, 2, 3])
})
