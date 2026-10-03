import { defaults } from '../src/model'
import { personalRange, readUpper, referencePose, RepCounter, RULES, upperPose, type Exercise } from '../src/features/workout/formModel'
import { emptyMotion, motionTick } from '../src/features/workout/coachMetrics'
import { boxingTick, emptyBoxing, emptyFlow, emptyReaction, flowTick, formXP, reactionTick, rhythmGrade } from '../src/features/workout/coachAnalysis'
import { calibrateDepth, fuseDepth } from '../src/features/workout/CoachSecondary'
import { heartRate, vibrationBytes } from '../src/features/workout/CoachWearables'
import { coachMarkdown, readCoachHistory, recoverySuggestion, saveCoachSession, type CoachSession } from '../src/features/workout/coachHistory'
import { readGhost, saveGhost } from '../src/features/workout/coachReplay'
import { awardCoachSet } from '../src/features/workout/coachRewards'
const session = (): CoachSession => ({ id: 'set', exercise: 'seatedTwist', at: new Date(2026, 9, 3, 12).getTime(), seconds: 60, reps: 10, score: 95, joules: 2000, kcal: 2, power: 33, peak: 2, leftWork: 1000, rightWork: 1000, leftAngle: 95, rightAngle: 96, range: personalRange(120, 170), compensation: .1 })
beforeEach(() => localStorage.clear())

