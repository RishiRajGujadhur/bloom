import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Burner Juggle: four burners, a stream of orders and 90 seconds. Click a
 * knob to change the heat, click a pan to stir. Each dish only cooks at its
 * own heat; too hot and it scorches, and some need a stir now and then.
 */
type Heat = 0 | 1 | 2 | 3
type Recipe = { name: string; glyph: string; heat: Heat; secs: number; stir?: number; color: string }
const RECIPES: Recipe[] = [
  { name: 'Rice', glyph: '🍚', heat: 1, secs: 14, color: '#f3ecd8' },
  { name: 'Steak', glyph: '🥩', heat: 3, secs: 7, color: '#b0473c' },
  { name: 'Tomato sauce', glyph: '🍅', heat: 2, secs: 11, stir: 4, color: '#d9432f' },
  { name: 'Pasta', glyph: '🍝', heat: 3, secs: 9, color: '#f1c86b' },
  { name: 'Porridge', glyph: '🥣', heat: 1, secs: 10, stir: 3, color: '#e9dcc0' },
  { name: 'Stir-fry', glyph: '🥦', heat: 3, secs: 6, stir: 2.5, color: '#5aa84a' },
  { name: 'Eggs', glyph: '🍳', heat: 2, secs: 5, color: '#fbe07a' },
  { name: 'Soup', glyph: '🍲', heat: 2, secs: 12, color: '#e08a3c' },
]
const HEATS = ['Off', 'Low', 'Med', 'High']
const ROUND = 90
const W = 720, H = 500

type Pan = { recipe: Recipe | null; heat: Heat; done: number; burn: number; sinceStir: number; state: 'cooking' | 'ready' | 'burnt' | 'empty' }
const emptyPan = (): Pan => ({ recipe: null, heat: 0, done: 0, burn: 0, sinceStir: 0, state: 'empty' })
const pick = () => RECIPES[Math.floor(Math.random() * RECIPES.length)]

