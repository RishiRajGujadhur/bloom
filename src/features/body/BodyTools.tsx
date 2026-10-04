import { lazy, Suspense, useEffect, useRef, useState } from 'react'
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
  const [opening, setOpening] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const practice = useCurrentPractice(page)
  const seated = useBodySeated()
  const silent = useBodySilent()
  const selected = supportedBodyExercise(page, practice?.movement ?? '')
  const meta = BODY_PAGES[page]
  useEffect(() => {
    if (!open || !dialog.current) return
    const node = dialog.current, button = trigger.current, previousOverflow = document.body.style.overflow
    node.showModal(); document.body.style.overflow = 'hidden'
    return () => { node.close(); document.body.style.overflow = previousOverflow; button?.focus() }
  }, [open])
  const openCoach = async () => {
    if (opening) return
    setOpening(true)
    practice?.pause()
    window.speechSynthesis?.cancel()
    window.dispatchEvent(new Event('bloom-body-coach-open'))
    try { const { stopPosture } = await import('../posture/postureRuntime'); stopPosture() } finally { setOpen(true); setOpening(false) }
  }
  if (!meta || !features[meta.feature]) return null
  return <div className="body-tools">
    <button ref={trigger} type="button" disabled={opening} className="body-tool-button" onClick={() => void openCoach()}><Camera size={16} /> {opening ? 'Preparing camera coach…' : 'Camera pose coach'}</button>
    <label className="body-tool-preference"><input type="checkbox" checked={seated} onChange={event => setBodySeated(event.target.checked)} /> Seated / wheelchair mode</label>
    <label className="body-tool-preference"><input type="checkbox" checked={silent} onChange={event => setBodySilent(event.target.checked)} /> Silent body cues</label>
    {open && <div className="body-coach-backdrop"><dialog ref={dialog} className="body-coach-dialog" aria-label={`${meta.title} camera pose coach`} onCancel={event => { event.preventDefault(); if (document.fullscreenElement) { void document.exitFullscreen(); return }; setOpen(false) }}>
      <header><h2>{meta.title} · camera pose coach</h2><button type="button" className="body-tool-button" aria-label="Close camera pose coach" onClick={() => setOpen(false)}><X size={18} /> Close</button></header>
      <p>{practice?.label ?? meta.title}. Camera access starts only when you choose Start camera. Your video stays on this device.</p>
      <Suspense fallback={<p role="status">Loading camera coach…</p>}><FormCoach initialExercise={selected && (!seated || RULES[selected].upper) ? selected : 'observe'} onLog={(liftId, reps, seconds) => logActivity('bodyCoach', { page, liftId, reps, seconds })} /></Suspense>
    </dialog></div>}
  </div>
}
