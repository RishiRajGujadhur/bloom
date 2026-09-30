import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Inbox River: letters float down the river toward the waterfall. Grab each
 * one and drop it on a dock — Do it now, Schedule, Hand off, or let it go over
 * the falls. Quick jobs are best done at once, big ones planned, other
 * people's handed back, and junk… let it go.
 */
type Kind = 'do' | 'schedule' | 'handoff' | 'drop'
type Letter = { id: number; subject: string; mins: number; mine: boolean; junk: boolean; x: number; y: number; speed: number }
const SUBJECTS: { s: string; mins: number; mine: boolean; junk: boolean }[] = [
  { s: 'Reply “yes” to dinner', mins: 1, mine: true, junk: false },
  { s: 'Pay the window cleaner', mins: 2, mine: true, junk: false },
  { s: 'Plan the holiday', mins: 90, mine: true, junk: false },
  { s: 'Write the report', mins: 120, mine: true, junk: false },
  { s: 'Book dentist', mins: 2, mine: true, junk: false },
  { s: 'Tidy the garage', mins: 180, mine: true, junk: false },
  { s: 'Your flatmate’s parcel slip', mins: 5, mine: false, junk: false },
  { s: 'Team rota (Sam runs it)', mins: 30, mine: false, junk: false },
  { s: 'Neighbour’s bin question', mins: 10, mine: false, junk: false },
  { s: '50% OFF EVERYTHING!!!', mins: 0, mine: true, junk: true },
  { s: 'You may already have won…', mins: 0, mine: true, junk: true },
  { s: 'Newsletter #214', mins: 0, mine: true, junk: true },
  { s: 'Confirm the plumber', mins: 1, mine: true, junk: false },
  { s: 'Learn the new app', mins: 60, mine: true, junk: false },
]
const right = (l: Letter): Kind => (l.junk ? 'drop' : !l.mine ? 'handoff' : l.mins <= 2 ? 'do' : 'schedule')
const W = 800, H = 500, RIVER_L = 250, RIVER_R = 550
const DOCKS: { k: Kind; label: string; glyph: string; x: number; y: number; color: string }[] = [
  { k: 'do', label: 'Do it now', glyph: '⚡', x: 110, y: 140, color: '#22c55e' },
  { k: 'schedule', label: 'Schedule', glyph: '📅', x: 110, y: 330, color: '#3b82f6' },
  { k: 'handoff', label: 'Hand off', glyph: '🤝', x: 690, y: 230, color: '#a855f7' },
  { k: 'drop', label: 'Let it go', glyph: '🌊', x: 400, y: 470, color: '#64748b' },
]
const TIME = 75

