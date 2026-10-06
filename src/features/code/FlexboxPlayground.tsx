import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { checkFlexTask, flexPositions, FLEX_START, FLEX_TASKS, type FlexSettings } from './flexboxModel'
import './flexboxPlayground.css'

const STORAGE_KEY = 'bloom-flexbox-playground-v1'
type Saved = { settings: FlexSettings; done: Record<string, boolean> }
const readSaved = (): Saved => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (saved?.settings && saved?.done) return saved
  } catch { /* use defaults */ }
  return { settings: FLEX_START, done: {} }
}

export function FlexboxPlayground({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [taskIndex, setTaskIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const itemRefs = useRef<(SVGGElement | null)[]>([])
  const task = FLEX_TASKS[taskIndex]
  const checks = checkFlexTask(task, saved.settings)
  const positions = flexPositions(saved.settings)
  const finished = FLEX_TASKS.filter((item) => saved.done[item.id]).length
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ } }

  useLayoutEffect(() => {
    const tweens = itemRefs.current.map((item, index) => {
      if (!item) return null
      const target = positions[index]
      if (prefersReducedMotion()) { gsap.set(item, { x: target.x, y: target.y }); return null }
      return gsap.to(item, { x: target.x, y: target.y, duration: .45, ease: 'power2.out' })
    })
    return () => { tweens.forEach((tween) => tween?.kill()) }
  }, [saved.settings])

  const update = (patch: Partial<FlexSettings>) => { persist({ ...saved, settings: { ...saved.settings, ...patch } }); setChecked(false) }
  const run = () => {
    setChecked(true)
    if (checks.every((item) => item.pass)) persist({ ...saved, done: { ...saved.done, [task.id]: true } })
  }
  const selectTask = (index: number) => { setTaskIndex(index); setChecked(false) }
  return <LearningExercise className="flex-lab" aria-label="Flexbox alignment playground" title={<>Flexbox alignment playground</>} description={<>Arrange the three cards by changing the flex container. Watch which axis each property moves.</>} onClose={onClose}>

    <div className="flex-lab-tasks" role="group" aria-label="Alignment tasks">{FLEX_TASKS.map((item, index) => <button type="button" key={item.id} aria-pressed={taskIndex === index} onClick={() => selectTask(index)}>{saved.done[item.id] ? '✓ ' : ''}{index + 1}. {item.title}</button>)}</div>
    <p className="flex-lab-objective"><strong>Objective:</strong> {task.objective}</p>
    <div className="flex-lab-grid"><div className="flex-lab-controls"><label>flex-direction<DropdownSelect value={saved.settings.direction} onChange={(event) => update({ direction: event.target.value as FlexSettings['direction'] })}><option value="row">row</option><option value="column">column</option></DropdownSelect></label><label>justify-content<DropdownSelect value={saved.settings.justify} onChange={(event) => update({ justify: event.target.value as FlexSettings['justify'] })}><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option><option value="space-between">space-between</option></DropdownSelect></label><label>align-items<DropdownSelect value={saved.settings.align} onChange={(event) => update({ align: event.target.value as FlexSettings['align'] })}><option value="flex-start">flex-start</option><option value="center">center</option><option value="flex-end">flex-end</option></DropdownSelect></label><label>gap <strong>{saved.settings.gap} px</strong><input type="range" min="0" max="32" step="4" value={saved.settings.gap} onChange={(event) => update({ gap: Number(event.target.value) })} /></label><button type="button" onClick={run}>Check alignment</button><p role="status">{saved.done[task.id] && checked ? `Solved! ${task.explain}` : checked ? `${checks.filter((item) => item.pass).length} of 3 properties match.` : `${finished} of ${FLEX_TASKS.length} tasks solved.`}</p></div><div><svg viewBox="0 0 520 300" role="img" aria-label={`Three cards arranged in a ${saved.settings.direction}, ${saved.settings.justify} on the main axis and ${saved.settings.align} on the cross axis`} className="flex-lab-svg"><rect x="36" y="36" width="440" height="220" rx="15" className="flex-lab-container" /><path d={saved.settings.direction === 'row' ? 'M50 274 H470' : 'M494 50 V250'} className="flex-lab-axis" /><text x="50" y="292" className="flex-lab-caption">MAIN AXIS → {saved.settings.direction}</text>{positions.map((_, index) => <g key={index} ref={(item) => { itemRefs.current[index] = item }}><rect width="56" height="42" rx="9" className="flex-lab-item" /><text x="28" y="27" textAnchor="middle" className="flex-lab-item-label">{index + 1}</text></g>)}</svg><p className="flex-lab-note">The dashed guide shows the main axis. Changing direction also changes what justify-content controls.</p></div></div><ul className="flex-lab-checks" aria-label="Alignment feedback">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul>
  </LearningExercise>
}
