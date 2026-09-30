import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Sleep Tide: a bedroom at night. Phones buzz awake, the TV flickers on, a
 * laptop glows, a late coffee appears. Tap each one to switch it off. The
 * darker and calmer the room, the faster the moon-tide of sleep rises. Fill
 * it before the alarm rings.
 */
type Thing = { id: string; label: string; x: number; y: number; w: number; h: number; glow: string; drain: number }
const THINGS: Thing[] = [
  { id: 'phone', label: 'phone', x: 470, y: 330, w: 34, h: 58, glow: '#7fd1ff', drain: 1.6 },
  { id: 'tv', label: 'TV', x: 70, y: 150, w: 170, h: 100, glow: '#9bb8ff', drain: 1.4 },
  { id: 'laptop', label: 'laptop', x: 60, y: 320, w: 110, h: 70, glow: '#c3f0ff', drain: 1.2 },
  { id: 'lamp', label: 'lamp', x: 610, y: 210, w: 60, h: 90, glow: '#ffd27a', drain: 0.7 },
  { id: 'coffee', label: 'coffee', x: 580, y: 350, w: 34, h: 36, glow: '#c98b5a', drain: 1.0 },
  { id: 'tablet', label: 'tablet', x: 640, y: 405, w: 70, h: 50, glow: '#a7ffcf', drain: 1.2 },
]
const W = 760, H = 480
const NIGHT = 70

