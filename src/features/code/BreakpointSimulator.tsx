import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'

import { prefersReducedMotion } from '../../utils/motion'
import { BREAKPOINT_CASES, BREAKPOINT_START, checkBreakpoints, columnsAt, previewCards, type Breakpoints } from './breakpointModel'
import './breakpointSimulator.css'

const STORAGE_KEY = 'bloom-breakpoint-simulator-v1'
const DONE_KEY = 'bloom-breakpoint-simulator-done-v1'
const readPoints = (): Breakpoints => {
  try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); if (Number.isFinite(saved?.twoColumns) && Number.isFinite(saved?.threeColumns)) return saved } catch { /* use starter */ }
  return BREAKPOINT_START
}

export function BreakpointSimulator({ onClose }: { onClose: () => void }) {
  const [points, setPoints] = useState(readPoints)
  const [viewport, setViewport] = useState(620)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkBreakpoints(readPoints()).every((item) => item.pass) } catch { return false } })
  const groups = useRef<(SVGGElement | null)[]>([])
  const cards = useRef<(SVGRectElement | null)[]>([])
  const preview = previewCards(viewport, points)
  const columns = columnsAt(viewport, points)
  const checks = checkBreakpoints(points)
  const passed = checks.filter((item) => item.pass).length
  const screenWidth = Math.max(140, Math.min(500, viewport * 500 / 1200))
  useLayoutEffect(() => {
    const tweens = preview.flatMap((card, index) => {
      if (prefersReducedMotion()) {
        if (groups.current[index]) gsap.set(groups.current[index], { x: card.x, y: card.y })
        if (cards.current[index]) gsap.set(cards.current[index], { attr: { width: card.width } })
        return []
      }
      return [groups.current[index] && gsap.to(groups.current[index], { x: card.x, y: card.y, duration: .38, ease: 'power2.out' }), cards.current[index] && gsap.to(cards.current[index], { attr: { width: card.width }, duration: .38, ease: 'power2.out' })].filter(Boolean) as gsap.core.Tween[]
    })
    return () => { tweens.forEach((tween) => tween.kill()) }
  }, [viewport, points])
  const update = (patch: Partial<Breakpoints>) => {
    const next = { ...points, ...patch }; setPoints(next); setChecked(false); setDone(false)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); localStorage.removeItem(DONE_KEY) } catch { /* keep in memory */ }
  }
  const run = () => { setChecked(true); if (checks.every((item) => item.pass)) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } } }
  const rulerX = (width: number) => 42 + Math.max(0, Math.min(1200, width)) * 476 / 1200
  return <LearningExercise className="breakpoint-sim" aria-label="Responsive breakpoint simulator" title={<>Choose responsive breakpoints</>} description={<>Move the thresholds, then resize the SVG viewport to see when the card layout changes.</>} onClose={onClose}>

    <p className="breakpoint-sim-objective"><strong>Objective:</strong> Show one column on a 390 px phone, two at 620 px, and three at 1024 px. Each card needs 180 px of room on the real page.</p>
    <div className="breakpoint-sim-grid"><div className="breakpoint-sim-controls"><label>Two columns begin at <strong>{points.twoColumns} px</strong><input type="range" min="400" max="800" step="20" value={points.twoColumns} onChange={(event) => update({ twoColumns: Number(event.target.value) })} /></label><label>Three columns begin at <strong>{points.threeColumns} px</strong><input type="range" min="600" max="1100" step="20" value={points.threeColumns} onChange={(event) => update({ threeColumns: Number(event.target.value) })} /></label><label>Preview width <strong>{viewport} px</strong><input type="range" min="320" max="1200" step="10" value={viewport} onChange={(event) => setViewport(Number(event.target.value))} /></label><div className="breakpoint-sim-presets bloom-wrap" role="group" aria-label="Preview sample widths">{BREAKPOINT_CASES.map((item) => <button key={item.name} type="button" onClick={() => setViewport(item.width)}>{item.name} {item.width}</button>)}</div><button type="button" className="breakpoint-sim-check" onClick={run}>Check breakpoints</button><p role="status">{done ? 'Responsive layout complete!' : checked ? `${passed} of ${checks.length} checks pass.` : `Preview shows ${columns} column${columns > 1 ? 's' : ''}.`}</p></div><div><svg viewBox="0 0 560 410" role="img" className="breakpoint-sim-svg" aria-label={`${viewport} pixel viewport showing ${columns} columns; two-column threshold ${points.twoColumns} pixels, three-column threshold ${points.threeColumns} pixels`}><rect x="1" y="1" width="558" height="408" rx="16" className="breakpoint-sim-canvas" /><rect x={(560 - screenWidth) / 2} y="42" width={screenWidth} height="312" rx="12" className="breakpoint-sim-screen" /><text x="280" y="31" textAnchor="middle" className="breakpoint-sim-caption">{viewport} px · {columns} column{columns > 1 ? 's' : ''}</text>{preview.map((_, index) => <g key={index} ref={(item) => { groups.current[index] = item }}><rect ref={(item) => { cards.current[index] = item }} height="40" rx="6" className="breakpoint-sim-card" /><text x="12" y="25" className="breakpoint-sim-card-label">{index + 1}</text></g>)}<path d="M42 375 H518" className="breakpoint-sim-ruler" /><path d={`M${rulerX(points.twoColumns)} 366 V389 M${rulerX(points.threeColumns)} 366 V389`} className="breakpoint-sim-threshold" /><circle cx={rulerX(viewport)} cy="375" r="7" className="breakpoint-sim-marker" /><text x="42" y="401" className="breakpoint-sim-caption">0</text><text x="487" y="401" className="breakpoint-sim-caption">1200 px</text></svg><p className="breakpoint-sim-note">The two vertical marks are your breakpoints. The dot is the preview width.</p></div></div><ul className="breakpoint-sim-checks" aria-label="Breakpoint checks">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul>
  </LearningExercise>
}
