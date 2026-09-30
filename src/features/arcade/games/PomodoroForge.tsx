import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Pomodoro Forge: strike while the iron's hot. Click the anvil to hammer; the
 * bar cools with every second out of the fire. Hammering glowing metal shapes
 * it fast, hammering cold metal cracks it. Click the forge to put the bar back
 * in and let it heat up again. Forge three pieces before the shop closes.
 */
const W = 780, H = 480
const TIME = 100
const ITEMS = [
  { name: 'Horseshoe', glyph: '🐴' },
  { name: 'Knife', glyph: '🔪' },
  { name: 'Key', glyph: '🔑' },
  { name: 'Lantern hook', glyph: '⚓' },
]
const heatColor = (h: number) => {
  // cold grey → dull red → orange → yellow-white
  const stops: [number, number[]][] = [[0, [90, 90, 95]], [0.3, [150, 40, 30]], [0.55, [240, 110, 30]], [0.8, [255, 200, 60]], [1, [255, 250, 210]]]
  for (let i = 1; i < stops.length; i++) if (h <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i]
    const f = (h - a) / (b - a)
    return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * f)).join(',')})`
  }
  return 'rgb(255,250,210)'
}

export default function PomodoroForge() {
  const [best, submit] = useBest('forge')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ heat: 0.9, inForge: false, progress: 0, cracks: 0, made: 0, t: TIME, running: true, strikes: 0, goodStrikes: 0, item: 0 })
  const hammer = useRef<SVGGElement>(null)
  const sparks = useRef<SVGGElement>(null)
  const bar = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { heat: 0.9, inForge: false, progress: 0, cracks: 0, made: 0, t: TIME, running: true, strikes: 0, goodStrikes: 0, item: 0 }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.heat = s.inForge ? Math.min(1, s.heat + dt * 0.28) : Math.max(0, s.heat - dt * 0.12)
        if (s.t <= 0) {
          s.running = false
          const score = s.made * 100 + Math.round(s.progress) - s.cracks * 15
          const record = submitRef.current(Math.max(0, score))
          setResult({ headline: 'The shop closes', lines: [`${s.made} pieces forged`, `${s.goodStrikes} of ${s.strikes} strikes on hot metal`, `${s.cracks} cracks`, `Score ${Math.max(0, score)}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const spark = (n: number, hot: boolean) => {
    const g = sparks.current
    if (!g || reducedMotion()) return
    for (let i = 0; i < n; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('cx', '400'); c.setAttribute('cy', '300'); c.setAttribute('r', String(2 + Math.random() * 3))
      c.setAttribute('fill', hot ? (Math.random() < 0.5 ? '#ffd166' : '#ff8c42') : '#aaa')
      g.appendChild(c)
      const a = -Math.PI * (0.1 + Math.random() * 0.8)
      const d = 60 + Math.random() * 120
      gsap.to(c, { attr: { cx: 400 + Math.cos(a) * d, cy: 300 + Math.sin(a) * d + 40 }, opacity: 0, duration: 0.5 + Math.random() * 0.4, ease: 'power2.out', onComplete: () => c.remove() })
    }
  }
  const strike = () => {
    const s = st.current
    if (!s.running || s.inForge) return
    s.strikes++
    if (hammer.current && !reducedMotion()) gsap.fromTo(hammer.current, { rotation: -50 }, { rotation: 0, duration: 0.14, ease: 'power3.in', svgOrigin: '520 250', yoyo: true, repeat: 1 })
    if (s.heat > 0.55) { s.progress += 7 + s.heat * 6; s.goodStrikes++; spark(14, true) }
    else if (s.heat > 0.3) { s.progress += 3; spark(6, true) }
    else {
      s.cracks++; spark(4, false)
      s.progress = Math.max(0, s.progress - 8)
      if (bar.current && !reducedMotion()) gsap.fromTo(bar.current, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' })
    }
    s.heat = Math.max(0, s.heat - 0.03)
    if (s.progress >= 100) {
      s.made++; s.progress = 0; s.item = (s.item + 1) % ITEMS.length; s.heat = 0.2
      if (bar.current && !reducedMotion()) gsap.fromTo(bar.current, { y: 0, scale: 1 }, { y: -80, opacity: 0, duration: 0.5, onComplete: () => { gsap.set(bar.current!, { y: 0, opacity: 1 }) } })
    }
  }
  const toggleForge = () => { const s = st.current; if (s.running) s.inForge = !s.inForge }

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const col = heatColor(s.heat)
  const shape = Math.min(1, s.progress / 100)
  const barX = s.inForge ? 120 : 330, barY = s.inForge ? 250 : 272
  return (
    <GameShell title="Pomodoro Forge" score={s.made * 100 + Math.round(s.progress)} best={best} result={result} onRestart={restart}
      hint={`Click the anvil to strike · click the forge to reheat · forging a ${ITEMS[s.item].name.toLowerCase()} · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Blacksmith's forge">
        <defs>
          <radialGradient id="pf-fire"><stop offset="0" stopColor="#fff3b0" /><stop offset=".4" stopColor="#ff9f1c" /><stop offset="1" stopColor="#ff4d00" stopOpacity="0" /></radialGradient>
          <filter id="pf-glow"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={W} height={H} fill="#2b2320" />
        <rect y={380} width={W} height={100} fill="#3b2f2a" />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 100} y={0} width={96} height={48} fill="#34292430" stroke="#1e1815" />)}
        {/* Forge. */}
        <g onPointerDown={toggleForge} style={{ cursor: 'pointer' }}>
          <path d="M40 380 L60 200 L240 200 L260 380 Z" fill="#5a4a42" stroke="#1e1815" strokeWidth={4} />
          <ellipse cx={150} cy={260} rx={80} ry={36} fill="#1a1110" />
          <ellipse cx={150} cy={258} rx={70 + Math.sin(performance.now() / 120) * 4} ry={30} fill="url(#pf-fire)" opacity={s.inForge ? 1 : 0.7} />
          <text x={150} y={360} textAnchor="middle" fill="#f3d9b1" fontSize={14} fontWeight={700}>{s.inForge ? 'heating… click to take out' : 'forge · click to reheat'}</text>
        </g>
        {/* Anvil. */}
        <g onPointerDown={strike} style={{ cursor: s.inForge ? 'default' : 'pointer' }}>
          <path d="M300 290 L520 290 L540 270 L560 290 L560 310 L480 310 L470 350 L500 380 L330 380 L360 350 L350 310 L300 310 Z" fill="#4a4f59" stroke="#22252b" strokeWidth={3} />
          <rect x={300} y={286} width={260} height={8} fill="#6b7280" />
        </g>
        {/* Bar. */}
        <g transform={`translate(${barX} ${barY})`} filter={s.heat > 0.3 ? 'url(#pf-glow)' : undefined} pointerEvents="none"><g ref={bar}>
          <path d={`M0 0 Q ${70 + shape * 40} ${-10 - shape * 30} 150 ${shape * -18} L150 ${14 - shape * 18} Q ${70 + shape * 40} ${4 - shape * 30} 0 14 Z`} fill={col} />
          <rect x={-60} y={4} width={62} height={6} fill="#2a2a2a" />
        </g></g>
        {/* Hammer. */}
        <g ref={hammer} pointerEvents="none">
          <rect x={440} y={170} width={14} height={110} rx={5} fill="#8a5a3c" transform="rotate(-40 447 225)" />
          <rect x={380} y={180} width={70} height={34} rx={6} fill="#5b6270" transform="rotate(-40 447 225)" />
        </g>
        <g ref={sparks} pointerEvents="none" />
        {/* Heat and progress. */}
        <g transform="translate(600 90)">
          <text fill="#f3d9b1" fontSize={13}>heat</text>
          <rect y={10} width={150} height={14} rx={7} fill="#1a1110" />
          <rect y={10} width={150 * s.heat} height={14} rx={7} fill={col} />
          <line x1={150 * 0.55} x2={150 * 0.55} y1={6} y2={28} stroke="#fff" strokeDasharray="2 2" />
          <text y={58} fill="#f3d9b1" fontSize={13}>{ITEMS[s.item].glyph} {ITEMS[s.item].name}</text>
          <rect y={66} width={150} height={10} rx={5} fill="#1a1110" />
          <rect y={66} width={1.5 * Math.min(100, s.progress)} height={10} rx={5} fill="#7bd389" />
          <text y={110} fill="#f3d9b1" fontSize={13}>forged {s.made} · cracks {s.cracks}</text>
        </g>
      </svg>
    </GameShell>
  )
}
