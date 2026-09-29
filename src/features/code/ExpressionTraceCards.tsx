import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, Lightbulb } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkExpression, EXPRESSION_CARDS } from './expressionTraceModel'
import './expressionTraceCards.css'

const STORAGE_KEY = 'bloom-expression-trace-done-v1'
const readDone = (): Record<string, boolean> => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {} } catch { return {} }
}

export function ExpressionTraceCards({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(readDone)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [hint, setHint] = useState(false)
  const route = useRef<SVGPathElement>(null)
  const card = EXPRESSION_CARDS[index]
  const result = picked === null ? null : checkExpression(card, picked)
  const count = EXPRESSION_CARDS.filter((item) => done[item.id]).length
  useLayoutEffect(() => {
    if (!route.current) return
    if (prefersReducedMotion()) { gsap.set(route.current, { strokeDashoffset: 0 }); return }
    const tween = gsap.fromTo(route.current, { strokeDashoffset: 390 }, { strokeDashoffset: result?.correct ? 0 : 160, duration: .65, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, result?.correct])
  const pick = (choice: string) => {
    setPicked(choice)
    if (checkExpression(card, choice).correct && !done[card.id]) {
      const next = { ...done, [card.id]: true }; setDone(next)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
    }
  }
  const choose = (next: number) => { setIndex(next); setPicked(null); setHint(false) }
  return <section className="expression-cards" aria-label="JavaScript expression tracing cards">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Trace the expression</h2><p>Predict the result, then follow each evaluation step. Solve all four cards to finish.</p></div></header>
    <div className="expression-cards-tabs" role="group" aria-label="Expression cards">{EXPRESSION_CARDS.map((item, cardIndex) => <button type="button" key={item.id} aria-pressed={index === cardIndex} onClick={() => choose(cardIndex)}>{done[item.id] ? '✓ ' : ''}{cardIndex + 1}. {item.title}</button>)}</div>
    <p className="expression-cards-objective"><strong>Objective:</strong> Work out what this JavaScript expression evaluates to. Try a choice before reading the trace.</p>
    <div className="expression-cards-grid"><div><p className="expression-cards-kicker">CARD {index + 1} OF {EXPRESSION_CARDS.length}</p><h3>{card.title}</h3><pre>{card.expression}</pre><div className="expression-cards-options" role="group" aria-label="Choose the result">{card.options.map((option) => <button type="button" key={option} aria-pressed={picked === option} onClick={() => pick(option)}>{option}</button>)}</div><button type="button" className="expression-cards-hint" onClick={() => setHint((value) => !value)}><Lightbulb size={15} /> {hint ? 'Hide hint' : 'Show hint'}</button>{hint && <p>{card.hint}</p>}<p role="status">{result ? result.correct ? 'Correct! Follow the trace to see why.' : `${picked} is not the result. Read the trace, then try again.` : `${count} of ${EXPRESSION_CARDS.length} cards solved.`}</p></div><div><svg viewBox="0 0 520 180" className="expression-cards-svg" role="img" aria-label={result ? result.explanation : 'Evaluation path waiting for an answer'}><rect x="1" y="1" width="518" height="178" rx="16" className="expression-cards-bg" /><path ref={route} d="M65 90 H455" className="expression-cards-route" strokeDasharray="390" strokeDashoffset="390" />{[65, 260, 455].map((x, stepIndex) => <g key={x}><circle cx={x} cy="90" r="23" className="expression-cards-node" /><text x={x} y="97" textAnchor="middle" className="expression-cards-number">{stepIndex + 1}</text></g>)}<text x="260" y="35" textAnchor="middle" className="expression-cards-svg-title">EVALUATION PATH</text></svg>{result ? <ol className="expression-cards-steps">{card.steps.map((step) => <li key={step}>{step}</li>)}</ol> : <p className="expression-cards-wait">Pick a result to reveal the steps.</p>}</div></div>{count === EXPRESSION_CARDS.length && <p className="expression-cards-complete">All expression cards solved. You can revisit any trace.</p>}
  </section>
}
