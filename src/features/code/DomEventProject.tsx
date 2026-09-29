import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkEventWiring, EVENT_TASKS, type EventChoice } from './domEventModel'
import './domEventProject.css'

const KEY = 'bloom-dom-event-project-v1'
type Saved = { choices: Record<string, EventChoice>; done: Record<string, boolean> }
function readSaved(): Saved {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value?.choices && value?.done) return value } catch { /* use starter */ }
  return { choices: {}, done: {} }
}

export function DomEventProject({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [tested, setTested] = useState(false)
  const [feedback, setFeedback] = useState('Choose the wiring, then use the preview.')
  const [name, setName] = useState('')
  const [output, setOutput] = useState('Waiting for an event…')
  const [signal, setSignal] = useState(0)
  const dot = useRef<SVGCircleElement>(null)
  const task = EVENT_TASKS[index]
  const choice = saved.choices[task.id] ?? task.starter
  const result = checkEventWiring(task, choice)
  const count = EVENT_TASKS.filter((item) => saved.done[item.id]).length

  useLayoutEffect(() => {
    if (!dot.current || !signal || prefersReducedMotion()) return
    const tween = gsap.fromTo(dot.current, { attr: { cx: 54 }, opacity: 1 }, { attr: { cx: 406 }, opacity: 0, duration: .8, ease: 'power2.inOut' })
    return () => { tween.progress(1).kill() }
  }, [signal])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* retain session state */ } }
  const update = (patch: Partial<EventChoice>) => {
    persist({ choices: { ...saved.choices, [task.id]: { ...choice, ...patch } }, done: { ...saved.done, [task.id]: false } })
    setTested(false); setOutput('Waiting for an event…'); setFeedback('Wiring changed. Use the preview to test it.')
  }
  const activate = (event: 'click' | 'input' | 'submit', value = '') => {
    setTested(true)
    if (!result.pass) { setFeedback(result.feedback); return }
    if (event !== task.event) { setFeedback(`This fired ${event}; the task needs ${task.event}.`); return }
    setOutput(task.id === 'button' ? 'Welcome aboard!' : task.id === 'input' ? `${value.length} characters` : 'Signup received!')
    setFeedback(`Success: ${task.target}.addEventListener('${task.event}', ${task.handler}) reacted to the real ${event} event.`)
    setSignal((current) => current + 1)
    persist({ ...saved, done: { ...saved.done, [task.id]: true } })
  }
  const selectTask = (at: number) => { setIndex(at); setTested(false); setOutput('Waiting for an event…'); setFeedback('Choose the wiring, then use the preview.'); setName('') }

  return <section className="dom-event-project" aria-label="DOM event wiring project">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Wire the interface</h2><p>Attach a listener to the right element, choose its event, and connect the handler. Test each wiring in the live preview.</p></div></header>
    <div className="dom-event-tabs" role="group" aria-label="Event wiring tasks">{EVENT_TASKS.map((item, at) => <button type="button" key={item.id} aria-pressed={index === at} onClick={() => selectTask(at)}>{saved.done[item.id] ? '✓ ' : ''}{at + 1}. {item.title}</button>)}</div>
    <p className="dom-event-objective"><strong>Objective:</strong> {task.objective} <span>{count} of 3 wired.</span></p>
    <div className="dom-event-grid"><div><h3>Build the listener</h3><div className="dom-event-controls"><label>Element<select value={choice.target} onChange={(event) => update({ target: event.target.value })}><option value="#join">#join — button</option><option value="#name">#name — input</option><option value="#signup">#signup — form</option></select></label><label>Event<select value={choice.event} onChange={(event) => update({ event: event.target.value })}><option value="click">click</option><option value="input">input</option><option value="submit">submit</option></select></label><label>Handler<select value={choice.handler} onChange={(event) => update({ handler: event.target.value })}><option value="showWelcome">showWelcome</option><option value="showCount">showCount</option><option value="showConfirmation">showConfirmation</option></select></label></div><code className="dom-event-code">document.querySelector('{choice.target}')?.addEventListener('{choice.event}', {choice.handler})</code><p className="dom-event-hint">The listener responds only when its element and event match the preview action. A form submit handler prevents page reload.</p></div>
    <div><h3>Live preview</h3><div className="dom-event-preview">{task.id === 'button' ? <button type="button" id="join" onClick={() => activate('click')}>Join</button> : task.id === 'input' ? <label htmlFor="name">Your name<input id="name" value={name} onChange={(event) => { setName(event.target.value); activate('input', event.target.value) }} /></label> : <form id="signup" onSubmit={(event) => { event.preventDefault(); activate('submit') }}><label htmlFor="signup-email">Email<input id="signup-email" type="email" required placeholder="you@example.com" /></label><button type="submit">Sign up</button></form>}<output aria-live="polite">{output}</output></div><p className="dom-event-trigger">Try it: {task.trigger}.</p></div></div>
    <svg className="dom-event-signal" viewBox="0 0 460 76" role="img" aria-label={`Event route from ${choice.target} through ${choice.event} to ${choice.handler}`}><path d="M54 39 H406" /><circle ref={dot} cx="54" cy="39" r="8" /><text x="8" y="19">{choice.target}</text><text x="196" y="19">{choice.event}</text><text x="332" y="19">{choice.handler}</text></svg>
    <p role="status" className={tested && result.pass ? 'dom-event-success' : ''}>{feedback}</p>
  </section>
}
