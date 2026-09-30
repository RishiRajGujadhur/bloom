import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Shelf Level: one end of the shelf is screwed in; you're holding the other.
 * Move the pointer up and down to tilt it and watch the bubble in the spirit
 * level drift. When it sits between the lines, click to drive the second
 * screw. Then the ornaments go on — a wonky shelf sends them sliding.
 */
const W = 780, H = 480
const SHELVES = 6
const PIVOT = { x: 190, y: 250 }

export default function ShelfLevel() {
  const [best, submit] = useBest('shelf')
  const [angle, setAngle] = useState(0.2)
  const [bubble, setBubble] = useState(0)
  const [phase, setPhase] = useState<'tilt' | 'test'>('tilt')
  const [n, setN] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const items = useRef<SVGGElement>(null)
  const st = useRef({ target: 0.2, angle: 0.2, bubble: 0, bv: 0, score: 0, errs: [] as number[], len: 380, start: performance.now() })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const fresh = (i: number) => {
    const s = st.current
    s.len = 300 + Math.random() * 180
    s.target = (Math.random() - 0.5) * 0.5; s.angle = s.target; s.bubble = 0; s.bv = 0; s.start = performance.now()
    setN(i); setPhase('tilt')
  }
  useEffect(() => {
    st.current = { target: 0.2, angle: 0.2, bubble: 0, bv: 0, score: 0, errs: [], len: 380, start: performance.now() }
    setScore(0); fresh(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      // A slightly shaky hand, and the bubble lags behind the tilt.
      const shake = Math.sin(now / 90) * 0.004 + Math.sin(now / 37) * 0.002
      s.angle += (s.target + shake - s.angle) * Math.min(1, dt * 10)
      const want = Math.max(-1, Math.min(1, -s.angle * 14))
      s.bv += (want - s.bubble) * dt * 30; s.bv *= 0.85
      s.bubble = Math.max(-1, Math.min(1, s.bubble + s.bv * dt))
      setAngle(s.angle); setBubble(s.bubble)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const move = (e: React.PointerEvent) => {
    if (phase !== 'tilt') return
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const s = st.current
    s.target = Math.max(-0.45, Math.min(0.45, Math.atan2(p.y - PIVOT.y, s.len)))
  }
  const screw = () => {
    if (phase !== 'tilt') return
    const s = st.current
    const err = Math.abs(s.angle) * (180 / Math.PI)
    s.errs.push(err)
    const secs = (performance.now() - s.start) / 1000
    const pts = Math.max(0, Math.round(40 - err * 25 + Math.max(0, 8 - secs) * 2))
    s.score += pts; setScore(s.score)
    s.target = s.angle
    setPhase('test')
    // Ornaments slide if the shelf isn't level.
    const g = items.current
    const slide = Math.sin(s.angle) * 900
    const finish = () => {
      if (n + 1 >= SHELVES) {
        const avg = s.errs.reduce((a, b) => a + b, 0) / s.errs.length
        const record = submitRef.current(s.score)
        setResult({ headline: 'Shelves up!', lines: [`Average tilt ${avg.toFixed(2)}°`, `${s.errs.filter((x) => x < 0.5).length} of ${SHELVES} dead level`, `Score ${s.score}`], record })
      } else fresh(n + 1)
    }
    if (g && !reducedMotion()) {
      gsap.fromTo(g.children, { y: -120, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: 'bounce.out' })
      gsap.to(g.children, { x: err > 0.6 ? slide : 0, rotation: err > 0.6 ? slide / 20 : 0, delay: 0.9, duration: err > 0.6 ? 0.8 : 0.1, ease: 'power2.in', onComplete: () => { gsap.set(g.children, { x: 0, rotation: 0 }); setTimeout(finish, 400) } })
    } else setTimeout(finish, 600)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const deg = (angle * 180) / Math.PI
  const inLines = Math.abs(bubble) < 0.12
  return (
    <GameShell title="Shelf Level" score={score} best={best} result={result} onRestart={restart}
      hint={`Shelf ${n + 1}/${SHELVES} · move up/down to tilt, click to screw it in when the bubble sits between the lines`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerDown={screw} role="img" aria-label="Wall shelf and spirit level" style={{ cursor: phase === 'tilt' ? 'ns-resize' : 'default' }}>
        <defs><pattern id="sl-wall" width="60" height="30" patternUnits="userSpaceOnUse"><rect width="60" height="30" fill="#f5e6d3" /><path d="M0 30h60M30 0v30" stroke="#e8d5bd" strokeWidth="2" /></pattern></defs>
        <rect width={W} height={H} fill="url(#sl-wall)" />
        <rect y={H - 40} width={W} height={40} fill="#b08968" />
        {/* Earlier shelves stay on the wall. */}
        {s.errs.slice(-3).map((e, i) => <rect key={i} x={120 + i * 200} y={70 + (i % 2) * 20} width={160} height={10} rx={3} fill="#c69c6d" opacity={0.5} transform={`rotate(${e > 0.6 ? e : 0} ${200 + i * 200} 80)`} />)}
        <g transform={`translate(${PIVOT.x} ${PIVOT.y}) rotate(${deg})`}>
          <rect x={0} y={0} width={s.len} height={16} rx={3} fill="#a0522d" />
          <rect x={0} y={16} width={s.len} height={4} fill="#7a3e1d" />
          <circle cx={10} cy={8} r={5} fill="#cbd5e1" stroke="#475569" />
          {phase === 'test' && <circle cx={s.len - 10} cy={8} r={5} fill="#cbd5e1" stroke="#475569" />}
          <g ref={items} opacity={phase === 'test' ? 1 : 0}>
            <text x={s.len * 0.25} y={-4} textAnchor="middle" fontSize={32}>🏺</text>
            <text x={s.len * 0.5} y={-4} textAnchor="middle" fontSize={30}>📚</text>
            <text x={s.len * 0.75} y={-4} textAnchor="middle" fontSize={30}>🌵</text>
          </g>
          {/* Spirit level resting on top. */}
          {phase === 'tilt' && (
            <g transform={`translate(${s.len / 2 - 90} -30)`}>
              <rect width={180} height={26} rx={6} fill="#facc15" stroke="#a16207" strokeWidth={2} />
              <rect x={50} y={5} width={80} height={16} rx={8} fill="#d9f99d" stroke="#65a30d" />
              <line x1={82} x2={82} y1={5} y2={21} stroke="#1f2937" strokeWidth={1.5} />
              <line x1={98} x2={98} y1={5} y2={21} stroke="#1f2937" strokeWidth={1.5} />
              <ellipse cx={90 + bubble * 34} cy={13} rx={8} ry={5} fill={inLines ? '#ffffff' : '#f0fdf4'} stroke={inLines ? '#16a34a' : '#84cc16'} strokeWidth={2} />
            </g>
          )}
        </g>
        {/* Your hand holding the far end. */}
        {phase === 'tilt' && <text x={PIVOT.x + Math.cos(angle) * s.len + 10} y={PIVOT.y + Math.sin(angle) * s.len + 30} fontSize={34}>✋</text>}
        <text x={W - 30} y={40} textAnchor="end" fontSize={16} fontWeight={800} fill={inLines ? '#16a34a' : '#92400e'}>{Math.abs(deg).toFixed(1)}°</text>
      </svg>
    </GameShell>
  )
}
