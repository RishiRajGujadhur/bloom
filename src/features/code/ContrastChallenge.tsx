import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { checkContrast, CONTRAST_TASKS, type ColorPair } from './contrastModel'
import './contrastChallenge.css'

const STORAGE_KEY = 'bloom-contrast-challenge-v1'
type Saved = { pairs: Record<string, ColorPair>; done: Record<string, boolean> }
const readSaved = (): Saved => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (saved?.pairs && saved?.done) return saved } catch { /* use starter */ }
  return { pairs: {}, done: {} }
}

export function ContrastChallenge({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const gauge = useRef<SVGCircleElement>(null)
  const task = CONTRAST_TASKS[index]
  const pair = saved.pairs[task.id] ?? task.start
  const result = checkContrast(task, pair)
  const complete = CONTRAST_TASKS.filter((item) => saved.done[item.id]).length
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ } }
  useLayoutEffect(() => {
    if (!gauge.current) return
    const offset = 264 * (1 - Math.min(result.ratio, 21) / 21)
    if (prefersReducedMotion()) { gsap.set(gauge.current, { strokeDashoffset: offset }); return }
    const tween = gsap.to(gauge.current, { strokeDashoffset: offset, duration: .5, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [result.ratio])
  const update = (patch: Partial<ColorPair>) => {
    persist({ ...saved, pairs: { ...saved.pairs, [task.id]: { ...pair, ...patch } }, done: { ...saved.done, [task.id]: false } })
    setChecked(false)
  }
  const run = () => { setChecked(true); if (result.pass) persist({ ...saved, done: { ...saved.done, [task.id]: true } }) }
  return <LearningExercise className="contrast-lab" aria-label="Color contrast repair challenge" title={<>Repair text contrast</>} description={<>Change foreground and background colors until the text is easier to read and meets the target ratio.</>} onClose={onClose}>

    <div className="contrast-lab-tasks" role="group" aria-label="Contrast challenges">{CONTRAST_TASKS.map((item, taskIndex) => <button type="button" key={item.id} aria-pressed={index === taskIndex} onClick={() => { setIndex(taskIndex); setChecked(false) }}>{saved.done[item.id] ? '✓ ' : ''}{item.title}</button>)}</div>
    <p className="contrast-lab-objective"><strong>Objective:</strong> Reach at least {task.threshold}:1 for {task.size} text. The live sample uses your selected colors.</p>
    <div className="contrast-lab-grid"><div className="contrast-lab-controls"><label>Text color <strong>{pair.foreground}</strong><input type="color" value={pair.foreground} onChange={(event) => update({ foreground: event.target.value })} /></label><label>Background color <strong>{pair.background}</strong><input type="color" value={pair.background} onChange={(event) => update({ background: event.target.value })} /></label><button type="button" onClick={run}>Check contrast</button><p role="status">{checked ? result.pass ? `${result.ratio.toFixed(2)}:1 passes. ${task.title} repaired.` : `${result.ratio.toFixed(2)}:1 is below ${task.threshold}:1. Increase the difference between the colors.` : `${complete} of ${CONTRAST_TASKS.length} challenges complete.`}</p><p className="contrast-lab-note">Ratio uses the WCAG 2.2 sRGB luminance formula. Normal text needs 4.5:1; large text needs 3:1.</p></div><div><svg viewBox="0 0 500 280" role="img" aria-label={`${task.title} preview with ${result.ratio.toFixed(2)} to 1 contrast ratio`} className="contrast-lab-svg"><rect x="1" y="1" width="498" height="278" rx="18" className="contrast-lab-frame" /><rect x="22" y="25" width="330" height="225" rx="14" fill={pair.background} /><text x="45" y="80" fill={pair.foreground} className={task.size === 'large' ? 'contrast-lab-large' : 'contrast-lab-normal'}>{task.size === 'large' ? 'Welcome to' : 'Every seed needs'}</text><text x="45" y="116" fill={pair.foreground} className={task.size === 'large' ? 'contrast-lab-large' : 'contrast-lab-normal'}>{task.size === 'large' ? 'the garden' : 'room to grow.'}</text><circle cx="420" cy="95" r="42" className="contrast-lab-gauge-track" /><circle ref={gauge} cx="420" cy="95" r="42" className="contrast-lab-gauge-fill" strokeDasharray="264" strokeDashoffset="264" /><text x="420" y="102" textAnchor="middle" className="contrast-lab-ratio">{result.ratio.toFixed(1)}</text><text x="420" y="157" textAnchor="middle" className="contrast-lab-gauge-label">ratio</text></svg></div></div><p className="contrast-lab-feedback">{checked && !result.pass ? `Need ${result.needed.toFixed(2)} more ratio points. Try a darker text color or a lighter background.` : checked ? 'The sample now meets this task’s contrast target.' : 'Use the color controls, then check the result.'}</p>
  </LearningExercise>
}
