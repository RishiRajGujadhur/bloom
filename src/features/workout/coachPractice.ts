import { RULES, type Exercise } from './formModel'
export function exerciseGuide(ex: Exercise) {
  const upper = RULES[ex].upper
  const camera = upper ? 'Position the camera near chest height with your head and both arms visible. Keep your usual seated support.' : ['pushup','plank','lunge'].includes(ex) ? 'Use a side view with the joints needed for this movement visible. Keep the device steady.' : 'Keep your hips, knees and ankles visible. A slight side angle can make depth easier to see.'
  const watch = ex === 'bicepCurl' ? 'Let the elbows stay near your torso instead of swinging them outward.' : ex === 'boxing' ? 'Return each hand to your comfortable guard before the next punch.' : ex === 'seatedTwist' ? 'Let your shoulders turn gently; avoid leaning to manufacture extra range.' : upper ? 'Keep your torso steady and work within your comfortable arm range.' : ex === 'plank' || ex === 'pushup' ? 'Avoid letting your hips sag or rise sharply.' : 'Move smoothly; let your knees follow your foot direction.'
  return { camera, move: RULES[ex].tip, watch }
}
