import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Pantry Tetris: the week's shopping arrives one item at a time. Click to drop
 * it into the fridge, wheel or right-click to turn it. The door has to shut, and
 * anything that goes off soon earns a bonus if it ends up near the front (top).
 */
type Kind = { name: string; w: number; h: number; round?: boolean; fill: string; days: number; glyph: string }
const KINDS: Kind[] = [
  { name: 'Milk', w: 42, h: 76, fill: '#e8f1fb', days: 5, glyph: '🥛' },
  { name: 'Eggs', w: 84, h: 30, fill: '#f3d9a4', days: 14, glyph: '🥚' },
  { name: 'Apple', w: 36, h: 36, round: true, fill: '#e2574c', days: 20, glyph: '🍎' },
  { name: 'Berries', w: 44, h: 28, fill: '#6b4bc8', days: 3, glyph: '🫐' },
  { name: 'Cheese', w: 58, h: 34, fill: '#f6c945', days: 21, glyph: '🧀' },
  { name: 'Yoghurt', w: 36, h: 44, fill: '#f7f1e3', days: 7, glyph: '🥣' },
  { name: 'Juice', w: 30, h: 96, fill: '#f59f2a', days: 10, glyph: '🧃' },
  { name: 'Leftovers', w: 76, h: 42, fill: '#9dc7b5', days: 2, glyph: '🍲' },
  { name: 'Lettuce', w: 54, h: 54, round: true, fill: '#6fbf5b', days: 5, glyph: '🥬' },
  { name: 'Butter', w: 56, h: 24, fill: '#fbe7a1', days: 30, glyph: '🧈' },
  { name: 'Carrots', w: 90, h: 22, fill: '#f08a24', days: 12, glyph: '🥕' },
  { name: 'Fish', w: 80, h: 30, fill: '#8fb3cf', days: 1, glyph: '🐟' },
]
const W = 640, H = 540
const L = 170, R = 470, TOP = 120, FLOOR = 510
const PER = 4 // "goes off soon" if days <= PER
const COUNT = 14

type Item = { id: number; k: Kind; body: Matter.Body }
const shuffle = () => Array.from({ length: COUNT }, () => KINDS[Math.floor(Math.random() * KINDS.length)])

