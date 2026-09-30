import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Pack the Suitcase: a weekend away and a carry-on. Drag the pieces into the
 * case (right-click or R to turn one). Some things you really can't leave
 * without; the rest is nice to have. Zip it before the taxi arrives.
 */
type Shape = number[][] // list of [col,row]
type Piece = { id: string; name: string; glyph: string; cells: Shape; color: string; must: boolean }
const COLS = 9, ROWS = 6, CELL = 52, GX = 60, GY = 70
const W = 980, H = 470
const PIECES: Piece[] = [
  { id: 'passport', name: 'Passport', glyph: '🛂', cells: [[0, 0]], color: '#b33c4a', must: true },
  { id: 'charger', name: 'Charger', glyph: '🔌', cells: [[0, 0], [1, 0]], color: '#444a57', must: true },
  { id: 'meds', name: 'Medicine', glyph: '💊', cells: [[0, 0]], color: '#f07a7a', must: true },
  { id: 'toothbrush', name: 'Wash bag', glyph: '🧼', cells: [[0, 0], [1, 0], [0, 1], [1, 1]], color: '#7cc6e8', must: true },
  { id: 'jumper', name: 'Jumper', glyph: '🧶', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], color: '#8e6bd6', must: false },
  { id: 'jeans', name: 'Jeans', glyph: '👖', cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]], color: '#3e6fb3', must: false },
  { id: 'shirts', name: 'Shirts', glyph: '👕', cells: [[0, 0], [1, 0], [2, 0], [1, 1]], color: '#6ac18b', must: false },
  { id: 'socks', name: 'Socks', glyph: '🧦', cells: [[0, 0], [0, 1]], color: '#f2a65a', must: true },
  { id: 'shoes', name: 'Shoes', glyph: '👟', cells: [[0, 0], [1, 0], [1, 1]], color: '#c9c9c9', must: false },
  { id: 'book', name: 'Book', glyph: '📘', cells: [[0, 0], [1, 0]], color: '#4b7bd1', must: false },
  { id: 'hat', name: 'Sun hat', glyph: '👒', cells: [[0, 0], [1, 0], [2, 0]], color: '#e9c46a', must: false },
  { id: 'umbrella', name: 'Umbrella', glyph: '☂️', cells: [[0, 0], [0, 1], [0, 2], [0, 3]], color: '#2a9d8f', must: false },
  { id: 'snacks', name: 'Snacks', glyph: '🍪', cells: [[0, 0], [1, 0], [0, 1]], color: '#d4a373', must: false },
  { id: 'camera', name: 'Camera', glyph: '📷', cells: [[0, 0], [1, 0]], color: '#555', must: false },
  { id: 'pillow', name: 'Big pillow', glyph: '🛏️', cells: [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]], color: '#e5e5f7', must: false },
]
const TIME = 75
const rotate = (s: Shape): Shape => { const r = s.map(([c, rr]) => [-rr, c]); const mc = Math.min(...r.map((p) => p[0])), mr = Math.min(...r.map((p) => p[1])); return r.map(([c, rr]) => [c - mc, rr - mr]) }
type Placed = { at: [number, number] | null; cells: Shape; tray: [number, number] }

