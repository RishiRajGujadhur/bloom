import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Clock Tower: the town clock has stopped and people keep shouting up the
 * time they need. Drag the long hand round (the short one follows, like a
 * real clock) and ring the bell when it's right. Quick and correct keeps the
 * square happy.
 */
const W = 760, H = 500, CX = 380, CY = 250, R = 150
const words = ['o’clock', 'five past', 'ten past', 'quarter past', 'twenty past', 'twenty-five past', 'half past', 'twenty-five to', 'twenty to', 'quarter to', 'ten to', 'five to']
const HOURS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven']
const phrase = (total: number, style: number) => {
  const h = Math.floor(total / 60) % 12, m = total % 60
  if (style === 2) { const h24 = (Math.floor(total / 60) % 24); return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}` }
  if (m === 0) return `${HOURS[h]} o’clock`
  const w = words[m / 5]
  return m <= 30 ? `${w} ${HOURS[h]}` : `${w} ${HOURS[(h + 1) % 12]}`
}
const ROUNDS = 10
const SECS = 14

export default function ClockTower() {
  const [best, submit] = useBest('clocktower')
  const [mins, setMins] = useState(0) // minutes since 12:00, 0..719 (24h shown as needed)
  const [ask, setAsk] = useState({ total: 180, style: 0, who: '👵' })
  const [n, setN] = useState(0)
  const [time, setTime] = useState(SECS)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const bell = useRef<SVGGElement>(null)
  const dragging = useRef(false)
  const lastA = useRef(0)
  const st = useRef({ n: 0, t: SECS, score: 0, right: 0, running: true, ask: { total: 180, style: 0, who: '👵' } })
  const minsRef = useRef(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const newAsk = () => {
    const style = Math.random() < 0.3 ? 2 : 0
    const total = style === 2 ? Math.floor(Math.random() * 288) * 5 : Math.floor(Math.random() * 144) * 5
    const who = ['👵', '🧑', '👮', '👩', '🧒', '👨'][Math.floor(Math.random() * 6)]
    const a = { total, style, who }
    st.current.ask = a
    setAsk(a)
  }
  useEffect(() => {
    st.current = { n: 0, t: SECS, score: 0, right: 0, running: true, ask: st.current.ask }
    setScore(0); setN(0); newAsk()
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) ring(true)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round])

  const ring = (timeout = false) => {
    const s = st.current
    if (!s.running) return
    const target = s.ask.total % 720
    const got = minsRef.current % 720
    const ok = !timeout && got === target
    if (ok) { s.right++; s.score += 10 + Math.ceil(s.t) }
    if (bell.current && !reducedMotion()) gsap.fromTo(bell.current, { rotation: -20 }, { rotation: 0, duration: 0.8, ease: 'elastic.out(1.2, 0.2)', svgOrigin: `${CX} 40` })
    setScore(s.score)
    s.n++
    setN(s.n)
    if (s.n >= ROUNDS) {
      s.running = false
      const record = submitRef.current(s.score)
      setResult({ headline: 'The square is on time', lines: [`${s.right} of ${ROUNDS} times set right`, `Score ${s.score}`], record })
    } else { s.t = SECS; newAsk() }
  }
  const pointer = (e: React.PointerEvent) => {
    if (!dragging.current) return
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const a = Math.atan2(p.x - CX, -(p.y - CY)) // 0 at 12, clockwise
    let d = a - lastA.current
    if (d > Math.PI) d -= Math.PI * 2
    if (d < -Math.PI) d += Math.PI * 2
    lastA.current = a
    const next = ((minsRef.current + (d / (Math.PI * 2)) * 60) % 720 + 720) % 720
    minsRef.current = next
    setMins(next)
  }
  const release = () => {
    if (!dragging.current) return
    dragging.current = false
    const snapped = Math.round(minsRef.current / 5) * 5 % 720
    minsRef.current = snapped
    setMins(snapped)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const minA = ((mins % 60) / 60) * 360
  const hourA = ((mins / 60) % 12) / 12 * 360
  return (
    <GameShell title="Clock Tower" score={score} best={best} result={result} onRestart={restart}
      hint={`Time ${Math.min(n + 1, ROUNDS)}/${ROUNDS} · drag the long hand, then ring the bell · ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={pointer} onPointerUp={release} onPointerLeave={release} role="img" aria-label="Town clock" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#dbeafe" />
        <path d={`M${CX - 190} ${H} V 110 L ${CX} 10 L ${CX + 190} 110 V ${H} Z`} fill="#d6c3a5" stroke="#8b7355" strokeWidth={4} />
        <g ref={bell} onPointerDown={() => ring()} style={{ cursor: 'pointer' }}>
          <path d={`M${CX - 26} 76 Q ${CX - 26} 40 ${CX} 40 Q ${CX + 26} 40 ${CX + 26} 76 Z`} fill="#eab308" stroke="#a16207" strokeWidth={3} />
          <circle cx={CX} cy={80} r={6} fill="#a16207" />
          <text x={CX} y={104} textAnchor="middle" fontSize={11} fontWeight={800} fill="#78350f">ring!</text>
        </g>
        <circle cx={CX} cy={CY + 20} r={R + 14} fill="#78350f" />
        <circle cx={CX} cy={CY + 20} r={R} fill="#fffbeb" />
        {Array.from({ length: 60 }, (_, i) => {
          const a = (i / 60) * Math.PI * 2
          const r1 = i % 5 ? R - 8 : R - 16
          return <line key={i} x1={CX + Math.sin(a) * r1} y1={CY + 20 - Math.cos(a) * r1} x2={CX + Math.sin(a) * (R - 2)} y2={CY + 20 - Math.cos(a) * (R - 2)} stroke="#44403c" strokeWidth={i % 5 ? 1.5 : 4} />
        })}
        {['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].map((t, i) => {
          const a = (i / 12) * Math.PI * 2
          return <text key={t} x={CX + Math.sin(a) * (R - 36)} y={CY + 20 - Math.cos(a) * (R - 36) + 7} textAnchor="middle" fontSize={20} fontFamily="Georgia, serif" fill="#292524">{t}</text>
        })}
        <g transform={`translate(${CX} ${CY + 20}) rotate(${hourA})`}><rect x={-6} y={-78} width={12} height={90} rx={6} fill="#1c1917" /></g>
        <g transform={`translate(${CX} ${CY + 20}) rotate(${minA})`} onPointerDown={(e) => { dragging.current = true; const m = svg.current?.getScreenCTM(); if (m) { const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()); lastA.current = Math.atan2(p.x - CX, -(p.y - CY - 20)) } (e.target as Element).setPointerCapture?.(e.pointerId) }} style={{ cursor: 'grab' }}>
          <rect x={-18} y={-R + 6} width={36} height={R} fill="transparent" />
          <rect x={-4} y={-R + 14} width={8} height={R - 4} rx={4} fill="#b91c1c" />
          <circle cy={-R + 20} r={10} fill="#b91c1c" />
        </g>
        <circle cx={CX} cy={CY + 20} r={9} fill="#a16207" />
        {/* The person below shouting the time. */}
        <foreignObject x={8} y={150} width={180} height={110}>
          <div className="ct-bubble">{ask.style === 2 ? `It’s ${phrase(ask.total, 2)}!` : `Set it to ${phrase(ask.total, 0)}!`}</div>
        </foreignObject>
        <text x={70} y={320} fontSize={56}>{ask.who}</text>
      </svg>
    </GameShell>
  )
}
