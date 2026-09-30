import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Energy Meter: a busy family evening. People wander from room to room and
 * never switch anything off behind them. Tap lights and gadgets in empty
 * rooms to turn them off; leave them on where someone's using them. Keep the
 * meter out of the red and the bill small.
 */
type Room = { id: string; name: string; x: number; y: number; w: number; h: number }
type Gadget = { id: string; room: string; glyph: string; watts: number; on: boolean; x: number; y: number }
const W = 800, H = 480
const ROOMS: Room[] = [
  { id: 'bed1', name: 'Bedroom', x: 60, y: 60, w: 220, h: 170 }, { id: 'bath', name: 'Bathroom', x: 290, y: 60, w: 170, h: 170 }, { id: 'bed2', name: 'Kids’ room', x: 470, y: 60, w: 250, h: 170 },
  { id: 'kitchen', name: 'Kitchen', x: 60, y: 250, w: 250, h: 190 }, { id: 'living', name: 'Living room', x: 320, y: 250, w: 250, h: 190 }, { id: 'hall', name: 'Hall', x: 580, y: 250, w: 140, h: 190 },
]
const GADGETS: Omit<Gadget, 'on'>[] = [
  { id: 'l1', room: 'bed1', glyph: '💡', watts: 60, x: 120, y: 110 }, { id: 'pc', room: 'bed1', glyph: '💻', watts: 90, x: 220, y: 180 },
  { id: 'l2', room: 'bath', glyph: '💡', watts: 60, x: 375, y: 110 }, { id: 'heater', room: 'bath', glyph: '♨️', watts: 1500, x: 375, y: 190 },
  { id: 'l3', room: 'bed2', glyph: '💡', watts: 60, x: 540, y: 110 }, { id: 'console', room: 'bed2', glyph: '🎮', watts: 150, x: 650, y: 180 },
  { id: 'l4', room: 'kitchen', glyph: '💡', watts: 60, x: 110, y: 300 }, { id: 'oven', room: 'kitchen', glyph: '🍕', watts: 2000, x: 240, y: 390 }, { id: 'radio', room: 'kitchen', glyph: '📻', watts: 20, x: 170, y: 390 },
  { id: 'l5', room: 'living', glyph: '💡', watts: 60, x: 380, y: 300 }, { id: 'tv', room: 'living', glyph: '📺', watts: 120, x: 500, y: 380 },
  { id: 'l6', room: 'hall', glyph: '💡', watts: 60, x: 650, y: 300 },
]
const PEOPLE = ['🧑', '👧', '👴']
const TIME = 70

