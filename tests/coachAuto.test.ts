import { autoTick, emptyAuto } from '../src/features/workout/coachAuto'
import { upperPose, type Exercise } from '../src/features/workout/formModel'
function identify(ex: Exercise) { let state = emptyAuto(); for(let i=0;i<=100;i++) state=autoTick(state,upperPose(ex,i/100),i*40); return state }
test('recognizes a complete curl and lateral raise',()=>{expect(identify('bicepCurl').detected).toBe('bicepCurl');expect(identify('lateralRaise').detected).toBe('lateralRaise')})
test('static poses and ambiguous hand forms stay unclassified',()=>{let state=emptyAuto();for(let i=0;i<100;i++)state=autoTick(state,upperPose('bicepCurl',0),i*40);expect(state.detected).toBeNull();expect(identify('boxing').detected).toBeNull()})
test('low visibility clears the recognition window',()=>{const pose=upperPose('bicepCurl',.5);pose[15].visibility=.1;expect(autoTick({samples:[{at:0,elbow:80,elevation:0,wrist:0}],detected:null},pose,100).samples).toEqual([])})
test('recognized movement remains locked until Auto is selected again',()=>{const state=identify('bicepCurl');expect(autoTick(state,upperPose('lateralRaise',.5),5000).detected).toBe('bicepCurl')})

test('recognizes a complete overhead press',()=>{expect(identify('seatedPress').detected).toBe('seatedPress')})
