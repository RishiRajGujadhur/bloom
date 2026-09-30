import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Recycling Rush: rubbish rides a conveyor over five bins. Click an item when
 * it's above the right bin and the trapdoor drops it in (with a satisfying
 * physics tumble). Anything left on the belt goes to landfill. The belt speeds
 * up as you go.
 */
type BinId = 'paper' | 'plastic' | 'glass' | 'compost' | 'general'
type Junk = { glyph: string; name: string; bin: BinId }
const JUNK: Junk[] = [
  { glyph: '📰', name: 'newspaper', bin: 'paper' }, { glyph: '📦', name: 'cardboard box', bin: 'paper' }, { glyph: '✉️', name: 'envelope', bin: 'paper' },
  { glyph: '🥫', name: 'tin can', bin: 'plastic' }, { glyph: '🧴', name: 'shampoo bottle', bin: 'plastic' }, { glyph: '🥤', name: 'drink can', bin: 'plastic' },
  { glyph: '🍾', name: 'glass bottle', bin: 'glass' }, { glyph: '🍶', name: 'glass jar', bin: 'glass' },
  { glyph: '🍌', name: 'banana peel', bin: 'compost' }, { glyph: '🍎', name: 'apple core', bin: 'compost' }, { glyph: '🥚', name: 'eggshells', bin: 'compost' }, { glyph: '🍕', name: 'greasy pizza box', bin: 'compost' },
  { glyph: '🍟', name: 'crisp packet', bin: 'general' }, { glyph: '🧦', name: 'worn-out sock', bin: 'general' }, { glyph: '🧸', name: 'broken toy', bin: 'general' },
]
const BINS: { id: BinId; label: string; color: string }[] = [
  { id: 'paper', label: 'Paper', color: '#4f8df5' },
  { id: 'plastic', label: 'Cans & plastic', color: '#f5c542' },
  { id: 'glass', label: 'Glass', color: '#3fbf9f' },
  { id: 'compost', label: 'Compost', color: '#8a5a3c' },
  { id: 'general', label: 'General', color: '#6b6f78' },
]
const W = 800, H = 500, BELT_Y = 150, BIN_W = 140, BIN_X0 = 50, BIN_TOP = 330
const ROUND = 75

type Item = { id: number; j: Junk; x: number; body: Matter.Body | null }

