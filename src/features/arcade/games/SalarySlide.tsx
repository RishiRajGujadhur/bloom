import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Salary Slide: payday! A river of coins pours down a slide into four
 * buckets — Rent, Food, Fun and Savings. Drag the gates between buckets to
 * change how the flow splits. Surprise bills arrive during the month; if a
 * bucket can't cover what's due, it spills. Six months.
 */
const W = 800, H = 480
const BUCKETS = [
  { id: 'rent', label: 'Rent', color: '#6366f1' }, { id: 'food', label: 'Food', color: '#10b981' },
  { id: 'fun', label: 'Fun', color: '#f59e0b' }, { id: 'save', label: 'Savings', color: '#ec4899' },
] as const
type Id = typeof BUCKETS[number]['id']
const MONTHS = 6
const PAY = 100
const NEEDS: Record<Id, number> = { rent: 40, food: 22, fun: 0, save: 0 }
const SURPRISES = [{ text: 'Dentist bill', from: 'save' as Id, amt: 12 }, { text: 'Friend’s birthday', from: 'fun' as Id, amt: 8 }, { text: 'Bike repair', from: 'save' as Id, amt: 15 }, { text: 'Big food shop', from: 'food' as Id, amt: 6 }, { text: 'Concert tickets', from: 'fun' as Id, amt: 10 }, { text: 'Boiler fix', from: 'save' as Id, amt: 20 }]