export default function SleepTide() {
  const [best, submit] = useBest('sleep')
  const [on, setOn] = useState<Record<string, boolean>>({})
  const [tide, setTide] = useState(0)
  const [left, setLeft] = useState(NIGHT)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ on: {} as Record<string, boolean>, tide: 0, t: NIGHT, taps: 0, running: true })
  const els = useRef(new Map<string, SVGGElement>())
  const moon = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { on: { tv: true, phone: true }, tide: 0, t: NIGHT, taps: 0, running: true }
    setOn({ ...st.current.on })
    let last = performance.now()
    let nextWake = 1.5
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        const lit = THINGS.filter((t) => s.on[t.id])
        const drain = lit.reduce((n, t) => n + t.drain, 0)
        s.tide = Math.max(0, Math.min(100, s.tide + (lit.length ? -drain * 1.6 : 5.2) * dt))
        nextWake -= dt
        if (nextWake <= 0) {
          const off = THINGS.filter((t) => !s.on[t.id])
          if (off.length) {
            const t = off[Math.floor(Math.random() * off.length)]
            s.on[t.id] = true
            setOn({ ...s.on })
            const el = els.current.get(t.id)
            if (el && !reducedMotion()) gsap.fromTo(el, { x: -3 }, { x: 3, repeat: 5, yoyo: true, duration: 0.05, onComplete: () => { gsap.set(el, { x: 0 }) } })
          }
          nextWake = Math.max(0.9, 3.2 - (NIGHT - s.t) * 0.03) * (0.7 + Math.random() * 0.6)
        }
        setTide(s.tide)
        setLeft(Math.ceil(s.t))
        if (s.tide >= 100 || s.t <= 0) {
          s.running = false
          const slept = s.tide >= 100
          const score = slept ? Math.round(100 + s.t * 5) : Math.round(s.tide)
          const record = submitRef.current(score)
          setResult({ headline: slept ? 'Fast asleep 😴' : 'The alarm rings…', lines: [slept ? `Asleep with ${Math.ceil(s.t)}s of night to spare` : `Tide reached ${Math.round(s.tide)}%`, `${s.taps} things switched off`, `Score ${score}`], record })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  useEffect(() => {
    if (!moon.current || reducedMotion()) return
    const t = gsap.to(moon.current, { y: -6, duration: 2.4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => { t.kill() }
  }, [])

  const off = (id: string) => {
    const s = st.current
    if (!s.running || !s.on[id]) return
    s.on[id] = false
    s.taps++
    setOn({ ...s.on })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const anyOn = THINGS.some((t) => on[t.id])
  const dim = 1 - tide / 140
  return (
    <GameShell title="Sleep Tide" score={Math.round(tide)} best={best} result={result} onRestart={restart}
      hint={`Tap anything glowing to switch it off · the moon-tide rises in a dark, quiet room · ${Math.max(0, left)}s till the alarm`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bedroom at night">
        <defs>
          <radialGradient id="st-glow"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <linearGradient id="st-tide" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#8fb3ff" /><stop offset="1" stopColor="#2b3f8f" /></linearGradient>
          <clipPath id="st-win"><rect x={300} y={40} width={200} height={170} rx={10} /></clipPath>
        </defs>
        <rect width={W} height={H} fill={`rgb(${22 * dim + 12} ${26 * dim + 14} ${58 * dim + 20})`} />
        <rect y={390} width={W} height={90} fill="#1d2242" />
        {/* Window with the moon and the tide of sleep. */}
        <rect x={296} y={36} width={208} height={178} rx={12} fill="#2a3160" />
        <g clipPath="url(#st-win)">
          <rect x={300} y={40} width={200} height={170} fill="#0e1433" />
          {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={310 + ((i * 53) % 190)} cy={50 + ((i * 37) % 100)} r={1.3} fill="#fff" opacity={0.7} />)}
          <g ref={moon}><circle cx={440} cy={85} r={24} fill="#fff4d6" /><circle cx={450} cy={78} r={22} fill="#0e1433" opacity={0.25} /></g>
          <path d={`M300 ${210 - tide * 1.5} Q 350 ${200 - tide * 1.5} 400 ${210 - tide * 1.5} T 500 ${210 - tide * 1.5} L500 210 L300 210 Z`} fill="url(#st-tide)" opacity={0.9} />
        </g>
        <line x1={400} x2={400} y1={40} y2={210} stroke="#2a3160" strokeWidth={6} />
        {/* Bed. */}
        <rect x={250} y={380} width={300} height={40} rx={10} fill="#5a4b8a" />
        <rect x={260} y={350} width={90} height={36} rx={14} fill="#e8e2ff" />
        <path d="M330 380 Q 420 330 540 372 L540 390 L330 390 Z" fill="#8c7bd6" />
        <text x={300} y={372} fontSize={20}>{tide > 70 ? '😴' : tide > 30 ? '😌' : '😳'}</text>
        {THINGS.map((t) => {
          const lit = on[t.id]
          return (
            <g key={t.id} ref={(el) => { if (el) els.current.set(t.id, el) }} onPointerDown={() => off(t.id)} style={{ cursor: lit ? 'pointer' : 'default' }} aria-label={`${t.label} ${lit ? 'on' : 'off'}`}>
              {lit && <ellipse cx={t.x + t.w / 2} cy={t.y + t.h / 2} rx={t.w * 1.4} ry={t.h * 1.4} fill={t.glow} opacity={0.28}><animate attributeName="opacity" values=".18;.34;.18" dur="1.2s" repeatCount="indefinite" /></ellipse>}
              {t.id === 'tv' && <><rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill="#111" stroke="#333" strokeWidth={4} />{lit && <rect x={t.x + 6} y={t.y + 6} width={t.w - 12} height={t.h - 12} fill={t.glow}><animate attributeName="fill" values="#9bb8ff;#ffb3c7;#b3ffd9;#9bb8ff" dur="1.5s" repeatCount="indefinite" /></rect>}<rect x={t.x + t.w / 2 - 20} y={t.y + t.h} width={40} height={10} fill="#222" /></>}
              {t.id === 'phone' && <><rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill="#111" />{lit && <rect x={t.x + 3} y={t.y + 5} width={t.w - 6} height={t.h - 12} rx={3} fill={t.glow} />}{lit && <text x={t.x + t.w / 2} y={t.y + 30} textAnchor="middle" fontSize={14}>💬</text>}</>}
              {t.id === 'laptop' && <><rect x={t.x} y={t.y} width={t.w} height={t.h - 12} rx={4} fill="#2b2b2b" />{lit && <rect x={t.x + 5} y={t.y + 5} width={t.w - 10} height={t.h - 22} fill={t.glow} />}<rect x={t.x - 10} y={t.y + t.h - 12} width={t.w + 20} height={10} rx={3} fill="#3a3a3a" /></>}
              {t.id === 'lamp' && <><path d={`M${t.x} ${t.y + 30} L${t.x + t.w} ${t.y + 30} L${t.x + t.w - 12} ${t.y} L${t.x + 12} ${t.y} Z`} fill={lit ? t.glow : '#6b6250'} /><rect x={t.x + t.w / 2 - 3} y={t.y + 30} width={6} height={50} fill="#444" /><rect x={t.x + 10} y={t.y + 80} width={t.w - 20} height={8} rx={3} fill="#444" /></>}
              {t.id === 'coffee' && (lit ? <><rect x={t.x} y={t.y} width={t.w - 8} height={t.h} rx={5} fill="#f3efe6" /><path d={`M${t.x + t.w - 8} ${t.y + 8} q12 6 0 18`} stroke="#f3efe6" strokeWidth={4} fill="none" /><path d={`M${t.x + 8} ${t.y - 4} q-6 -10 2 -18 M${t.x + 18} ${t.y - 4} q-6 -10 2 -18`} stroke="#fff" opacity={0.6} fill="none"><animate attributeName="opacity" values=".2;.7;.2" dur="1.4s" repeatCount="indefinite" /></path></> : <rect x={t.x} y={t.y + t.h - 6} width={t.w - 8} height={6} rx={3} fill="#665" opacity={0.4} />)}
              {t.id === 'tablet' && <><rect x={t.x} y={t.y} width={t.w} height={t.h} rx={6} fill="#1a1a1a" />{lit && <rect x={t.x + 4} y={t.y + 4} width={t.w - 8} height={t.h - 8} rx={3} fill={t.glow} />}{lit && <text x={t.x + t.w / 2} y={t.y + 31} textAnchor="middle" fontSize={16}>🎮</text>}</>}
            </g>
          )
        })}
        <g transform="translate(24 24)">
          <rect width={200} height={14} rx={7} fill="#ffffff22" />
          <rect width={tide * 2} height={14} rx={7} fill="#8fb3ff" />
          <text y={34} fontSize={13} fill="#dfe6ff">sleep tide {Math.round(tide)}% {anyOn ? '· something’s awake' : '· so quiet…'}</text>
        </g>
      </svg>
    </GameShell>
  )
}
