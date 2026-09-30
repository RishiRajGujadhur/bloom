import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Fuse Box: it's a busy evening and everyone wants power at once. Tap a
 * waiting appliance, then tap a circuit to plug it in. Each circuit handles
 * 3 kW; go over and the fuse trips, cutting everything on it for a few
 * seconds. Nobody likes waiting too long either.
 */
type App = { id: number; name: string; glyph: string; watts: number; secs: number; wait: number; left: number; circuit: number | null }
const TYPES = [
  { name: 'Kettle', glyph: '☕', watts: 2000, secs: 5 },
  { name: 'Heater', glyph: '🔥', watts: 1500, secs: 12 },
  { name: 'Lamp', glyph: '💡', watts: 60, secs: 14 },
  { name: 'Washer', glyph: '🧺', watts: 1000, secs: 14 },
  { name: 'Microwave', glyph: '📡', watts: 1200, secs: 5 },
  { name: 'TV', glyph: '📺', watts: 150, secs: 12 },
  { name: 'Hairdryer', glyph: '💨', watts: 1800, secs: 6 },
  { name: 'Oven', glyph: '🍕', watts: 2500, secs: 10 },
  { name: 'Laptop', glyph: '💻', watts: 90, secs: 12 },
  { name: 'Iron', glyph: '👔', watts: 2200, secs: 7 },
]
const CAP = 3000
const W = 820, H = 480
const EVENING = 80
const CX = [200, 410, 620]

