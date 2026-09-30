import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Habit Hatchery: every egg needs one warm tap each day. Seven days in a row
 * and it hatches something wonderful; miss a day and it cools back to the
 * start. Add a new egg from the basket whenever you like — but every egg
 * needs its tap, every day. Twenty-one days.
 */
const W = 800, H = 480
const DAY_S = 3.2
const DAYS = 21
const CRITTERS = ['🐣', '🦆', '🦉', '🐉', '🦜', '🐢', '🦋', '🐧', '🦩', '🦚']
type Egg = { id: number; x: number; y: number; streak: number; tapped: boolean; hatched: string | null; hue: number }

export default function HabitHatchery() {
  const [best, submit] = useBest('hatchery')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ eggs: [] as Egg[], day: 1, t: 0, hatched: 0, broken: 0, running: true, id: 1, bestStreak: 0 })
  const els = useRef(new Map<number, SVGGElement>())
  const sun = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const slot = (i: number) => ({ x: 130 + (i % 5) * 135, y: 200 + Math.floor(i / 5) * 150 })
  useEffect(() => {
    st.current = { eggs: [{ id: 1, ...slot(0), streak: 0, tapped: false, hatched: null, hue: 40 }], day: 1, t: 0, hatched: 0, broken: 0, running: true, id: 2, bestStreak: 0 }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t += dt
        if (s.t >= DAY_S) {
          s.t = 0
          // End of day: tapped eggs grow their streak, untapped ones cool off.
          for (const e of s.eggs) {
            if (e.hatched) continue
            if (e.tapped) {
              e.streak++
              s.bestStreak = Math.max(s.bestStreak, e.streak)
              if (e.streak >= 7) {
                e.hatched = CRITTERS[Math.floor(Math.random() * CRITTERS.length)]
                s.hatched++
                const el = els.current.get(e.id)
                if (el && !reducedMotion()) gsap.fromTo(el, { scale: 0.4, rotation: -20 }, { scale: 1, rotation: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', svgOrigin: `${e.x} ${e.y}` })
              }
            } else if (e.streak > 0) {
              e.streak = 0; s.broken++
              const el = els.current.get(e.id)
              if (el && !reducedMotion()) gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
            }
            e.tapped = false
          }
          s.day++
          if (s.day > DAYS) {
            s.running = false
            const score = s.hatched * 50 + s.bestStreak * 5 - s.broken * 5
            const record = submitRef.current(Math.max(0, score))
            setResult({ headline: 'Three weeks later…', lines: [`${s.hatched} eggs hatched`, `${s.broken} streaks broken`, `Longest streak ${s.bestStreak} days`, `Score ${Math.max(0, score)}`], record })
          }
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const tap = (e: Egg) => {
    if (!st.current.running || e.hatched || e.tapped) return
    e.tapped = true
    const el = els.current.get(e.id)
    if (el && !reducedMotion()) gsap.fromTo(el, { scale: 1.12 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', svgOrigin: `${e.x} ${e.y}` })
  }
  const addEgg = () => {
    const s = st.current
    if (!s.running || s.eggs.length >= 10) return
    const i = s.eggs.length
    s.eggs.push({ id: s.id++, ...slot(i), streak: 0, tapped: false, hatched: null, hue: Math.random() * 360 })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const dayFrac = s.t / DAY_S
  return (
    <GameShell title="Habit Hatchery" score={s.hatched * 50} best={best} result={result} onRestart={restart}
      hint={`Day ${Math.min(s.day, DAYS)}/${DAYS} · tap every egg once a day · 7 days in a row hatches it · ${s.eggs.filter((e) => !e.hatched && !e.tapped).length} still need warming today`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Nest of eggs">
        <rect width={W} height={H} fill={`hsl(${200 - dayFrac * 20}, 70%, ${88 - Math.max(0, dayFrac - 0.7) * 60}%)`} />
        <g ref={sun}><circle cx={100 + dayFrac * 600} cy={90 - Math.sin(dayFrac * Math.PI) * 50} r={30} fill="#fcd34d" /></g>
        <rect y={H - 60} width={W} height={60} fill="#a3b18a" />
        {s.eggs.map((e) => {
          const warm = e.tapped
          return (
            <g key={e.id} ref={(el) => { if (el) els.current.set(e.id, el) }} onPointerDown={() => tap(e)} style={{ cursor: e.hatched || warm ? 'default' : 'pointer' }}>
              <ellipse cx={e.x} cy={e.y + 50} rx={58} ry={18} fill="#8d6e63" />
              {Array.from({ length: 9 }, (_, k) => <path key={k} d={`M${e.x - 58 + k * 14} ${e.y + 44} q7 -12 14 0`} stroke="#6d4c41" strokeWidth={3} fill="none" />)}
              {e.hatched ? (
                <>
                  <path d={`M${e.x - 32} ${e.y + 40} l8 -14 l8 10 l8 -12 l8 12 l8 -10 l8 14 Z`} fill={`hsl(${e.hue} 60% 88%)`} />
                  <text x={e.x} y={e.y + 14} textAnchor="middle" fontSize={46}>{e.hatched}</text>
                </>
              ) : (
                <>
                  {warm && <ellipse cx={e.x} cy={e.y + 4} rx={46} ry={54} fill="#fde68a" opacity={0.45}><animate attributeName="opacity" values=".3;.55;.3" dur="1.2s" repeatCount="indefinite" /></ellipse>}
                  <ellipse cx={e.x} cy={e.y + 4} rx={32} ry={42} fill={`hsl(${e.hue} ${warm ? 70 : 35}% ${warm ? 85 : 80}%)`} stroke="#0002" strokeWidth={2} />
                  {e.streak >= 4 && <path d={`M${e.x - 12} ${e.y - 14} l6 8 l6 -6 l6 8`} stroke="#6b7280" strokeWidth={2} fill="none" />}
                  <g transform={`translate(${e.x - 42} ${e.y + 78})`}>
                    {Array.from({ length: 7 }, (_, k) => <circle key={k} cx={k * 14} cy={0} r={5} fill={k < e.streak ? '#f59e0b' : '#ffffffaa'} stroke="#0002" />)}
                  </g>
                </>
              )}
            </g>
          )
        })}
        <g transform={`translate(${W - 110} ${H - 135})`} onPointerDown={addEgg} style={{ cursor: s.eggs.length < 10 ? 'pointer' : 'default' }} opacity={s.eggs.length < 10 ? 1 : 0.4}>
          <path d="M0 40 h90 l-10 50 h-70 z" fill="#d4a373" stroke="#8d6e63" strokeWidth={3} />
          <ellipse cx={30} cy={40} rx={14} ry={18} fill="#fef3c7" /><ellipse cx={58} cy={38} rx={14} ry={18} fill="#e0f2fe" />
          <text x={45} y={110} textAnchor="middle" fontSize={12} fontWeight={800} fill="#3f3f46">+ new egg</text>
        </g>
      </svg>
    </GameShell>
  )
}
