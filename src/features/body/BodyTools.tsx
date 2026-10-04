import { lazy, Suspense, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { logActivity } from '../../components/studio/Studio'
import { supportedBodyExercise, useCurrentPractice } from './bodyPractice'
import { setBodySeated, useBodySeated, setBodySilent, useBodySilent } from './bodyPreferences'
import { RULES } from '../workout/formModel'
import '../workout/formcoach.css'
import './bodyTools.css'

const FormCoach = lazy(() => import('../workout/FormCoach').then(module => ({ default: module.FormCoach })))
export const BODY_PAGES: Record<string, { title: string; feature: string }> = {
  exercises: { title: 'Exercises', feature: 'exerciseGuides' }, workouts: { title: 'Workouts', feature: 'workoutLog' },
  intervals: { title: 'Intervals', feature: 'intervalCoach' }, yoga: { title: 'Yoga', feature: 'yogaFlow' },
  stretch: { title: 'Stretch', feature: 'mobility' }, run: { title: 'Run & walk', feature: 'runTracker' },
  body: { title: 'Body progress', feature: 'bodyProgress' }, eyes: { title: 'Eye care', feature: 'eyeCare' },
  daylight: { title: 'Daylight', feature: 'daylight' }, dojo: { title: 'Dojo', feature: 'dojo' },
  readiness: { title: 'Readiness', feature: 'readinessScan' }, taichi: { title: 'Tai Chi', feature: 'wuXing' },
  posture: { title: 'Posture', feature: 'postureGuard' },
}

export function BodyTools({ page, features }: { page: string; features: Record<string, boolean> }) {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const practice = useCurrentPractice(page)
  const seated = useBodySeated()
  const silent = useBodySilent()
  const selected = supportedBodyExercise(page, practice?.movement ?? '')
  const meta = BODY_PAGES[page]
  if (!meta || !features[meta.feature]) return null
  return <div className="body-tools">
    <button ref={trigger} type="button" className="body-tool-button" onClick={() => setOpen(true)}><Camera size={16} /> Camera pose coach</button>
    <label className="body-tool-preference"><input type="checkbox" checked={seated} onChange={event => setBodySeated(event.target.checked)} /> Seated / wheelchair mode</label>
    <label className="body-tool-preference"><input type="checkbox" checked={silent} onChange={event => setBodySilent(event.target.checked)} /> Silent body cues</label>
    {open && <div className="body-coach-backdrop"><section className="body-coach-dialog" role="dialog" aria-modal="true" aria-label={`${meta.title} camera pose coach`}>
      <header><h2>{meta.title} · camera pose coach</h2><button type="button" className="body-tool-button" aria-label="Close camera pose coach" onClick={() => setOpen(false)}><X size={18} /> Close</button></header>
      <p>{practice?.label ?? meta.title}. Camera access starts only when you choose Start camera. Your video stays on this device.</p>
      <Suspense fallback={<p role="status">Loading camera coach…</p>}><FormCoach initialExercise={selected && (!seated || RULES[selected].upper) ? selected : 'observe'} onLog={(liftId, reps, seconds) => logActivity('bodyCoach', { page, liftId, reps, seconds })} /></Suspense>
    </section></div>}
  </div>
}
