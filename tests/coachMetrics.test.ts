import { alignment, demoPose, exerciseVisible, readUpper, RepCounter, RULES, upperBaseline, upperPose, upperVisible, type Exercise } from '../src/features/workout/formModel'
import { emptyGesture, emptyMotion, gestureTick, motionTick } from '../src/features/workout/coachMetrics'
import { liftById, progress, volume } from '../src/features/workout/workoutModel'

test('accessible exercises do not require any lower-body landmark', () => {
  const pose = upperPose('seatedTwist', .5)
  expect(upperVisible(pose)).toBe(true)
  for (const ex of ['seatedTwist', 'chairPushup', 'wheelchairDip', 'taiChi', 'boxing', 'karate', 'kungFu'] as Exercise[]) {
    expect(readUpper(ex, pose).faults).toEqual([])
    expect(liftById(RULES[ex].liftId)).toBeDefined()
  }
  pose[15].visibility = .1
  expect(upperVisible(pose)).toBe(false)
})

test('seated reps and blocks count full cycles; boxing accepts either striking arm', () => {
  for (const ex of ['seatedTwist', 'wheelchairDip', 'chairPushup', 'boxing', 'karate'] as Exercise[]) {
    const counter = new RepCounter(ex)
    for (let i = 0; i <= 160; i++) counter.push(readUpper(ex, upperPose(ex, i / 80 % 1), upperBaseline(upperPose(ex, 0))), i * 50)
    expect(counter.reps.length).toBeGreaterThanOrEqual(2)
  }
})

test('alignment is relative to the user neutral pose and tolerates natural asymmetry', () => {
  const pose = upperPose('seatedTwist', 0)
  pose[11].y -= .03
  const baseline = upperBaseline(pose)
  expect(alignment(pose, baseline)?.alert).toBe(false)
  expect(alignment(pose, baseline)?.value).toBeCloseTo(0)
  pose[11].y -= .1
  expect(alignment(pose, baseline)?.alert).toBe(true)
  expect(alignment([], baseline)).toBeNull()
})

test('whole-body exercises still work from the visible side and need lower joints', () => {
  const pose = demoPose('pushup', 0)
  pose[12].visibility = 0; pose[14].visibility = 0; pose[16].visibility = 0
  expect(exerciseVisible('pushup', pose)).toBe(true)
  expect(exerciseVisible('squat', upperPose('seatedTwist', 0))).toBe(false)
})

test('motion estimates react to either hand and exclude body translation and tracking gaps', () => {
  const pose = upperPose('boxing', 0)
  const first = motionTick(emptyMotion(), pose, undefined, 1000, 70, .4)
  const moving = pose.map((p) => ({ ...p })); moving[16].x += .06
  const next = motionTick(first, moving, undefined, 1100, 70, .4)
  expect(next.right).toBeGreaterThan(next.left)
  expect(next.watts).toBeGreaterThan(0)
  expect(next.kcal).toBeGreaterThan(0)
  const shifted = pose.map((p) => ({ ...p, x: p.x + .1, y: p.y + .1 }))
  expect(motionTick(first, shifted, undefined, 1100, 70, .4).watts).toBe(0)
  const missing = motionTick(next, [], undefined, 1200, 70, .4)
  expect(missing.watts).toBe(0)
  expect(missing.kcal).toBe(next.kcal)
  expect(motionTick(missing, moving, undefined, 1600, 70, .4).watts).toBe(0)
})

test('world velocity uses metres without fallback shoulder-scale changes', () => {
  const pose = upperPose('boxing', 0)
  const first = motionTick(emptyMotion(), pose, pose, 1000, 70, .3)
  const moved = pose.map((p) => ({ ...p })); moved[15].x += .1
  const left = motionTick(first, pose, moved, 1100, 70, .3)
  const right = motionTick(first, pose, moved, 1100, 70, .6)
  expect(left.source).toBe('world')
  expect(left.left).toBe(right.left)
})

test('hover requires 2.8 seconds, cannot repeat while held, and resets on another button', () => {
  const partial = gestureTick(emptyGesture(), 'log', 1)
  expect(partial.action).toBeNull()
  const different = gestureTick(partial.state, 'finish', 1)
  expect(different.progress).toBeCloseTo(1 / 2.8)
  const fired = gestureTick(partial.state, 'log', 1.9)
  expect(fired.action).toBe('log')
  expect(gestureTick(fired.state, 'log', 4).action).toBeNull()
  const released = gestureTick(fired.state, null, .6)
  expect(gestureTick(released.state, 'log', 3).action).toBe('log')
})

test('timed coach logs retain seconds and are excluded from lifting volume and max charts', () => {
  const set = { liftId: 'taichiflow', weight: 0, reps: 30, seconds: 30, at: 1 }
  expect(volume([set], 70)).toBe(0)
  expect(progress([{ id: 'session', templateId: 'coach', name: 'Coach', startedAt: 1, sets: [set] }], 'taichiflow', 70)).toEqual([])
})
