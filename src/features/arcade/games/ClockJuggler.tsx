import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Clock Juggler: a busy Saturday of timers. Each dial sweeps down at its own
 * speed. Tap a dial in its green window to deal with it: take the bread out,
 * move the laundry, feed the parking meter. Too early wastes a trip, too late
 * and something goes wrong. More timers join as the day goes on.
 */
type Timer = { id: string; label: string; glyph: string; secs: number; left: number; x: number; y: number; active: boolean; oops: string }
const W = 780, H = 480
const DAY = 90
const ALL: Omit<Timer, 'left' | 'active'>[] = [
  { id: 'oven', label: 'Bread', glyph: '🍞', secs: 9, x: 130, y: 150, oops: 'burnt the bread' },
  { id: 'wash', label: 'Laundry', glyph: '🧺', secs: 13, x: 390, y: 150, oops: 'laundry went musty' },
  { id: 'meter', label: 'Parking', glyph: '🅿️', secs: 11, x: 650, y: 150, oops: 'parking ticket' },
  { id: 'kettle', label: 'Tea', glyph: '🍵', secs: 6, x: 130, y: 350, oops: 'tea went cold' },
  { id: 'call', label: 'Call Gran', glyph: '📞', secs: 15, x: 390, y: 350, oops: 'missed Gran’s call' },
  { id: 'plants', label: 'Seedlings', glyph: '🌱', secs: 8, x: 650, y: 350, oops: 'seedlings wilted' },
]
const WINDOW = 0.22 // last 22% of the dial is the green window

export default function ClockJuggler() {
  const [best, submit] = useBest('clocks')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ timers: [] as Timer[], t: DAY, score: 0, good: 0, early: 0, oops: [] as string[], running: true })
  const els = useRef(new Map<string, SVGGElement>())
  const toast = useRef<SVGTextElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const say = (msg: string, color: string, x: number, y: number) => {
    const t = toast.current
    if (!t) return
    t.textContent = msg; t.setAttribute('fill', color); t.setAttribute('x', String(x)); t.setAttribute('y', String(y - 90))
    if (reducedMotion()) return
    gsap.fromTo(t, { opacity: 1, y: 0 }, { opacity: 0, y: -24, duration: 1.1, ease: 'power1.out' })
  }

  useEffect(() => {
    st.current = { timers: ALL.map((a, i) => ({ ...a, left: a.secs * (0.6 + Math.random() * 0.4), active: i < 2 })), t: DAY, score: 0, good: 0, early: 0, oops: [], running: true }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        // A new timer joins every ~12 s.
        const want = Math.min(ALL.length, 2 + Math.floor((DAY - s.t) / 12))
        s.timers.forEach((tm, i) => { if (i < want && !tm.active) { tm.active = true; tm.left = tm.secs } })
        for (const tm of s.timers) {
          if (!tm.active) continue
          tm.left -= dt
          if (tm.left <= 0) {
            s.oops.push(tm.oops); s.score = Math.max(0, s.score - 10)
            say(`Oh no — ${tm.oops}`, '#e11d48', tm.x, tm.y)
            const el = els.current.get(tm.id)
            if (el && !reducedMotion()) gsap.fromTo(el, { x: -8 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
            tm.left = tm.secs
          }
        }
        if (s.t <= 0) {
          s.running = false
          const counts = s.oops.reduce<Record<string, number>>((m, o) => ({ ...m, [o]: (m[o] ?? 0) + 1 }), {})
          const worst = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
          const record = submitRef.current(s.score)
          setResult({ headline: 'Saturday survived', lines: [`${s.good} timers handled on time`, `${s.early} trips too early`, worst ? `Most often: ${worst[0]} (×${worst[1]})` : 'Nothing went wrong!', `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const tap = (tm: Timer) => {
    const s = st.current
    if (!s.running || !tm.active) return
    const frac = tm.left / tm.secs
    const el = els.current.get(tm.id)
    if (frac <= WINDOW) {
      s.good++; s.score += 10 + Math.round((WINDOW - frac) * 40)
      say('Nice timing!', '#16a34a', tm.x, tm.y)
      if (el && !reducedMotion()) gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', svgOrigin: `${tm.x} ${tm.y}` })
      tm.left = tm.secs
    } else {
      s.early++; s.score = Math.max(0, s.score - 3)
      say('Not yet…', '#b45309', tm.x, tm.y)
      tm.left = Math.max(0.5, tm.left - tm.secs * 0.1) // a wasted trip costs a little time
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const arc = (frac: number, r: number) => {
    const a = -Math.PI / 2 + frac * Math.PI * 2
    const large = frac > 0.5 ? 1 : 0
    return frac >= 0.999 ? `M0 ${-r} A${r} ${r} 0 1 1 -0.01 ${-r}` : `M0 ${-r} A${r} ${r} 0 ${large} 1 ${Math.cos(a) * r} ${Math.sin(a) * r}`
  }
  return (
    <GameShell title="Clock Juggler" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Tap a dial in its green window · early wastes a trip, late means trouble · ${Math.max(0, Math.ceil(s.t))}s of Saturday left`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Timers">
        <rect width={W} height={H} fill="#fdf6ec" />
        {s.timers.map((tm) => {
          const frac = Math.max(0, tm.left / tm.secs)
          const green = frac <= WINDOW
          return (
            <g key={tm.id} ref={(el) => { if (el) els.current.set(tm.id, el) }} onPointerDown={() => tap(tm)} style={{ cursor: tm.active ? 'pointer' : 'default' }} opacity={tm.active ? 1 : 0.25}>
              <g transform={`translate(${tm.x} ${tm.y})`}>
                <circle r={76} fill="#fff" stroke="#e7dccb" strokeWidth={4} />
                <path d={arc(WINDOW, 64)} fill="none" stroke="#bbf7d0" strokeWidth={14} />
                <path d={arc(frac, 64)} fill="none" stroke={green ? '#22c55e' : frac < 0.4 ? '#f59e0b' : '#60a5fa'} strokeWidth={8} strokeLinecap="round" />
                <line x1={0} y1={0} x2={Math.cos(-Math.PI / 2 + frac * Math.PI * 2) * 52} y2={Math.sin(-Math.PI / 2 + frac * Math.PI * 2) * 52} stroke="#334155" strokeWidth={4} strokeLinecap="round" />
                <circle r={6} fill="#334155" />
                <text y={-18} textAnchor="middle" fontSize={28}>{tm.glyph}</text>
                <text y={36} textAnchor="middle" fontSize={13} fontWeight={700} fill="#475569">{tm.label}</text>
                {green && tm.active && <circle r={80} fill="none" stroke="#22c55e" strokeWidth={3} opacity={0.6}><animate attributeName="r" values="78;86;78" dur=".6s" repeatCount="indefinite" /></circle>}
              </g>
            </g>
          )
        })}
        <text ref={toast} textAnchor="middle" fontSize={16} fontWeight={800} opacity={0} />
      </svg>
    </GameShell>
  )
}
