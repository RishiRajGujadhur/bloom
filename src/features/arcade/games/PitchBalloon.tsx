import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Pitch Balloon: you're pitching an idea in a lift, and your balloon of
 * attention is slowly sinking. Words float past — tap the clear, strong ones
 * to puff the balloon up; filler ("um", "basically", "like") weighs it down.
 * Reach the top floor before it sinks. Three pitches.
 */
const PITCHES = [
  { idea: 'a community tool library', strong: ['borrow', 'share', 'save money', 'neighbours', 'drills', 'weekly', 'free', 'less waste'] },
  { idea: 'a school walking bus', strong: ['safe', 'healthy', 'together', 'on time', 'volunteers', 'fewer cars', 'every morning', 'fun'] },
  { idea: 'a lunchtime reading club', strong: ['quiet', 'thirty minutes', 'new books', 'friends', 'relax', 'swap', 'Thursdays', 'cosy'] },
]
const FILLER = ['um', 'basically', 'like', 'sort of', 'you know', 'kind of', 'literally', 'I mean', 'actually', 'whatever']
const W = 780, H = 480
type Word = { id: number; text: string; strong: boolean; x: number; y: number; vx: number }

export default function PitchBalloon() {
  const [best, submit] = useBest('pitch')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ pi: 0, alt: 0.3, words: [] as Word[], next: 0.3, id: 1, score: 0, strong: 0, filler: 0, running: true, lines: [] as string[] })
  const balloon = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { pi: 0, alt: 0.3, words: [], next: 0.3, id: 1, score: 0, strong: 0, filler: 0, running: true, lines: [] }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.alt -= dt * 0.035
        s.next -= dt
        if (s.next <= 0) {
          const strong = Math.random() < 0.5
          const P = PITCHES[s.pi]
          const fromLeft = Math.random() < 0.5
          s.words.push({ id: s.id++, text: strong ? P.strong[Math.floor(Math.random() * P.strong.length)] : FILLER[Math.floor(Math.random() * FILLER.length)], strong, x: fromLeft ? -80 : W + 80, y: 60 + Math.random() * 340, vx: (fromLeft ? 1 : -1) * (90 + Math.random() * 60) })
          s.next = 0.6 + Math.random() * 0.5
        }
        for (const w of s.words) w.x += w.vx * dt
        s.words = s.words.filter((w) => w.x > -120 && w.x < W + 120)
        if (s.alt >= 1 || s.alt <= 0) {
          const won = s.alt >= 1
          s.lines.push(`${PITCHES[s.pi].idea}: ${won ? 'they said yes! 🎉' : 'they lost interest'}`)
          if (won) s.score += 40
          if (s.pi + 1 >= PITCHES.length) {
            s.running = false
            const record = submitRef.current(s.score)
            setResult({ headline: 'Pitches delivered', lines: [...s.lines, `${s.strong} strong words, ${s.filler} fillers`, `Score ${s.score}`], record })
          } else { s.pi++; s.alt = 0.3; s.words = [] }
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const tap = (w: Word) => {
    const s = st.current
    if (!s.running) return
    if (w.strong) { s.alt = Math.min(1, s.alt + 0.1); s.strong++; s.score += 5 } else { s.alt = Math.max(0, s.alt - 0.12); s.filler++ }
    s.words = s.words.filter((x) => x !== w)
    if (balloon.current && !reducedMotion()) gsap.fromTo(balloon.current, { scale: w.strong ? 1.15 : 0.9 }, { scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.4)', transformOrigin: '50% 50%' })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const by = 420 - s.alt * 360
  return (
    <GameShell title="Pitch Balloon" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Pitch ${Math.min(s.pi + 1, 3)}/3: ${PITCHES[Math.min(s.pi, 2)].idea} · tap clear, strong words; filler weighs the balloon down`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Balloon of attention">
        <rect width={W} height={H} fill="#e0f2fe" />
        {Array.from({ length: 10 }, (_, i) => <g key={i}><line x1={20} x2={60} y1={40 + i * 42} y2={40 + i * 42} stroke="#94a3b8" /><text x={66} y={44 + i * 42} fontSize={10} fill="#64748b">{10 - i}</text></g>)}
        <text x={40} y={24} fontSize={11} fill="#0369a1" fontWeight={800}>top floor</text>
        <g transform={`translate(390 ${by})`}>
          <g ref={balloon}>
            <ellipse rx={46} ry={56} fill="#f43f5e" />
            <ellipse cx={-14} cy={-20} rx={10} ry={16} fill="#fff" opacity={0.4} />
            <path d="M-6 56 l6 10 l6 -10 z" fill="#be123c" />
          </g>
          <path d="M0 66 q10 20 -6 40 q-12 20 4 36" stroke="#475569" strokeWidth={2} fill="none" />
        </g>
        {s.words.map((w) => (
          <g key={w.id} transform={`translate(${w.x} ${w.y})`} onPointerDown={() => tap(w)} style={{ cursor: 'pointer' }}>
            <rect x={-8 - w.text.length * 4.5} y={-18} width={16 + w.text.length * 9} height={34} rx={17} fill={w.strong ? '#fff' : '#f1f5f9'} stroke={w.strong ? '#0ea5e9' : '#cbd5e1'} strokeWidth={2} />
            <text textAnchor="middle" y={5} fontSize={15} fontWeight={w.strong ? 800 : 400} fill={w.strong ? '#0c4a6e' : '#94a3b8'} fontStyle={w.strong ? 'normal' : 'italic'}>{w.text}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
