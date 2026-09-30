import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Calendar Blocks: the week is seven tall columns of hours. Blocks drop in one
 * at a time — work, errands, friends, exercise, rest. Tap a day to drop the
 * block there. A full, balanced day (some rest, not all work) glows and
 * clears; a day stacked past the top burns out. Plan the week.
 */
type Kind = 'work' | 'errand' | 'friends' | 'move' | 'rest'
const KINDS: Record<Kind, { label: string; color: string; glyph: string }> = {
  work: { label: 'Work', color: '#3b82f6', glyph: '💼' }, errand: { label: 'Errands', color: '#f59e0b', glyph: '🛒' },
  friends: { label: 'Friends', color: '#ec4899', glyph: '👫' }, move: { label: 'Exercise', color: '#10b981', glyph: '🏃' }, rest: { label: 'Rest', color: '#8b5cf6', glyph: '😌' },
}
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ROWS = 10, CW = 90, RH = 34, GX = 60, GY = 60
const W = 820, H = 470
const BLOCKS = 40
type Block = { kind: Kind; h: number }

const rand = (): Block => {
  const r = Math.random()
  const kind: Kind = r < 0.38 ? 'work' : r < 0.55 ? 'errand' : r < 0.7 ? 'friends' : r < 0.84 ? 'move' : 'rest'
  return { kind, h: kind === 'work' ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2) }
}

export default function CalendarBlocks() {
  const [best, submit] = useBest('calendar')
  const [cols, setCols] = useState<Block[][]>(() => DAYS.map(() => []))
  const [next, setNext] = useState<Block[]>(() => [rand(), rand(), rand()])
  const [left, setLeft] = useState(BLOCKS)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState('Balanced days (with some rest) glow and clear.')
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const colEls = useRef<(SVGGElement | null)[]>([])
  const st = useRef({ score: 0, cleared: 0, burnouts: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, cleared: 0, burnouts: 0 }; setCols(DAYS.map(() => [])); setNext([rand(), rand(), rand()]); setLeft(BLOCKS); setScore(0); setMsg('Balanced days (with some rest) glow and clear.') }, [round])

  const drop = (d: number) => {
    if (result || left <= 0) return
    const b = next[0]
    const s = st.current
    const col = [...cols[d], b]
    const height = col.reduce((n, x) => n + x.h, 0)
    const nextCols = cols.map((c, i) => (i === d ? col : c))
    const el = colEls.current[d]
    if (height > ROWS) {
      s.burnouts++; s.score = Math.max(0, s.score - 25)
      nextCols[d] = []
      setMsg(`${DAYS[d]} burned out — too much in one day.`)
      if (el && !reducedMotion()) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.25)' })
    } else if (height >= 8) {
      const kinds = new Set(col.map((x) => x.kind))
      const work = col.filter((x) => x.kind === 'work').reduce((n, x) => n + x.h, 0)
      const balanced = kinds.has('rest') && kinds.size >= 3 && work <= 6
      if (balanced) {
        s.cleared++; s.score += 40 + kinds.size * 10
        nextCols[d] = []
        setMsg(`${DAYS[d]}: a lovely, balanced day! ✨`)
        if (el && !reducedMotion()) gsap.fromTo(el, { opacity: 0.3 }, { opacity: 1, duration: 0.6 })
      } else setMsg(`${DAYS[d]} is full but lopsided — ${kinds.has('rest') ? 'too much work' : 'no rest yet'}.`)
    }
    setCols(nextCols)
    setScore(s.score)
    setNext([...next.slice(1), rand()])
    const l = left - 1
    setLeft(l)
    if (l <= 0) {
      const partial = nextCols.filter((c) => c.some((x) => x.kind === 'rest')).length
      s.score += partial * 5
      const record = submitRef.current(s.score)
      setTimeout(() => setResult({ headline: 'The week is planned', lines: [`${s.cleared} balanced days`, `${s.burnouts} burnouts`, `Score ${s.score}`], record }), 300)
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const b = next[0]
  return (
    <GameShell title="Calendar Blocks" score={score} best={best} result={result} onRestart={restart}
      hint={`Tap a day to drop the ${KINDS[b.kind].label.toLowerCase()} block (${b.h}h) · ${left} blocks left · ${msg}`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Week planner">
        <rect width={W} height={H} fill="#f8fafc" />
        {DAYS.map((day, d) => {
          const x = GX + d * CW
          let y = GY + ROWS * RH
          return (
            <g key={day} ref={(el) => { colEls.current[d] = el }} onPointerDown={() => drop(d)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={GY} width={CW - 8} height={ROWS * RH} rx={10} fill="#fff" stroke="#e2e8f0" />
              <rect x={x} y={GY} width={CW - 8} height={RH * 2} rx={10} fill="#fee2e2" opacity={0.5} />
              <text x={x + (CW - 8) / 2} y={GY - 12} textAnchor="middle" fontSize={14} fontWeight={800} fill="#334155">{day}</text>
              {cols[d].map((blk, i) => {
                y -= blk.h * RH
                return (
                  <g key={i}>
                    <rect x={x + 4} y={y + 2} width={CW - 16} height={blk.h * RH - 4} rx={8} fill={KINDS[blk.kind].color} />
                    <text x={x + (CW - 8) / 2} y={y + (blk.h * RH) / 2 + 6} textAnchor="middle" fontSize={16}>{KINDS[blk.kind].glyph}</text>
                  </g>
                )
              })}
            </g>
          )
        })}
        <g transform={`translate(${GX + 7 * CW + 20} ${GY})`}>
          <text fontSize={13} fontWeight={800} fill="#334155">Next</text>
          {next.map((blk, i) => (
            <g key={i} transform={`translate(0 ${16 + i * 110})`} opacity={i ? 0.6 : 1}>
              <rect width={110} height={blk.h * RH} rx={10} fill={KINDS[blk.kind].color} />
              <text x={55} y={(blk.h * RH) / 2 + 6} textAnchor="middle" fontSize={16} fill="#fff" fontWeight={800}>{KINDS[blk.kind].glyph} {blk.h}h</text>
            </g>
          ))}
        </g>
        <text x={GX} y={GY + ROWS * RH + 30} fontSize={12} fill="#64748b">A day clears when it's 8h+ with rest, at least three kinds of block, and no more than 6h of work. Past the red line it burns out.</text>
      </svg>
    </GameShell>
  )
}
