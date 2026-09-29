import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkPromiseOrder, PROMISE_SCENARIOS } from './promiseOrderModel'
import './promiseOrderVisualizer.css'

const KEY = 'bloom-promise-order-v1'
type Saved = { answers: Record<string, string[]>; done: Record<string, boolean> }
function readSaved(): Saved {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value?.answers && value?.done) return value } catch { /* use starter */ }
  return { answers: {}, done: {} }
}

export function PromiseOrderVisualizer({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const [reveal, setReveal] = useState(0)
  const dots = useRef<SVGGElement>(null)
  const scenario = PROMISE_SCENARIOS[index]
  const answer = saved.answers[scenario.id] ?? scenario.steps.map((step) => step.id).reverse()
  const result = checkPromiseOrder(scenario, answer)
  const doneCount = PROMISE_SCENARIOS.filter((item) => saved.done[item.id]).length

  useLayoutEffect(() => {
    if (!dots.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(dots.current.children, { y: -5 }, { y: 0, duration: .25, stagger: .1 })
    return () => { tween.progress(1).kill() }
  }, [index, reveal])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const move = (at: number, direction: -1 | 1) => {
    const next = [...answer]; const other = at + direction
    if (other < 0 || other >= next.length) return
    ;[next[at], next[other]] = [next[other], next[at]]
    persist({ answers: { ...saved.answers, [scenario.id]: next }, done: { ...saved.done, [scenario.id]: false } })
    setChecked(false); setReveal(0)
  }
  const run = () => { setChecked(true); setReveal(1); if (result.pass) persist({ ...saved, done: { ...saved.done, [scenario.id]: true } }) }
  const nextStep = () => setReveal((value) => Math.min(scenario.steps.length, value + 1))

  return <section className="promise-order" aria-label="Promise ordering visualizer">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Order the event loop</h2><p>Predict console output. Synchronous code runs first, Promise callbacks are microtasks, and timer callbacks run afterward.</p></div></header>
    <div className="promise-order-tabs" role="group" aria-label="Promise scenarios">{PROMISE_SCENARIOS.map((item, at) => <button type="button" key={item.id} aria-pressed={index === at} onClick={() => { setIndex(at); setChecked(false); setReveal(0) }}>{saved.done[item.id] ? '✓ ' : ''}{at + 1}. {item.title}</button>)}</div>
    <p className="promise-order-objective"><strong>Objective:</strong> Put the logs in the order they appear. {doneCount} of 3 solved.</p>
    <div className="promise-order-grid"><div><h3>Code</h3><pre><code>{scenario.code}</code></pre><p>Move each output with the arrow buttons, then check your prediction.</p></div><div><h3>Your predicted output</h3><ol>{answer.map((id, at) => <li key={id}><span>{id}</span><div><button type="button" aria-label={`Move ${id} earlier`} disabled={at === 0} onClick={() => move(at, -1)}>↑</button><button type="button" aria-label={`Move ${id} later`} disabled={at === answer.length - 1} onClick={() => move(at, 1)}>↓</button></div></li>)}</ol><button type="button" className="promise-order-check" onClick={run}>Check order</button><p role="status">{checked ? result.feedback : 'The callback queues are waiting. Arrange the output first.'}</p></div></div>
    <div className="promise-order-timeline"><div><h3>Execution timeline</h3><button type="button" onClick={nextStep} disabled={!checked || reveal >= scenario.steps.length}>Step forward</button></div><svg viewBox="0 0 600 170" role="img" aria-label={`${reveal} of ${scenario.steps.length} execution steps shown`}><path d="M40 80 H560" /><g ref={dots}>{scenario.steps.map((step, at) => { const x = 55 + at * (490 / Math.max(1, scenario.steps.length - 1)); const visible = checked && at < reveal; return <g key={step.id} opacity={visible ? 1 : .3}><circle cx={x} cy="80" r="17" fill={step.queue === 'stack' ? '#6c8ec3' : step.queue === 'microtask' ? '#62af91' : '#d8a35c'} /><text x={x} y="48" textAnchor="middle">{step.label}</text><text x={x} y="120" textAnchor="middle">{step.queue}</text></g> })}</g></svg>{checked && reveal > 0 && <p role="status"><strong>Step {reveal}:</strong> {scenario.steps[reveal - 1].reason}</p>}</div>
  </section>
}
