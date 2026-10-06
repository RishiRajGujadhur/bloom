import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { buildLoopFrames, checkLoop, LOOP_START, type LoopSettings } from './loopDebuggerModel'
import './loopDebugger.css'

const STORAGE_KEY = 'bloom-loop-debugger-v1'
const DONE_KEY = 'bloom-loop-debugger-done-v1'
const readSettings = (): LoopSettings => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if ([0, 1].includes(saved?.start) && ['<', '<=', '>'].includes(saved?.comparison) && [1, 2].includes(saved?.step)) return saved } catch { /* use starter */ }
  return LOOP_START
}

export function LoopDebugger({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState(readSettings)
  const [frameIndex, setFrameIndex] = useState(0)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkLoop(readSettings()).pass } catch { return false } })
  const cursor = useRef<SVGGElement>(null)
  const frames = buildLoopFrames(settings)
  const frame = frames[frameIndex]
  const result = checkLoop(settings)
  useLayoutEffect(() => {
    if (!cursor.current) return
    const x = Math.min(4, frame.i) * 80
    if (prefersReducedMotion()) { gsap.set(cursor.current, { x }); return }
    const tween = gsap.to(cursor.current, { x, duration: .3, ease: 'power2.out' })
    return () => { tween.kill() }
  }, [frame.i])
  const update = (patch: Partial<LoopSettings>) => {
    const next = { ...settings, ...patch }; setSettings(next); setFrameIndex(0); setChecked(false); setDone(false)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); localStorage.removeItem(DONE_KEY) } catch { /* keep in memory */ }
  }
  const runCheck = () => {
    setChecked(true)
    if (frameIndex === frames.length - 1 && result.pass) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } }
  }
  return <LearningExercise className="loop-debugger" aria-label="Loop debugger with step-through state" title={<>Debug the garden loop</>} description={<>Step through the loop one state at a time. Change the rule until it visits exactly plots 0, 1, and 2.</>} onClose={onClose}>

    <p className="loop-debugger-objective"><strong>Objective:</strong> Visit plots 0, 1, and 2 once each. Plot 3 must stay unvisited. Reach the final state before checking your fix.</p>
    <div className="loop-debugger-grid bloom-columns"><div><div className="loop-debugger-controls"><label>Start i at<select value={settings.start} onChange={(event) => update({ start: Number(event.target.value) as LoopSettings['start'] })}><option value="0">0</option><option value="1">1</option></select></label><label>Compare i<select value={settings.comparison} onChange={(event) => update({ comparison: event.target.value as LoopSettings['comparison'] })}><option value="<">&lt; 3</option><option value="<=">&lt;= 3</option><option value=">">&gt; 3</option></select></label><label>Increase i by<select value={settings.step} onChange={(event) => update({ step: Number(event.target.value) as LoopSettings['step'] })}><option value="1">1</option><option value="2">2</option></select></label></div><pre>{`let i = ${settings.start};\nwhile (i ${settings.comparison} 3) {\n  visit(i);\n  i += ${settings.step};\n}`}</pre><div className="loop-debugger-actions bloom-wrap"><button type="button" disabled={frameIndex === 0} onClick={() => setFrameIndex((value) => value - 1)}><ChevronLeft size={15} /> Previous state</button><button type="button" disabled={frameIndex === frames.length - 1} onClick={() => setFrameIndex((value) => value + 1)}>Next state <ChevronRight size={15} /></button><button type="button" onClick={() => { setFrameIndex(0); setChecked(false) }}><RotateCcw size={15} /> Restart trace</button></div><p role="status">State {frameIndex + 1} of {frames.length}: {frame.message}</p><button type="button" className="loop-debugger-check" onClick={runCheck}>Check loop</button>{checked && <p>{frameIndex === frames.length - 1 ? result.feedback : 'Step to the final state before checking the result.'}</p>}{done && <p className="loop-debugger-complete">Loop fixed and fully traced.</p>}</div><div><svg viewBox="0 0 500 240" role="img" aria-label={`Current i is ${frame.i}; visited plots ${frame.visited.join(', ') || 'none'}`} className="loop-debugger-svg"><rect x="1" y="1" width="498" height="238" rx="16" className="loop-debugger-bg" /><path d="M75 118 H395" className="loop-debugger-track" />{[0, 1, 2, 3, 4].map((plot) => <g key={plot}><circle cx={75 + plot * 80} cy="118" r="24" className={frame.visited.includes(plot) ? 'loop-debugger-visited' : 'loop-debugger-plot'} /><text x={75 + plot * 80} y="125" textAnchor="middle" className="loop-debugger-number">{plot}</text></g>)}<g ref={cursor}><path d="M75 49 L63 70 H87 Z" className="loop-debugger-cursor" /></g><text x="250" y="202" textAnchor="middle" className="loop-debugger-caption">{frame.phase === 'visit' ? `VISITING ${frame.i}` : frame.phase === 'done' ? 'LOOP STOPPED' : `CHECKING i = ${frame.i}`}</text></svg><p className="loop-debugger-note">Highlighted circles have been visited. The pointer follows the value of <code>i</code>.</p><ol className="loop-debugger-history">{frames.slice(0, frameIndex + 1).map((item, index) => <li key={index}>{item.message}</li>)}</ol></div></div>
  </LearningExercise>
}