export default function RecyclingRush() {
  const [best, submit] = useBest('recycle')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ items: [] as Item[], t: ROUND, score: 0, right: 0, wrong: 0, landfill: 0, speed: 70, running: true, belt: 0 })
  const engine = useRef<Matter.Engine | null>(null)
  const binEls = useRef(new Map<BinId, SVGGElement>())
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { items: [], t: ROUND, score: 0, right: 0, wrong: 0, landfill: 0, speed: 70, running: true, belt: 0 }
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1.2 } })
    engine.current = e
    const walls: Matter.Body[] = [Matter.Bodies.rectangle(W / 2, H + 20, W * 2, 40, { isStatic: true })]
    for (let i = 0; i <= BINS.length; i++) walls.push(Matter.Bodies.rectangle(BIN_X0 + i * BIN_W + (i === 0 ? 0 : 0), BIN_TOP + 90, 8, 180, { isStatic: true }))
    Matter.Composite.add(e.world, walls)
    let id = 1
    let spawnIn = 0.5
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      Matter.Engine.update(e, dt * 1000)
      if (s.running) {
        s.t -= dt
        s.speed = 70 + (ROUND - s.t) * 1.6
        s.belt += s.speed * dt
        spawnIn -= dt
        if (spawnIn <= 0) { s.items.push({ id: id++, j: JUNK[Math.floor(Math.random() * JUNK.length)], x: -30, body: null }); spawnIn = Math.max(0.55, 110 / s.speed) }
        for (const it of s.items) if (!it.body) it.x += s.speed * dt
        const gone = s.items.filter((it) => !it.body && it.x > W + 30)
        if (gone.length) { s.landfill += gone.length; s.score = Math.max(0, s.score - 3 * gone.length) }
        s.items = s.items.filter((it) => (it.body ? it.body.position.y < H + 60 && !(it.body as Matter.Body & { settled?: boolean }).settled : it.x <= W + 30))
        // Items that land in a bin count once, then fade out.
        for (const it of s.items) {
          const b = it.body as (Matter.Body & { counted?: boolean; settled?: boolean }) | null
          if (b && !b.counted && b.position.y > BIN_TOP + 20) {
            b.counted = true
            const bi = Math.max(0, Math.min(BINS.length - 1, Math.floor((b.position.x - BIN_X0) / BIN_W)))
            const ok = BINS[bi].id === it.j.bin
            if (ok) { s.right++; s.score += 10 } else { s.wrong++; s.score = Math.max(0, s.score - 5) }
            const el = binEls.current.get(BINS[bi].id)
            if (el && !reducedMotion()) gsap.fromTo(el, { y: ok ? 6 : 0, x: ok ? 0 : -6 }, { y: 0, x: 0, duration: 0.45, ease: 'elastic.out(1, 0.35)' })
            window.setTimeout(() => { b.settled = true; Matter.Composite.remove(e.world, b) }, 900)
          }
        }
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Shift over', lines: [`${s.right} in the right bin`, `${s.wrong} in the wrong bin`, `${s.landfill} went to landfill`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const drop = (it: Item) => {
    if (it.body || !engine.current || !st.current.running) return
    const b = Matter.Bodies.circle(it.x, BELT_Y + 20, 20, { restitution: 0.35, friction: 0.2, density: 0.002 })
    Matter.Body.setVelocity(b, { x: st.current.speed / 60, y: 1 })
    Matter.Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.3)
    Matter.Composite.add(engine.current.world, b)
    it.body = b
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const hover = s.items.find((it) => !it.body && it.x > 0 && it.x < W)
  return (
    <GameShell title="Recycling Rush" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Click an item when it's over the right bin · ${Math.max(0, Math.ceil(s.t))}s${hover ? ` · next: ${hover.j.name}` : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Conveyor over recycling bins">
        <rect width={W} height={H} fill="#eef2ea" />
        {/* Belt with moving slats. */}
        <rect x={0} y={BELT_Y + 22} width={W} height={26} fill="#3b3f47" />
        {Array.from({ length: 30 }, (_, i) => <rect key={i} x={((i * 36 + s.belt) % (W + 36)) - 36} y={BELT_Y + 25} width={20} height={20} rx={3} fill="#555b66" />)}
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={i * 72 + 20} cy={BELT_Y + 60} r={10} fill="#8a909b" stroke="#3b3f47" strokeWidth={3} transform={`rotate(${s.belt * 3} ${i * 72 + 20} ${BELT_Y + 60})`} />)}
        <text x={W - 10} y={BELT_Y - 12} textAnchor="end" fontSize={12} fill="#555">→ landfill</text>
        {BINS.map((b, i) => {
          const x = BIN_X0 + i * BIN_W
          return (
            <g key={b.id} ref={(el) => { if (el) binEls.current.set(b.id, el) }}>
              <path d={`M${x + 6} ${BIN_TOP} L${x + BIN_W - 6} ${BIN_TOP} L${x + BIN_W - 16} ${H - 4} L${x + 16} ${H - 4} Z`} fill={b.color} opacity={0.85} />
              <rect x={x + 2} y={BIN_TOP - 12} width={BIN_W - 4} height={14} rx={5} fill={b.color} />
              <text x={x + BIN_W / 2} y={BIN_TOP + 40} textAnchor="middle" fontWeight={800} fontSize={14} fill="#fff">{b.label}</text>
              <path d={`M${x + BIN_W / 2} ${BELT_Y + 80} l0 ${BIN_TOP - BELT_Y - 100}`} stroke={b.color} strokeDasharray="3 6" opacity={0.5} />
            </g>
          )
        })}
        {s.items.map((it) => {
          const x = it.body ? it.body.position.x : it.x
          const y = it.body ? it.body.position.y : BELT_Y
          const r = it.body ? (it.body.angle * 180) / Math.PI : 0
          return (
            <g key={it.id} transform={`translate(${x} ${y}) rotate(${r})`} onPointerDown={() => drop(it)} style={{ cursor: it.body ? 'default' : 'pointer' }}>
              <circle r={24} fill="#fff" opacity={it.body ? 0 : 0.7} />
              <text textAnchor="middle" dominantBaseline="central" fontSize={30}>{it.j.glyph}</text>
            </g>
          )
        })}
      </svg>
    </GameShell>
  )
}
