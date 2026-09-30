import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Water Wheel: an old mill wheel turns the grindstone for the village bakery,
 * but only while its trough has water. Tap the pump for a sip of water into
 * the trough; too little and the wheel stalls, too much at once and it
 * overflows and wastes. Little and often keeps the flour coming all day.
 */
const W = 780, H = 460
const DAY = 70

export default function WaterWheel() {
  const [best, submit] = useBest('waterwheel')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ trough: 0.4, angle: 0, flour: 0, wasted: 0, stalls: 0, stalled: false, t: DAY, taps: [] as number[], running: true, splash: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { trough: 0.4, angle: 0, flour: 0, wasted: 0, stalls: 0, stalled: false, t: DAY, taps: [], running: true, splash: 0 }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        // The day warms up: water evaporates faster around midday.
        const drain = 0.05 + Math.sin(((DAY - s.t) / DAY) * Math.PI) * 0.05
        s.trough = Math.max(0, s.trough - drain * dt)
        const turning = s.trough > 0.08
        if (!turning && !s.stalled) { s.stalled = true; s.stalls++ }
        if (turning) s.stalled = false
        const speed = turning ? 0.6 + Math.min(1, s.trough) * 1.2 : 0
        s.angle += speed * dt * 60
        s.flour += speed * dt
        s.splash = Math.max(0, s.splash - dt)
        if (s.t <= 0) {
          s.running = false
          const score = Math.max(0, Math.round(s.flour * 3 - s.wasted * 20 - s.stalls * 8))
          const record = submitRef.current(score)
          setResult({ headline: 'The bakery’s stocked for tomorrow 🍞', lines: [`${Math.round(s.flour)} sacks of flour`, `${s.stalls} stalls`, `${s.wasted.toFixed(1)} troughs overflowed`, `Score ${score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const pump = () => {
    const s = st.current
    if (!s.running) return
    s.trough += 0.14
    if (s.trough > 1) { s.wasted += s.trough - 1; s.trough = 1; s.splash = 0.8 }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const sunA = ((DAY - s.t) / DAY) * Math.PI
  return (
    <GameShell title="Water Wheel" score={Math.round(s.flour * 3)} best={best} result={result} onRestart={restart}
      hint={`Tap the pump for a sip at a time · keep the trough between empty and overflowing · stalls ${s.stalls} · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Water mill" onPointerDown={pump} style={{ cursor: 'pointer' }}>
        <rect width={W} height={H} fill="#e0f2fe" />
        <circle cx={80 + Math.cos(Math.PI - sunA) * -300 + 300} cy={300 - Math.sin(sunA) * 240} r={30} fill="#fcd34d" />
        <rect y={380} width={W} height={80} fill="#65a30d" />
        {/* Mill building. */}
        <rect x={430} y={180} width={260} height={200} fill="#d6c3a5" stroke="#8b7355" strokeWidth={3} />
        <path d="M410 180 L560 90 L710 180 Z" fill="#7c2d12" />
        <rect x={540} y={290} width={50} height={90} fill="#78350f" />
        <text x={620} y={250} fontSize={34}>🍞</text>
        {/* Flour sacks piling up. */}
        {Array.from({ length: Math.min(12, Math.floor(s.flour / 6)) }, (_, i) => <ellipse key={i} cx={720 - (i % 4) * 24} cy={370 - Math.floor(i / 4) * 16} rx={12} ry={9} fill="#fef3c7" stroke="#d6b88a" />)}
        {/* Trough and water. */}
        <rect x={150} y={120} width={200} height={40} rx={4} fill="#8b5e34" />
        <rect x={156} y={156 - 32 * s.trough} width={188} height={32 * s.trough} fill="#38bdf8" />
        {s.trough > 0.08 && <path d={`M350 ${150 - 20 * s.trough} q30 20 40 80`} stroke="#38bdf8" strokeWidth={6 + s.trough * 10} fill="none" opacity={0.8} />}
        {s.splash > 0 && Array.from({ length: 8 }, (_, i) => <circle key={i} cx={250 + Math.cos(i) * 110 * (1 - s.splash)} cy={120 - Math.sin(i * 0.7) * 40 * (1 - s.splash)} r={5} fill="#38bdf8" opacity={s.splash} />)}
        {/* Wheel. */}
        <g transform={`translate(400 270) rotate(${s.angle})`}>
          <circle r={90} fill="none" stroke="#78350f" strokeWidth={10} />
          {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <g key={i}><line x1={0} y1={0} x2={Math.cos(a) * 90} y2={Math.sin(a) * 90} stroke="#92400e" strokeWidth={5} /><rect x={Math.cos(a) * 92 - 12} y={Math.sin(a) * 92 - 12} width={24} height={24} fill="#a16207" transform={`rotate(${(a * 180) / Math.PI} ${Math.cos(a) * 92} ${Math.sin(a) * 92})`} /></g> })}
          <circle r={14} fill="#451a03" />
        </g>
        {/* Pump. */}
        <g transform="translate(80 200)">
          <rect x={-10} y={0} width={30} height={180} fill="#475569" />
          <rect x={-40} y={-10} width={90} height={16} rx={8} fill="#334155" transform="rotate(-15)" />
          <path d="M20 20 h40 v20" stroke="#475569" strokeWidth={10} fill="none" />
          <text x={5} y={210} textAnchor="middle" fontSize={13} fontWeight={800} fill="#14532d">tap to pump</text>
        </g>
        {s.stalled && <text x={400} y={60} textAnchor="middle" fontSize={20} fontWeight={800} fill="#b91c1c">The wheel has stopped!</text>}
      </svg>
    </GameShell>
  )
}
