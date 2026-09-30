import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Memory Market: your friend shouts the shopping list across the square, one
 * item at a time — then the list blows away. Stroll the stalls and tap what
 * was on it. Tricks help: picture the items in a silly scene. Lists get
 * longer each trip.
 */
const GOODS = ['🍎', '🍌', '🥕', '🧀', '🥖', '🥚', '🍅', '🥦', '🍋', '🧅', '🍇', '🥔', '🌽', '🍄', '🥒', '🍓', '🥑', '🍐', '🥜', '🍯', '🧄', '🍒', '🥛', '🍞']
const NAMES: Record<string, string> = { '🍎': 'apples', '🍌': 'bananas', '🥕': 'carrots', '🧀': 'cheese', '🥖': 'baguette', '🥚': 'eggs', '🍅': 'tomatoes', '🥦': 'broccoli', '🍋': 'lemons', '🧅': 'onions', '🍇': 'grapes', '🥔': 'potatoes', '🌽': 'corn', '🍄': 'mushrooms', '🥒': 'cucumber', '🍓': 'strawberries', '🥑': 'avocado', '🍐': 'pears', '🥜': 'peanuts', '🍯': 'honey', '🧄': 'garlic', '🍒': 'cherries', '🥛': 'milk', '🍞': 'bread' }
const TRIPS = [3, 4, 5, 6, 7, 8]
const W = 800, H = 470

export default function MemoryMarket() {
  const [best, submit] = useBest('market')
  const [trip, setTrip] = useState(0)
  const [phase, setPhase] = useState<'listen' | 'shop'>('listen')
  const [list, setList] = useState<string[]>([])
  const [shown, setShown] = useState(-1)
  const [stall, setStall] = useState<string[]>([])
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ score: 0, right: 0, wrong: 0, forgot: 0 })
  const bubble = useRef<SVGGElement>(null)
  const grid = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const startTrip = useCallback((t: number) => {
    const n = TRIPS[t]
    const shuffled = [...GOODS].sort(() => Math.random() - 0.5)
    const l = shuffled.slice(0, n)
    const decoys = shuffled.slice(n, n + Math.min(16 - n, 12))
    setList(l); setStall([...l, ...decoys].sort(() => Math.random() - 0.5)); setPicked(new Set()); setShown(-1); setPhase('listen'); setTrip(t)
    let i = 0
    const tick = () => {
      if (i < l.length) { setShown(i); i++; timer = window.setTimeout(tick, 1100) } else { setShown(-1); setPhase('shop') }
    }
    let timer = window.setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    st.current = { score: 0, right: 0, wrong: 0, forgot: 0 }
    setScore(0)
    return startTrip(0)
  }, [round, startTrip])

  useEffect(() => {
    if (shown < 0 || !bubble.current || reducedMotion()) return
    gsap.fromTo(bubble.current, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)', svgOrigin: '400 120' })
  }, [shown])
  useEffect(() => {
    if (phase !== 'shop' || !grid.current || reducedMotion()) return
    gsap.fromTo(grid.current.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.03, duration: 0.3, ease: 'power2.out' })
  }, [phase, trip])

  const pick = (g: string) => {
    if (phase !== 'shop' || picked.has(g)) return
    const s = st.current
    const next = new Set(picked); next.add(g)
    setPicked(next)
    if (list.includes(g)) { s.right++; s.score += 10 } else { s.wrong++; s.score = Math.max(0, s.score - 5) }
    setScore(s.score)
  }
  const checkout = () => {
    const s = st.current
    const missed = list.filter((g) => !picked.has(g)).length
    s.forgot += missed
    if (!missed) s.score += TRIPS[trip] * 5
    setScore(s.score)
    if (trip >= TRIPS.length - 1) {
      const record = submitRef.current(s.score)
      setResult({ headline: 'Baskets full!', lines: [`${s.right} list items remembered`, `${s.forgot} forgotten`, `${s.wrong} impulse buys`, `Score ${s.score}`], record })
    } else startTrip(trip + 1)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Memory Market" score={score} best={best} result={result} onRestart={restart}
      hint={phase === 'listen' ? `Trip ${trip + 1}/${TRIPS.length}: listen… ${list.length} things to get` : `Tap everything that was on the list, then check out · ${picked.size} in the basket`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Market square">
        <rect width={W} height={H} fill="#fff4e0" />
        {Array.from({ length: 10 }, (_, i) => <path key={i} d={`M${i * 80} 0 h80 v30 q-20 18 -40 0 q-20 18 -40 0z`} fill={i % 2 ? '#e76f51' : '#fefae0'} />)}
        {phase === 'listen' ? (
          <g>
            <circle cx={160} cy={300} r={50} fill="#ffd9b3" />
            <circle cx={145} cy={292} r={5} fill="#333" /><circle cx={175} cy={292} r={5} fill="#333" />
            <ellipse cx={160} cy={318} rx={12} ry={8} fill="#b5543c" />
            <rect x={120} y={350} width={80} height={100} rx={24} fill="#2a9d8f" />
            {shown >= 0 && (
              <g ref={bubble}>
                <path d="M260 60 h280 a24 24 0 0 1 24 24 v80 a24 24 0 0 1 -24 24 h-200 l-60 50 l12 -50 h-32 a24 24 0 0 1 -24 -24 v-80 a24 24 0 0 1 24 -24z" fill="#fff" stroke="#e9c46a" strokeWidth={3} />
                <text x={400} y={140} textAnchor="middle" fontSize={64}>{list[shown]}</text>
                <text x={400} y={176} textAnchor="middle" fontSize={16} fill="#6b4e2e" fontWeight={700}>“…and {NAMES[list[shown]]}!”</text>
              </g>
            )}
            <text x={560} y={420} textAnchor="middle" fontSize={14} fill="#6b4e2e">{shown + 1 > 0 ? `${shown + 1} of ${list.length}` : 'get ready…'}</text>
          </g>
        ) : (
          <g ref={grid}>
            {stall.map((g, i) => {
              const x = 110 + (i % 6) * 100, y = 90 + Math.floor(i / 6) * 110
              const got = picked.has(g)
              const good = list.includes(g)
              return (
                <g key={g} transform={`translate(${x} ${y})`} onPointerDown={() => pick(g)} style={{ cursor: 'pointer' }}>
                  <rect x={-42} y={-42} width={84} height={84} rx={16} fill={got ? (good ? '#bbf7d0' : '#fecaca') : '#ffffff'} stroke="#e9c46a" strokeWidth={3} />
                  <text textAnchor="middle" dominantBaseline="central" fontSize={42}>{g}</text>
                </g>
              )
            })}
            <g transform={`translate(${W - 150} ${H - 60})`} onPointerDown={checkout} style={{ cursor: 'pointer' }}>
              <rect width={130} height={42} rx={21} fill="#e76f51" />
              <text x={65} y={27} textAnchor="middle" fill="#fff" fontWeight={800}>🧺 Check out</text>
            </g>
          </g>
        )}
      </svg>
    </GameShell>
  )
}