test('personal range counts a limited-motion rep against its own attainable baseline', () => {
  const counter = new RepCounter('wheelchairDip'); counter.range = personalRange(125, 165)
  expect(counter.range).not.toBeNull(); expect(personalRange(160, 165)).toBeNull()
  counter.push({ metric: 165, faults: [], label: '' }, 0)
  counter.push({ metric: 125, faults: [], label: '' }, 1000)
  expect(counter.push({ metric: 165, faults: [], label: '' }, 2000)?.score).toBe(100)
})
test('new seated presets have exercise storage IDs and count their reference cycles', () => {
  for (const ex of ['seatedPress', 'chestFly'] as Exercise[]) {
    const counter = new RepCounter(ex)
    for (let i = 0; i <= 160; i++) counter.push(readUpper(ex, upperPose(ex, i / 80 % 1)), i * 50)
    expect(RULES[ex].upper).toBe(true); expect(counter.reps.length).toBeGreaterThanOrEqual(2)
  }
})
test('seated calorie proxy differs from standing while work remains based on the same arm motion', () => {
  const pose = upperPose('boxing', 0), moved = pose.map(p => ({ ...p })); moved[15].x += .1
  const first = motionTick(emptyMotion(), pose, undefined, 1000, 70, .4)
  const seated = motionTick(first, moved, undefined, 1100, 70, .4, true)
  const standing = motionTick(first, moved, undefined, 1100, 70, .4, false)
  expect(seated.kcal).toBeLessThan(standing.kcal); expect(seated.joules).toBe(standing.joules)
  expect(seated.leftWork).toBeGreaterThan(seated.rightWork)
})
test('combo consistency grades regular intervals above uneven strikes', () => {
  expect(rhythmGrade([0, 500, 1000, 1500])?.score).toBe(100)
  expect(rhythmGrade([0, 200, 1100, 1400])!.score).toBeLessThan(80)
  expect(rhythmGrade([0, 500])).toBeNull()
})
test('Tai Chi flow does not grant a perfect score while motion is absent', () => {
  expect(flowTick(emptyFlow(), { ...emptyMotion(), at: 1000 }).score).toBeNull()
  expect(referencePose('taiChi', .2, 'Yang')[15]).not.toEqual(referencePose('taiChi', .2, 'Chen')[15])
})
test('boxing lead-side straight extension is classified once, with either hand supported', () => {
  let state = boxingTick(emptyBoxing(), upperPose('boxing', 0), 1000)
  state = boxingTick(state, upperPose('boxing', .25), 1100)
  expect(state.strike).toBe('Jab'); expect(state.counts.Jab).toBe(1)
  expect(boxingTick(state, upperPose('boxing', .25), 1150).counts.Jab).toBe(1)
})
test('reaction onset begins after a visual cue and records hand initiation', () => {
  const pose = upperPose('boxing', 0), moved = pose.map(p => ({ ...p })); moved[15].x += .02
  const waiting = reactionTick(emptyReaction(), pose, pose, 1000)
  const cue = reactionTick(waiting, pose, pose, 4000)
  expect(cue.cueAt).toBe(4000); expect(cue.elapsed).toBeNull()
  expect(reactionTick(cue, moved, pose, 4100).elapsed).toBe(100)
})
test('two-camera depth only uses fresh calibrated visible side landmarks', () => {
  const front = upperPose('boxing', 0), side = upperPose('boxing', 0), calibration = calibrateDepth(front, side)
  side[15].x += .1
  expect(fuseDepth(front, { at: 1000, pose: side }, calibration, 1050)[15].z).toBeCloseTo(side[15].x - .5)
  expect(fuseDepth(front, { at: 1000, pose: side }, calibration, 1400)).toBe(front)
  side[15].visibility = 0
  expect(fuseDepth(front, { at: 1000, pose: side }, calibration, 1050)[15]).toBe(front[15])
})
test('perfect-form XP compounds but poor form and long gaps break its streak', () => {
  expect(formXP([{ score: 95, at: 1000 }, { score: 95, at: 2000 }, { score: 95, at: 3000 }]).xp).toBeGreaterThan(15)
  expect(formXP([{ score: 95, at: 1000 }, { score: 70, at: 2000 }, { score: 95, at: 3000 }]).xp).toBe(10)
  expect(formXP([{ score: 95, at: 1000 }, { score: 95, at: 8000 }]).streak).toBe(1)
})
test('RPG set awards are idempotent and tolerate invalid or extreme values', () => {
  const data = defaults(), reward = { id: 'camera-set', xp: 25, damage: 5 }
  const next = awardCoachSet(data, reward, session().at)
  expect(next.rpg.ledger['coach:camera-set'].exp).toBe(25)
  expect(awardCoachSet(next, reward)).toBe(next)
  expect(awardCoachSet(data, { id: 'bad', xp: NaN, damage: Infinity })).toBe(data)
})
test('history export includes personal thresholds and rejects malformed storage', () => {
  saveCoachSession(session()); expect(readCoachHistory()).toHaveLength(1)
  expect(coachMarkdown(readCoachHistory())).toContain('Estimated work: 2000.00 J')
  expect(coachMarkdown(readCoachHistory())).toContain('rep triggers')
  localStorage.setItem('bloom-coach-history-v1', '[{"exercise":"invalid"}]'); expect(readCoachHistory()).toEqual([])
})
test('recovery suggestion uses the previous local day rather than arbitrary older sessions', () => {
  expect(recoverySuggestion([session()], new Date(2026, 9, 4, 10).getTime())?.exercise).toBe('taiChi')
  expect(recoverySuggestion([session()], new Date(2026, 9, 6, 10).getTime())).toBeNull()
})
test('ghost recordings are bounded, retain the best score, and reject corrupt poses', () => {
  const frames = Array.from({ length: 300 }, (_, i) => ({ at: i * 50, pose: upperPose('boxing', i / 80 % 1), score: 95 }))
  saveGhost('boxing', frames, 95, 20); saveGhost('boxing', frames, 70, 10)
  expect(readGhost('boxing', 'form')?.score).toBe(95); expect(readGhost('boxing', 'form')!.frames.length).toBeLessThanOrEqual(80)
  localStorage.setItem('bloom-coach-ghost-boxing-form', '{"score":95,"power":20,"frames":[{"at":0,"pose":[]}]}')
  expect(readGhost('boxing', 'form')).toBeNull()
})
test('heart-rate parsing supports 8/16-bit values and rejects no-contact/truncated data', () => {
  expect(heartRate(new DataView(new Uint8Array([0, 80]).buffer))).toBe(80)
  expect(heartRate(new DataView(new Uint8Array([1, 150, 0]).buffer))).toBe(150)
  expect(heartRate(new DataView(new Uint8Array([4, 80]).buffer))).toBeNull()
  expect(heartRate(new DataView(new Uint8Array([1, 80]).buffer))).toBeNull()
  expect([...vibrationBytes('01 7f')]).toEqual([1, 127]); expect(() => vibrationBytes('oops')).toThrow()
})
