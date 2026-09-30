import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Breath Kite: hold the mouse (or Space) and the kite climbs; let go and it
 * glides down. Rings drift in on the wind along a long, slow wave: about four
 * seconds up and six down. Thread the rings in a row for a growing streak.
 */
const W = 760, H = 460
const ROUND = 80
const SPEED = 110 // px/s the rings travel
const KX = 190 // kite x
const wave = (t: number) => {
  // 4 s rise, 6 s fall: a 10 s asymmetric cycle mapped to 0..1 height.
  const c = ((t % 10) + 10) % 10
  return c < 4 ? 0.5 - 0.5 * Math.cos((c / 4) * Math.PI) : 0.5 + 0.5 * Math.cos(((c - 4) / 6) * Math.PI)
}
const ringY = (t: number) => H - 80 - wave(t) * (H - 170)

type Ring = { id: number; t: number; hit: boolean | null }

export default function BreathKite() {
  const [best, submit] = useBest('kite')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ y: H - 120, vy: 0, hold: false, time: 0, score: 0, streak: 0, bestStreak: 0, through: 0, missed: 0, running: true, rings: [] as Ring[], trail: [] as { x: number; y: number }[], nextRing: 0 })
  const kite = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { y: H - 120, vy: 0, hold: false, time: 0, score: 0, streak: 0, bestStreak: 0, through: 0, missed: 0, running: true, rings: [], trail: [], nextRing: 0 }
    let raf = 0
    let last = performance.now()
    let id = 1
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.time += dt
        s.vy += (s.hold ? -300 : 180) * dt
        s.vy *= 0.94
        s.y = Math.max(40, Math.min(H - 40, s.y + s.vy * dt))
        // Rings leave the right edge at the time they will reach the kite.
        const lead = (W - KX) / SPEED
        while (s.nextRing <= s.time + lead) { s.rings.push({ id: id++, t: s.nextRing, hit: null }); s.nextRing += 1.25 }
        for (const r of s.rings) {
          const x = KX + (r.t - s.time) * SPEED
          if (r.hit == null && x <= KX) {
            r.hit = Math.abs(ringY(r.t) - s.y) < 34
            if (r.hit) {
              s.streak++; s.through++; s.bestStreak = Math.max(s.bestStreak, s.streak)
              s.score += 10 + Math.min(20, s.streak * 2)
              if (kite.current && !reducedMotion()) gsap.fromTo(kite.current, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', svgOrigin: '0 0' })
            } else { s.streak = 0; s.missed++ }
          }
        }
        s.rings = s.rings.filter((r) => KX + (r.t - s.time) * SPEED > -60)
        s.trail.unshift({ x: KX, y: s.y })
        s.trail = s.trail.slice(0, 26)
        if (s.time >= ROUND) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'The wind settles', lines: [`${s.through} rings threaded`, `Longest streak ${s.bestStreak}`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const key = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); st.current.hold = e.type === 'keydown' } }
    window.addEventListener('keydown', key)
    window.addEventListener('keyup', key)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key) }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const tilt = Math.max(-25, Math.min(25, s.vy * 0.12))
  // The guide line: the wave's path across the screen.
  const guide = Array.from({ length: 40 }, (_, i) => {
    const x = (i / 39) * W
    return `${i ? 'L' : 'M'}${x} ${ringY(s.time + (x - KX) / SPEED)}`
  }).join(' ')
  const tail = s.trail.map((p, i) => `${i ? 'L' : 'M'}${p.x - i * 7} ${p.y + 20 + Math.sin(s.time * 6 + i * 0.6) * (i * 0.5)}`).join(' ')
  const phase = ((s.time % 10) + 10) % 10
  return (
    <GameShell title="Breath Kite" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Hold to rise, release to glide · thread the rings · streak ${s.streak} · ${Math.max(0, Math.ceil(ROUND - s.time))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Kite over hills"
        onPointerDown={() => { st.current.hold = true }} onPointerUp={() => { st.current.hold = false }} onPointerLeave={() => { st.current.hold = false }}>
        <defs>
          <linearGradient id="bk-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fd0ff" /><stop offset="1" stopColor="#fbe7d0" /></linearGradient>
          <linearGradient id="bk-kite" x1="0" x2="1"><stop offset="0" stopColor="#ff6b6b" /><stop offset="1" stopColor="#ffb86b" /></linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#bk-sky)" />
        {[0, 1, 2].map((i) => {
          const x = ((i * 300 - s.time * (20 + i * 8)) % (W + 200) + W + 200) % (W + 200) - 100
          return <g key={i} transform={`translate(${x} ${60 + i * 40})`} opacity={0.85}><ellipse rx={50} ry={16} fill="#fff" /><ellipse cx={30} cy={-8} rx={30} ry={14} fill="#fff" /></g>
        })}
        <path d={`M0 ${H} L0 ${H - 40} Q ${190 - (s.time * 12) % 380} ${H - 90} 380 ${H - 40} T 760 ${H - 40} L760 ${H} Z`} fill="#7fbf6a" />
        <path d={guide} fill="none" stroke="#ffffff" strokeWidth={3} strokeDasharray="2 10" opacity={0.6} />
        {s.rings.map((r) => {
          const x = KX + (r.t - s.time) * SPEED
          const y = ringY(r.t)
          return (
            <g key={r.id} transform={`translate(${x} ${y})`} opacity={r.hit === false ? 0.3 : 1}>
              <ellipse rx={12} ry={34} fill="none" stroke={r.hit ? '#3ddc84' : '#ffd23f'} strokeWidth={6} />
              <ellipse rx={12} ry={34} fill="none" stroke="#ffffff" strokeWidth={1.5} opacity={0.8} />
            </g>
          )
        })}
        <line x1={KX - 150} y1={H} x2={KX} y2={s.y + 10} stroke="#555" strokeWidth={1} opacity={0.6} />
        <path d={tail} fill="none" stroke="#ff6b6b" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <g transform={`translate(${KX} ${s.y}) rotate(${tilt})`}>
          <g ref={kite}>
            <path d="M0 -26 L20 0 L0 30 L-20 0 Z" fill="url(#bk-kite)" stroke="#8a2f2f" strokeWidth={2} />
            <path d="M0 -26 L0 30 M-20 0 L20 0" stroke="#8a2f2f" strokeWidth={1.5} />
          </g>
        </g>
        <g transform={`translate(${W - 110} 30)`}>
          <circle r={22} fill="#ffffffaa" />
          <circle r={8 + wave(s.time) * 12} fill={phase < 4 ? '#6bb7ff' : '#9be0b0'} />
          <text y={42} textAnchor="middle" fontSize={12} fill="#334">{phase < 4 ? 'rise' : 'glide'}</text>
        </g>
      </svg>
    </GameShell>
  )
}
