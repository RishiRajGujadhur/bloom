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

import { poseReadiness } from '../src/features/workout/coachPractice'
test('readiness ignores legs in seated mode but rejects off-picture wrists', () => {
 const pose=upperPose('bicepCurl',0); expect(poseReadiness('bicepCurl',pose,true).ready).toBe(true)
 pose[15].x=1.1; expect(poseReadiness('bicepCurl',pose,true).ready).toBe(false)
 pose[15].x=.4; pose[15].visibility=.2; expect(poseReadiness('bicepCurl',pose,true).message).toContain('both arms')
})

import { practiceSummary } from '../src/features/workout/coachPractice'
test('set recaps compare the same exercise and aggregate the current local day', () => {
 const now=new Date(2026,9,4,12).getTime(); const rows=[{exercise:'bicepCurl' as const,at:now-1000,reps:8,seconds:30,score:85},{exercise:'bicepCurl' as const,at:now,reps:10,seconds:40,score:95},{exercise:'boxing' as const,at:now,reps:99,seconds:20,score:50}]
 expect(practiceSummary(rows,'bicepCurl',now)).toMatchObject({sets:2,reps:18,change:10})
 expect(practiceSummary(rows,'lateralRaise',now)).toBeNull()
})

import { liftById } from '../src/features/workout/workoutModel'
test('new seated movements have workout-history and muscle catalog entries', () => {
 expect(liftById('seatedbicepcurl')?.muscles).toContain('biceps')
 expect(liftById('seatedlateralraise')?.muscles).toContain('shoulders')
})

import { coachMarkdown, readCoachHistory, type CoachSession } from '../src/features/workout/coachHistory'
test('tempo exports use real lines and corrupt optional timing values are rejected', () => {
 const row: CoachSession = { id:'tempo', exercise:'bicepCurl', at:1, seconds:40, reps:10, score:95, joules:1, kcal:1, power:1, peak:1, leftWork:1, rightWork:1, leftAngle:90, rightAngle:90, range:null, compensation:0, tempoScore:95, liftSeconds:1, returnSeconds:3 }
 expect(coachMarkdown([row])).toContain('Tempo score: 95%\n- Lift / return timing: 1.0 / 3.0 s')
 localStorage.setItem('bloom-coach-history-v1',JSON.stringify([{...row,liftSeconds:'bad'}]))
 expect(readCoachHistory()).toHaveLength(0)
 localStorage.removeItem('bloom-coach-history-v1')
})
