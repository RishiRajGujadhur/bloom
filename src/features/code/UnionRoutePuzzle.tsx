import { Checkbox } from '../../components/ui/Checkbox'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { acceptsExample, checkUnionRoute, UNION_ROUTES } from './unionRouteModel'
import './unionRoutePuzzle.css'

const KEY = 'bloom-union-routes-v1'
type Progress = { members: Record<string, string[]>; done: Record<string, boolean> }
function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (value && typeof value === 'object' && value.members && value.done) return value
  } catch { /* continue with empty progress */ }
  return { members: {}, done: {} }
}

export function UnionRoutePuzzle({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState(readProgress)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const route = UNION_ROUTES[index]
  const selected = progress.members[route.id] ?? []
  const result = checkUnionRoute(route, selected)
  const count = UNION_ROUTES.filter((item) => progress.done[item.id]).length
  const flow = useRef<SVGPathElement>(null)

  useLayoutEffect(() => {
    if (!flow.current) return
    const target = checked && result.pass ? 0 : 340
    if (prefersReducedMotion()) { gsap.set(flow.current, { strokeDashoffset: target }); return }
    const tween = gsap.to(flow.current, { strokeDashoffset: target, duration: .6, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, checked, result.pass])

  const save = (next: Progress) => {
    setProgress(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
  }
  const toggle = (part: string) => {
    const members = selected.includes(part) ? selected.filter((entry) => entry !== part) : [...selected, part]
    save({ members: { ...progress.members, [route.id]: members }, done: { ...progress.done, [route.id]: false } })
    setChecked(false)
  }
  const check = () => {
    setChecked(true)
    if (result.pass) save({ ...progress, done: { ...progress.done, [route.id]: true } })
  }
  const move = (next: number) => { setIndex(next); setChecked(false) }

  return <LearningExercise className="union-route" aria-label="TypeScript union route puzzle" title={<>Route the values</>} description={<>Build a union that welcomes every valid value and keeps the unwanted ones out.</>} onClose={onClose} backSizing="feature">

    <div className="union-route-tabs bloom-wrap" role="group" aria-label="Union routes">{UNION_ROUTES.map((item, at) => <button type="button" key={item.id} aria-pressed={index === at} onClick={() => move(at)}>{progress.done[item.id] ? '✓ ' : ''}{at + 1}. {item.title}</button>)}</div>
    <div className="union-route-grid bloom-columns"><div><span className="union-route-kicker">ROUTE {index + 1} OF {UNION_ROUTES.length}</span><h3>{route.title}</h3><p>{route.story}</p><fieldset><legend>Choose the members of this union</legend><div className="union-route-parts bloom-wrap">{route.candidates.map((part) => <label key={part} className={selected.includes(part) ? 'selected' : ''}><Checkbox checked={selected.includes(part)} onCheckedChange={() => toggle(part)} /><code>{part}</code></label>)}</div></fieldset><p className="union-route-signature"><code>type Route = {selected.length ? selected.join(' | ') : '/* choose types */'}</code></p><div className="union-route-actions bloom-wrap"><button type="button" onClick={check}>Test route</button><button type="button" disabled={index === 0} aria-label="Previous route" onClick={() => move(index - 1)}><ChevronLeft size={16} /></button><button type="button" disabled={index === UNION_ROUTES.length - 1} aria-label="Next route" onClick={() => move(index + 1)}><ChevronRight size={16} /></button></div><p role="status" className={checked ? result.pass ? 'union-route-pass' : 'union-route-fail' : ''}>{checked ? result.feedback : `${count} of ${UNION_ROUTES.length} routes open.`}</p>{count === UNION_ROUTES.length && <p className="union-route-complete">Every route is open. You can combine broad types and precise literal types without admitting unintended values.</p>}</div><div className="union-route-board"><svg viewBox="0 0 460 205" role="img" aria-label={`Value route through union members to ${checked && result.pass ? 'open gate' : 'test gate'}`}><rect x="1" y="1" width="458" height="203" rx="17" className="union-route-frame" /><path d="M60 100 H400" className="union-route-track" /><path ref={flow} d="M60 100 H400" strokeDasharray="340" strokeDashoffset="340" className="union-route-flow" /><circle cx="60" cy="100" r="27" /><circle cx="230" cy="100" r="29" /><circle cx="400" cy="100" r="27" /><text x="60" y="106" textAnchor="middle">V</text><text x="230" y="106" textAnchor="middle">|</text><text x="400" y="106" textAnchor="middle">{checked && result.pass ? '✓' : '?'}</text><text x="60" y="163" textAnchor="middle">VALUE</text><text x="230" y="163" textAnchor="middle">UNION</text><text x="400" y="163" textAnchor="middle">GATE</text></svg><table><caption>Values at the gate</caption><thead><tr><th scope="col">Value</th><th scope="col">Should</th><th scope="col">Your route</th></tr></thead><tbody>{route.examples.map((example) => <tr key={example.value}><td><code>{example.value}</code></td><td>{example.accepted ? 'Admit' : 'Reject'}</td><td>{acceptsExample(route, selected, example.value) ? 'Admits' : 'Rejects'}</td></tr>)}</tbody></table></div></div>
  </LearningExercise>
}