export default function FuseBox() {
  const [best, submit] = useBest('fuse')
  const [, frame] = useState(0)
  const [sel, setSel] = useState<number | null>(null)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ apps: [] as App[], tripped: [0, 0, 0], t: EVENING, score: 0, served: 0, trips: 0, grumbles: 0, running: true, next: 0.5, id: 1 })
  const boxes = useRef<(SVGGElement | null)[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { apps: [], tripped: [0, 0, 0], t: EVENING, score: 0, served: 0, trips: 0, grumbles: 0, running: true, next: 0.5, id: 1 }
    setSel(null)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.next -= dt
        const waiting = s.apps.filter((a) => a.circuit === null).length
        if (s.next <= 0 && waiting < 6) {
          const tp = TYPES[Math.floor(Math.random() * TYPES.length)]
          s.apps.push({ id: s.id++, ...tp, wait: 0, left: tp.secs, circuit: null })
          s.next = Math.max(1.1, 2.6 - (EVENING - s.t) * 0.02)
        }
        s.tripped = s.tripped.map((v) => Math.max(0, v - dt))
        for (const a of s.apps) {
          if (a.circuit === null) {
            a.wait += dt
            if (a.wait > 9) { a.left = -1; s.grumbles++; s.score = Math.max(0, s.score - 5) }
          } else if (s.tripped[a.circuit] <= 0) {
            a.left -= dt
            if (a.left <= 0) { s.served++; s.score += 10 + Math.round(a.watts / 400) }
          }
        }
        s.apps = s.apps.filter((a) => a.left > 0)
        // Overload check.
        for (let c = 0; c < 3; c++) {
          if (s.tripped[c] > 0) continue
          const load = s.apps.filter((a) => a.circuit === c).reduce((n, a) => n + a.watts, 0)
          if (load > CAP) {
            s.tripped[c] = 4; s.trips++; s.score = Math.max(0, s.score - 15)
            s.apps.filter((a) => a.circuit === c).forEach((a) => { a.circuit = null; a.wait = 3 })
            const b = boxes.current[c]
            if (b && !reducedMotion()) gsap.fromTo(b, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' })
          }
        }
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Lights out, bedtime', lines: [`${s.served} jobs powered`, `${s.trips} fuses tripped`, `${s.grumbles} people gave up waiting`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const plug = (c: number) => {
    const s = st.current
    if (sel === null || s.tripped[c] > 0) return
    const a = s.apps.find((x) => x.id === sel)
    if (a) a.circuit = c
    setSel(null)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const queue = s.apps.filter((a) => a.circuit === null)
  return (
    <GameShell title="Fuse Box" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Tap an appliance, then a circuit · each circuit holds 3 kW · ${Math.max(0, Math.ceil(s.t))}s of evening left`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Fuse box and appliances">
        <rect width={W} height={H} fill="#eef1f5" />
        <text x={24} y={34} fontSize={14} fontWeight={800} fill="#334155">Waiting for power</text>
        {queue.map((a, i) => {
          const x = 30 + i * 128
          const mood = a.wait < 4 ? '#22c55e' : a.wait < 7 ? '#f59e0b' : '#ef4444'
          return (
            <g key={a.id} transform={`translate(${x} 50)`} onPointerDown={() => setSel(a.id)} style={{ cursor: 'pointer' }}>
              <rect width={116} height={84} rx={14} fill={sel === a.id ? '#dbeafe' : '#fff'} stroke={sel === a.id ? '#2563eb' : '#cbd5e1'} strokeWidth={sel === a.id ? 3 : 1.5} />
              <text x={14} y={40} fontSize={28}>{a.glyph}</text>
              <text x={52} y={30} fontSize={12} fontWeight={700} fill="#1e293b">{a.name}</text>
              <text x={52} y={48} fontSize={12} fill="#475569">{(a.watts / 1000).toFixed(a.watts < 1000 ? 2 : 1)} kW</text>
              <rect x={12} y={64} width={92} height={6} rx={3} fill="#e2e8f0" />
              <rect x={12} y={64} width={92 * Math.max(0, 1 - a.wait / 9)} height={6} rx={3} fill={mood} />
            </g>
          )
        })}
        {[0, 1, 2].map((c) => {
          const on = s.apps.filter((a) => a.circuit === c)
          const load = on.reduce((n, a) => n + a.watts, 0)
          const tripped = s.tripped[c] > 0
          const pendingW = sel !== null ? (s.apps.find((a) => a.id === sel)?.watts ?? 0) : 0
          return (
            <g key={c} ref={(el) => { boxes.current[c] = el }} onPointerDown={() => plug(c)} style={{ cursor: sel !== null ? 'pointer' : 'default' }}>
              <rect x={CX[c] - 90} y={170} width={180} height={280} rx={18} fill={tripped ? '#1f2937' : '#ffffff'} stroke={sel !== null && !tripped ? '#2563eb' : '#94a3b8'} strokeWidth={sel !== null ? 3 : 2} strokeDasharray={sel !== null && !tripped ? '8 6' : undefined} />
              <text x={CX[c]} y={196} textAnchor="middle" fontWeight={800} fill={tripped ? '#fca5a5' : '#334155'}>Circuit {'ABC'[c]}{tripped ? ' · TRIPPED' : ''}</text>
              <rect x={CX[c] - 70} y={208} width={140} height={14} rx={7} fill="#e2e8f0" />
              <rect x={CX[c] - 70} y={208} width={Math.min(140, (load / CAP) * 140)} height={14} rx={7} fill={load > CAP * 0.8 ? '#f97316' : '#22c55e'} />
              {sel !== null && !tripped && <rect x={CX[c] - 70 + Math.min(140, (load / CAP) * 140)} y={208} width={Math.min(140, (pendingW / CAP) * 140)} height={14} rx={0} fill={load + pendingW > CAP ? '#ef4444' : '#93c5fd'} opacity={0.8} />}
              <text x={CX[c]} y={240} textAnchor="middle" fontSize={12} fill={tripped ? '#e5e7eb' : '#475569'}>{(load / 1000).toFixed(1)} / 3.0 kW</text>
              {on.map((a, i) => (
                <g key={a.id} transform={`translate(${CX[c] - 70} ${254 + i * 38})`}>
                  <rect width={140} height={32} rx={8} fill="#f8fafc" stroke="#e2e8f0" />
                  <text x={8} y={22} fontSize={18}>{a.glyph}</text>
                  <text x={34} y={20} fontSize={11} fill="#334155">{a.name}</text>
                  <rect x={34} y={24} width={98} height={3} rx={1.5} fill="#e2e8f0" />
                  <rect x={34} y={24} width={98 * (1 - a.left / a.secs)} height={3} rx={1.5} fill="#3b82f6" />
                </g>
              ))}
              {tripped && <text x={CX[c]} y={330} textAnchor="middle" fontSize={40}>⚡</text>}
            </g>
          )
        })}
      </svg>
    </GameShell>
  )
}
