import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkInference, INFERENCE_CASES } from './inferenceModel'
import './inferencePrediction.css'

const STORAGE_KEY = 'bloom-code-inference-v1'
type Progress = { choices: Record<string, string>; passed: Record<string, boolean> }
function readProgress(): Progress {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (value && typeof value === 'object' && value.choices && value.passed) return value
  } catch { /* start fresh if storage is unavailable */ }
  return { choices: {}, passed: {} }
}

export function InferencePrediction({ onClose }: { onClose: () => void }) {
  const [progress, setProgress] = useState(readProgress)
  const [index, setIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const pathRef = useRef<SVGPathElement>(null)
  const item = INFERENCE_CASES[index]
  const choice = progress.choices[item.id] ?? ''
  const result = checkInference(item, choice)
  const passed = INFERENCE_CASES.filter((entry) => progress.passed[entry.id]).length

  useLayoutEffect(() => {
    if (!pathRef.current) return
    const end = checked && result.pass ? 0 : 316
    if (prefersReducedMotion()) { gsap.set(pathRef.current, { strokeDashoffset: end }); return }
    const tween = gsap.to(pathRef.current, { strokeDashoffset: end, duration: .55, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, checked, result.pass])

  const save = (next: Progress) => {
    setProgress(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep session progress */ }
  }
  const select = (value: string) => {
    save({ choices: { ...progress.choices, [item.id]: value }, passed: { ...progress.passed, [item.id]: false } })
    setChecked(false)
  }
  const check = () => {
    setChecked(true)
    if (result.pass) save({ ...progress, passed: { ...progress.passed, [item.id]: true } })
  }
  const move = (next: number) => { setIndex(next); setChecked(false) }

  return <LearningExercise className="inference-lab" aria-label="TypeScript inference prediction" title={<>Predict the invisible type</>} description={<>The compiler reads the code and fills in missing types. Follow its clues through five short cases.</>} onClose={onClose} backSizing="feature">

    <div className="inference-lab-tabs" role="group" aria-label="Inference cases">{INFERENCE_CASES.map((entry, at) => <button key={entry.id} type="button" aria-pressed={at === index} onClick={() => move(at)}>{progress.passed[entry.id] ? '✓ ' : ''}{at + 1}. {entry.title}</button>)}</div>
    <div className="inference-lab-grid bloom-columns"><div><span className="inference-lab-kicker">CASE {index + 1} OF {INFERENCE_CASES.length}</span><h3>{item.title}</h3><pre><code>{item.code}</code></pre><p>What type does TypeScript infer for <strong>{item.target}</strong>?</p><div className="inference-lab-options bloom-wrap" role="radiogroup" aria-label={`Inferred type for ${item.target}`}>{item.options.map((option) => <label key={option} className={choice === option ? 'selected' : ''}><input type="radio" name="inference-answer" value={option} checked={choice === option} onChange={() => select(option)} /><code>{option}</code></label>)}</div><div className="inference-lab-actions"><button type="button" onClick={check}>Check prediction</button><button type="button" disabled={index === 0} aria-label="Previous case" onClick={() => move(index - 1)}><ChevronLeft size={16} /></button><button type="button" disabled={index === INFERENCE_CASES.length - 1} aria-label="Next case" onClick={() => move(index + 1)}><ChevronRight size={16} /></button></div><p role="status" className={checked ? result.pass ? 'inference-lab-correct' : 'inference-lab-try' : ''}>{checked ? result.feedback : `${passed} of ${INFERENCE_CASES.length} cases solved.`}</p>{passed === INFERENCE_CASES.length && <p className="inference-lab-finish">All five cases solved. You can now spot when TypeScript widens a value and when it keeps a literal.</p>}</div><div className="inference-lab-visual"><svg viewBox="0 0 440 204" role="img" aria-label={`Inference path from ${item.target} through TypeScript to ${checked && result.pass ? item.answer : 'a predicted type'}`}><rect x="1" y="1" width="438" height="202" rx="18" className="inference-lab-frame" /><path d="M62 100 H378" className="inference-lab-track" /><path ref={pathRef} d="M62 100 H378" strokeDasharray="316" strokeDashoffset="316" className="inference-lab-flow" /><circle cx="62" cy="100" r="27" /><circle cx="220" cy="100" r="27" /><circle cx="378" cy="100" r="27" /><text x="62" y="106" textAnchor="middle">{'{ }'}</text><text x="220" y="106" textAnchor="middle">TS</text><text x="378" y="106" textAnchor="middle">?</text><text x="62" y="163" textAnchor="middle">CODE</text><text x="220" y="163" textAnchor="middle">INFER</text><text x="378" y="163" textAnchor="middle">TYPE</text></svg><p>{checked && result.pass ? item.explanation : 'Read the binding, value, and expression. Then predict the type the compiler discovers.'}</p></div></div>
  </LearningExercise>
}
