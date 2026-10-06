import { Checkbox } from '../../components/ui/Checkbox'
import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkGate, GATE_TASKS, type GateRule } from './conditionGateModel'
import './conditionGate.css'

const KEY = 'bloom-condition-gate-v1'
type Saved = { rules: Record<string, GateRule>; done: Record<string, boolean> }
const readSaved = (): Saved => {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value?.rules && value?.done) return value } catch { /* use starters */ }
  return { rules: {}, done: {} }
}

export function ConditionGate({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const lanes = useRef<SVGGElement>(null)
  const task = GATE_TASKS[index]
  const rule = saved.rules[task.id] ?? task.starter
  const result = checkGate(task, rule)
  const complete = GATE_TASKS.filter((item) => saved.done[item.id]).length
  useLayoutEffect(() => {
    if (!lanes.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(lanes.current.children, { opacity: .35, x: -8 }, { opacity: 1, x: 0, duration: .28, stagger: .05, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [index, checked, rule.left, rule.operator, rule.right, rule.invertRight])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep work in memory */ } }
  const update = (patch: Partial<GateRule>) => { persist({ rules: { ...saved.rules, [task.id]: { ...rule, ...patch } }, done: { ...saved.done, [task.id]: false } }); setChecked(false) }
  const run = () => { setChecked(true); if (result.pass) persist({ ...saved, done: { ...saved.done, [task.id]: true } }) }
  return <LearningExercise className="condition-gate" aria-label="JavaScript condition gate builder" title={<>Build the condition gate</>} description={<>Combine boolean checks to decide who passes each story gate. Run four examples to test the rule.</>} onClose={onClose}>

    <div className="condition-gate-tabs" role="group" aria-label="Condition missions">{GATE_TASKS.map((item, at) => <button type="button" key={item.id} aria-pressed={index === at} onClick={() => { setIndex(at); setChecked(false) }}>{saved.done[item.id] ? '✓ ' : ''}{at + 1}. {item.title}</button>)}</div>
    <p className="condition-gate-objective"><strong>Mission:</strong> {task.story}</p>
    <div className="condition-gate-grid bloom-columns"><div><h3>Your JavaScript rule</h3><div className="condition-gate-builder bloom-columns"><label>First check<DropdownSelect value={rule.left} onChange={(event) => update({ left: event.target.value })}>{task.predicates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</DropdownSelect></label><label>Join with<DropdownSelect value={rule.operator} onChange={(event) => update({ operator: event.target.value as GateRule['operator'] })}><option value="&&">&& — both</option><option value="||">|| — either</option></DropdownSelect></label><label>Second check<DropdownSelect value={rule.right} onChange={(event) => update({ right: event.target.value })}>{task.predicates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</DropdownSelect></label><label className="condition-gate-not"><Checkbox checked={rule.invertRight} onCheckedChange={(checked) => update({ invertRight: checked })} /> Add ! (NOT) to second check</label></div><code className="condition-gate-expression">{task.predicates.find((item) => item.id === rule.left)?.label} {rule.operator} {rule.invertRight ? '!' : ''}{task.predicates.find((item) => item.id === rule.right)?.label}</code><button type="button" className="condition-gate-run" onClick={run}>Run four cases</button><p role="status">{checked ? result.feedback : `${complete} of ${GATE_TASKS.length} gates solved. Choose checks, then run the cases.`}</p>{index < GATE_TASKS.length - 1 && <button type="button" className="condition-gate-next" onClick={() => { setIndex(index + 1); setChecked(false) }}>Next gate <ChevronRight size={15} /></button>}</div><div><h3>Case paths</h3><svg viewBox="0 0 460 285" role="img" aria-label={`Case paths: ${result.cases.map((item) => `${item.name} ${item.actual ? 'admitted' : 'blocked'}`).join(', ')}`}><g ref={lanes}>{result.cases.map((item, at) => { const y = 43 + at * 62; const correct = item.actual === item.expected; return <g key={item.name}><path d={`M112 ${y} H345`} stroke={checked ? correct ? '#55a88a' : '#d67660' : '#a5adc0'} strokeWidth="4" strokeDasharray={item.actual ? undefined : '7 6'} /><circle cx="112" cy={y} r="17" fill="#7686b2" /><circle cx="345" cy={y} r="18" fill={checked ? correct ? '#55a88a' : '#d67660' : '#a5adc0'} /><text x="14" y={y + 5}>{item.name}</text><text x="377" y={y + 5}>{checked ? item.actual ? 'OPEN' : 'STOP' : '?'}</text></g> })}</g></svg><p className="condition-gate-note">Solid lines pass the gate; dashed lines stop. Green matches the mission. Orange needs a new rule.</p>{checked && <ul aria-label="Case results">{result.cases.map((item) => <li key={item.name}><strong>{item.name}:</strong> expected {item.expected ? 'open' : 'stop'}, got {item.actual ? 'open' : 'stop'} {item.actual === item.expected ? '✓' : '○'}</li>)}</ul>}</div></div>
  </LearningExercise>
}