export default function InboxRiver() {
  const [best, submit] = useBest('inbox')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ letters: [] as Letter[], t: TIME, score: 0, right: 0, wrong: 0, lost: 0, running: true, next: 0.3, id: 1, drag: null as null | { id: number; dx: number; dy: number } })
  const svg = useRef<SVGSVGElement>(null)
  const dockEls = useRef(new Map<Kind, SVGGElement>())
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { letters: [], t: TIME, score: 0, right: 0, wrong: 0, lost: 0, running: true, next: 0.3, id: 1, drag: null }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        s.next -= dt
        if (s.next <= 0) {
          const sub = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)]
          s.letters.push({ id: s.id++, subject: sub.s, mins: sub.mins, mine: sub.mine, junk: sub.junk, x: RIVER_L + 40 + Math.random() * (RIVER_R - RIVER_L - 80), y: -40, speed: 34 + (TIME - s.t) * 0.7 })
          s.next = Math.max(1.1, 2.4 - (TIME - s.t) * 0.018)
        }
        for (const l of s.letters) if (s.drag?.id !== l.id) { l.y += l.speed * dt; l.x += Math.sin(now / 700 + l.id) * 8 * dt }
        const fell = s.letters.filter((l) => l.y > H - 70 && s.drag?.id !== l.id)
        for (const l of fell) {
          // Going over the falls is right for junk, a lost task otherwise.
          if (l.junk) { s.right++; s.score += 5 } else { s.lost++; s.score = Math.max(0, s.score - 8) }
        }
        s.letters = s.letters.filter((l) => !fell.includes(l))
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Inbox calm', lines: [`${s.right} handled the right way`, `${s.wrong} in the wrong place`, `${s.lost} important ones swept away`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const pt = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 }
  }
  const grab = (e: React.PointerEvent, l: Letter) => {
    if (!st.current.running) return
    const p = pt(e)
    st.current.drag = { id: l.id, dx: p.x - l.x, dy: p.y - l.y }
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
  }
  const move = (e: React.PointerEvent) => {
    const d = st.current.drag
    if (!d) return
    const l = st.current.letters.find((x) => x.id === d.id)
    if (!l) return
    const p = pt(e)
    l.x = p.x - d.dx; l.y = p.y - d.dy
  }
  const drop = () => {
    const s = st.current
    const d = s.drag
    s.drag = null
    if (!d) return
    const l = s.letters.find((x) => x.id === d.id)
    if (!l) return
    const dock = DOCKS.find((k) => Math.hypot(k.x - l.x, k.y - l.y) < 90)
    if (!dock) return
    const ok = right(l) === dock.k
    if (ok) { s.right++; s.score += 10 } else { s.wrong++; s.score = Math.max(0, s.score - 4) }
    s.letters = s.letters.filter((x) => x !== l)
    const el = dockEls.current.get(dock.k)
    if (el && !reducedMotion()) gsap.fromTo(el, { scale: ok ? 1.15 : 0.9 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', svgOrigin: `${dock.x} ${dock.y}` })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  return (
    <GameShell title="Inbox River" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Drag each letter to a dock before it reaches the falls · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={drop} role="img" aria-label="Letters on a river" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#bfe3b4" />
        <path d={`M${RIVER_L} 0 C ${RIVER_L - 20} 200, ${RIVER_L + 30} 300, ${RIVER_L} ${H} L ${RIVER_R} ${H} C ${RIVER_R + 30} 300, ${RIVER_R - 20} 200, ${RIVER_R} 0 Z`} fill="#5aa9e6" />
        {Array.from({ length: 18 }, (_, i) => {
          const y = ((i * 41 + performance.now() * 0.05) % (H + 30)) - 15
          const x = RIVER_L + 30 + ((i * 97) % (RIVER_R - RIVER_L - 60))
          return <path key={i} d={`M${x} ${y} q10 6 20 0`} stroke="#ffffff88" strokeWidth={2} fill="none" />
        })}
        <rect x={RIVER_L} y={H - 60} width={RIVER_R - RIVER_L} height={60} fill="#e0f2fe" opacity={0.7} />
        {DOCKS.map((d) => (
          <g key={d.k} ref={(el) => { if (el) dockEls.current.set(d.k, el) }}>
            <rect x={d.x - 80} y={d.y - 38} width={160} height={76} rx={16} fill="#fff" stroke={d.color} strokeWidth={4} strokeDasharray={d.k === 'drop' ? '6 6' : undefined} opacity={0.95} />
            <text x={d.x} y={d.y - 4} textAnchor="middle" fontSize={24}>{d.glyph}</text>
            <text x={d.x} y={d.y + 24} textAnchor="middle" fontSize={14} fontWeight={800} fill={d.color}>{d.label}</text>
          </g>
        ))}
        {s.letters.map((l) => (
          <g key={l.id} transform={`translate(${l.x} ${l.y}) rotate(${Math.sin(l.id + l.y / 60) * 6})`} onPointerDown={(e) => grab(e, l)} style={{ cursor: 'grab' }}>
            <rect x={-78} y={-30} width={156} height={60} rx={6} fill={l.junk ? '#fef3c7' : '#ffffff'} stroke="#94a3b8" />
            <path d="M-78 -30 L0 2 L78 -30" fill="none" stroke="#cbd5e1" />
            <text x={0} y={8} textAnchor="middle" fontSize={11} fontWeight={700} fill="#1e293b">{l.subject}</text>
            <text x={-70} y={24} fontSize={10} fill="#475569">{l.junk ? '📣 promo' : `⏱ ${l.mins < 60 ? `${l.mins}m` : `${l.mins / 60}h`}${l.mine ? '' : ' · 👤 not yours'}`}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
