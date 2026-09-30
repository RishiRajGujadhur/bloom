import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Medicine Cabinet: it's clear-out day. Every box shows its label — expiry
 * date and who it's for. Drag each one to the right place: back on the
 * cabinet shelf, into the pharmacy return bag if it's out of date, or up to
 * the high "kids can't reach" shelf if it's a grown-up medicine. Today is
 * 30 September 2026.
 */
type Box = { id: number; name: string; color: string; exp: string; adult: boolean; expired: boolean; x: number; y: number; placed: string | null }
const TODAY = '2026-09-30'
const NAMES = [
  { name: 'Paracetamol', color: '#60a5fa', adult: false }, { name: 'Ibuprofen', color: '#f472b6', adult: false }, { name: 'Cough syrup', color: '#a78bfa', adult: false },
  { name: 'Antihistamine', color: '#34d399', adult: false }, { name: 'Strong painkiller', color: '#ef4444', adult: true }, { name: 'Sleeping tablets', color: '#1e3a8a', adult: true },
  { name: 'Iron tablets', color: '#f59e0b', adult: true }, { name: 'Plasters', color: '#fbbf24', adult: false }, { name: 'Blood-pressure pills', color: '#6b7280', adult: true }, { name: 'Antiseptic cream', color: '#10b981', adult: false },
]
const W = 820, H = 500
const ZONES = [
  { id: 'high', label: 'High shelf (grown-ups only)', x: 40, y: 30, w: 420, h: 90, color: '#7c3aed' },
  { id: 'shelf', label: 'Cabinet shelf', x: 40, y: 150, w: 420, h: 90, color: '#0ea5e9' },
  { id: 'return', label: 'Pharmacy return bag', x: 540, y: 30, w: 240, h: 210, color: '#dc2626' },
]
const rightZone = (b: Box) => (b.expired ? 'return' : b.adult ? 'high' : 'shelf')

export default function MedicineCabinet() {
  const [best, submit] = useBest('meds')
  const [boxes, setBoxes] = useState<Box[]>([])
  const [drag, setDrag] = useState<{ id: number; dx: number; dy: number } | null>(null)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const zoneEls = useRef(new Map<string, SVGGElement>())
  const st = useRef({ score: 0, right: 0, wrong: 0, t0: performance.now() })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => {
    st.current = { score: 0, right: 0, wrong: 0, t0: performance.now() }
    const pick = [...NAMES].sort(() => Math.random() - 0.5).slice(0, 8)
    setBoxes(pick.map((n, i) => {
      const expired = Math.random() < 0.35
      const d = new Date(`${TODAY}T12:00:00`); d.setMonth(d.getMonth() + (expired ? -(1 + Math.floor(Math.random() * 18)) : 1 + Math.floor(Math.random() * 30)))
      return { id: i, name: n.name, color: n.color, adult: n.adult, expired, exp: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), x: 60 + (i % 4) * 110, y: 300 + Math.floor(i / 4) * 95, placed: null }
    }))
    setScore(0); setMsg('')
  }, [round])

  const pt = (e: React.PointerEvent) => { const m = svg.current?.getScreenCTM(); return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 } }
  const drop = () => {
    if (!drag) return
    const b = boxes.find((x) => x.id === drag.id)!
    const z = ZONES.find((zz) => b.x > zz.x - 30 && b.x < zz.x + zz.w - 50 && b.y > zz.y - 30 && b.y < zz.y + zz.h - 30)
    setDrag(null)
    if (!z) return
    const s = st.current
    const ok = rightZone(b) === z.id
    if (ok) { s.right++; s.score += 12 } else { s.wrong++; s.score = Math.max(0, s.score - 6) }
    setScore(s.score)
    setMsg(ok ? `${b.name}: sorted ✓` : `${b.name}: ${b.expired ? 'that one’s out of date' : b.adult ? 'that should be up high, away from kids' : 'that one’s fine for the normal shelf'}`)
    const el = zoneEls.current.get(z.id)
    if (el && !reducedMotion()) gsap.fromTo(el, { x: ok ? 0 : -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    const placedCount = boxes.filter((x) => x.placed && x.placed === z.id).length
    const next = boxes.map((x) => (x.id === b.id ? { ...x, placed: ok ? z.id : null, x: ok ? z.x + 20 + (placedCount % 5) * 80 : 60 + (x.id % 4) * 110, y: ok ? z.y + 30 + Math.floor(placedCount / 5) * 60 : 300 + Math.floor(x.id / 4) * 95 } : x))
    setBoxes(next)
    if (next.every((x) => x.placed)) {
      const secs = (performance.now() - s.t0) / 1000
      s.score += Math.max(0, Math.round(60 - secs))
      const record = submitRef.current(s.score)
      setTimeout(() => setResult({ headline: 'Cabinet sorted and safe', lines: [`${s.right} sorted first time`, `${s.wrong} slips`, `Score ${s.score}`], record }), 400)
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Medicine Cabinet" score={score} best={best} result={result} onRestart={restart}
      hint={`Today is 30 Sep 2026 · drag each box: out of date → return bag, grown-up medicine → high shelf, the rest → cabinet ${msg ? `· ${msg}` : ''}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={(e) => { if (drag) { const p = pt(e); setBoxes((bs) => bs.map((b) => (b.id === drag.id ? { ...b, x: p.x - drag.dx, y: p.y - drag.dy } : b))) } }} onPointerUp={drop} role="img" aria-label="Medicine cabinet" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#f0fdfa" />
        {ZONES.map((z) => (
          <g key={z.id} ref={(el) => { if (el) zoneEls.current.set(z.id, el) }}>
            <rect x={z.x} y={z.y} width={z.w} height={z.h} rx={12} fill="#fff" stroke={z.color} strokeWidth={3} strokeDasharray={z.id === 'return' ? '8 6' : undefined} />
            <text x={z.x + 10} y={z.y + 18} fontSize={12} fontWeight={800} fill={z.color}>{z.label}</text>
            {z.id === 'high' && <text x={z.x + z.w - 30} y={z.y + 22} fontSize={18}>🔒</text>}
            {z.id === 'return' && <text x={z.x + z.w / 2} y={z.y + z.h - 30} textAnchor="middle" fontSize={40}>🛍️</text>}
          </g>
        ))}
        <text x={40} y={285} fontSize={12} fontWeight={700} fill="#475569">To sort:</text>
        {boxes.map((b) => (
          <g key={b.id} transform={`translate(${b.x} ${b.y})`} onPointerDown={(e) => { if (b.placed) return; const p = pt(e); setDrag({ id: b.id, dx: p.x - b.x, dy: p.y - b.y }) }} style={{ cursor: b.placed ? 'default' : 'grab' }} opacity={b.placed ? 0.85 : 1}>
            <rect width={96} height={58} rx={6} fill="#fff" stroke={b.color} strokeWidth={3} />
            <rect width={96} height={16} rx={6} fill={b.color} />
            <text x={48} y={12} textAnchor="middle" fontSize={9.5} fontWeight={800} fill="#fff">{b.name}</text>
            <text x={48} y={33} textAnchor="middle" fontSize={10} fill={b.expired ? '#dc2626' : '#334155'} fontWeight={700}>EXP {b.exp}</text>
            <text x={48} y={50} textAnchor="middle" fontSize={9} fill="#64748b">{b.adult ? 'Adults only' : 'Adults & children'}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
