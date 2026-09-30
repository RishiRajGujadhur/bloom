import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Unit Price Duel: two products swing onto the shelf. Grab the one that gives
 * you more for your money before they swing away. Big packs aren't always
 * cheaper, and "3 for 2" deals need a second look. Streaks speed things up.
 */
type Offer = { name: string; glyph: string; price: number; qty: number; unit: string; deal?: string; pay: number; get: number }
const ITEMS = [
  { name: 'Cereal', glyph: '🥣', unit: 'g', sizes: [375, 500, 750] }, { name: 'Juice', glyph: '🧃', unit: 'ml', sizes: [250, 1000, 1500] },
  { name: 'Rice', glyph: '🍚', unit: 'g', sizes: [500, 1000, 2000] }, { name: 'Pasta', glyph: '🍝', unit: 'g', sizes: [500, 1000] },
  { name: 'Yoghurt', glyph: '🥛', unit: 'g', sizes: [125, 500] }, { name: 'Coffee', glyph: '☕', unit: 'g', sizes: [200, 454] },
  { name: 'Bananas', glyph: '🍌', unit: 'each', sizes: [1, 5, 6] }, { name: 'Tea bags', glyph: '🍵', unit: 'bags', sizes: [40, 80, 160] },
]
const W = 780, H = 460
const ROUNDS = 16
const mk = (): [Offer, Offer] => {
  const it = ITEMS[Math.floor(Math.random() * ITEMS.length)]
  const base = 0.2 + Math.random() * 0.6 // price per 100 units
  const make = (): Offer => {
    const qty = it.sizes[Math.floor(Math.random() * it.sizes.length)]
    const perUnit = base * (0.75 + Math.random() * 0.5) / (it.unit === 'each' ? 0.5 : it.unit === 'bags' ? 20 : 100)
    const price = Math.max(0.3, Math.round(qty * perUnit * 20) / 20)
    const deal = Math.random() < 0.25 ? '3 for 2' : undefined
    return { name: it.name, glyph: it.glyph, price, qty, unit: it.unit, deal, pay: deal ? 2 : 1, get: deal ? 3 : 1 }
  }
  const a = make()
  let b = make()
  let tries = 0
  while (Math.abs(a.price * a.pay / (a.qty * a.get) - b.price * b.pay / (b.qty * b.get)) < 0.0002 && tries++ < 10) b = make()
  if (a.qty === b.qty && !a.deal && !b.deal) b = { ...b, qty: it.sizes[(it.sizes.indexOf(b.qty) + 1) % it.sizes.length] }
  return [a, b]
}
const per = (o: Offer) => (o.price * o.pay) / (o.qty * o.get)