export default function SalarySlide() {
  const [best, submit] = useBest('salary')
  const [gates, setGates] = useState([0.38, 0.62, 0.8]) // cumulative split points along the width
  const [fill, setFill] = useState<Record<Id, number>>({ rent: 0, food: 0, fun: 0, save: 0 })
  const [month, setMonth] = useState(1)
  const [phase, setPhase] = useState<'plan' | 'pour' | 'bills'>('plan')
  const [log, setLog] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const coins = useRef<SVGGElement>(null)
  const drag = useRef<number | null>(null)
  const st = useRef({ score: 0, saved: 0, spills: 0, happy: 0, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, saved: 0, spills: 0, happy: 0, lines: [] }; setFill({ rent: 0, food: 0, fun: 0, save: 0 }); setMonth(1); setPhase('plan'); setLog([]); setScore(0); setGates([0.38, 0.62, 0.8]) }, [round])

  const shares = (): Record<Id, number> => ({ rent: gates[0], food: gates[1] - gates[0], fun: gates[2] - gates[1], save: 1 - gates[2] })
  const X0 = 60, XW = 680
  const pour = () => {
    if (phase !== 'plan') return
    setPhase('pour')
    const sh = shares()
    const g = coins.current
    const done = () => {
      const next = { ...fill }
      ;(Object.keys(sh) as Id[]).forEach((k) => { next[k] = Math.round((next[k] + sh[k] * PAY) * 10) / 10 })
      // Monthly needs and a surprise.
      const s = st.current
      const lines: string[] = []
      ;(Object.keys(NEEDS) as Id[]).forEach((k) => { if (NEEDS[k]) { if (next[k] >= NEEDS[k]) next[k] -= NEEDS[k]; else { s.spills++; lines.push(`${k === 'rent' ? 'Rent' : 'Food'} came up short! 😬`); next[k] = 0 } } })
      const sur = SURPRISES[(month - 1) % SURPRISES.length]
      if (next[sur.from] >= sur.amt) { next[sur.from] -= sur.amt; lines.push(`${sur.text}: covered from ${sur.from === 'save' ? 'Savings' : sur.from === 'fun' ? 'Fun' : 'Food'} ✓`) }
      else { s.spills++; lines.push(`${sur.text}: couldn’t cover it 😬`) }
      const funSpent = Math.min(next.fun, 12); next.fun -= funSpent; if (funSpent >= 8) s.happy++
      setFill(next); setPhase('bills'); setLog(lines)
      const pts = lines.filter((l) => l.includes('✓')).length * 10 - lines.filter((l) => l.includes('😬')).length * 15 + (funSpent >= 8 ? 8 : 0)
      s.score = Math.max(0, s.score + pts); setScore(s.score)
      s.lines.push(`Month ${month}: ${lines.join(' ')}`)
      setTimeout(() => {
        if (month >= MONTHS) {
          s.score += Math.round(next.save)
          const record = submitRef.current(s.score)
          setResult({ headline: s.spills ? 'Made it through… just' : 'Money on autopilot 💸', lines: [`Savings at the end: ${Math.round(next.save)}`, `${s.spills} times something came up short`, `${s.happy} fun months`, `Score ${s.score}`], record })
        } else { setMonth(month + 1); setPhase('plan') }
      }, 1800)
    }
    if (!g || reducedMotion()) { done(); return }
    g.replaceChildren()
    const tl = gsap.timeline({ onComplete: done })
    for (let i = 0; i < 40; i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      c.setAttribute('r', '7'); c.setAttribute('fill', '#facc15'); c.setAttribute('stroke', '#a16207'); c.setAttribute('cx', '400'); c.setAttribute('cy', '30')
      g.appendChild(c)
      const u = (i + 0.5) / 40
      tl.to(c, { attr: { cx: X0 + u * XW, cy: 330 }, duration: 0.7, ease: 'power2.in' }, i * 0.035)
      tl.to(c, { opacity: 0, duration: 0.15 }, i * 0.035 + 0.7)
    }
  }
  const move = (e: React.PointerEvent) => {
    if (drag.current === null || phase !== 'plan') return
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const u = Math.max(0.02, Math.min(0.98, (p.x - X0) / XW))
    setGates((gs) => { const n = [...gs]; const i = drag.current!; n[i] = Math.max(i ? n[i - 1] + 0.03 : 0.03, Math.min(i < 2 ? n[i + 1] - 0.03 : 0.97, u)); return n })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const edges = [0, ...gates, 1]
  const sh = shares()
  return (
    <GameShell title="Salary Slide" score={score} best={best} result={result} onRestart={restart}
      hint={`Month ${month}/${MONTHS} · drag the gates to split pay (rent needs ${NEEDS.rent}, food ${NEEDS.food}) · ${phase === 'plan' ? 'then pour!' : log.join(' · ')}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }} role="img" aria-label="Salary slide and buckets" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#f5f3ff" />
        <path d="M340 10 h120 l-30 40 h-60 z" fill="#facc15" stroke="#a16207" strokeWidth={3} />
        <text x={400} y={34} textAnchor="middle" fontSize={14} fontWeight={900} fill="#713f12">PAYDAY {PAY}</text>
        <path d={`M370 50 L${X0} 300 L${X0 + XW} 300 L430 50 Z`} fill="#e0e7ff" opacity={0.7} />
        {BUCKETS.map((b, i) => {
          const x0 = X0 + edges[i] * XW, x1 = X0 + edges[i + 1] * XW
          const lvl = Math.min(1, fill[b.id] / 60)
          return (
            <g key={b.id}>
              <path d={`M${x0 + 4} 320 L${x1 - 4} 320 L${x1 - 12} 440 L${x0 + 12} 440 Z`} fill="#fff" stroke={b.color} strokeWidth={3} />
              <path d={`M${x0 + 12 + (1 - lvl) * 0} ${440 - lvl * 118} L${x1 - 12} ${440 - lvl * 118} L${x1 - 12} 440 L${x0 + 12} 440 Z`} fill={b.color} opacity={0.5} />
              <text x={(x0 + x1) / 2} y={356} textAnchor="middle" fontSize={13} fontWeight={800} fill={b.color}>{b.label}</text>
              <text x={(x0 + x1) / 2} y={378} textAnchor="middle" fontSize={12} fill="#475569">{Math.round(sh[b.id] * 100)}% · {Math.round(fill[b.id])}</text>
            </g>
          )
        })}
        {gates.map((gv, i) => (
          <g key={i} onPointerDown={() => { drag.current = i }} style={{ cursor: phase === 'plan' ? 'ew-resize' : 'default' }}>
            <line x1={X0 + gv * XW} y1={290} x2={X0 + gv * XW} y2={446} stroke="#334155" strokeWidth={6} strokeLinecap="round" />
            <circle cx={X0 + gv * XW} cy={296} r={12} fill="#334155" />
            <path d={`M${X0 + gv * XW - 5} 296 h10 M${X0 + gv * XW - 5} 292 l-4 4 4 4 M${X0 + gv * XW + 5} 292 l4 4 -4 4`} stroke="#fff" strokeWidth={1.5} fill="none" />
          </g>
        ))}
        <g ref={coins} pointerEvents="none" />
        <g transform="translate(620 20)" onPointerDown={pour} style={{ cursor: phase === 'plan' ? 'pointer' : 'default' }} opacity={phase === 'plan' ? 1 : 0.4}>
          <rect width={150} height={44} rx={22} fill="#7c3aed" />
          <text x={75} y={28} textAnchor="middle" fontWeight={800} fill="#fff">💰 Pour the pay</text>
        </g>
      </svg>
    </GameShell>
  )
}
