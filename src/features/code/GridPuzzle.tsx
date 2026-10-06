import { LearningExercise } from './LearningExercise'
import { useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { RotateCcw } from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { checkGridLayout, gridRect, GRID_START, GRID_TILES, type GridLayout, type GridPlacement } from './gridPuzzleModel'
import './gridPuzzle.css'

const DRAFT_KEY = 'bloom-grid-puzzle-draft-v1'
const DONE_KEY = 'bloom-grid-puzzle-done-v1'
const readLayout = (): GridLayout => {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
    if (GRID_TILES.every((tile) => ['column', 'row', 'columnSpan', 'rowSpan'].every((key) => Number.isInteger(saved?.[tile.id]?.[key])))) return saved
  } catch { /* use starter */ }
  return GRID_START
}

export function GridPuzzle({ onClose }: { onClose: () => void }) {
  const [layout, setLayout] = useState(readLayout)
  const [checked, setChecked] = useState(false)
  const [done, setDone] = useState(() => { try { return localStorage.getItem(DONE_KEY) === 'true' && checkGridLayout(readLayout()).every((item) => item.pass) } catch { return false } })
  const groups = useRef<(SVGGElement | null)[]>([])
  const rectangles = useRef<(SVGRectElement | null)[]>([])
  const labels = useRef<(SVGTextElement | null)[]>([])
  const checks = checkGridLayout(layout)
  const passed = checks.filter((item) => item.pass).length
  useLayoutEffect(() => {
    const tweens = GRID_TILES.flatMap((tile, index) => {
      const rect = gridRect(layout[tile.id])
      const options = { x: rect.x, y: rect.y, duration: .4, ease: 'power2.out' }
      const shape = { attr: { width: rect.width, height: rect.height }, duration: .4, ease: 'power2.out' }
      const text = { x: rect.width / 2, y: rect.height / 2 + 5, duration: .4, ease: 'power2.out' }
      if (prefersReducedMotion()) {
        if (groups.current[index]) gsap.set(groups.current[index], options)
        if (rectangles.current[index]) gsap.set(rectangles.current[index], shape)
        if (labels.current[index]) gsap.set(labels.current[index], text)
        return []
      }
      return [groups.current[index] && gsap.to(groups.current[index], options), rectangles.current[index] && gsap.to(rectangles.current[index], shape), labels.current[index] && gsap.to(labels.current[index], text)].filter(Boolean) as gsap.core.Tween[]
    })
    return () => { tweens.forEach((tween) => tween.kill()) }
  }, [layout])
  const persist = (next: GridLayout) => {
    setLayout(next); setChecked(false); setDone(false)
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)); localStorage.removeItem(DONE_KEY) } catch { /* keep in memory */ }
  }
  const update = (id: keyof GridLayout, key: keyof GridPlacement, value: number) => persist({ ...layout, [id]: { ...layout[id], [key]: value } })
  const run = () => { setChecked(true); if (checks.every((item) => item.pass)) { setDone(true); try { localStorage.setItem(DONE_KEY, 'true') } catch { /* keep in memory */ } } }
  return <LearningExercise className="grid-puzzle" aria-label="Grid layout puzzle" title={<>Fit the page into a grid</>} description={<>Place four page regions on a 3 × 3 CSS grid. Change each tile’s start track and span.</>} onClose={onClose}>

    <p className="grid-puzzle-objective"><strong>Objective:</strong> Hero fills the top left two cells; Notes fills the right side of rows 1–2; Gallery fills the lower left four cells; Footer fills the bottom right cell.</p>
    <div className="grid-puzzle-layout"><div className="grid-puzzle-controls">{GRID_TILES.map((tile) => <fieldset key={tile.id}><legend><span style={{ background: tile.color }} />{tile.name}</legend>{([{ key: 'column', name: 'Column' }, { key: 'row', name: 'Row' }, { key: 'columnSpan', name: 'Column span' }, { key: 'rowSpan', name: 'Row span' }] as const).map((property) => <label key={property.key}>{property.name}<select value={layout[tile.id][property.key]} onChange={(event) => update(tile.id, property.key, Number(event.target.value))} aria-label={`${tile.name} ${property.name.toLowerCase()}`}>{[1, 2, 3].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>)}</fieldset>)}<div className="grid-puzzle-actions"><button type="button" onClick={run}>Check layout</button><button type="button" onClick={() => persist(GRID_START)}><RotateCcw size={15} /> Reset</button></div></div><div><svg viewBox="0 0 440 400" className="grid-puzzle-svg" role="img" aria-label="Animated three by three grid with Hero, Notes, Gallery, and Footer tiles"><rect x="1" y="1" width="438" height="398" rx="16" className="grid-puzzle-background" />{Array.from({ length: 9 }, (_, index) => <rect key={index} x={58 + index % 3 * 108} y={36 + Math.floor(index / 3) * 108} width="100" height="100" rx="8" className="grid-puzzle-cell" />)}{GRID_TILES.map((tile, index) => <g key={tile.id} ref={(item) => { groups.current[index] = item }}><rect ref={(item) => { rectangles.current[index] = item }} rx="8" fill={tile.color} className="grid-puzzle-tile" /><text ref={(item) => { labels.current[index] = item }} textAnchor="middle" className="grid-puzzle-label">{tile.name}</text></g>)}</svg><p className="grid-puzzle-tip">A span of 2 covers two tracks and the gap between them. Keep every tile inside the board.</p><p role="status">{done ? 'Grid solved. All regions fit!' : checked ? `${passed} of ${checks.length} checks pass.` : 'Adjust the tile controls, then check the layout.'}</p></div></div><ul className="grid-puzzle-checks" aria-label="Grid feedback">{checks.map((item) => <li key={item.label}><strong>{checked ? item.pass ? '✓ ' : '○ ' : ''}{item.label}</strong>{checked && !item.pass && <span>{item.hint}</span>}</li>)}</ul>
  </LearningExercise>
}
