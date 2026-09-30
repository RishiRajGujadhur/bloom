import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Laundry Sorter: clothes tumble out of the chute. Grab and fling each one
 * into the right basket before the pile overflows. Each piece's colour and
 * little care tag decide where it belongs; one stray red sock turns the whole
 * white load pink.
 */
type Cloth = { kind: 'shirt' | 'sock' | 'jeans' | 'towel' | 'dress'; color: string; tone: 'white' | 'dark' | 'colour'; delicate: boolean }
type Basket = { id: 'whites' | 'darks' | 'colours' | 'delicate'; label: string; tag: string; x: number; color: string }
const W = 720, H = 520, FLOOR = 470
const BASKETS: Basket[] = [
  { id: 'whites', label: 'Whites', tag: '60°', x: 110, color: '#e8eef5' },
  { id: 'colours', label: 'Colours', tag: '40°', x: 290, color: '#f2b84b' },
  { id: 'darks', label: 'Darks', tag: '30°', x: 470, color: '#3b3f58' },
  { id: 'delicate', label: 'Hand wash', tag: '✋', x: 630, color: '#c9a7e8' },
]
const COLORS = { white: ['#ffffff', '#f4f1ea'], dark: ['#23263a', '#3a2f2a', '#1f3b4d'], colour: ['#e23b3b', '#2f9e5b', '#f08a24', '#3e7be0'] }
const ROUND = 60
const pickCloth = (): Cloth => {
  const tone = (['white', 'dark', 'colour'] as const)[Math.floor(Math.random() * 3)]
  const kinds = ['shirt', 'sock', 'jeans', 'towel', 'dress'] as const
  const kind = kinds[Math.floor(Math.random() * kinds.length)]
  const list = COLORS[tone]
  return { kind, tone, color: list[Math.floor(Math.random() * list.length)], delicate: kind === 'dress' || Math.random() < 0.12 }
}
const want = (c: Cloth): Basket['id'] => (c.delicate ? 'delicate' : c.tone === 'white' ? 'whites' : c.tone === 'dark' ? 'darks' : 'colours')
const SIZE: Record<Cloth['kind'], [number, number]> = { shirt: [60, 50], sock: [26, 40], jeans: [44, 70], towel: [70, 40], dress: [50, 70] }
const PATH: Record<Cloth['kind'], (w: number, h: number) => string> = {
  shirt: (w, h) => `M${-w / 2} ${-h / 2 + 10} L${-w / 4} ${-h / 2} L${w / 4} ${-h / 2} L${w / 2} ${-h / 2 + 10} L${w / 2 - 8} ${-h / 2 + 20} L${w / 3} ${-h / 2 + 16} L${w / 3} ${h / 2} L${-w / 3} ${h / 2} L${-w / 3} ${-h / 2 + 16} L${-w / 2 + 8} ${-h / 2 + 20} Z`,
  sock: (w, h) => `M${-w / 2} ${-h / 2} L${w / 2 - 6} ${-h / 2} L${w / 2 - 6} ${h / 4} Q${w / 2 + 8} ${h / 2} ${0} ${h / 2} L${-w / 2} ${h / 2 - 10} Z`,
  jeans: (w, h) => `M${-w / 2} ${-h / 2} L${w / 2} ${-h / 2} L${w / 2} ${h / 2} L${4} ${h / 2} L${0} ${-h / 6} L${-4} ${h / 2} L${-w / 2} ${h / 2} Z`,
  towel: (w, h) => `M${-w / 2} ${-h / 2} h${w} v${h} h${-w} Z`,
  dress: (w, h) => `M${-w / 5} ${-h / 2} L${w / 5} ${-h / 2} L${w / 4} ${-h / 6} L${w / 2} ${h / 2} L${-w / 2} ${h / 2} L${-w / 4} ${-h / 6} Z`,
}

type Item = { id: number; c: Cloth; body: Matter.Body }