export default function EnergyMeter() {
  const [best, submit] = useBest('energy')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ gadgets: [] as Gadget[], people: [] as { glyph: string; room: string; x: number; y: number; tx: number; ty: number; stay: number }[], t: TIME, kwh: 0, wasted: 0, annoyed: 0, running: true })
  const needle = useRef<SVGLineElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const occupied = (room: string) => st.current.people.some((p) => p.room === room && Math.hypot(p.x - p.tx, p.y - p.ty) < 10)

  useEffect(() => {
    st.current = { gadgets: GADGETS.map((g) => ({ ...g, on: Math.random() < 0.5 })), people: PEOPLE.map((g, i) => { const r = ROOMS[i + 3]; return { glyph: g, room: r.id, x: r.x + r.w / 2, y: r.y + r.h / 2, tx: r.x + r.w / 2, ty: r.y + r.h / 2, stay: 2 + Math.random() * 4 } }), t: TIME, kwh: 0, wasted: 0, annoyed: 0, running: true }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        for (const p of s.people) {
          const dx = p.tx - p.x, dy = p.ty - p.y, d = Math.hypot(dx, dy)
          if (d > 2) { p.x += (dx / d) * Math.min(d, 160 * dt); p.y += (dy / d) * Math.min(d, 160 * dt) }
          else {
            p.stay -= dt
            if (p.stay <= 0) {
              const r = ROOMS[Math.floor(Math.random() * ROOMS.length)]
              p.room = r.id; p.tx = r.x + 30 + Math.random() * (r.w - 60); p.ty = r.y + 40 + Math.random() * (r.h - 70); p.stay = 3 + Math.random() * 5
              // Walking in, they switch on the light and something else.
              s.gadgets.filter((g) => g.room === r.id).forEach((g) => { if (g.id.startsWith('l') || Math.random() < 0.5) g.on = true })
            }
          }
        }
        let watts = 0
        for (const g of s.gadgets) if (g.on) { watts += g.watts; if (!occupied(g.room)) s.wasted += (g.watts * dt) / 3600 }
        s.kwh += (watts * dt) / 3600
        if (needle.current) needle.current.setAttribute('transform', `rotate(${-80 + Math.min(160, (watts / 4000) * 160)} 770 150)`)
        if (s.t <= 0) {
          s.running = false
          const score = Math.max(0, Math.round(200 - s.wasted * 3 - s.annoyed * 10))
          const record = submitRef.current(score)
          setResult({ headline: 'Lights out, everyone', lines: [`Energy used ${s.kwh.toFixed(1)} units`, `Wasted in empty rooms ${s.wasted.toFixed(1)}`, `${s.annoyed} times you switched off something in use`, `Score ${score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const toggle = (g: Gadget, el: SVGGElement) => {
    const s = st.current
    if (!s.running) return
    if (g.on && occupied(g.room)) { s.annoyed++; if (!reducedMotion()) gsap.fromTo(el, { x: -5 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }) }
    g.on = !g.on
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const watts = s.gadgets.reduce((n, g) => n + (g.on ? g.watts : 0), 0)
  return (
    <GameShell title="Energy Meter" score={Math.max(0, Math.round(200 - s.wasted * 3 - s.annoyed * 10))} best={best} result={result} onRestart={restart}
      hint={`Switch off things in empty rooms, leave people’s things on · ${watts} W right now · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="House cross-section">
        <rect width={W} height={H} fill="#0f172a" />
        <path d="M40 50 L390 10 L740 50 V450 H40 Z" fill="#1e293b" />
        {ROOMS.map((r) => {
          const lit = s.gadgets.some((g) => g.room === r.id && g.id.startsWith('l') && g.on)
          const occ = occupied(r.id)
          return (
            <g key={r.id}>
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={6} fill={lit ? '#fef3c7' : '#334155'} />
              <text x={r.x + 10} y={r.y + 20} fontSize={12} fontWeight={700} fill={lit ? '#78350f' : '#94a3b8'}>{r.name}{occ ? '' : ' · empty'}</text>
            </g>
          )
        })}
        {s.gadgets.map((g) => (
          <g key={g.id} onPointerDown={(e) => toggle(g, e.currentTarget)} style={{ cursor: 'pointer' }}>
            {g.on && <circle cx={g.x} cy={g.y} r={26} fill="#fde047" opacity={0.35}><animate attributeName="r" values="22;28;22" dur="1.4s" repeatCount="indefinite" /></circle>}
            <circle cx={g.x} cy={g.y} r={20} fill={g.on ? '#fff' : '#475569'} stroke={occupied(g.room) ? '#22c55e' : g.on ? '#ef4444' : '#64748b'} strokeWidth={3} />
            <text x={g.x} y={g.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={20} opacity={g.on ? 1 : 0.35}>{g.glyph}</text>
          </g>
        ))}
        {s.people.map((p, i) => <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontSize={30}>{p.glyph}</text>)}
        <g>
          <path d="M745 150 A35 35 0 0 1 795 150" fill="none" stroke="#334155" strokeWidth={10} transform="translate(-10 0)" />
          <path d="M777 124 A35 35 0 0 1 785 150" fill="none" stroke="#ef4444" strokeWidth={10} />
          <line ref={needle} x1={770} y1={150} x2={770} y2={122} stroke="#f8fafc" strokeWidth={3} strokeLinecap="round" transform="rotate(-80 770 150)" />
          <text x={770} y={172} textAnchor="middle" fontSize={10} fill="#94a3b8">meter</text>
        </g>
      </svg>
    </GameShell>
  )
}
