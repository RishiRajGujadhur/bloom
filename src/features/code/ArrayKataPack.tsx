import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ArrowLeft, Lightbulb, Play, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { runCode, type RunResult } from './codeRunner'
import { ARRAY_KATA } from './arrayKataModel'
import './arrayKataPack.css'

const STORAGE_KEY = 'bloom-array-kata-pack-v1'
type Saved = { drafts: Record<string, string>; done: Record<string, boolean> }
const readSaved = (): Saved => { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (saved?.drafts && saved?.done) return saved } catch { /* use starters */ } return { drafts: {}, done: {} } }

export function ArrayKataPack({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(readSaved)
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<RunResult | null>(null)
  const [running, setRunning] = useState(false)
  const [hint, setHint] = useState(false)
  const path = useRef<SVGPathElement>(null)
  const task = ARRAY_KATA[index]
  const code = saved.drafts[task.id] ?? task.starter
  const count = ARRAY_KATA.filter((item) => saved.done[item.id]).length
  const passed = result?.checks.filter((item) => item.pass).length ?? 0
  const complete = !!result && result.checks.length === task.checks.length && result.checks.every((item) => item.pass)
  useLayoutEffect(() => {
    if (!path.current) return
    if (prefersReducedMotion()) { gsap.set(path.current, { strokeDashoffset: complete ? 0 : 400 }); return }
    const tween = gsap.to(path.current, { strokeDashoffset: complete ? 0 : 400, duration: .6, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [index, complete])
  const persist = (next: Saved) => { setSaved(next); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* keep in memory */ } }
  const edit = (value: string) => { persist({ drafts: { ...saved.drafts, [task.id]: value }, done: { ...saved.done, [task.id]: false } }); setResult(null) }
  const run = async () => {
    if (running) return
    setRunning(true)
    try {
      const next = await runCode(code, task.checks)
      setResult(next)
      if (!next.error && !next.syntax && next.checks.length && next.checks.every((item) => item.pass)) persist({ ...saved, done: { ...saved.done, [task.id]: true } })
    } finally { setRunning(false) }
  }
  const choose = (next: number) => { if (running) return; setIndex(next); setResult(null); setHint(false) }
  return <section className="array-kata" aria-label="Array transformation kata pack">
    <header><button type="button" onClick={onClose} aria-label="Back to learning path"><ArrowLeft size={18} /></button><div><h2>Array transformation kata</h2><p>Write a function, run the checks, and use failed cases to improve it. Your drafts and passed kata are saved.</p></div></header>
    <div className="array-kata-tabs" role="group" aria-label="Array kata">{ARRAY_KATA.map((item, taskIndex) => <button type="button" key={item.id} aria-pressed={index === taskIndex} disabled={running} onClick={() => choose(taskIndex)}>{saved.done[item.id] ? '✓ ' : ''}{taskIndex + 1}. {item.title}</button>)}</div>
    <p className="array-kata-objective"><strong>Objective:</strong> {task.objective}</p>
    <div className="array-kata-grid"><div><label htmlFor="array-kata-code">Your JavaScript</label><textarea id="array-kata-code" spellCheck={false} value={code} onChange={(event) => edit(event.target.value)} onKeyDown={(event) => { if (event.ctrlKey && event.key === 'Enter') { event.preventDefault(); void run() } }} /><div className="array-kata-actions"><button type="button" onClick={() => void run()} disabled={running}><Play size={15} /> {running ? 'Running…' : 'Run checks'} <kbd>Ctrl ↵</kbd></button><button type="button" onClick={() => edit(task.starter)}><RotateCcw size={15} /> Reset</button><button type="button" onClick={() => setHint((value) => !value)}><Lightbulb size={15} /> Hint</button></div>{hint && <p>{task.hint}</p>}<p role="status">{complete ? `All ${task.checks.length} checks pass. Kata solved!` : result ? `${passed} of ${task.checks.length} checks pass.` : `${count} of ${ARRAY_KATA.length} kata solved.`}</p></div><div><svg viewBox="0 0 520 190" role="img" className="array-kata-svg" aria-label={`Array transformation: ${task.input} becomes ${task.output} when the kata passes`}><rect x="1" y="1" width="518" height="188" rx="16" className="array-kata-bg" /><path ref={path} d="M60 96 H460" className="array-kata-path" strokeDasharray="400" strokeDashoffset="400" /><rect x="22" y="61" width="132" height="70" rx="10" className="array-kata-node" /><rect x="194" y="61" width="132" height="70" rx="10" className="array-kata-node" /><rect x="366" y="61" width="132" height="70" rx="10" className="array-kata-node" /><text x="88" y="85" textAnchor="middle" className="array-kata-label">INPUT</text><text x="88" y="109" textAnchor="middle">{task.input.slice(0, 18)}</text><text x="260" y="85" textAnchor="middle" className="array-kata-label">FUNCTION</text><text x="260" y="109" textAnchor="middle">{task.id === 'double' ? 'map' : task.id === 'long' ? 'filter' : 'reduce'}</text><text x="432" y="85" textAnchor="middle" className="array-kata-label">TARGET</text><text x="432" y="109" textAnchor="middle">{task.output.slice(0, 18)}</text></svg><ul className="array-kata-checks" aria-label="Test results">{task.checks.map((check, checkIndex) => <li key={check.label}><strong>{result ? result.checks[checkIndex]?.pass ? '✓ ' : '○ ' : ''}{check.label}</strong>{result && !result.checks[checkIndex]?.pass && result.checks[checkIndex]?.got && <span>Got {result.checks[checkIndex].got}</span>}</li>)}</ul>{result?.syntax && <p className="array-kata-error">Syntax error on line {result.syntax.line}: {result.syntax.message}</p>}{result?.error && <p className="array-kata-error">{result.error}</p>}</div></div>{count === ARRAY_KATA.length && <p className="array-kata-complete">All array kata solved.</p>}
  </section>
}