export default function PantryTetris() {
  const [best, submit] = useBest('pantry')
  const [queue, setQueue] = useState<Kind[]>(shuffle)
  const [angle, setAngle] = useState(0)
  const [x, setX] = useState((L + R) / 2)
  const [items, setItems] = useState<Item[]>([])
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const engine = useRef<Matter.Engine | null>(null)
  const nodes = useRef(new Map<number, SVGGElement>())
  const door = useRef<SVGRectElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const nextId = useRef(1)
  const [round, setRound] = useState(0)

  useEffect(() => {
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1.1 } })
    engine.current = e
    const wall = (x: number, y: number, w: number, h: number) => Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, friction: 0.6 })
    Matter.Composite.add(e.world, [wall((L + R) / 2, FLOOR + 20, R - L + 80, 40), wall(L - 20, 300, 40, 600), wall(R + 20, 300, 40, 600)])
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      Matter.Engine.update(e, Math.min(32, t - last))
      last = t
      for (const b of Matter.Composite.allBodies(e.world)) {
        const n = nodes.current.get(b.id)
        if (n) n.setAttribute('transform', `translate(${b.position.x} ${b.position.y}) rotate(${(b.angle * 180) / Math.PI})`)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const finish = useCallback((all: Item[]) => {
    const inside = all.filter((i) => i.body.bounds.min.y > TOP - 4 && i.body.position.x > L && i.body.position.x < R)
    const over = all.length - inside.length
    const fresh = inside.filter((i) => i.k.days <= PER)
    const front = fresh.filter((i) => i.body.position.y < 330)
    const s = Math.max(0, inside.length * 10 + front.length * 8 - over * 15)
    setScore(s)
    const shut = over === 0
    const full = R - L + 28
    if (door.current) gsap.fromTo(door.current, { attr: { width: 0 } }, { attr: { width: full * (shut ? 1 : 0.82) }, duration: reducedMotion() ? 0 : 0.8, ease: shut ? 'bounce.out' : 'elastic.out(1, 0.3)' })
    const record = submit(s)
    setResult({
      headline: shut ? 'Door shut!' : 'It won’t close…',
      lines: [
        `${inside.length} of ${all.length} items fit`,
        fresh.length ? `${front.length} of ${fresh.length} short-dated items within easy reach` : 'Nothing short-dated this trip',
        ...(over ? [`${over} sticking out`] : []),
        `Score ${s}`,
      ],
      record,
    })
  }, [submit])

  const drop = () => {
    if (!queue.length || result || !engine.current) return
    const k = queue[0]
    const opts = { friction: 0.5, restitution: 0.05, density: 0.002, angle: (angle * Math.PI) / 180 }
    const body = k.round ? Matter.Bodies.circle(x, 60, k.w / 2, opts) : Matter.Bodies.rectangle(x, 60, k.w, k.h, { ...opts, chamfer: { radius: 5 } })
    Matter.Composite.add(engine.current.world, body)
    const it = { id: nextId.current++, k, body }
    const next = [...items, it]
    setItems(next)
    setScore((s) => s + 10)
    setQueue((q) => q.slice(1))
    if (queue.length === 1) setTimeout(() => finish(next), 2200)
  }

  const restart = useCallback(() => {
    setQueue(shuffle()); setItems([]); setScore(0); setResult(null); setAngle(0); nodes.current.clear(); setRound((r) => r + 1)
    if (door.current) gsap.set(door.current, { attr: { width: 0 } })
  }, [])

  const pointer = (e: React.PointerEvent) => {
    const m = svg.current!.getScreenCTM()
    if (!m) return
    const px = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).x
    const k = queue[0]
    const half = k ? (angle % 180 ? k.h : k.w) / 2 : 20
    setX(Math.min(R - half - 2, Math.max(L + half + 2, px)))
  }
  const turn = () => setAngle((a) => (a + 90) % 360)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'q' || e.key === 'e' || e.key === 'ArrowUp') turn(); if (e.key === ' ' || e.key === 'Enter') { e.preventDefault() } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  const k = queue[0]
  const shape = (kind: Kind, ghost = false) => (
    <>
      {kind.round
        ? <circle r={kind.w / 2} fill={kind.fill} stroke="rgb(0 0 0 / .25)" strokeWidth={1.5} opacity={ghost ? 0.55 : 1} />
        : <rect x={-kind.w / 2} y={-kind.h / 2} width={kind.w} height={kind.h} rx={5} fill={kind.fill} stroke="rgb(0 0 0 / .25)" strokeWidth={1.5} opacity={ghost ? 0.55 : 1} />}
      <text textAnchor="middle" dominantBaseline="central" fontSize={Math.min(kind.w, kind.h) * 0.6}>{kind.glyph}</text>
      {kind.days <= PER && <circle className="pt-fresh" cx={kind.round ? kind.w / 3 : kind.w / 2 - 6} cy={kind.round ? -kind.w / 3 : -kind.h / 2 + 6} r={4} fill="#ff4d6d" />}
    </>
  )
  return (
    <GameShell title="Pantry Tetris" score={score} best={best} result={result} onRestart={restart}
      hint="Click to drop · wheel, right-click or Q to turn · red dot = eat soon, keep it where you'll see it">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={pointer} onClick={drop} onWheel={turn} onContextMenu={(e) => { e.preventDefault(); turn() }} role="img" aria-label="Fridge">
        <defs>
          <linearGradient id="pt-in" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#eaf6ff" /><stop offset="1" stopColor="#cfe3f3" /></linearGradient>
          <linearGradient id="pt-door" x1="0" x2="1"><stop offset="0" stopColor="#dfe8ef" /><stop offset="1" stopColor="#b8c7d3" /></linearGradient>
        </defs>
        <rect x={L - 14} y={TOP - 30} width={R - L + 28} height={FLOOR - TOP + 44} rx={22} fill="#9fb2c1" />
        <rect x={L} y={TOP - 16} width={R - L} height={FLOOR - TOP + 16} rx={10} fill="url(#pt-in)" />
        <line x1={L} x2={R} y1={330} y2={330} stroke="#ffffff" strokeWidth={2} strokeDasharray="3 5" />
        <line x1={L} x2={R} y1={TOP} y2={TOP} stroke="#ff4d6d" strokeDasharray="6 6" strokeWidth={2} />
        <text x={R + 30} y={TOP + 4} fontSize={12} fill="currentColor" opacity={0.6}>door line</text>
        <text x={R + 30} y={336} fontSize={12} fill="currentColor" opacity={0.6}>front shelf ↑</text>
        {items.map((it) => (
          <g key={`${round}-${it.id}`} ref={(n) => { if (n) nodes.current.set(it.body.id, n); else nodes.current.delete(it.body.id) }}>{shape(it.k)}</g>
        ))}
        {k && !result && (
          <g transform={`translate(${x} 60) rotate(${angle})`} pointerEvents="none">{shape(k, true)}</g>
        )}
        {k && !result && <line x1={x} x2={x} y1={90} y2={FLOOR} stroke="currentColor" strokeDasharray="2 8" opacity={0.25} pointerEvents="none" />}
        <g transform={`translate(20 40)`}>
          <text fontSize={13} fill="currentColor" opacity={0.7}>Next up ({queue.length})</text>
          {queue.slice(1, 5).map((q, i) => (
            <g key={i} transform={`translate(60 ${60 + i * 90}) scale(.7)`} opacity={1 - i * 0.2}>{shape(q)}</g>
          ))}
        </g>
        <rect ref={door} x={L - 14} y={TOP - 30} width={0} height={FLOOR - TOP + 44} rx={22} fill="url(#pt-door)" stroke="#8aa0b0" strokeWidth={2} pointerEvents="none" />
      </svg>
    </GameShell>
  )
}
