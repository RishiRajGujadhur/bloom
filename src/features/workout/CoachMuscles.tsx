import { RULES, type Exercise } from './formModel'
import { liftById } from './workoutModel'
import { muscleNames } from '../exercise/exercises'
export function CoachMuscles({ exercise }: { exercise: Exercise }) {
  const muscles = liftById(RULES[exercise].liftId)?.muscles ?? []
  const color = (group: typeof muscles[number][]) => group.some(name => muscles.includes(name)) ? '#5dffc0' : '#36584b'
  return <div className="fc-diagnostics"><h4>Primary muscle groups</h4><svg viewBox="0 0 160 140" className="fc-muscle-map" role="img" aria-label={`Exercise muscle guide: ${muscles.map(name => muscleNames[name]).join(', ')}`}><circle cx="80" cy="18" r="12" fill="#36584b" /><path d="M49 42Q80 29 111 42L101 107H59Z" fill={color(['back'])} /><ellipse cx="52" cy="46" rx="16" ry="10" fill={color(['shoulders'])} /><ellipse cx="108" cy="46" rx="16" ry="10" fill={color(['shoulders'])} /><rect x="28" y="52" width="18" height="35" rx="9" fill={color(['biceps', 'triceps'])} /><rect x="114" y="52" width="18" height="35" rx="9" fill={color(['biceps', 'triceps'])} /><rect x="23" y="86" width="15" height="38" rx="7" fill={color(['forearms'])} /><rect x="122" y="86" width="15" height="38" rx="7" fill={color(['forearms'])} /><path d="M62 46H98V66H62Z" fill={color(['chest'])} /><path d="M65 72H95V103H65Z" fill={color(['abs', 'obliques'])} /></svg><p>{muscles.map(name => muscleNames[name]).join(' · ')}</p><small>Exercise guide; muscle activation is not measured by the camera.</small></div>
}