export default function BurnerJuggle() {
  const [best, submit] = useBest('burners')
  const [, force] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const st = useRef({ pans: [emptyPan(), emptyPan(), emptyPan(), emptyPan()], orders: [pick(), pick(), pick()], t: ROUND, score: 0, served: 0, burnt: 0, running: true })
  const knobs = useRef<(SVGGElement | null)[]>([])
  const flames = useRef<(SVGGElement | null)[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const restart = useCallback(() => {
    st.current = { pans: [emptyPan(), emptyPan(), emptyPan(), emptyPan()], orders: [pick(), pick(), pick()], t: ROUND, score: 0, served: 0, burnt: 0, running: true }
    setResult(null)
    force((n) => n + 1)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      const s = st.current
      if (!s.running) return
      const dt = 0.1
      s.t = Math.max(0, s.t - dt)
      s.pans.forEach((p) => {
        if (!p.recipe || p.state !== 'cooking') return
        const r = p.recipe
        p.sinceStir += dt
        const sticking = r.stir && p.sinceStir > r.stir
        if (p.heat === r.heat && !sticking) p.done += dt / r.secs
        else if (p.heat > r.heat || (sticking && p.heat > 0)) p.burn += dt * (p.heat - r.heat + (sticking ? 1 : 0)) * 0.18
        if (p.done >= 1) p.state = 'ready'
        if (p.burn >= 1) { p.state = 'burnt'; s.burnt++ }
      })
      if (s.t <= 0) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: s.burnt ? 'Service over' : 'Clean service!', lines: [`${s.served} dishes served`, `${s.burnt} scorched`, `Score ${s.score}`], record })
      }
      force((n) => n + 1)
    }, 100)
    return () => clearInterval(id)
  }, [])

  // Flames breathe with the heat.
  useEffect(() => {
    if (reducedMotion()) return
    const tl = flames.current.map((f) => f && gsap.to(f.querySelectorAll('path'), { scaleY: 1.18, scaleX: 0.92, transformOrigin: '50% 100%', duration: 0.18, repeat: -1, yoyo: true, stagger: 0.05, ease: 'sine.inOut' }))
    return () => tl.forEach((t) => t?.kill())
  }, [])

  const turn = (i: number) => {
    const p = st.current.pans[i]
    p.heat = ((p.heat + 1) % 4) as Heat
    const k = knobs.current[i]
    if (k) gsap.to(k, { rotation: p.heat * 90, svgOrigin: '0 0', duration: reducedMotion() ? 0 : 0.25, ease: 'back.out(2)' })
    force((n) => n + 1)
  }
  const pan = (i: number, el: SVGGElement) => {
    const s = st.current
    const p = s.pans[i]
    if (!s.running) return
    if (p.state === 'empty' && s.orders.length) {
      p.recipe = s.orders.shift()!
      p.state = 'cooking'
      s.orders.push(pick())
    } else if (p.state === 'cooking') {
      p.sinceStir = 0
      if (!reducedMotion()) gsap.fromTo(el.querySelector('.bj-food'), { rotation: -25 }, { rotation: 0, svgOrigin: '0 0', duration: 0.4, ease: 'elastic.out(1, 0.4)' })
    } else if (p.state === 'ready') {
      s.served++
      s.score += 20 + Math.round((1 - p.burn) * 10)
      if (!reducedMotion()) gsap.fromTo(el, { x: 0 }, { x: 0, keyframes: [{ y: -30, duration: 0.15 }, { y: 0, duration: 0.2 }] })
      Object.assign(p, emptyPan(), { heat: p.heat })
    } else if (p.state === 'burnt') {
      Object.assign(p, emptyPan(), { heat: p.heat })
    }
    force((n) => n + 1)
  }

  const s = st.current
  const pos = [[150, 170], [370, 170], [150, 370], [370, 370]] as const
  return (
    <GameShell title="Burner Juggle" score={s.score} best={best} result={result} onRestart={restart}
      hint="Click an empty pan to start the next order · click a knob for heat · click a cooking pan to stir · click a finished dish to serve">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Stove">
        <rect x={40} y={60} width={460} height={420} rx={24} fill="#2d2f36" />
        <rect x={40} y={60} width={460} height={420} rx={24} fill="none" stroke="#565b66" strokeWidth={3} />
        {s.pans.map((p, i) => {
          const [cx, cy] = pos[i]
          const r = p.recipe
          const right = r && p.heat === r.heat
          const stick = r?.stir && p.sinceStir > r.stir
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={70} fill="#1b1c21" stroke="#444" strokeWidth={4} />
              <g ref={(el) => { flames.current[i] = el }} transform={`translate(${cx} ${cy})`} opacity={p.heat / 3}>
                {Array.from({ length: 12 }, (_, j) => {
                  const a = (j / 12) * Math.PI * 2
                  const fx = Math.cos(a) * 58, fy = Math.sin(a) * 58
                  return <path key={j} d={`M${fx - 6} ${fy} Q${fx} ${fy - 10 - p.heat * 6} ${fx + 6} ${fy} Z`} fill={p.heat === 3 ? '#ff7a2a' : '#4aa3ff'} transform={`rotate(${(a * 180) / Math.PI + 90} ${fx} ${fy})`} />
                })}
              </g>
              <g className="bj-pan" transform={`translate(${cx} ${cy})`} onClick={(e) => pan(i, e.currentTarget)} style={{ cursor: 'pointer' }}>
                <rect x={50} y={-8} width={70} height={16} rx={8} fill="#555a63" />
                <circle r={58} fill="#3c4048" stroke="#6b707a" strokeWidth={4} />
                {r ? (
                  <g className="bj-food">
                    <circle r={44} fill={p.state === 'burnt' ? '#2a211c' : r.color} opacity={0.9} />
                    <text textAnchor="middle" dominantBaseline="central" fontSize={34}>{p.state === 'burnt' ? '💨' : r.glyph}</text>
                  </g>
                ) : <text textAnchor="middle" dominantBaseline="central" fontSize={14} fill="#c9ccd3">tap for next</text>}
                {r && p.state === 'cooking' && (
                  <>
                    <circle r={52} fill="none" stroke="#ffffff22" strokeWidth={6} />
                    <circle r={52} fill="none" stroke={right ? '#3ddc84' : '#f5c542'} strokeWidth={6} strokeDasharray={`${p.done * 327} 327`} transform="rotate(-90)" />
                    {p.burn > 0.05 && <circle r={52} fill="none" stroke="#ff4d4d" strokeWidth={6} strokeDasharray={`${p.burn * 327} 327`} transform="rotate(90)" opacity={0.8} />}
                    {stick && <text y={-64} textAnchor="middle" fontSize={13} fontWeight={800} fill="#ffcf5a">stir!</text>}
                  </>
                )}
                {p.state === 'ready' && <text y={-64} textAnchor="middle" fontSize={14} fontWeight={800} fill="#3ddc84">✓ serve</text>}
                {p.state === 'burnt' && <text y={-64} textAnchor="middle" fontSize={13} fontWeight={800} fill="#ff6b6b">scorched · tap to clear</text>}
              </g>
              <g transform={`translate(${cx - 34} ${cy + 88})`}>
                <text x={-40} y={5} fontSize={11} fill="#c9ccd3">{r ? `${r.name}: ${HEATS[r.heat]}` : ''}</text>
              </g>
              <g transform={`translate(${cx + 78} ${cy + 72})`} onClick={() => turn(i)} style={{ cursor: 'pointer' }} aria-label={`Burner ${i + 1} heat ${HEATS[p.heat]}`}>
                <circle r={16} fill="#8b909b" stroke="#c9ccd3" strokeWidth={2} />
                <g ref={(el) => { knobs.current[i] = el }}><rect x={-3} y={-15} width={6} height={14} rx={3} fill="#1b1c21" /></g>
                <text y={30} textAnchor="middle" fontSize={11} fill="currentColor">{HEATS[p.heat]}</text>
              </g>
            </g>
          )
        })}
        <g transform="translate(530 70)">
          <text fontSize={15} fontWeight={800} fill="currentColor">Orders</text>
          {s.orders.map((o, i) => (
            <g key={i} transform={`translate(0 ${24 + i * 70})`}>
              <rect width={160} height={58} rx={10} fill="#fffdf4" stroke="#e4d9b8" />
              <text x={12} y={36} fontSize={26}>{o.glyph}</text>
              <text x={50} y={24} fontSize={13} fontWeight={700} fill="#333">{o.name}</text>
              <text x={50} y={42} fontSize={11} fill="#666">{HEATS[o.heat]} heat{o.stir ? ' · stir' : ''}</text>
            </g>
          ))}
          <text y={270} fontSize={13} fill="currentColor">Time</text>
          <rect y={280} width={160} height={10} rx={5} fill="currentColor" opacity={0.15} />
          <rect y={280} width={(s.t / ROUND) * 160} height={10} rx={5} fill={s.t < 15 ? '#ff5a5a' : '#3ddc84'} />
          <text y={320} fontSize={13} fill="currentColor">Served {s.served} · Scorched {s.burnt}</text>
        </g>
      </svg>
    </GameShell>
  )
}