export default function LaundrySorter() {
  const [best, submit] = useBest('laundry')
  const [items, setItems] = useState<Item[]>([])
  const [score, setScore] = useState(0)
  const [time, setTime] = useState(ROUND)
  const [pink, setPink] = useState(false)
  const [loads, setLoads] = useState<Record<string, number>>({ whites: 0, colours: 0, darks: 0, delicate: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const nodes = useRef(new Map<number, SVGGElement>())
  const basketEls = useRef(new Map<string, SVGGElement>())
  const st = useRef({ score: 0, right: 0, wrong: 0, pink: false, running: true })
  const engineRef = useRef<Matter.Engine | null>(null)
  const grab = useRef<Matter.Constraint | null>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const toWorld = (e: { clientX: number; clientY: number }) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 }
  }

  useEffect(() => {
    st.current = { score: 0, right: 0, wrong: 0, pink: false, running: true }
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    engineRef.current = e
    const s = { isStatic: true }
    Matter.Composite.add(e.world, [
      Matter.Bodies.rectangle(W / 2, FLOOR + 30, W * 2, 60, s),
      Matter.Bodies.rectangle(-30, H / 2, 60, H * 2, s),
      Matter.Bodies.rectangle(W + 30, H / 2, 60, H * 2, s),
      // folding table under the chute
      Matter.Bodies.rectangle(360, 290, 240, 14, { isStatic: true, friction: 0.8 }),
    ])
    let alive: Item[] = []
    let nextSpawn = 0
    let raf = 0
    let last = performance.now()
    const start = last
    const loop = (t: number) => {
      const dt = Math.min(32, t - last)
      last = t
      Matter.Engine.update(e, dt)
      const left = Math.max(0, ROUND - (t - start) / 1000)
      if (st.current.running && t > nextSpawn && alive.length < 10) {
        const c = pickCloth()
        const [w, h] = SIZE[c.kind]
        const b = Matter.Bodies.rectangle(300 + Math.random() * 120, 40, w, h, { frictionAir: 0.03, restitution: 0.2, density: 0.0015, chamfer: { radius: 6 } })
        Matter.Composite.add(e.world, b)
        alive = [...alive, { id: b.id, c, body: b }]
        setItems(alive)
        nextSpawn = t + Math.max(900, 2200 - (ROUND - left) * 25)
      }
      for (const it of alive) {
        const b = it.body
        const n = nodes.current.get(b.id)
        if (n) n.setAttribute('transform', `translate(${b.position.x} ${b.position.y}) rotate(${(b.angle * 180) / Math.PI})`)
        // Landed in a basket?
        if (b.position.y > FLOOR - 70 && grab.current?.bodyB !== b) {
          const bk = BASKETS.find((k) => Math.abs(k.x - b.position.x) < 92)
          if (bk && b.speed < 6) {
            const ok = want(it.c) === bk.id
            if (ok) { st.current.score += 10; st.current.right++ } else {
              st.current.score = Math.max(0, st.current.score - 5); st.current.wrong++
              if (bk.id === 'whites' && it.c.tone === 'colour' && it.c.color === '#e23b3b') { st.current.pink = true; setPink(true) }
            }
            setLoads((l) => ({ ...l, [bk.id]: l[bk.id] + 1 }))
            setScore(st.current.score)
            const el = basketEls.current.get(bk.id)
            if (el && !reducedMotion()) gsap.fromTo(el, { y: 8 }, { y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
            Matter.Composite.remove(e.world, b)
            alive = alive.filter((x) => x !== it)
            setItems(alive)
          }
        }
      }
      if (st.current.running && (left <= 0 || alive.length >= 10)) {
        st.current.running = false
        setTime(0)
        const s = st.current
        const record = submitRef.current(s.score)
        setResult({ headline: left <= 0 ? 'Laundry day done' : 'The pile won', lines: [`${s.right} sorted right`, `${s.wrong} in the wrong basket`, ...(s.pink ? ['A red sock turned the whites pink'] : []), `Score ${s.score}`], record })
      } else if (st.current.running) setTime(Math.ceil(left))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const down = (e: React.PointerEvent, it: Item) => {
    if (!engineRef.current || !st.current.running) return
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    const p = toWorld(e)
    const c = Matter.Constraint.create({ pointA: { x: p.x, y: p.y }, bodyB: it.body, pointB: { x: p.x - it.body.position.x, y: p.y - it.body.position.y }, stiffness: 0.2, damping: 0.1 })
    Matter.Composite.add(engineRef.current.world, c)
    grab.current = c
  }
  const move = (e: React.PointerEvent) => {
    if (!grab.current) return
    const p = toWorld(e)
    grab.current.pointA = { x: p.x, y: p.y }
  }
  const up = () => {
    if (grab.current && engineRef.current) Matter.Composite.remove(engineRef.current.world, grab.current)
    grab.current = null
  }
  const restart = useCallback(() => { setItems([]); setScore(0); setPink(false); setLoads({ whites: 0, colours: 0, darks: 0, delicate: 0 }); setResult(null); setTime(ROUND); nodes.current.clear(); setRound((r) => r + 1) }, [])

  return (
    <GameShell title="Laundry Sorter" score={score} best={best} result={result} onRestart={restart}
      hint={`Grab and fling clothes into baskets · ${time}s left · check the colour and the little tag`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={up} onPointerLeave={up} role="img" aria-label="Laundry room">
        <rect width={W} height={H} fill="#eef3f6" />
        <rect y={FLOOR} width={W} height={H - FLOOR} fill="#c9d3da" />
        <path d="M260 0 L460 0 L460 90 L400 140 L320 140 L260 90 Z" fill="#b6c2cb" />
        <rect x={240} y={283} width={240} height={14} rx={4} fill="#a07a52" />
        <path d="M250 297 l20 0 l-20 24 Z M470 297 l-20 0 l20 24 Z" fill="#7a5a3a" />
        <text x={360} y={320} textAnchor="middle" fontSize={11} fill="#556">pile: {items.length}/10</text>
        <circle cx={620} cy={80} r={46} fill="#dfe6ea" stroke="#9aa6ae" strokeWidth={6} />
        <circle cx={620} cy={80} r={30} fill="#a8c7de" opacity={0.6} />
        {BASKETS.map((b) => (
          <g key={b.id} ref={(el) => { if (el) basketEls.current.set(b.id, el) }}>
            <path d={`M${b.x - 62} ${FLOOR - 70} L${b.x + 62} ${FLOOR - 70} L${b.x + 52} ${FLOOR} L${b.x - 52} ${FLOOR} Z`} fill={b.id === 'whites' && pink ? '#f7b6cf' : b.color} stroke="#0003" strokeWidth={2} />
            {Array.from({ length: 5 }, (_, i) => <line key={i} x1={b.x - 50 + i * 25} x2={b.x - 44 + i * 22} y1={FLOOR - 64} y2={FLOOR - 6} stroke="#0002" />)}
            <text x={b.x} y={FLOOR - 80} textAnchor="middle" fontWeight={800} fontSize={14} fill="#334">{b.label}</text>
            <text x={b.x} y={FLOOR - 32} textAnchor="middle" fontWeight={800} fontSize={18} fill={b.id === 'darks' ? '#fff' : '#334'}>{b.tag}</text>
            <text x={b.x} y={FLOOR + 30} textAnchor="middle" fontSize={12} fill="#334">{loads[b.id]} in</text>
          </g>
        ))}
        {items.map((it) => {
          const [w, h] = SIZE[it.c.kind]
          return (
            <g key={`${round}-${it.id}`} ref={(n) => { if (n) nodes.current.set(it.body.id, n); else nodes.current.delete(it.body.id) }} onPointerDown={(e) => down(e, it)} style={{ cursor: 'grab' }}>
              <path d={PATH[it.c.kind](w, h)} fill={it.c.color} stroke="#0004" strokeWidth={1.5} />
              <g transform={`translate(${w / 4 - 12} ${h / 4 - 8})`}>
                <rect width={20} height={14} rx={2} fill="#fff" stroke="#999" />
                <text x={10} y={11} textAnchor="middle" fontSize={9} fill="#333">{it.c.delicate ? '✋' : it.c.tone === 'white' ? '60' : it.c.tone === 'dark' ? '30' : '40'}</text>
              </g>
            </g>
          )
        })}
      </svg>
    </GameShell>
  )
}
