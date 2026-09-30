import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Drawer Organiser: the junk drawer has a new foam insert with a shaped slot
 * for every tool. Drag each item into the slot that matches its outline —
 * shape and size both count. Once everything has a home, you'll always know
 * where the scissors are. Three drawers, each fuller.
 */
type Item = { id: string; glyph: string; w: number; h: number }
const ITEMS: Item[] = [
  { id: 'scissors', glyph: '✂️', w: 60, h: 110 }, { id: 'tape', glyph: '📏', w: 110, h: 40 }, { id: 'torch', glyph: '🔦', w: 110, h: 44 },
  { id: 'keys', glyph: '🔑', w: 60, h: 60 }, { id: 'battery', glyph: '🔋', w: 44, h: 80 }, { id: 'pen', glyph: '✏️', w: 110, h: 26 },
  { id: 'glue', glyph: '🧴', w: 50, h: 90 }, { id: 'string', glyph: '🧶', w: 70, h: 70 }, { id: 'clip', glyph: '📎', w: 40, h: 60 },
]
const W = 820, H = 500
const DX = 40, DY = 40, DW = 500, DH = 420

export default function DrawerOrganiser() {
  const [best, submit] = useBest('drawer')
  const [level, setLevel] = useState(0)
  const [slots, setSlots] = useState<(Item & { x: number; y: number; filled: boolean })[]>([])
  const [loose, setLoose] = useState<(Item & { x: number; y: number })[]>([])
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const st = useRef({ score: 0, t0: performance.now(), wrong: 0, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const setup = useCallback((lv: number) => {
    const n = 5 + lv * 2
    const pick = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, n)
    // Shelf-pack slots in rows inside the drawer.
    let x = DX + 20, y = DY + 20, rowH = 0
    const sl = pick.map((it) => {
      if (x + it.w > DX + DW - 20) { x = DX + 20; y += rowH + 18; rowH = 0 }
      const s = { ...it, x, y, filled: false }
      x += it.w + 18; rowH = Math.max(rowH, it.h)
      return s
    })
    setSlots(sl)
    setLoose([...pick].sort(() => Math.random() - 0.5).map((it, i) => ({ ...it, x: 570 + (i % 2) * 125, y: 20 + Math.floor(i / 2) * 95 })))
    st.current.t0 = performance.now(); st.current.wrong = 0
  }, [])
  useEffect(() => { st.current = { score: 0, t0: performance.now(), wrong: 0, lines: [] }; setScore(0); setLevel(0); setup(0) }, [round, setup])

  const pt = (e: React.PointerEvent) => { const m = svg.current?.getScreenCTM(); return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 } }
  const drop = () => {
    if (!drag) return
    const it = loose.find((l) => l.id === drag.id)!
    setDrag(null)
    const slot = slots.find((s) => !s.filled && Math.abs(s.x + s.w / 2 - (it.x + it.w / 2)) < 50 && Math.abs(s.y + s.h / 2 - (it.y + it.h / 2)) < 50)
    if (!slot) return
    const s = st.current
    if (slot.id !== it.id) {
      s.wrong++
      const el = svg.current?.querySelector(`[data-item="${it.id}"]`)
      if (el && !reducedMotion()) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
      return
    }
    const nextSlots = slots.map((x) => (x === slot ? { ...x, filled: true } : x))
    setSlots(nextSlots)
    setLoose((ls) => ls.filter((l) => l.id !== it.id))
    if (nextSlots.every((x) => x.filled)) {
      const secs = (performance.now() - s.t0) / 1000
      const pts = Math.max(15, Math.round(80 - secs - s.wrong * 6))
      s.score += pts; setScore(s.score); s.lines.push(`Drawer ${level + 1}: ${Math.round(secs)}s`)
      setTimeout(() => {
        if (level + 1 >= 3) { const record = submitRef.current(s.score); setResult({ headline: 'A place for everything', lines: [...s.lines, `Score ${s.score}`], record }) }
        else { setLevel(level + 1); setup(level + 1) }
      }, 700)
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Drawer Organiser" score={score} best={best} result={result} onRestart={restart}
      hint={`Drawer ${level + 1}/3 · drag each item into the slot that matches its shape · ${loose.length} left`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={(e) => { if (drag) { const p = pt(e); setLoose((ls) => ls.map((l) => (l.id === drag.id ? { ...l, x: p.x - drag.dx, y: p.y - drag.dy } : l))) } }} onPointerUp={drop} role="img" aria-label="Drawer with foam insert" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#f5f5f4" />
        <rect x={DX - 14} y={DY - 14} width={DW + 28} height={DH + 28} rx={12} fill="#a16207" />
        <rect x={DX} y={DY} width={DW} height={DH} rx={6} fill="#1f2937" />
        {slots.map((s) => (
          <g key={s.id}>
            <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={Math.min(s.w, s.h) / 3} fill={s.filled ? '#334155' : '#0f172a'} stroke="#475569" strokeWidth={2} />
            {s.filled && <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 12} textAnchor="middle" fontSize={Math.min(s.w, s.h) * 0.7}>{s.glyph}</text>}
            {!s.filled && <text x={s.x + s.w / 2} y={s.y + s.h / 2 + 10} textAnchor="middle" fontSize={Math.min(s.w, s.h) * 0.6} opacity={0.12}>{s.glyph}</text>}
          </g>
        ))}
        {loose.map((l) => (
          <g key={l.id} data-item={l.id} transform={`translate(${l.x} ${l.y})`} onPointerDown={(e) => { const p = pt(e); setDrag({ id: l.id, dx: p.x - l.x, dy: p.y - l.y }) }} style={{ cursor: 'grab' }}>
            <rect width={l.w} height={l.h} rx={Math.min(l.w, l.h) / 3} fill="#fff" stroke="#d6d3d1" strokeWidth={2} />
            <text x={l.w / 2} y={l.h / 2 + 12} textAnchor="middle" fontSize={Math.min(l.w, l.h) * 0.7}>{l.glyph}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
