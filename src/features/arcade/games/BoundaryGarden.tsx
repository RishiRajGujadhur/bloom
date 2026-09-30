import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Boundary Garden: your garden has a fence with gates. Visitors wander up —
 * friendly bees, a friend with a watering can, but also slugs, a goat that
 * eats everything, and a neighbour who "borrows" your tools. Tap a gate to
 * open or close it. Welcome the good, keep out what drains the garden; a
 * garden with every gate shut stays safe but gets lonely and unpollinated.
 */
type V = { id: number; glyph: string; name: string; good: boolean; gate: number; t: number }
const VISITORS = [
  { glyph: '🐝', name: 'bee', good: true }, { glyph: '🦋', name: 'butterfly', good: true }, { glyph: '👩', name: 'friend with a watering can', good: true }, { glyph: '🐦', name: 'robin', good: true },
  { glyph: '🐌', name: 'slug', good: false }, { glyph: '🐐', name: 'hungry goat', good: false }, { glyph: '🦝', name: 'raccoon', good: false }, { glyph: '🧔', name: 'tool-borrowing neighbour', good: false },
]
const GATES = 4
const W = 800, H = 480
const TIME = 60
const gateX = (i: number) => 130 + i * 180

export default function BoundaryGarden() {
  const [best, submit] = useBest('boundary')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ open: [true, false, true, false], vs: [] as V[], bloom: 50, t: TIME, next: 0.5, id: 1, welcomed: 0, blocked: 0, pests: 0, turnedAway: 0, running: true })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { open: [true, false, true, false], vs: [], bloom: 50, t: TIME, next: 0.5, id: 1, welcomed: 0, blocked: 0, pests: 0, turnedAway: 0, running: true }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t -= dt; s.next -= dt
        if (s.next <= 0) {
          const v = VISITORS[Math.floor(Math.random() * VISITORS.length)]
          s.vs.push({ id: s.id++, ...v, gate: Math.floor(Math.random() * GATES), t: 0 })
          s.next = Math.max(0.8, 1.8 - (TIME - s.t) * 0.012)
        }
        for (const v of s.vs) {
          v.t += dt / 3
          if (v.t >= 1 && v.t < 1.05) {
            v.t = 1.05
            if (s.open[v.gate]) { if (v.good) { s.welcomed++; s.bloom = Math.min(100, s.bloom + 6) } else { s.pests++; s.bloom = Math.max(0, s.bloom - 10) } }
            else if (v.good) { s.turnedAway++; s.bloom = Math.max(0, s.bloom - 2) } else s.blocked++
          }
        }
        s.vs = s.vs.filter((v) => v.t < 1.6)
        // A totally closed garden slowly wilts.
        if (s.open.every((o) => !o)) s.bloom = Math.max(0, s.bloom - dt * 1.5)
        if (s.t <= 0) {
          s.running = false
          const score = Math.round(s.bloom * 2 + s.welcomed * 3 + s.blocked * 3)
          const record = submitRef.current(score)
          setResult({ headline: s.bloom > 70 ? 'A thriving garden 🌻' : 'The garden survived', lines: [`${s.welcomed} good visitors welcomed`, `${s.blocked} pests kept out`, `${s.pests} got in, ${s.turnedAway} friends turned away`, `Score ${score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const toggle = (i: number) => { const s = st.current; if (s.running) s.open[i] = !s.open[i] }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'matrix'
  return (
    <GameShell title="Boundary Garden" score={Math.round(s.bloom)} best={best} result={result} onRestart={restart}
      hint={`Tap gates to open or close them · let the helpers in, keep the takers out · bloom ${Math.round(s.bloom)}% · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Garden with a fence">
        <rect width={W} height={H} fill={dark ? '#001a08' : '#dbeafe'} />
        <rect y={260} width={W} height={220} fill={dark ? '#003314' : '#86efac'} />
        {Array.from({ length: 14 }, (_, i) => {
          const x = 30 + i * 56, h = 20 + (s.bloom / 100) * 50
          return <g key={i}><line x1={x} y1={470} x2={x} y2={470 - h} stroke="#15803d" strokeWidth={3} /><circle cx={x} cy={470 - h} r={4 + s.bloom / 18} fill={['#f472b6', '#facc15', '#a78bfa', '#fb923c'][i % 4]} opacity={0.3 + s.bloom / 140} /></g>
        })}
        {/* Fence with gates. */}
        <rect y={250} width={W} height={10} fill="#a16207" />
        {Array.from({ length: 40 }, (_, i) => <rect key={i} x={i * 20 + 4} y={210} width={12} height={50} fill="#ca8a04" />)}
        {s.open.map((o, i) => (
          <g key={i} onPointerDown={() => toggle(i)} style={{ cursor: 'pointer' }}>
            <rect x={gateX(i) - 44} y={200} width={88} height={64} fill={dark ? '#001a08' : '#dbeafe'} />
            {o
              ? <><rect x={gateX(i) - 44} y={206} width={10} height={58} fill="#78350f" /><path d={`M${gateX(i) - 34} 212 L${gateX(i) - 70} 196 L${gateX(i) - 70} 256 L${gateX(i) - 34} 262`} fill="#a16207" opacity={0.8} /></>
              : <rect x={gateX(i) - 44} y={206} width={88} height={58} rx={4} fill="#78350f" />}
            <text x={gateX(i)} y={290} textAnchor="middle" fontSize={12} fontWeight={800} fill={o ? '#15803d' : '#78350f'}>{o ? 'open' : 'closed'}</text>
          </g>
        ))}
        {s.vs.map((v) => {
          const x = gateX(v.gate)
          const blockedHere = !s.open[v.gate] && v.t >= 1
          const y = v.t < 1 ? 40 + v.t * 170 : blockedHere ? 210 - (v.t - 1) * 200 : 210 + (v.t - 1) * 300
          return <text key={v.id} x={x + Math.sin(v.t * 12 + v.id) * 10} y={y} textAnchor="middle" fontSize={34} opacity={v.t > 1.3 ? 1.6 - v.t : 1}>{v.glyph}</text>
        })}
        <g transform="translate(20 20)">
          <rect width={200} height={10} rx={5} fill="#ffffff88" />
          <rect width={2 * s.bloom} height={10} rx={5} fill="#22c55e" />
          <text y={28} fontSize={12} fill="#14532d">garden bloom</text>
        </g>
      </svg>
    </GameShell>
  )
}
