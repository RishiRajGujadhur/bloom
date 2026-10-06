import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkSelector, sceneNodes, SELECTOR_CASES } from './selectorDetectiveModel'
import './selectorDetective.css'

const KEY = 'bloom-css-selector-detective-v1'
const readSolved = () => { try { const value = JSON.parse(localStorage.getItem(KEY) ?? '[]'); return Array.isArray(value) ? value.filter((item): item is number => Number.isInteger(item) && item >= 0 && item < SELECTOR_CASES.length) : [] } catch { return [] as number[] } }

export function SelectorDetective({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState(() => SELECTOR_CASES.map(() => ''))
  const [solved, setSolved] = useState<number[]>(readSolved)
  const [checked, setChecked] = useState(false)
  const board = useRef<SVGGElement>(null)
  const current = SELECTOR_CASES[index]
  const answer = answers[index]
  const result = checkSelector(current, answer)
  const nodes = sceneNodes(current)
  useLayoutEffect(() => {
    if (!board.current || prefersReducedMotion()) return
    const tween = gsap.fromTo(board.current.children, { opacity: .45, y: 8 }, { opacity: 1, y: 0, stagger: .06, duration: .3, ease: 'power2.out' })
    return () => { tween.progress(1).kill() }
  }, [index, checked])
  const update = (value: string) => { setAnswers((old) => old.map((item, at) => at === index ? value : item)); setChecked(false) }
  const run = () => {
    setChecked(true)
    if (result.pass && !solved.includes(index)) {
      const next = [...solved, index]
      setSolved(next)
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* progress remains in memory */ }
    }
  }
  const choose = (next: number) => { setIndex(next); setChecked(false) }
  return <LearningExercise className="selector-detective" aria-label="CSS selector detective kata" title={<>Selector detective</>} description={<>Read each scene, write a selector, and reveal exactly the requested evidence.</>} onClose={onClose} backSizing="minimum">

    <div className="selector-detective-progress" role="group" aria-label="Investigation cases">{SELECTOR_CASES.map((item, at) => <button type="button" key={item.title} aria-label={`Case ${at + 1}: ${item.title}${solved.includes(at) ? ', solved' : ''}`} aria-current={index === at ? 'step' : undefined} onClick={() => choose(at)}>{solved.includes(at) ? '✓' : at + 1}</button>)}</div>
    <div className="selector-detective-grid bloom-columns"><div><span className="selector-detective-kicker">CASE {index + 1} OF {SELECTOR_CASES.length}</span><h3>{current.title}</h3><p>{current.story}</p><pre aria-label="Scene HTML"><code>{current.markup.replaceAll('><', '>\n<')}</code></pre><label htmlFor="selector-answer">Your CSS selector</label><div className="selector-detective-input bloom-wrap"><input id="selector-answer" value={answer} onChange={(event) => update(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') run() }} autoComplete="off" spellCheck={false} placeholder={current.example} /><button type="button" onClick={run}>Test selector</button></div><p role="status">{checked ? result.feedback : 'Type a selector, then test your match.'}</p><div className="selector-detective-actions bloom-wrap"><button type="button" onClick={() => update('')}><RotateCcw size={15} /> Clear</button><button type="button" disabled={index === 0} onClick={() => choose(index - 1)} aria-label="Previous case"><ChevronLeft size={16} /></button><button type="button" disabled={index === SELECTOR_CASES.length - 1} onClick={() => choose(index + 1)} aria-label="Next case"><ChevronRight size={16} /></button></div>{solved.length === SELECTOR_CASES.length && <p className="selector-detective-done">All three cases solved. You can now combine classes, child relationships, and attributes.</p>}</div><div><h3>Evidence board</h3><svg viewBox="0 0 460 300" role="img" aria-label={`Evidence board showing ${nodes.map((node) => `${node.id}${checked && result.matched.includes(node.id) ? ' selected' : ''}`).join(', ')}`}><g ref={board}>{nodes.map((node, at) => { const x = 115 + (at % 2) * 230; const y = 78 + Math.floor(at / 2) * 105; const lit = checked && result.matched.includes(node.id); const target = current.targets.includes(node.id); return <g key={node.id}><path d={`M230 28 Q${x} 20 ${x} ${y - 26}`} fill="none" stroke={lit ? '#55b8a2' : '#8d95b4'} strokeWidth="2" strokeDasharray={target ? undefined : '4 5'} /><circle cx={x} cy={y} r="36" fill={lit ? '#55b8a2' : '#d9ddec'} stroke={lit && !target ? '#d37162' : '#6d78a5'} strokeWidth="3" /><text x={x} y={y + 56} textAnchor="middle">{node.id}</text></g> })}<circle cx="230" cy="28" r="13" fill="#6671b4" /></g></svg><p className="selector-detective-legend"><span>●</span> Lit nodes match your selector. Dashed paths lead to decoys.</p></div></div>
  </LearningExercise>
}
