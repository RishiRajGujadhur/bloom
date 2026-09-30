import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Coin Cascade: a month's pay arrives as 32 coins. Drop them through a peg
 * board into four jars. Two jars have bills that fall due partway through the
 * month; the Later jar grows a little every week it holds coins.
 */
const W = 640, H = 560
const JARS = [
  { id: 'home', label: 'Home', need: 9, due: 16, color: '#4f8df5' },
  { id: 'food', label: 'Food', need: 6, due: 24, color: '#46b37a' },
  { id: 'fun', label: 'Fun', need: 0, due: 0, color: '#f0a132' },
  { id: 'later', label: 'Later', need: 0, due: 0, color: '#b565d9' },
] as const
const COINS = 32
const JAR_W = W / 4
const JAR_TOP = 440

type Result = { headline: string; lines: string[]; record: boolean } | null

export default function CoinCascade() {
  const [best, submit] = useBest('coins')
  const [left, setLeft] = useState(COINS)
  const [counts, setCounts] = useState<Record<string, number>>({ home: 0, food: 0, fun: 0, later: 0 })
  const [paid, setPaid] = useState<Record<string, boolean | null>>({ home: null, food: null })
  const [later, setLater] = useState(0)
  const [x, setX] = useState(W / 2)
  const [result, setResult] = useState<Result>(null)
  const [round, setRound] = useState(0)
  const [coins, setCoins] = useState<{ id: number; body: Matter.Body }[]>([])
  const engine = useRef<Matter.Engine | null>(null)
  const nodes = useRef(new Map<number, SVGGElement>())
  const svg = useRef<SVGSVGElement>(null)
  const counted = useRef(new Set<number>())
  const state = useRef({ counts: { home: 0, food: 0, fun: 0, later: 0 } as Record<string, number>, dropped: 0, laterBonus: 0 })
  const toast = useRef<SVGTextElement>(null)

  const flash = (msg: string, color: string) => {
    const t = toast.current
    if (!t) return
    t.textContent = msg
    t.setAttribute('fill', color)
    if (reducedMotion()) return
    gsap.fromTo(t, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3 })
    gsap.to(t, { opacity: 0, delay: 1.6, duration: 0.4 })
  }

  useEffect(() => {
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    engine.current = e
    const st = { isStatic: true, restitution: 0.4, friction: 0.02 }
    const pegs: Matter.Body[] = []
    for (let r = 0; r < 7; r++) for (let c = 0; c < 11; c++) {
      const px = 40 + c * 56 + (r % 2 ? 28 : 0)
      if (px > W - 20) continue
      pegs.push(Matter.Bodies.circle(px, 110 + r * 44, 6, { ...st, label: 'peg' }))
    }
    const walls = [
      Matter.Bodies.rectangle(-10, H / 2, 20, H, st), Matter.Bodies.rectangle(W + 10, H / 2, 20, H, st),
      Matter.Bodies.rectangle(W / 2, H + 10, W, 20, st),
      ...[1, 2, 3].map((i) => Matter.Bodies.rectangle(i * JAR_W, JAR_TOP + 60, 8, 120, st)),
    ]
    Matter.Composite.add(e.world, [...pegs, ...walls])
    let raf = 0
    let last = performance.now()
    const loop = (t: number) => {
      Matter.Engine.update(e, Math.min(32, t - last))
      last = t
      for (const b of Matter.Composite.allBodies(e.world)) {
        if (b.isStatic) continue
        const n = nodes.current.get(b.id)
        if (n) n.setAttribute('transform', `translate(${b.position.x} ${b.position.y})`)
        if (!counted.current.has(b.id) && b.position.y > JAR_TOP + 10) {
          counted.current.add(b.id)
          const jar = JARS[Math.min(3, Math.max(0, Math.floor(b.position.x / JAR_W)))]
          state.current.counts[jar.id]++
          setCounts({ ...state.current.counts })
          if (n && !reducedMotion()) gsap.fromTo(n, { scale: 1.6 }, { scale: 1, duration: 0.4, transformOrigin: '50% 50%' })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const end = useCallback(() => {
    const c = state.current.counts
    const home = c.home >= 9, food = c.food >= 6
    const saved = c.later + state.current.laterBonus
    const s = (home ? 40 : 0) + (food ? 30 : 0) + Math.round(saved * 4) + Math.min(c.fun, 6) * 3
    const record = submit(s)
    setResult({
      headline: home && food ? 'Month made!' : 'Tight month',
      lines: [
        `Home ${home ? 'paid' : 'short'} · Food ${food ? 'paid' : 'short'}`,
        `Later jar: ${saved.toFixed(1)} coins (${state.current.laterBonus.toFixed(1)} grew on its own)`,
        `Fun: ${c.fun} coins${c.fun > 6 ? ' — the extra fun didn’t add much' : ''}`,
        `Score ${s}`,
      ],
      record,
    })
  }, [submit])

  const drop = () => {
    if (!left || result || !engine.current) return
    const b = Matter.Bodies.circle(x + (Math.random() - 0.5) * 4, 40, 11, { restitution: 0.35, friction: 0.01, density: 0.004 })
    Matter.Composite.add(engine.current.world, b)
    setCoins((cs) => [...cs, { id: b.id, body: b }])
    const dropped = ++state.current.dropped
    setLeft(COINS - dropped)
    // A "week" passes every 8 coins: Later grows 10%.
    if (dropped % 8 === 0) {
      const c = state.current.counts
      const g = (c.later + state.current.laterBonus) * 0.1
      if (g > 0) { state.current.laterBonus += g; setLater(state.current.laterBonus); flash(`Later grew +${g.toFixed(1)}`, '#b565d9') }
    }
    for (const j of JARS) if (j.due && dropped === j.due) {
      setTimeout(() => {
        const ok = state.current.counts[j.id] >= j.need
        setPaid((p) => ({ ...p, [j.id]: ok }))
        flash(ok ? `${j.label} bill paid ✓` : `${j.label} bill due — short!`, ok ? '#2e9d62' : '#e24a4a')
      }, 1400)
    }
    if (dropped === COINS) setTimeout(end, 2600)
  }

  const restart = useCallback(() => {
    state.current = { counts: { home: 0, food: 0, fun: 0, later: 0 }, dropped: 0, laterBonus: 0 }
    counted.current.clear(); nodes.current.clear()
    setCoins([]); setCounts({ home: 0, food: 0, fun: 0, later: 0 }); setPaid({ home: null, food: null }); setLater(0); setLeft(COINS); setResult(null); setRound((r) => r + 1)
  }, [])

  const move = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    if (m) setX(Math.min(W - 14, Math.max(14, new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()).x)))
  }
  const score = (counts.home >= 9 ? 40 : 0) + (counts.food >= 6 ? 30 : 0) + Math.round((counts.later + later) * 4) + Math.min(counts.fun, 6) * 3
  return (
    <GameShell title="Coin Cascade" score={score} best={best} result={result} onRestart={restart}
      hint={`Click to drop a coin · ${left} left this month · bills: Home 9 by coin 16, Food 6 by coin 24`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onClick={drop} role="img" aria-label="Peg board and jars">
        <defs>
          <radialGradient id="cc-coin"><stop offset="0" stopColor="#fff3b0" /><stop offset=".6" stopColor="#f5c542" /><stop offset="1" stopColor="#c8901a" /></radialGradient>
        </defs>
        {Array.from({ length: 7 }, (_, r) => Array.from({ length: 11 }, (_, c) => {
          const px = 40 + c * 56 + (r % 2 ? 28 : 0)
          return px > W - 20 ? null : <circle key={`${r}-${c}`} cx={px} cy={110 + r * 44} r={6} fill="currentColor" opacity={0.35} />
        }))}
        {JARS.map((j, i) => {
          const n = counts[j.id]
          const fill = Math.min(1, n / (j.need || 10))
          return (
            <g key={j.id} transform={`translate(${i * JAR_W} ${JAR_TOP})`}>
              <rect x={10} y={4} width={JAR_W - 20} height={112} rx={14} fill={j.color} opacity={0.12} />
              <rect x={10} y={4 + 112 * (1 - fill)} width={JAR_W - 20} height={112 * fill} rx={14} fill={j.color} opacity={0.35} style={{ transition: 'all .4s' }} />
              <text x={JAR_W / 2} y={-8} textAnchor="middle" fontWeight={700} fill={j.color}>{j.label}</text>
              <text x={JAR_W / 2} y={60} textAnchor="middle" fontSize={22} fontWeight={800} fill="currentColor">
                {j.id === 'later' ? (n + later).toFixed(1) : n}{j.need ? `/${j.need}` : ''}
              </text>
              {j.due > 0 && (
                <text x={JAR_W / 2} y={84} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.7}>
                  {paid[j.id] == null ? `due at coin ${j.due}` : paid[j.id] ? 'paid ✓' : 'missed ✗'}
                </text>
              )}
              {j.id === 'later' && <text x={JAR_W / 2} y={84} textAnchor="middle" fontSize={12} fill="currentColor" opacity={0.7}>grows weekly</text>}
            </g>
          )
        })}
        {coins.map((c) => (
          <g key={`${round}-${c.id}`} ref={(n) => { if (n) nodes.current.set(c.id, n); else nodes.current.delete(c.id) }}>
            <circle r={11} fill="url(#cc-coin)" stroke="#a87412" strokeWidth={1.5} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="#8a5c08">1</text>
          </g>
        ))}
        {left > 0 && !result && (
          <g transform={`translate(${x} 40)`} pointerEvents="none">
            <circle r={11} fill="url(#cc-coin)" opacity={0.7} />
            <line y1={14} y2={60} stroke="currentColor" strokeDasharray="2 5" opacity={0.3} />
          </g>
        )}
        <g transform="translate(20 22)">
          {Array.from({ length: COINS }, (_, i) => <circle key={i} cx={i * 18.5} cy={0} r={6} fill={i < COINS - left ? 'currentColor' : '#f5c542'} opacity={i < COINS - left ? 0.15 : 1} />)}
        </g>
        <text ref={toast} x={W / 2} y={82} textAnchor="middle" fontSize={20} fontWeight={800} opacity={0} />
      </svg>
    </GameShell>
  )
}
