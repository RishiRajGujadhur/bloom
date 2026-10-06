import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkCoercion, COERCION_CARDS } from './coercionKataModel'
import './coercionKata.css'

const STORAGE_KEY = 'bloom-coercion-kata-done-v1'
const readDone = (): Record<string, boolean> => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {} } catch { return {} }
}

export function CoercionKata({ onClose }: { onClose: () => void }) {
  const [done, setDone] = useState(readDone)
  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [type, setType] = useState('')
  const [checked, setChecked] = useState(false)
  const path = useRef<SVGPathElement>(null)
  const card = COERCION_CARDS[index]
  const result = checkCoercion(card, value, type)
  const count = COERCION_CARDS.filter((item) => done[item.id]).length
  useLayoutEffect(() => {
    if (!path.current) return
    if (prefersReducedMotion()) { gsap.set(path.current, { strokeDashoffset: checked && result.pass ? 0 : 380 }); return }
    const tween = gsap.to(path.current, { strokeDashoffset: checked && result.pass ? 0 : 380, duration: .6, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, checked, result.pass])
  const submit = () => {
    setChecked(true)
    if (result.pass && !done[card.id]) {
      const next = { ...done, [card.id]: true }; setDone(next)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ }
    }
  }
  const choose = (next: number) => { setIndex(next); setValue(''); setType(''); setChecked(false) }
  return <LearningExercise className="coercion-kata" aria-label="Type coercion prediction kata" title={<>Predict the conversion</>} description={<>Type the value and choose its JavaScript type. Check your answer to reveal the conversion steps.</>} onClose={onClose}>

    <div className="coercion-kata-tabs" role="group" aria-label="Coercion kata">{COERCION_CARDS.map((item, cardIndex) => <button type="button" key={item.id} aria-pressed={index === cardIndex} onClick={() => choose(cardIndex)}>{done[item.id] ? '✓ ' : ''}{cardIndex + 1}. {item.title}</button>)}</div>
    <p className="coercion-kata-objective"><strong>Objective:</strong> Predict both the value and type of the expression. Enter string contents without quote marks.</p>
    <div className="coercion-kata-grid bloom-columns"><div><h3>{card.title}</h3><pre>{card.expression}</pre><div className="coercion-kata-answer bloom-columns"><label>Resulting value<input value={value} onChange={(event) => { setValue(event.target.value); setChecked(false) }} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); submit() } }} autoComplete="off" spellCheck={false} /></label><label>Resulting type<DropdownSelect value={type} onChange={(event) => { setType(event.target.value); setChecked(false) }}><option value="">Choose type</option><option value="string">string</option><option value="number">number</option><option value="boolean">boolean</option><option value="undefined">undefined</option></DropdownSelect></label></div><button type="button" className="coercion-kata-check" onClick={submit}>Check prediction</button><p role="status">{checked ? result.pass ? `Correct! ${card.rule}` : `${result.valuePass ? 'Value correct.' : 'Value needs another look.'} ${result.typePass ? 'Type correct.' : 'Type needs another look.'}` : `${count} of ${COERCION_CARDS.length} kata solved.`}</p>{index + 1 < COERCION_CARDS.length && <button type="button" className="coercion-kata-next" onClick={() => choose(index + 1)}>Next kata <ChevronRight size={15} /></button>}</div><div><svg viewBox="0 0 500 180" role="img" className="coercion-kata-svg" aria-label={`${card.inputType} to ${card.outputType} conversion path`}><rect x="1" y="1" width="498" height="178" rx="16" className="coercion-kata-bg" /><path ref={path} d="M70 95 H450" className="coercion-kata-path" strokeDasharray="380" strokeDashoffset="380" /><circle cx="70" cy="95" r="24" className="coercion-kata-node" /><circle cx="250" cy="95" r="24" className="coercion-kata-node" /><circle cx="450" cy="95" r="24" className="coercion-kata-node" /><text x="70" y="101" textAnchor="middle" className="coercion-kata-number">1</text><text x="250" y="101" textAnchor="middle" className="coercion-kata-number">2</text><text x="450" y="101" textAnchor="middle" className="coercion-kata-number">3</text><text x="250" y="36" textAnchor="middle" className="coercion-kata-caption">TYPE CONVERSION PATH</text></svg>{checked && <><p><strong>{card.rule}</strong></p><ol>{card.steps.map((step) => <li key={step}>{step}</li>)}</ol></>}</div></div>{count === COERCION_CARDS.length && <p className="coercion-kata-complete">All five coercion kata solved.</p>}
  </LearningExercise>
}
