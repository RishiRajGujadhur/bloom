import { readUpper, upperPose, RepCounter } from '../src/features/workout/formModel'
import { exerciseGuide } from '../src/features/workout/coachPractice'
test('seated curls count a complete flex-and-return cycle and support one arm', () => {
 const counter = new RepCounter('bicepCurl')
 for (let i=0;i<=80;i++) { const pose=upperPose('bicepCurl',i/80); const other=upperPose('bicepCurl',0); [12,14,16].forEach(j=>{pose[j]=other[j]}); counter.push(readUpper('bicepCurl',pose),i*50) }
 expect(counter.reps).toHaveLength(1)
 expect(counter.reps[0].score).toBeGreaterThanOrEqual(90)
})
test('curl elbow drift receives a specific correction', () => {
 const pose=upperPose('bicepCurl',.5); pose[13].x-=.2
 expect(readUpper('bicepCurl',pose).faults).toContain('Keep elbows near your sides')
 expect(exerciseGuide('bicepCurl').camera).toContain('seated support')
})

test('seated lateral raises count arm elevation rather than elbow bends', () => {
 const counter = new RepCounter('lateralRaise')
 for (let i=0;i<=80;i++) counter.push(readUpper('lateralRaise',upperPose('lateralRaise',i/80)),i*50)
 expect(counter.reps).toHaveLength(1)
 expect(readUpper('lateralRaise',upperPose('lateralRaise',.5)).metric).toBeCloseTo(90)
})
