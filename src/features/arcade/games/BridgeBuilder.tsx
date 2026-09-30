import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Bridge Builder: two islands want to trade. Click a dot, then another dot
 * within reach, to lay a plank between them (planks join at their ends, and
 * new dots appear where they meet the grid). Press Test and a heavy cart rolls
 * across. Triangles hold; flat spans sag and snap. Fewer planks, more
 * reward. Three gaps.
 */
const W = 820, H = 480, G = 40
const LEVELS = [
  { gap: [240, 560], budget: 12 },
  { gap: [200, 600], budget: 15 },
  { gap: [160, 660], budget: 19 },
]
const DECK = 280 // road height
const MAXLEN = 125
type Node = { x: number; y: number; fixed: boolean }
type Plank = { a: number; b: number }

export default function BridgeBuilder() {
  const [best, submit] = useBest('bridge')
  const [level, setLevel] = useState(0)
  const [nodes, setNodes] = useState<Node[]>([])
  const [planks, setPlanks] = useState<Plank[]>([])
  const [sel, setSel] = useState<number | null>(null)
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState('Build from the cliff edges. Triangles are strong.')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const sim = useRef<{ e: Matter.Engine; nodeBodies: Matter.Body[]; plankBodies: (Matter.Body | null)[]; cart: Matter.Body; wheels: Matter.Body[]; t: number } | null>(null)
  const [, frame] = useState(0)
  const st = useRef({ score: 0, used: 0, crossed: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const setup = useCallback((l: number) => {
    const [a, b] = LEVELS[l].gap
    setNodes([{ x: a, y: DECK, fixed: true }, { x: a, y: DECK + 80, fixed: true }, { x: b, y: DECK, fixed: true }, { x: b, y: DECK + 80, fixed: true }])
    setPlanks([]); setSel(null); setTesting(false); setLevel(l)
    setMsg('Build from the cliff edges. Triangles are strong.')
  }, [])
  useEffect(() => { st.current = { score: 0, used: 0, crossed: 0 }; setScore(0); setup(0) }, [round, setup])

  const snap = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: Math.round(p.x / G) * G, y: Math.round(p.y / G) * G }
  }
  const click = (e: React.PointerEvent) => {
    if (testing || result) return
    const p = snap(e)
    const [ga, gb] = LEVELS[level].gap
    if (p.x < ga || p.x > gb || p.y < 120 || p.y > 420) return
    let idx = nodes.findIndex((n) => n.x === p.x && n.y === p.y)
    if (sel === null) { if (idx >= 0) setSel(idx); else setMsg('Start from an existing dot.'); return }
    const from = nodes[sel]
    const len = Math.hypot(p.x - from.x, p.y - from.y)
    if (len === 0) { setSel(null); return }
    if (len > MAXLEN) { setMsg('Too long for one plank.'); return }
    if (planks.length >= LEVELS[level].budget) { setMsg('Out of planks — press Test!'); return }
    if (idx < 0) { const ns = [...nodes, { x: p.x, y: p.y, fixed: false }]; idx = ns.length - 1; setNodes(ns) }
    if (!planks.some((k) => (k.a === sel && k.b === idx) || (k.a === idx && k.b === sel))) setPlanks([...planks, { a: sel, b: idx }])
    setSel(idx)
  }

  const test = () => {
    if (testing) return
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    e.constraintIterations = 6
    const [ga, gb] = LEVELS[level].gap
    const ground = [Matter.Bodies.rectangle(ga / 2 - 20, DECK + 150, ga + 40, 300, { isStatic: true, friction: 1 }), Matter.Bodies.rectangle(gb + (W - gb) / 2 + 20, DECK + 150, W - gb + 40, 300, { isStatic: true, friction: 1 })]
    const nodeBodies = nodes.map((n) => Matter.Bodies.circle(n.x, n.y, 5, { isStatic: n.fixed, density: 0.004, collisionFilter: { group: -1 } }))
    const plankBodies: (Matter.Body | null)[] = []
    const cons: Matter.Constraint[] = []
    planks.forEach((k) => {
      const A = nodes[k.a], B = nodes[k.b]
      const len = Math.hypot(B.x - A.x, B.y - A.y)
      const body = Matter.Bodies.rectangle((A.x + B.x) / 2, (A.y + B.y) / 2, len, 8, { angle: Math.atan2(B.y - A.y, B.x - A.x), density: 0.0012, friction: 0.9, collisionFilter: { group: -1 } })
      plankBodies.push(body)
      cons.push(Matter.Constraint.create({ bodyA: body, pointA: { x: -Math.cos(body.angle) * len / 2, y: -Math.sin(body.angle) * len / 2 }, bodyB: nodeBodies[k.a], stiffness: 1, length: 0 }))
      cons.push(Matter.Constraint.create({ bodyA: body, pointA: { x: Math.cos(body.angle) * len / 2, y: Math.sin(body.angle) * len / 2 }, bodyB: nodeBodies[k.b], stiffness: 1, length: 0 }))
    })
    // The cart: a heavy box on two wheels, sitting on the left cliff.
    const cart = Matter.Bodies.rectangle(ga - 80, DECK - 36, 60, 26, { density: 0.006 })
    const wheels = [Matter.Bodies.circle(ga - 100, DECK - 16, 12, { friction: 1, density: 0.003 }), Matter.Bodies.circle(ga - 60, DECK - 16, 12, { friction: 1, density: 0.003 })]
    const axles = wheels.map((w, i) => Matter.Constraint.create({ bodyA: cart, pointA: { x: i ? 20 : -20, y: 12 }, bodyB: w, stiffness: 0.9, length: 0 }))
    Matter.Composite.add(e.world, [...ground, ...nodeBodies, ...plankBodies.filter(Boolean) as Matter.Body[], ...cons, cart, ...wheels, ...axles])
    sim.current = { e, nodeBodies, plankBodies, cart, wheels, t: 0 }
    setTesting(true); setMsg('Here it comes…')
    const used = planks.length
    let raf = 0, last = performance.now()
    const loop = (now: number) => {
      const s = sim.current
      if (!s) return
      const dt = Math.min(20, now - last); last = now
      s.t += dt
      wheels.forEach((w) => Matter.Body.setAngularVelocity(w, 0.18)); Matter.Body.applyForce(cart, cart.position, { x: 0.0025, y: 0 })
      Matter.Engine.update(e, dt)
      // Planks snap if their joints stretch too far.
      for (const c of [...cons]) {
        if (!c.bodyA || !c.bodyB) continue
        const d = Matter.Vector.magnitude(Matter.Vector.sub(Matter.Constraint.pointAWorld(c), c.bodyB.position))
        if (d > 14) { Matter.Composite.remove(e.world, c); cons.splice(cons.indexOf(c), 1) }
      }
      frame((n) => n + 1)
      const crossed = cart.position.x > gb + 40 && cart.position.y < DECK + 20
      const fell = cart.position.y > H + 60
      if (crossed || fell || s.t > 14000) {
        cancelAnimationFrame(raf)
        const stt = st.current
        if (crossed) {
          const pts = 50 + (LEVELS[level].budget - used) * 10
          stt.score += pts; stt.crossed++; stt.used += used; setScore(stt.score)
          setMsg(`It made it! +${pts}`)
          setTimeout(() => {
            sim.current = null
            if (level >= LEVELS.length - 1) { const record = submitRef.current(stt.score); setResult({ headline: 'Trade route open!', lines: [`${stt.crossed} of ${LEVELS.length} gaps bridged`, `${stt.used} planks used`, `Score ${stt.score}`], record }) }
            else setup(level + 1)
          }, 1300)
        } else {
          setMsg(fell ? 'Splash! Tweak your bridge and test again.' : 'Stuck — maybe a gentler slope?')
          setTimeout(() => { sim.current = null; setTesting(false) }, 1300)
        }
        return
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
  }

  const undo = () => { if (!testing) { setPlanks(planks.slice(0, -1)); setSel(null) } }
  const restart = useCallback(() => { sim.current = null; setResult(null); setRound((r) => r + 1) }, [])
  const L = LEVELS[level]
  const s = sim.current
  return (
    <GameShell title="Bridge Builder" score={score} best={best} result={result} onRestart={restart}
      hint={`Gap ${level + 1}/${LEVELS.length} · planks ${planks.length}/${L.budget} · ${msg}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerDown={click} onPointerMove={(e) => setHover(snap(e))} role="img" aria-label="Bridge over a gap" style={{ touchAction: 'none' }}>
        <defs><linearGradient id="bb-sky" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#bae6fd" /><stop offset="1" stopColor="#e0f2fe" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#bb-sky)" />
        <path d={`M0 ${H - 40} q ${W / 4} -20 ${W / 2} 0 t ${W / 2} 0 V ${H} H 0 Z`} fill="#38bdf8" />
        <rect x={0} y={DECK} width={L.gap[0]} height={H - DECK} fill="#65a30d" />
        <rect x={L.gap[1]} y={DECK} width={W - L.gap[1]} height={H - DECK} fill="#65a30d" />
        <rect x={0} y={DECK} width={L.gap[0]} height={10} fill="#4d7c0f" /><rect x={L.gap[1]} y={DECK} width={W - L.gap[1]} height={10} fill="#4d7c0f" />
        {!testing && Array.from({ length: Math.floor((L.gap[1] - L.gap[0]) / G) + 1 }, (_, i) => Array.from({ length: 8 }, (_, j) => <circle key={`${i}-${j}`} cx={L.gap[0] + i * G} cy={120 + j * G} r={2} fill="#0369a1" opacity={0.25} />))}
        {!testing && sel !== null && hover && <line x1={nodes[sel].x} y1={nodes[sel].y} x2={hover.x} y2={hover.y} stroke={Math.hypot(hover.x - nodes[sel].x, hover.y - nodes[sel].y) > MAXLEN ? '#ef4444' : '#a16207'} strokeWidth={6} strokeDasharray="6 6" opacity={0.6} />}
        {s ? (
          <>
            {s.plankBodies.map((b, i) => b && <line key={i} x1={b.vertices[0].x / 2 + b.vertices[3].x / 2} y1={b.vertices[0].y / 2 + b.vertices[3].y / 2} x2={b.vertices[1].x / 2 + b.vertices[2].x / 2} y2={b.vertices[1].y / 2 + b.vertices[2].y / 2} stroke="#a16207" strokeWidth={8} strokeLinecap="round" />)}
            {s.nodeBodies.map((b, i) => <circle key={i} cx={b.position.x} cy={b.position.y} r={6} fill="#78350f" />)}
            <g transform={`translate(${s.cart.position.x} ${s.cart.position.y}) rotate(${(s.cart.angle * 180) / Math.PI})`}><rect x={-30} y={-13} width={60} height={26} rx={5} fill="#dc2626" /><text y={5} textAnchor="middle" fontSize={14}>📦</text></g>
            {s.wheels.map((w, i) => <circle key={i} cx={w.position.x} cy={w.position.y} r={12} fill="#1f2937" />)}
          </>
        ) : (
          <>
            {planks.map((k, i) => <line key={i} x1={nodes[k.a].x} y1={nodes[k.a].y} x2={nodes[k.b].x} y2={nodes[k.b].y} stroke="#a16207" strokeWidth={8} strokeLinecap="round" />)}
            {nodes.map((n, i) => <circle key={i} cx={n.x} cy={n.y} r={sel === i ? 10 : 7} fill={n.fixed ? '#1f2937' : '#78350f'} stroke={sel === i ? '#f59e0b' : 'none'} strokeWidth={3} />)}
            <g transform={`translate(${L.gap[0] - 80} ${DECK - 36})`}><rect x={-30} y={-13} width={60} height={26} rx={5} fill="#dc2626" /><circle cx={-20} cy={20} r={12} fill="#1f2937" /><circle cx={20} cy={20} r={12} fill="#1f2937" /></g>
          </>
        )}
      </svg>
      <div className="cf-tray">
        <button type="button" disabled={testing || !planks.length} onClick={undo}>↶ Undo plank</button>
        <button type="button" className="cf-match" disabled={testing || !planks.length} onClick={test}>▶ Test the bridge</button>
      </div>
    </GameShell>
  )
}
