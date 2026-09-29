import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { ANNOTATION_TASKS, checkAnnotation } from './typeAnnotationModel'
import './typeAnnotationPrimer.css'

const KEY = 'bloom-type-annotations-v1'
type Saved = { answers: Record<string, string>; done: Record<string, boolean> }
const readSaved = (): Saved => {
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? 'null'); if (value && typeof value === 'object' && value.answers && value.done) return value } catch { /* use empty progress */ }
  return { answers: {}, done: {} }
}

export function TypeAnnotationPrimer({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const flow = useRef<SVGPathElement>(null)
  const task = ANNOTATION_TASKS[index]
  const answer = saved.answers[task.id] ?? ''
  const result = checkAnnotation(task, answer)
  const count = ANNOTATION_TASKS.filter((item) => saved.done[item.id]).length
  useLayoutEffect(() => {
    if (!flow.current) return
    if (prefersReducedMotion()) { gsap.set(flow.current, { strokeDashoffset: checked && result.pass ? 0 : 320 }); return }
    const tween = gsap.to(flow.current, { strokeDashoffset: checked && result.pass ? 0 : 320, duration: .5, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, checked, result.pass])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* retain work in memory */ } }
  const update = (value: string) => { persist({ answers: { ...saved.answers, [task.id]: value }, done: { ...saved.done, [task.id]: false } }); setChecked(false) }
  const run = () => { setChecked(true); if (result.pass) persist({ ...saved, done: { ...saved.done, [task.id]: true } }) }
  const choose = (next: number) => { setIndex(next); setChecked(false) }
  return <section className="type-primer" aria-label="TypeScript annotation primer">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Label the value</h2><p>TypeScript annotations describe values before your program runs. Fill each blank after the colon.</p></div></header>
    <div className="type-primer-tabs" role="group" aria-label="Annotation exercises">{ANNOTATION_TASKS.map((item, at) => <button type="button" key={item.id} aria-pressed={index === at} onClick={() => choose(at)}>{saved.done[item.id] ? '✓ ' : ''}{at + 1}. {item.title}</button>)}</div>
    <div className="type-primer-grid"><div><span className="type-primer-kicker">TYPE {index + 1} OF {ANNOTATION_TASKS.length}</span><h3>{task.title}</h3><p>What type fits the value on the right?</p><div className="type-primer-code"><label htmlFor="type-primer-answer">{task.before}</label><input id="type-primer-answer" value={answer} onChange={(event) => update(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); run() } }} autoComplete="off" spellCheck={false} aria-label={`Type annotation for ${task.title}`} placeholder="type" /><code>{task.after}</code>{answer.length > 20 && <code className="type-primer-answer-preview" aria-label="Full annotation">{answer}</code>}</div><div className="type-primer-actions"><button type="button" onClick={run}>Check type</button><button type="button" disabled={index === 0} onClick={() => choose(index - 1)} aria-label="Previous type"><ChevronLeft size={16} /></button><button type="button" disabled={index === ANNOTATION_TASKS.length - 1} onClick={() => choose(index + 1)} aria-label="Next type"><ChevronRight size={16} /></button></div><p role="status">{checked ? result.feedback : `${count} of ${ANNOTATION_TASKS.length} types practiced.`}</p>{checked && result.pass && <p className="type-primer-inference">Without the annotation, TypeScript would infer this type from the value. Writing it explicitly can document a public API.</p>}{count === ANNOTATION_TASKS.length && <p className="type-primer-complete">Primer complete. You can now label text, numbers, flags, arrays, and object shapes.</p>}</div><div><h3>Type path</h3><svg viewBox="0 0 460 210" role="img" aria-label={`${task.valueKind} value to ${checked && result.pass ? task.expected : 'type annotation'} to checked use`}><rect x="1" y="1" width="458" height="208" rx="14" className="type-primer-frame" /><path d="M70 104 H390" className="type-primer-track" /><path ref={flow} d="M70 104 H390" className="type-primer-flow" strokeDasharray="320" strokeDashoffset="320" /><circle cx="70" cy="104" r="26" className="type-primer-node" /><circle cx="230" cy="104" r="26" className="type-primer-node" /><circle cx="390" cy="104" r="26" className="type-primer-node" /><text x="70" y="110" textAnchor="middle">1</text><text x="230" y="110" textAnchor="middle">2</text><text x="390" y="110" textAnchor="middle">3</text><text x="70" y="165" textAnchor="middle">VALUE</text><text x="230" y="165" textAnchor="middle">TYPE</text><text x="390" y="165" textAnchor="middle">CHECK</text></svg><p className="type-primer-note">The annotation is checked during development. JavaScript runs without TypeScript type annotations.</p></div></div>
  </section>
}