export default function UnitPriceDuel() {
  const [best, submit] = useBest('unitprice')
  const [pair, setPair] = useState<[Offer, Offer]>(mk)
  const [n, setN] = useState(0)
  const [streak, setStreak] = useState(0)
  const [score, setScore] = useState(0)
  const [flash, setFlash] = useState<string | null>(null)
  const [time, setTime] = useState(7)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const cards = useRef<(SVGGElement | null)[]>([])
  const st = useRef({ n: 0, score: 0, right: 0, streak: 0, bestStreak: 0, t: 7, busy: false })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const next = useCallback(() => {
    const s = st.current
    s.n++; setN(s.n)
    if (s.n >= ROUNDS) {
      const record = submitRef.current(s.score)
      setResult({ headline: 'Basket bargain-hunted', lines: [`${s.right} of ${ROUNDS} best buys`, `Longest streak ${s.bestStreak}`, `Score ${s.score}`], record })
      return
    }
    s.t = Math.max(3, 7 - s.streak * 0.4); s.busy = false
    setPair(mk()); setFlash(null)
  }, [])
  useEffect(() => {
    st.current = { n: 0, score: 0, right: 0, streak: 0, bestStreak: 0, t: 7, busy: false }
    setN(0); setScore(0); setStreak(0); setPair(mk())
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (!s.busy && s.n < ROUNDS) {
        s.t -= dt
        setTime(Math.max(0, s.t))
        if (s.t <= 0) { s.busy = true; s.streak = 0; setStreak(0); setFlash('Too slow — they swung away'); setTimeout(next, 900) }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, next])
  const choose = (i: number) => {
    const s = st.current
    if (s.busy) return
    s.busy = true
    const ok = per(pair[i]) <= per(pair[1 - i])
    if (ok) { s.right++; s.streak++; s.bestStreak = Math.max(s.bestStreak, s.streak); s.score += 10 + s.streak * 2 + Math.round(s.t) } else s.streak = 0
    setScore(s.score); setStreak(s.streak)
    const unitLabel = (o: Offer) => o.unit === 'each' ? 'each' : o.unit === 'bags' ? 'per bag' : `per 100${o.unit}`
    const fmt = (o: Offer) => `£${(per(o) * (o.unit === 'each' || o.unit === 'bags' ? 1 : 100)).toFixed(2)} ${unitLabel(o)}`
    setFlash(ok ? `Nice! ${fmt(pair[i])} vs ${fmt(pair[1 - i])}` : `Other one’s better: ${fmt(pair[1 - i])} vs ${fmt(pair[i])}`)
    setTimeout(next, 1400)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Unit Price Duel" score={score} best={best} result={result} onRestart={restart}
      hint={`${n + 1 > ROUNDS ? ROUNDS : n + 1}/${ROUNDS} · tap the better value · streak ${streak} · ${time.toFixed(1)}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Two products">
        <rect width={W} height={H} fill="#f0fdf4" />
        <rect y={370} width={W} height={20} fill="#a16207" />
        {pair.map((o, i) => {
          const cx = i ? 560 : 220
          return (
            <g key={`${n}-${i}`} ref={(el) => { cards.current[i] = el }} onPointerDown={() => choose(i)} style={{ cursor: 'pointer' }}>
              {!reducedMotion() && <animateTransform attributeName="transform" type="rotate" values={`${i ? 22 : -22} ${cx} 0;${i ? -6 : 6} ${cx} 0;0 ${cx} 0`} dur="0.7s" fill="freeze" />}
              <line x1={cx} y1={0} x2={cx} y2={90} stroke="#94a3b8" strokeWidth={2} />
              <rect x={cx - 130} y={90} width={260} height={270} rx={20} fill="#fff" stroke="#86efac" strokeWidth={3} />
              <text x={cx} y={190} textAnchor="middle" fontSize={Math.min(96, 50 + Math.sqrt(o.qty) * 1.5)}>{o.glyph}</text>
              <text x={cx} y={240} textAnchor="middle" fontSize={18} fontWeight={800} fill="#14532d">{o.name}</text>
              <text x={cx} y={266} textAnchor="middle" fontSize={15} fill="#166534">{o.unit === 'each' ? `pack of ${o.qty}` : `${o.qty}${o.unit === 'bags' ? ' bags' : o.unit}`}</text>
              <rect x={cx - 60} y={286} width={120} height={46} rx={10} fill="#fde047" />
              <text x={cx} y={318} textAnchor="middle" fontSize={24} fontWeight={900} fill="#713f12">£{o.price.toFixed(2)}</text>
              {o.deal && <g transform={`translate(${cx + 90} 110) rotate(12)`}><circle r={34} fill="#ef4444" /><text textAnchor="middle" y={6} fontSize={14} fontWeight={900} fill="#fff">{o.deal}</text></g>}
            </g>
          )
        })}
        <rect x={40} y={20} width={W - 80} height={8} rx={4} fill="#dcfce7" />
        <rect x={40} y={20} width={(W - 80) * (time / 7)} height={8} rx={4} fill={time < 2 ? '#ef4444' : '#22c55e'} />
        {flash && <text x={W / 2} y={420} textAnchor="middle" fontSize={17} fontWeight={800} fill="#14532d">{flash}</text>}
      </svg>
    </GameShell>
  )
}
