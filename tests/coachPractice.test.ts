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

import { emptyTempo, tempoTick, practicePhase } from '../src/features/workout/coachPractice'
test('reference tempo allocates one second to lift and three to return', () => {
 expect(practicePhase(1,'1:3')).toBe(.5); expect(practicePhase(2.5,'1:3')).toBe(.75); expect(practicePhase(4,'1:3')).toBe(0)
})
test('tempo measures a full cycle and discards interrupted partial movements', () => {
 let state=emptyTempo(), last: ReturnType<typeof tempoTick>['result']=null
 for(let at=100;at<=4100;at+=100) { const t=(at-100)/1000; const metric=t<=1?180-90*t:90+90*(t-1)/3; const tick=tempoTick(state,metric,at,110,160,'1:3'); state=tick.state; if(tick.result) last=tick.result }
 expect(last).not.toBeNull(); expect(last!.lift).toBeCloseTo(1,1); expect(last!.lower).toBeGreaterThan(2); expect(last!.score).toBeGreaterThan(85)
 const partial=tempoTick(emptyTempo(),180,100,110,160,'1:3'); const bent=tempoTick(partial.state,90,200,110,160,'1:3'); expect(tempoTick(bent.state,180,1500,110,160,'1:3').result).toBeNull()
})
