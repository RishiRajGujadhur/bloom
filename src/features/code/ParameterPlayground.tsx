import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkParameterTask, PARAMETER_TASKS, type ParameterTask } from './parameterPlaygroundModel'
import './parameterPlayground.css'

const STORAGE_KEY = 'bloom-parameter-playground-v1'
type Saved = { args: Record<string, [string, string]>; done: Record<string, boolean> }
const readSaved = (): Saved => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (saved?.args && saved?.done) return saved } catch { /* use starters */ } return { args: {}, done: {} } }

export function ParameterPlayground({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const path = useRef<SVGPathElement>(null)
  const task: ParameterTask = PARAMETER_TASKS[index]
  const args = saved.args[task.id] ?? task.defaults
  const result = checkParameterTask(task, args)
  const count = PARAMETER_TASKS.filter((item) => saved.done[item.id]).length
  useLayoutEffect(() => {
    if (!path.current) return
    if (prefersReducedMotion()) { gsap.set(path.current, { strokeDashoffset: checked && result.pass ? 0 : 400 }); return }
    const tween = gsap.to(path.current, { strokeDashoffset: checked && result.pass ? 0 : 400, duration: .55, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, checked, result.pass])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ } }
  const update = (position: 0 | 1, value: string) => {
    const next: [string, string] = [...args] as [string, string]; next[position] = value
    persist({ args: { ...saved.args, [task.id]: next }, done: { ...saved.done, [task.id]: false } }); setChecked(false)
  }
  const run = () => { setChecked(true); if (result.pass) persist({ ...saved, done: { ...saved.done, [task.id]: true } }) }
  const choose = (next: number) => { setIndex(next); setChecked(false) }
  return <LearningExercise className="parameter-lab" aria-label="Function parameter playground" title={<>Pass the right arguments</>} description={<>Edit the arguments, watch where they bind, and check the function’s returned value.</>} onClose={onClose}>

    <div className="parameter-lab-tabs" role="group" aria-label="Parameter tasks">{PARAMETER_TASKS.map((item, taskIndex) => <button type="button" key={item.id} aria-pressed={index === taskIndex} onClick={() => choose(taskIndex)}>{saved.done[item.id] ? '✓ ' : ''}{taskIndex + 1}. {item.title}</button>)}</div>
    <p className="parameter-lab-objective"><strong>Objective:</strong> {task.story} Target return: <code>{task.target}</code>.</p>
    <div className="parameter-lab-grid bloom-columns"><div><h3>{task.title}</h3><pre>{task.code}</pre><div className="parameter-lab-fields bloom-columns">{task.labels.map((label, position) => <label key={label}>Argument {position + 1} → {label}<input value={args[position]} onChange={(event) => update(position as 0 | 1, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); run() } }} aria-label={`Argument for ${label}`} /></label>)}</div><button type="button" className="parameter-lab-check" onClick={run}>Check return value</button><p role="status">{checked ? result.pass ? `Correct! ${task.note}` : `${result.bindingChecks.map((pass, position) => `${task.labels[position]} ${pass ? 'matches' : 'needs a different argument'}`).join('; ')}. Returned ${result.output}.` : `${count} of ${PARAMETER_TASKS.length} tasks solved.`}</p>{index + 1 < PARAMETER_TASKS.length && <button type="button" className="parameter-lab-next" onClick={() => choose(index + 1)}>Next task <ChevronRight size={15} /></button>}</div><div><svg viewBox="0 0 520 250" role="img" className="parameter-lab-svg" aria-label={`Argument one binds ${result.bindings[0]} to ${task.labels[0]}; argument two binds ${result.bindings[1]} to ${task.labels[1]}; return value ${result.output}`}><rect x="1" y="1" width="518" height="248" rx="16" className="parameter-lab-bg" /><path ref={path} d="M55 125 H455" className="parameter-lab-path" strokeDasharray="400" strokeDashoffset="400" /><rect x="28" y="67" width="128" height="115" rx="12" className="parameter-lab-node" /><rect x="198" y="67" width="128" height="115" rx="12" className="parameter-lab-node" /><rect x="368" y="67" width="128" height="115" rx="12" className="parameter-lab-node" /><text x="92" y="97" textAnchor="middle" className="parameter-lab-label">ARGUMENTS</text><text x="92" y="127" textAnchor="middle">{args[0].slice(0, 13) || '(empty)'}</text><text x="92" y="153" textAnchor="middle">{args[1].slice(0, 13) || '(omitted)'}</text><text x="262" y="97" textAnchor="middle" className="parameter-lab-label">PARAMETERS</text><text x="262" y="127" textAnchor="middle">{task.labels[0]} = {result.bindings[0].slice(0, 9)}</text><text x="262" y="153" textAnchor="middle">{task.labels[1]} = {result.bindings[1].slice(0, 9)}</text><text x="432" y="97" textAnchor="middle" className="parameter-lab-label">RETURN</text><text x="432" y="137" textAnchor="middle">{result.output.slice(0, 15)}</text></svg><p className="parameter-lab-note">{task.note} Blank optional arguments use the function’s default.</p></div></div>{count === PARAMETER_TASKS.length && <p className="parameter-lab-complete">All parameter tasks solved.</p>}
  </LearningExercise>
}
