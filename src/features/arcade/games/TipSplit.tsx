import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Tip Split Café: friends finish lunch and the bill lands. Drag coins from the
 * pot onto each friend's plate so everyone pays for what they had, plus their
 * share of the tip. Get it fair and fast and they'll invite you again.
 */
type Friend = { name: string; face: string; items: { glyph: string; price: number }[] }
const MENU = [{ glyph: '🥗', price: 8 }, { glyph: '🍔', price: 12 }, { glyph: '🍝', price: 11 }, { glyph: '☕', price: 3 }, { glyph: '🍰', price: 5 }, { glyph: '🥤', price: 2 }, { glyph: '🍕', price: 10 }, { glyph: '🍜', price: 9 }]
const FACES = ['👩', '🧔', '👧', '👴', '🧑', '👱']
const TIPS = [0.1, 0.12, 0.15]
const W = 800, H = 480
const BILLS = 4

const makeBill = () => {
  const n = 2 + Math.floor(Math.random() * 3)
  const friends: Friend[] = Array.from({ length: n }, (_, i) => ({ name: ['Ana', 'Ben', 'Cai', 'Dee', 'Eli'][i], face: FACES[(i + Math.floor(Math.random() * 3)) % FACES.length], items: Array.from({ length: 1 + Math.floor(Math.random() * 2) }, () => MENU[Math.floor(Math.random() * MENU.length)]) }))
  return { friends, tip: TIPS[Math.floor(Math.random() * TIPS.length)] }
}
const owed = (f: Friend, tip: number) => Math.round(f.items.reduce((n, i) => n + i.price, 0) * (1 + tip))

