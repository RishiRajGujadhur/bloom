import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkReducedMotion, REDUCED_MOTION_START, type ReducedMotionSettings } from './reducedMotionModel'
import './reducedMotionExercise.css'

const STORAGE_KEY = 'bloom-reduced-motion-exercise-v1'
const DONE_KEY = 'bloom-reduced-motion-exercise-done-v1'
const readSettings = (): ReducedMotionSettings => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (Number.isFinite(saved?.durationMs) && typeof saved?.repeats === 'boolean' && typeof saved?.keepsResult === 'boolean') return saved } catch { /* use starter */ }
  return REDUCED_MOTION_START
}

export function ReducedMotionExercise({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState(readSettings)
  const [mode, setMode] = useState<'full' | 'reduced'>('full')
  const [previewRun, setPreviewRun] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkReducedMotion(readSettings()).every((item) => item.pass) } catch { return false } })
  const marker = useRef<SVGGElement>(null)
  const checks = checkReducedMotion(settings)
  const passed = checks.filter((item) => item.pass).length

  useLayoutEffect(() => {
    if (!marker.current) return
    if (prefersReducedMotion()) { gsap.set(marker.current, { x: 340 }); return }
    const duration = mode === 'full' ? 1.25 : settings.durationMs / 1000
    if (duration === 0) { gsap.set(marker.current, { x: 340 }); return }
    const tween = gsap.fromTo(marker.current, { x: 0 }, { x: 340, duration, repeat: mode === 'reduced' && settings.repeats ? 1 : 0, ease: 'power2.inOut' })
    return () => { tween.kill() }
  }, [mode, settings, previewRun])

  const update = (patch: Partial<ReducedMotionSettings>) => {
    const next = { ...settings, ...patch }; setSettings(next); setChecked(false); setDone(false)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); localStorage.removeItem(DONE_KEY) } catch { /* keep in memory */ }
  }
  const run = () => { setChecked(true); if (checks.every((item) => item.pass)) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } } }
  return <LearningExercise className="motion-exercise" aria-label="Reduced-motion interface exercise" title={<>Keep the result, calm the motion</>} description={<>This progress signal moves across the screen. Design a reduced-motion version that still communicates completion.</>} onClose={onClose}>

    <p className="motion-exercise-objective"><strong>Objective:</strong> Make the reduced version instant or brief, stop repetition, and keep a visible success result.</p>
    <div className="motion-exercise-grid"><div className="motion-exercise-controls"><fieldset><legend>Preview mode</legend><label><input type="radio" name="motion-preview" checked={mode === 'full'} onChange={() => setMode('full')} /> Full motion</label><label><input type="radio" name="motion-preview" checked={mode === 'reduced'} onChange={() => setMode('reduced')} /> Reduced version</label></fieldset><label>Reduced transition length<select value={settings.durationMs} onChange={(event) => update({ durationMs: Number(event.target.value) })}><option value="0">Instant</option><option value="80">80 ms</option><option value="300">300 ms</option><option value="900">900 ms</option></select></label><label><input type="checkbox" checked={settings.repeats} onChange={(event) => update({ repeats: event.target.checked })} /> Repeat the reduced animation</label><label><input type="checkbox" checked={settings.keepsResult} onChange={(event) => update({ keepsResult: event.target.checked })} /> Show a static success result</label><div className="motion-exercise-actions bloom-wrap"><button type="button" onClick={() => setPreviewRun((value) => value + 1)}>Replay preview</button><button type="button" onClick={run}>Check design</button><button type="button" onClick={() => update(REDUCED_MOTION_START)}><RotateCcw size={15} /> Reset</button></div><p role="status">{done ? 'Reduced-motion design complete.' : checked ? `${passed} of 3 design checks pass.` : 'Configure the reduced version, then check it.'}</p></div><div><svg viewBox="0 0 500 270" role="img" aria-label={`${mode === 'full' ? 'Full motion' : 'Reduced motion'} preview: ${settings.keepsResult ? 'success state visible' : 'success state hidden'}`} className="motion-exercise-svg"><rect x="1" y="1" width="498" height="268" rx="16" className="motion-exercise-canvas" /><text x="40" y="45" className="motion-exercise-caption">{mode === 'full' ? 'FULL MOTION' : 'REDUCED VERSION'}</text><path d="M65 120 H405" className="motion-exercise-track" /><circle cx="405" cy="120" r="18" className="motion-exercise-destination" /><path d="M397 120 L403 126 L414 113" className="motion-exercise-check" /><g ref={marker}><circle cx="65" cy="120" r="12" className="motion-exercise-marker" /></g>{(mode === 'full' || settings.keepsResult) && <text x="250" y="206" textAnchor="middle" className="motion-exercise-result">✓ Task complete</text>}</svg><p className="motion-exercise-note">Your device’s reduced-motion setting always skips this demo’s movement. The controls simulate the version you are designing.</p></div></div><ul className="motion-exercise-checks" aria-label="Reduced-motion feedback">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul>
  </LearningExercise>
}
