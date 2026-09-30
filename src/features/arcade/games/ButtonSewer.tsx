import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Button Sewer: a coat has lost its buttons. Click the holes to pull the
 * thread up and down in a steady pattern — across and back, a few times per
 * pair, crossing or side by side — then wrap and knot. Tangles happen when you
 * jump to the wrong hole. Sew as many as you can in 75 seconds.
 */
type Btn = { name: string; holes: [number, number][]; pattern: number[]; color: string; style: string }
const BUTTONS: Btn[] = [
  { name: 'Two-hole', holes: [[-18, 0], [18, 0]], pattern: [0, 1, 0, 1, 0, 1], color: '#e76f51', style: 'across and back' },
  { name: 'Four-hole, parallel', holes: [[-16, -16], [16, -16], [-16, 16], [16, 16]], pattern: [0, 1, 0, 1, 2, 3, 2, 3], color: '#2a9d8f', style: 'two side-by-side bars' },
  { name: 'Four-hole, cross', holes: [[-16, -16], [16, -16], [-16, 16], [16, 16]], pattern: [0, 3, 0, 3, 1, 2, 1, 2], color: '#e9c46a', style: 'an X' },
  { name: 'Four-hole, square', holes: [[-16, -16], [16, -16], [-16, 16], [16, 16]], pattern: [0, 1, 3, 2, 0, 1, 3, 2], color: '#8e7dbe', style: 'round the square' },
]
const W = 760, H = 480, CX = 380, CY = 240, SCALE = 3.2
const TIME = 75

