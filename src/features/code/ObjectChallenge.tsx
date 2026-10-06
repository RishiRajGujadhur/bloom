import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Lightbulb, Play, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { runCode, type RunResult } from './codeRunner'
import { OBJECT_CHECKS, OBJECT_STARTER } from './objectUpdateModel'
import './objectChallenge.css'

const DRAFT_KEY = 'bloom-object-challenge-draft-v1'
const DONE_KEY = 'bloom-object-challenge-done-v1'
const readDraft = () => { try { return localStorage.getItem(DRAFT_KEY) ?? OBJECT_STARTER } catch { return OBJECT_STARTER } }
const readDone = () => { try { return localStorage.getItem(DONE_KEY) === 'true' } catch { return false } }

export function ObjectChallenge({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState(readDraft)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [hint, setHint] = useState(false)
  const [done, setDone] = useState(readDone)
  const path = useRef<SVGPathElement>(null)
  const passed = result?.checks.filter((item) => item.pass).length ?? 0
  const complete = !!result && result.checks.length === OBJECT_CHECKS.length && result.checks.every((item) => item.pass)
  useLayoutEffect(() => {
    if (!path.current) return
    if (prefersReducedMotion()) { gsap.set(path.current, { strokeDashoffset: complete ? 0 : 180 }); return }
    const tween = gsap.to(path.current, { strokeDashoffset: complete ? 0 : 180, duration: .6, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [complete])
  const edit = (value: string) => {
    setCode(value); setResult(null); setDone(false)
    try { localStorage.setItem(DRAFT_KEY, value); localStorage.removeItem(DONE_KEY) } catch { /* keep draft in memory */ }
  }
  const run = async () => {
    if (running) return
    setRunning(true)
    try {
      const next = await runCode(code, OBJECT_CHECKS)
      setResult(next)
      if (!next.error && !next.syntax && next.checks.every((item) => item.pass)) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } }
    } finally { setRunning(false) }
  }
  return <LearningExercise className="object-challenge" aria-label="Object lookup and update challenge" title={<>Update the garden stock</>} description={<>Read a key chosen at runtime, change its count, and return a fresh object.</>} onClose={onClose}>

    <p className="object-challenge-objective"><strong>Objective:</strong> Complete <code>adjustStock(stock, crop, delta)</code>. Keep every other crop, treat missing crops as zero, and leave the input object unchanged.</p>
    <div className="object-challenge-grid bloom-columns"><div><label htmlFor="object-challenge-code">Your JavaScript</label><textarea id="object-challenge-code" spellCheck={false} value={code} onChange={(event) => edit(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); void run() } }} /><div className="object-challenge-actions"><button type="button" onClick={() => void run()} disabled={running}><Play size={15} /> {running ? 'Running…' : 'Run checks'} <kbd>Ctrl ↵</kbd></button><button type="button" onClick={() => edit(OBJECT_STARTER)}><RotateCcw size={15} /> Reset</button><button type="button" onClick={() => setHint((value) => !value)}><Lightbulb size={15} /> Hint</button></div>{hint && <p>Use <code>stock[crop]</code> for a dynamic lookup. A spread copy and computed key can create the updated object.</p>}<p role="status">{complete || done ? 'All five checks pass. Stock updater complete!' : result ? `${passed} of ${OBJECT_CHECKS.length} checks pass.` : 'Write the function, then run the checks.'}</p></div><div><svg viewBox="0 0 520 230" role="img" className="object-challenge-svg" aria-label="Garden stock object changes kale from 3 to 5 while mint stays 2"><rect x="1" y="1" width="518" height="228" rx="16" className="object-challenge-bg" /><path ref={path} d="M169 114 H349" className="object-challenge-path" strokeDasharray="180" strokeDashoffset="180" /><rect x="25" y="50" width="145" height="128" rx="12" className="object-challenge-node" /><rect x="350" y="50" width="145" height="128" rx="12" className="object-challenge-node" /><text x="97" y="82" textAnchor="middle" className="object-challenge-title">INPUT STOCK</text><text x="97" y="113" textAnchor="middle">kale: 3</text><text x="97" y="139" textAnchor="middle">mint: 2</text><text x="422" y="82" textAnchor="middle" className="object-challenge-title">NEW STOCK</text><text x="422" y="113" textAnchor="middle">kale: 5</text><text x="422" y="139" textAnchor="middle">mint: 2</text><text x="260" y="95" textAnchor="middle" className="object-challenge-delta">+2 kale</text><text x="260" y="202" textAnchor="middle" className="object-challenge-caption">The input object must stay unchanged.</text></svg><ul className="object-challenge-checks" aria-label="Object update checks">{OBJECT_CHECKS.map((check, index) => <li key={check.label}><strong>{result ? result.checks[index]?.pass ? '✓ ' : '○ ' : ''}{check.label}</strong>{result && !result.checks[index]?.pass && result.checks[index]?.got && <span>Got {result.checks[index].got}</span>}</li>)}</ul>{result?.syntax && <p className="object-challenge-error">Syntax error on line {result.syntax.line}: {result.syntax.message}</p>}{result?.error && <p className="object-challenge-error">{result.error}</p>}</div></div>
  </LearningExercise>
}