export default function PackSuitcase() {
  const [best, submit] = useBest('suitcase')
  const [state, setState] = useState<Record<string, Placed>>({})
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; ox: number; oy: number } | null>(null)
  const [time, setTime] = useState(TIME)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const lid = useRef<SVGRectElement>(null)
  const done = useRef(false)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const init: Record<string, Placed> = {}
    PIECES.forEach((p, i) => { init[p.id] = { at: null, cells: p.cells, tray: [640 + (i % 4) * 85, 30 + Math.floor(i / 4) * 105] } })
    setState(init)
    setTime(TIME)
    done.current = false
    if (lid.current) gsap.set(lid.current, { attr: { height: 0 } })
    const t0 = performance.now()
    const iv = setInterval(() => {
      const left = Math.max(0, TIME - Math.floor((performance.now() - t0) / 1000))
      setTime(left)
    }, 250)
    return () => clearInterval(iv)
  }, [round])

  const occupied = (except: string, s: Record<string, Placed>) => {
    const m = new Set<string>()
    for (const [id, p] of Object.entries(s)) if (id !== except && p.at) p.cells.forEach(([c, r]) => m.add(`${p.at![0] + c},${p.at![1] + r}`))
    return m
  }
  const fits = (id: string, at: [number, number], cells: Shape, s: Record<string, Placed>) => {
    const occ = occupied(id, s)
    return cells.every(([c, r]) => { const x = at[0] + c, y = at[1] + r; return x >= 0 && y >= 0 && x < COLS && y < ROWS && !occ.has(`${x},${y}`) })
  }
  const pt = (e: { clientX: number; clientY: number }) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 }
  }

  const zip = useCallback(() => {
    if (done.current) return
    done.current = true
    const placed = PIECES.filter((p) => state[p.id]?.at)
    const musts = PIECES.filter((p) => p.must)
    const missing = musts.filter((p) => !state[p.id]?.at)
    const cells = placed.reduce((n, p) => n + state[p.id].cells.length, 0)
    const fill = Math.round((cells / (COLS * ROWS)) * 100)
    const score = (musts.length - missing.length) * 20 + fill + (missing.length ? 0 : 30) + time
    if (lid.current) gsap.to(lid.current, { attr: { height: ROWS * CELL + 16 }, duration: reducedMotion() ? 0 : 0.7, ease: 'bounce.out' })
    const record = submitRef.current(score)
    setTimeout(() => setResult({ headline: missing.length ? 'Zipped… but wait' : 'All packed!', lines: [missing.length ? `Left behind: ${missing.map((m) => m.name).join(', ')}` : 'Every essential is in', `Case ${fill}% full`, `${time}s to spare`, `Score ${score}`], record }), reducedMotion() ? 0 : 750)
  }, [state, time])
  useEffect(() => { if (time === 0) zip() }, [time, zip])

  const down = (e: React.PointerEvent, id: string) => {
    if (done.current) return
    if (e.button === 2) return
    e.stopPropagation()
    const p = pt(e)
    const s = state[id]
    const ox = s.at ? GX + s.at[0] * CELL : s.tray[0]
    const oy = s.at ? GY + s.at[1] * CELL : s.tray[1]
    setDrag({ id, x: p.x, y: p.y, ox: p.x - ox, oy: p.y - oy })
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => { if (drag) { const p = pt(e); setDrag({ ...drag, x: p.x, y: p.y }) } }
  const up = () => {
    if (!drag) return
    const s = state[drag.id]
    const col = Math.round((drag.x - drag.ox - GX) / CELL), row = Math.round((drag.y - drag.oy - GY) / CELL)
    const next = { ...state }
    next[drag.id] = { ...s, at: fits(drag.id, [col, row], s.cells, state) ? [col, row] : null }
    setState(next)
    setDrag(null)
  }
  const turn = (id: string) => {
    if (done.current) return
    const s = state[id]
    const cells = rotate(s.cells)
    const next = { ...state }
    next[id] = { ...s, cells, at: s.at && fits(id, s.at, cells, state) ? s.at : null }
    setState(next)
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key.toLowerCase() === 'r' && drag) { e.preventDefault(); e.stopPropagation(); turn(drag.id) } }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  })

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const packedMust = PIECES.filter((p) => p.must && state[p.id]?.at).length
  const mustTotal = PIECES.filter((p) => p.must).length
  return (
    <GameShell title="Pack the Suitcase" score={packedMust * 20} best={best} result={result} onRestart={restart}
      hint={`Drag things into the case · right-click to turn · essentials glow gold (${packedMust}/${mustTotal}) · taxi in ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={up} onContextMenu={(e) => e.preventDefault()} role="img" aria-label="Suitcase and belongings">
        <rect width={W} height={H} fill="#f4efe6" />
        <rect x={GX - 18} y={GY - 18} width={COLS * CELL + 36} height={ROWS * CELL + 36} rx={22} fill="#3d5a80" />
        <rect x={GX - 6} y={GY - 6} width={COLS * CELL + 12} height={ROWS * CELL + 12} rx={12} fill="#e8eef6" />
        {Array.from({ length: COLS * ROWS }, (_, i) => <rect key={i} x={GX + (i % COLS) * CELL + 2} y={GY + Math.floor(i / COLS) * CELL + 2} width={CELL - 4} height={CELL - 4} rx={6} fill="#dde5f0" />)}
        <rect x={GX + COLS * CELL / 2 - 40} y={GY - 40} width={80} height={24} rx={10} fill="none" stroke="#3d5a80" strokeWidth={8} />
        <g transform={`translate(${GX + COLS * CELL - 100} ${GY + ROWS * CELL + 26})`} onPointerDown={zip} style={{ cursor: 'pointer' }}>
          <rect width={100} height={40} rx={20} fill="#e76f51" />
          <text x={50} y={26} textAnchor="middle" fontWeight={800} fill="#fff">Zip it ✓</text>
        </g>
        {PIECES.map((p) => {
          const s = state[p.id]
          if (!s) return null
          const dragging = drag?.id === p.id
          const x = dragging ? drag.x - drag.ox : s.at ? GX + s.at[0] * CELL : s.tray[0]
          const y = dragging ? drag.y - drag.oy : s.at ? GY + s.at[1] * CELL : s.tray[1]
          const scale = !s.at && !dragging ? 0.5 : 1
          const cx = Math.max(...s.cells.map((c) => c[0])) + 1, cy = Math.max(...s.cells.map((c) => c[1])) + 1
          return (
            <g key={p.id} transform={`translate(${x} ${y}) scale(${scale})`} onPointerDown={(e) => down(e, p.id)} onContextMenu={(e) => { e.preventDefault(); turn(p.id) }} style={{ cursor: 'grab' }} opacity={dragging ? 0.85 : 1}>
              {s.cells.map(([c, r], i) => <rect key={i} x={c * CELL + 2} y={r * CELL + 2} width={CELL - 4} height={CELL - 4} rx={8} fill={p.color} stroke={p.must ? '#ffc93c' : '#0003'} strokeWidth={p.must ? 4 : 1.5} />)}
              <text x={(cx * CELL) / 2} y={(cy * CELL) / 2 + 10} textAnchor="middle" fontSize={28} pointerEvents="none">{p.glyph}</text>
            </g>
          )
        })}
        <rect ref={lid} x={GX - 18} y={GY - 18} width={COLS * CELL + 36} height={0} rx={22} fill="#2c4a6e" pointerEvents="none" />
      </svg>
    </GameShell>
  )
}