export default function ButtonSewer() {
  const [best, submit] = useBest('buttons')
  const [bi, setBi] = useState(0)
  const [step, setStep] = useState(0)
  const [phase, setPhase] = useState<'sew' | 'wrap' | 'knot'>('sew')
  const [wraps, setWraps] = useState(0)
  const [time, setTime] = useState(TIME)
  const [score, setScore] = useState(0)
  const [tangle, setTangle] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ t: TIME, score: 0, sewn: 0, tangles: 0, running: true })
  const threads = useRef<SVGGElement>(null)
  const needle = useRef<SVGGElement>(null)
  const btnEl = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { t: TIME, score: 0, sewn: 0, tangles: 0, running: true }
    setBi(0); setStep(0); setPhase('sew'); setWraps(0); setScore(0); setTangle(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Coat’s ready!', lines: [`${s.sewn} buttons sewn on`, `${s.tangles} tangles`, `Score ${s.score}`], record })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const b = BUTTONS[bi % BUTTONS.length]
  const holeAt = (i: number) => ({ x: CX + b.holes[i][0] * SCALE, y: CY + b.holes[i][1] * SCALE })
  const hole = (i: number) => {
    const s = st.current
    if (!s.running || phase !== 'sew') return
    const p = holeAt(i)
    if (needle.current && !reducedMotion()) gsap.to(needle.current, { x: p.x, y: p.y, duration: 0.18, ease: 'power2.out' })
    if (b.pattern[step] === i) {
      if (step > 0 && threads.current) {
        const from = holeAt(b.pattern[step - 1])
        const front = step % 2 === 1 // odd steps go down through the front: visible stitch
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
        line.setAttribute('x1', String(from.x)); line.setAttribute('y1', String(from.y)); line.setAttribute('x2', String(p.x)); line.setAttribute('y2', String(p.y))
        line.setAttribute('stroke', front ? '#1f2937' : '#6b7280'); line.setAttribute('stroke-width', front ? '5' : '2')
        line.setAttribute('stroke-linecap', 'round')
        if (!front) line.setAttribute('stroke-dasharray', '4 6')
        const len = Math.hypot(p.x - from.x, p.y - from.y)
        line.setAttribute('stroke-dashoffset', String(len))
        threads.current.appendChild(line)
        if (!reducedMotion() && front) { line.setAttribute('stroke-dasharray', String(len)); gsap.to(line, { attr: { 'stroke-dashoffset': 0 }, duration: 0.2 }) } else line.removeAttribute('stroke-dashoffset')
      }
      if (step + 1 >= b.pattern.length) setPhase('wrap')
      setStep(step + 1)
    } else {
      s.tangles++; s.score = Math.max(0, s.score - 5); setScore(s.score)
      setTangle((n) => n + 1)
      if (btnEl.current && !reducedMotion()) gsap.fromTo(btnEl.current, { rotation: -8 }, { rotation: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', svgOrigin: `${CX} ${CY}` })
    }
  }
  const wrap = () => {
    if (phase !== 'wrap') return
    const n = wraps + 1
    setWraps(n)
    if (n >= 3) setPhase('knot')
  }
  const knot = () => {
    const s = st.current
    if (phase !== 'knot' || !s.running) return
    s.sewn++; s.score += 25 + b.pattern.length * 2; setScore(s.score)
    const done = () => {
      threads.current?.replaceChildren()
      setBi((x) => x + 1); setStep(0); setPhase('sew'); setWraps(0); setTangle(0)
    }
    if (btnEl.current && !reducedMotion()) gsap.fromTo(btnEl.current, { scale: 1 }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, svgOrigin: `${CX} ${CY}`, onComplete: done })
    else done()
  }
  const restart = useCallback(() => { threads.current?.replaceChildren(); setResult(null); setRound((r) => r + 1) }, [])
  const first = bi < BUTTONS.length // show numbered guides the first time round
  return (
    <GameShell title="Button Sewer" score={score} best={best} result={result} onRestart={restart}
      hint={`${b.name}: stitch ${b.style} · ${phase === 'sew' ? `${step}/${b.pattern.length} passes` : phase === 'wrap' ? 'wrap the thread under the button (tap the thread 3×)' : 'tie it off — tap the knot'} · ${time}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Button and coat">
        <defs>
          <pattern id="bs-tweed" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="#5b6b8a" /><path d="M0 12L12 0M-3 3L3 -3M9 15L15 9" stroke="#6d7ea0" strokeWidth="2" /></pattern>
        </defs>
        <rect width={W} height={H} fill="url(#bs-tweed)" />
        <path d={`M${CX - 250} 0 L${CX - 250} ${H}`} stroke="#3e4a62" strokeWidth={6} strokeDasharray="10 8" />
        {Array.from({ length: Math.min(8, st.current.sewn) }, (_, i) => <circle key={i} cx={CX - 300} cy={60 + i * 54} r={20} fill={BUTTONS[i % BUTTONS.length].color} stroke="#0003" />)}
        <g ref={btnEl}>
          <circle cx={CX} cy={CY} r={40 * SCALE} fill={b.color} stroke="#0003" strokeWidth={4} />
          <circle cx={CX} cy={CY} r={32 * SCALE} fill="none" stroke="#ffffff55" strokeWidth={3} />
          {b.holes.map((_, i) => {
            const p = holeAt(i)
            const next = b.pattern[step] === i && phase === 'sew'
            return (
              <g key={i} onPointerDown={() => hole(i)} style={{ cursor: 'pointer' }}>
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={11} fill="#00000066" stroke={next && first ? '#fff' : 'none'} strokeWidth={3} />
                {first && phase === 'sew' && b.pattern.map((pi, k) => (pi === i && k >= step ? <text key={k} x={p.x + 14 + (k % 3) * 9} y={p.y - 12 - Math.floor(k / 3) * 10} fontSize={9} fill="#ffffffcc">{k + 1}</text> : null))}
              </g>
            )
          })}
        </g>
        <g ref={threads} pointerEvents="none" />
        {phase === 'wrap' && (
          <g onPointerDown={wrap} style={{ cursor: 'pointer' }}>
            <rect x={CX - 140} y={CY + 40 * SCALE + 6} width={280} height={40} rx={20} fill="#ffffff22" />
            {Array.from({ length: wraps }, (_, i) => <ellipse key={i} cx={CX} cy={CY + 40 * SCALE + 26} rx={40 - i * 6} ry={7} fill="none" stroke="#1f2937" strokeWidth={3} />)}
            <text x={CX} y={CY + 40 * SCALE + 31} textAnchor="middle" fontSize={14} fill="#fff" fontWeight={700}>tap to wrap ({wraps}/3)</text>
          </g>
        )}
        {phase === 'knot' && (
          <g onPointerDown={knot} style={{ cursor: 'pointer' }}>
            <circle cx={CX + 40 * SCALE + 30} cy={CY} r={26} fill="#fff" />
            <text x={CX + 40 * SCALE + 30} y={CY + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill="#1f2937">knot</text>
          </g>
        )}
        <g ref={needle} pointerEvents="none" transform={`translate(${CX + 200} ${CY - 150})`}>
          <line x1={0} y1={0} x2={60} y2={-60} stroke="#e5e7eb" strokeWidth={4} strokeLinecap="round" />
          <ellipse cx={54} cy={-54} rx={3} ry={6} transform="rotate(45 54 -54)" fill="none" stroke="#9ca3af" strokeWidth={1.5} />
        </g>
        {tangle > 0 && <text x={CX} y={40} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fde68a">tangle! ×{tangle}</text>}
      </svg>
    </GameShell>
  )
}
