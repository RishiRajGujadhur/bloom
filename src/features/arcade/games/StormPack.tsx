import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Storm Pack: a storm's on its way and the power might go. Everything in the
 * house is whirling past on a carousel — tap things to throw them in the
 * go-bag (it only holds eight). The carousel speeds up as the clouds roll in.
 * When the storm hits, the bag gets tested.
 */
type Thing = { glyph: string; name: string; use: number }
const THINGS: Thing[] = [
  { glyph: '💧', name: 'Water', use: 10 }, { glyph: '🔦', name: 'Torch', use: 10 }, { glyph: '📻', name: 'Wind-up radio', use: 8 },
  { glyph: '🩹', name: 'First aid kit', use: 10 }, { glyph: '💊', name: 'Medicines', use: 10 }, { glyph: '🔋', name: 'Power bank', use: 8 },
  { glyph: '🥫', name: 'Tinned food', use: 8 }, { glyph: '📄', name: 'Documents', use: 7 }, { glyph: '💷', name: 'Some cash', use: 6 },
  { glyph: '🧥', name: 'Warm layer', use: 7 }, { glyph: '📢', name: 'Whistle', use: 5 },
  { glyph: '📺', name: 'TV', use: 0 }, { glyph: '🎮', name: 'Games console', use: 0 }, { glyph: '💐', name: 'Flowers', use: 0 },
  { glyph: '🎳', name: 'Bowling ball', use: 0 }, { glyph: '🎨', name: 'Painting', use: 1 }, { glyph: '🧸', name: 'Teddy', use: 2 }, { glyph: '💻', name: 'Laptop', use: 1 },
]
const W = 800, H = 480, CX = 300, CY = 250, R = 170
const TIME = 30
const SLOTS = 8

export default function StormPack() {
  const [best, submit] = useBest('storm')
  const [angle, setAngle] = useState(0)
  const [bag, setBag] = useState<Thing[]>([])
  const [time, setTime] = useState(TIME)
  const [items, setItems] = useState<Thing[]>([])
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const bagEl = useRef<SVGGElement>(null)
  const st = useRef({ angle: 0, t: TIME, running: true })
  const bagRef = useRef<Thing[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const finish = useCallback(() => {
    const s = st.current
    if (!s.running) return
    s.running = false
    const b = bagRef.current
    const score = b.reduce((n, t) => n + t.use * 10, 0)
    const essentials = ['Water', 'Torch', 'First aid kit', 'Medicines']
    const missing = essentials.filter((e) => !b.some((t) => t.name === e))
    const record = submitRef.current(score)
    setResult({ headline: missing.length ? 'The storm passed… it was a long night' : 'Snug through the storm ⛈️', lines: [`In the bag: ${b.map((t) => t.glyph).join(' ') || 'nothing'}`, missing.length ? `Really missed: ${missing.join(', ').toLowerCase()}` : 'Every essential packed', `Score ${score}`], record })
  }, [])
  useEffect(() => {
    st.current = { angle: 0, t: TIME, running: true }
    bagRef.current = []
    setBag([]); setItems([...THINGS].sort(() => Math.random() - 0.5))
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.angle += dt * (18 + (TIME - s.t) * 2.6)
        setAngle(s.angle); setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) finish()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, finish])

  const grab = (t: Thing) => {
    if (!st.current.running || bagRef.current.length >= SLOTS || bagRef.current.includes(t)) return
    bagRef.current = [...bagRef.current, t]
    setBag(bagRef.current)
    setItems((xs) => xs.filter((x) => x !== t))
    if (bagEl.current && !reducedMotion()) gsap.fromTo(bagEl.current, { y: -8 }, { y: 0, duration: 0.4, ease: 'bounce.out' })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const dark = Math.min(1, (TIME - time) / TIME)
  return (
    <GameShell title="Storm Pack" score={bag.reduce((n, t) => n + t.use * 10, 0)} best={best} result={result} onRestart={restart}
      hint={`Tap things as they whirl past to pack them · ${bag.length}/${SLOTS} in the bag · storm in ${time}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Carousel of belongings">
        <rect width={W} height={H} fill={`rgb(${226 - dark * 140}, ${232 - dark * 140}, ${240 - dark * 120})`} />
        {Array.from({ length: 5 }, (_, i) => <ellipse key={i} cx={(i * 190 + angle * 0.5) % (W + 200) - 100} cy={40 + (i % 2) * 20} rx={90} ry={26} fill={`rgba(71,85,105,${0.2 + dark * 0.6})`} />)}
        {dark > 0.6 && Array.from({ length: 30 }, (_, i) => <line key={i} x1={(i * 53 + angle * 3) % W} y1={(i * 37 + angle * 6) % H} x2={(i * 53 + angle * 3) % W - 6} y2={(i * 37 + angle * 6) % H + 14} stroke="#93c5fd" strokeWidth={2} opacity={0.6} />)}
        <circle cx={CX} cy={CY} r={R + 40} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={4} opacity={0.8} />
        <circle cx={CX} cy={CY} r={40} fill="#94a3b8" />
        {items.map((t, i) => {
          const a = ((angle + (i * 360) / items.length) * Math.PI) / 180
          const x = CX + Math.cos(a) * R, y = CY + Math.sin(a) * R
          return (
            <g key={t.name} transform={`translate(${x} ${y})`} onPointerDown={() => grab(t)} style={{ cursor: 'pointer' }}>
              <circle r={30} fill="#fff" stroke="#cbd5e1" />
              <text textAnchor="middle" dominantBaseline="central" fontSize={30}>{t.glyph}</text>
            </g>
          )
        })}
        <g ref={bagEl} transform="translate(560 110)">
          <path d="M20 40 h180 l-14 250 h-152 z" fill="#b45309" />
          <path d="M70 40 q40 -60 80 0" stroke="#78350f" strokeWidth={10} fill="none" />
          <text x={110} y={80} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff7ed">GO-BAG</text>
          {Array.from({ length: SLOTS }, (_, i) => (
            <g key={i} transform={`translate(${56 + (i % 2) * 110 - 20} ${110 + Math.floor(i / 2) * 44})`}>
              <rect x={-18} y={-18} width={80} height={36} rx={8} fill="#92400e" />
              {bag[i] && <text x={22} y={6} textAnchor="middle" fontSize={24}>{bag[i].glyph}</text>}
            </g>
          ))}
        </g>
      </svg>
      <div className="cf-tray"><button type="button" className="cf-match" onClick={finish} disabled={!bag.length}>🚪 Ready — bring on the storm</button></div>
    </GameShell>
  )
}