export default function TipSplit() {
  const [best, submit] = useBest('tipsplit')
  const [bill, setBill] = useState(makeBill)
  const [plates, setPlates] = useState<number[]>([])
  const [bi, setBi] = useState(0)
  const [drag, setDrag] = useState<{ v: number; x: number; y: number } | null>(null)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const dragRef = useRef<{ v: number; x: number; y: number } | null>(null)
  const setD = (d: { v: number; x: number; y: number } | null) => { dragRef.current = d; setDrag(d) }
  const st = useRef({ score: 0, t0: performance.now(), lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, t0: performance.now(), lines: [] }; const b = makeBill(); setBill(b); setPlates(b.friends.map(() => 0)); setBi(0); setScore(0); setMsg('') }, [round])

  const seatX = (i: number) => 120 + i * (560 / Math.max(1, bill.friends.length - 1 || 1))
  const pt = (e: React.PointerEvent) => { const m = svg.current?.getScreenCTM(); return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 } }
  const drop = () => {
    const d = dragRef.current
    if (!d) return
    const i = bill.friends.findIndex((_, k) => Math.abs(seatX(k) - d.x) < 70 && d.y < 300)
    if (i >= 0) setPlates((p) => p.map((v, k) => (k === i ? v + d.v : v)))
    setD(null)
  }
  const clearPlate = (i: number) => setPlates((p) => p.map((v, k) => (k === i ? 0 : v)))
  const settle = () => {
    const s = st.current
    const want = bill.friends.map((f) => owed(f, bill.tip))
    const off = want.reduce((n, w, i) => n + Math.abs(w - plates[i]), 0)
    const secs = (performance.now() - s.t0) / 1000
    const pts = Math.max(0, Math.round(60 - off * 6 - secs))
    s.score += pts; setScore(s.score)
    s.lines.push(`Bill ${bi + 1}: ${off === 0 ? 'spot on' : `£${off} off`}`)
    setMsg(off === 0 ? 'Perfectly fair! 🙌' : `Close — someone’s £${off} out.`)
    if (!reducedMotion() && svg.current) gsap.fromTo(svg.current.querySelectorAll('.ts-face'), { y: 0 }, { y: off === 0 ? -14 : 0, x: off === 0 ? 0 : 4, duration: 0.2, yoyo: true, repeat: 1, stagger: 0.05 })
    setTimeout(() => {
      if (bi + 1 >= BILLS) { const record = submitRef.current(s.score); setResult({ headline: 'Lunch club sorted', lines: [...s.lines, `Score ${s.score}`], record }) }
      else { const b = makeBill(); setBill(b); setPlates(b.friends.map(() => 0)); setBi(bi + 1); setMsg(''); s.t0 = performance.now() }
    }, 1300)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const total = bill.friends.reduce((n, f) => n + f.items.reduce((m, i) => m + i.price, 0), 0)
  return (
    <GameShell title="Tip Split Café" score={score} best={best} result={result} onRestart={restart}
      hint={`Bill ${bi + 1}/${BILLS} · drag coins onto each plate: what they had + ${Math.round(bill.tip * 100)}% tip (rounded) · tap a plate to clear it ${msg ? `· ${msg}` : ''}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={(e) => { const d = dragRef.current; if (d) { const p = pt(e); setD({ ...d, x: p.x, y: p.y }) } }} onPointerUp={drop} role="img" aria-label="Café table" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#fff7ed" />
        <ellipse cx={400} cy={220} rx={360} ry={120} fill="#d6a86c" />
        <ellipse cx={400} cy={210} rx={350} ry={112} fill="#e7bf85" />
        {bill.friends.map((f, i) => {
          const x = seatX(i)
          return (
            <g key={i}>
              <text className="ts-face" x={x} y={70} textAnchor="middle" fontSize={50}>{f.face}</text>
              <text x={x} y={100} textAnchor="middle" fontSize={13} fontWeight={800} fill="#7c2d12">{f.name}</text>
              <g onPointerDown={() => clearPlate(i)} style={{ cursor: 'pointer' }}>
                <ellipse cx={x} cy={200} rx={62} ry={38} fill="#fff" stroke="#e7e5e4" strokeWidth={3} />
                {f.items.map((it, k) => <text key={k} x={x - 20 + k * 36} y={196} textAnchor="middle" fontSize={26}>{it.glyph}</text>)}
                <text x={x} y={228} textAnchor="middle" fontSize={11} fill="#78716c">{f.items.map((it) => `£${it.price}`).join(' + ')}</text>
              </g>
              <g transform={`translate(${x} 270)`}>
                <circle r={20} fill="#fde047" stroke="#ca8a04" strokeWidth={2} />
                <text textAnchor="middle" y={5} fontSize={14} fontWeight={900} fill="#713f12">£{plates[i] ?? 0}</text>
              </g>
            </g>
          )
        })}
        <g transform="translate(640 330)">
          <rect width={140} height={110} rx={12} fill="#fff" stroke="#e7e5e4" />
          <text x={14} y={26} fontSize={13} fontWeight={800} fill="#7c2d12">🧾 Bill</text>
          <text x={14} y={50} fontSize={12} fill="#57534e">Food £{total}</text>
          <text x={14} y={70} fontSize={12} fill="#57534e">Tip {Math.round(bill.tip * 100)}%</text>
          <text x={14} y={92} fontSize={13} fontWeight={800} fill="#1c1917">Total ≈ £{Math.round(total * (1 + bill.tip))}</text>
        </g>
        {/* Coin pot. */}
        <g transform="translate(40 350)">
          <text fontSize={12} fontWeight={800} fill="#7c2d12" y={-8}>drag coins ↑</text>
          {[1, 2, 5, 10].map((v, i) => (
            <g key={v} transform={`translate(${30 + i * 70} 40)`} onPointerDown={(e) => { const p = pt(e); setD({ v, x: p.x, y: p.y }) }} style={{ cursor: 'grab' }}>
              <circle r={26 + i * 2} fill={v >= 5 ? '#e2e8f0' : '#fbbf24'} stroke={v >= 5 ? '#94a3b8' : '#b45309'} strokeWidth={3} />
              <text textAnchor="middle" y={6} fontSize={16} fontWeight={900} fill="#1c1917">£{v}</text>
            </g>
          ))}
        </g>
        <g transform="translate(360 400)" onPointerDown={settle} style={{ cursor: 'pointer' }}>
          <rect width={170} height={46} rx={23} fill="#ea580c" />
          <text x={85} y={29} textAnchor="middle" fontWeight={800} fill="#fff">💳 Settle up</text>
        </g>
        {drag && <g transform={`translate(${drag.x} ${drag.y})`} pointerEvents="none"><circle r={24} fill="#fbbf24" opacity={0.85} /><text textAnchor="middle" y={6} fontSize={15} fontWeight={900}>£{drag.v}</text></g>}
      </svg>
    </GameShell>
  )
}
