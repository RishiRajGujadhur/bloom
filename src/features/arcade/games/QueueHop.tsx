import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Queue Hop: five tills, five queues. Glance at the trolleys — how full each
 * basket is matters more than how many people are waiting — and tap the till
 * you think will be quickest. Then watch it play out. Eight shopping trips.
 */
const W = 800, H = 460
const TRIPS = 8
type Lane = { people: number[]; speed: number; express: boolean }

const makeLanes = (): Lane[] => Array.from({ length: 5 }, (_, i) => ({
  people: Array.from({ length: 1 + Math.floor(Math.random() * 5) }, () => 1 + Math.floor(Math.random() * 12)),
  speed: i === 4 ? 1.4 : 0.8 + Math.random() * 0.5,
  express: i === 4,
}))
const laneTime = (l: Lane) => l.people.reduce((n, items) => n + 4 + items * 1.1, 0) / l.speed

export default function QueueHop() {
  const [best, submit] = useBest('queue')
  const [lanes, setLanes] = useState<Lane[]>(makeLanes)
  const [trip, setTrip] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState('Which till will be fastest?')
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const bars = useRef<(SVGRectElement | null)[]>([])
  const st = useRef({ score: 0, best: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, best: 0 }; setLanes(makeLanes()); setTrip(0); setPicked(null); setScore(0); setMsg('Which till will be fastest?') }, [round])

  const pick = (i: number) => {
    if (picked !== null) return
    setPicked(i)
    const times = lanes.map(laneTime)
    const fastest = Math.min(...times)
    const rank = [...times].sort((a, b) => a - b).indexOf(times[i])
    const s = st.current
    const pts = [20, 12, 6, 2, 0][rank]
    s.score += pts; if (rank === 0) s.best++
    setScore(s.score)
    setMsg(rank === 0 ? 'Fastest till! 🏃' : `You waited ${Math.round(times[i] - fastest)}s longer than the quickest till.`)
    const max = Math.max(...times)
    bars.current.forEach((b, k) => { if (b) gsap.fromTo(b, { attr: { width: 0 } }, { attr: { width: (times[k] / max) * 140 }, duration: reducedMotion() ? 0 : 1.2, ease: 'power1.out' }) })
    setTimeout(() => {
      if (trip + 1 >= TRIPS) {
        const record = submitRef.current(s.score)
        setResult({ headline: 'Shopping done', lines: [`Picked the fastest till ${s.best} of ${TRIPS} times`, `Score ${s.score}`], record })
      } else { setTrip(trip + 1); setLanes(makeLanes()); setPicked(null); setMsg('Which till will be fastest?') }
    }, 2200)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Queue Hop" score={score} best={best} result={result} onRestart={restart}
      hint={`Trip ${trip + 1}/${TRIPS} · look at how full the trolleys are, not just the queue · ${msg}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Supermarket tills">
        <rect width={W} height={H} fill="#f8fafc" />
        {lanes.map((l, i) => {
          const x = 70 + i * 150
          return (
            <g key={`${trip}-${i}`} onPointerDown={() => pick(i)} style={{ cursor: picked === null ? 'pointer' : 'default' }}>
              <rect x={x - 55} y={20} width={110} height={420} rx={10} fill={picked === i ? '#dbeafe' : '#fff'} stroke={picked === i ? '#2563eb' : '#e2e8f0'} strokeWidth={3} />
              <rect x={x - 40} y={40} width={80} height={36} rx={6} fill={l.express ? '#16a34a' : '#475569'} />
              <text x={x} y={63} textAnchor="middle" fontSize={12} fontWeight={800} fill="#fff">{l.express ? 'EXPRESS' : `Till ${i + 1}`}</text>
              <text x={x} y={96} textAnchor="middle" fontSize={11} fill="#64748b">{l.speed > 1.15 ? 'speedy cashier' : l.speed < 0.95 ? 'chatty cashier' : 'steady cashier'}</text>
              {l.people.map((items, k) => (
                <g key={k} transform={`translate(${x} ${130 + k * 60})`}>
                  <text x={-22} y={10} fontSize={26}>🧍</text>
                  <rect x={4} y={-10} width={34} height={24} rx={3} fill="none" stroke="#94a3b8" strokeWidth={2} />
                  {Array.from({ length: Math.min(12, items) }, (_, j) => <rect key={j} x={7 + (j % 4) * 7.5} y={9 - Math.floor(j / 4) * 7} width={6} height={6} fill={['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'][j % 4]} />)}
                </g>
              ))}
              {picked !== null && <rect ref={(el) => { bars.current[i] = el }} x={x - 70} y={430} width={0} height={8} rx={4} fill={picked === i ? '#2563eb' : '#94a3b8'} />}
            </g>
          )
        })}
      </svg>
    </GameShell>
  )
}
