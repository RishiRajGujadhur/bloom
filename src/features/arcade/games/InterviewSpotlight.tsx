import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Interview Spotlight: you're on the stage, answering questions. Keep your
 * pointer inside the spotlight while your answer plays out — nerves make the
 * light wander and twitch. Hold Space (or the Breathe button) for a slow
 * breath and the light steadies, but the answer pauses while you breathe.
 * Six questions.
 */
const W = 780, H = 460
const QUESTIONS = ['Tell us about yourself.', 'Why do you want this role?', 'Describe a challenge you overcame.', 'What are you most proud of?', 'How do you handle feedback?', 'Any questions for us?']

export default function InterviewSpotlight() {
  const [best, submit] = useBest('spotlight')
  const [, frame] = useState(0)
  const [breathing, setBreathing] = useState(false)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ q: 0, progress: 0, x: 390, y: 220, vx: 0, vy: 0, nerves: 0.3, inside: 0, total: 0, px: 390, py: 220, breath: 0, breathing: false, running: true, score: 0, t: 0 })
  const svg = useRef<SVGSVGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { q: 0, progress: 0, x: 390, y: 220, vx: 0, vy: 0, nerves: 0.3, inside: 0, total: 0, px: 390, py: 220, breath: 0, breathing: false, running: true, score: 0, t: 0 }
    const key = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); st.current.breathing = e.type === 'keydown'; setBreathing(st.current.breathing) } }
    window.addEventListener('keydown', key); window.addEventListener('keyup', key)
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t += dt
        s.breath = s.breathing ? Math.min(1, s.breath + dt * 0.4) : Math.max(0, s.breath - dt * 0.2)
        // Nerves creep up over each question and when you lose the light; breathing brings them down.
        s.nerves = Math.max(0.1, Math.min(1, s.nerves + dt * (0.03 + s.q * 0.01) - s.breath * dt * 0.35))
        const jitter = s.nerves * 900
        s.vx += (Math.random() - 0.5) * jitter * dt + (390 - s.x) * dt * 0.6
        s.vy += (Math.random() - 0.5) * jitter * dt + (230 - s.y) * dt * 0.6
        s.vx *= 0.94; s.vy *= 0.94
        s.x = Math.max(120, Math.min(W - 120, s.x + s.vx * dt)); s.y = Math.max(110, Math.min(H - 110, s.y + s.vy * dt))
        const r = 80 - s.nerves * 30
        const inLight = Math.hypot(s.px - s.x, s.py - s.y) < r
        if (!s.breathing) {
          s.total += dt
          if (inLight) { s.inside += dt; s.progress += dt / 7 } else s.nerves = Math.min(1, s.nerves + dt * 0.12)
        }
        if (s.progress >= 1) {
          s.score += Math.round((s.inside / Math.max(0.1, s.total)) * 40)
          s.q++; s.progress = 0; s.inside = 0; s.total = 0
          if (s.q >= QUESTIONS.length) {
            s.running = false
            const record = submitRef.current(s.score)
            setResult({ headline: 'Thank you, we’ll be in touch 🤝', lines: [`${QUESTIONS.length} answers given`, `Composure score ${s.score}`], record })
          }
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key) }
  }, [round])

  const move = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    st.current.px = p.x; st.current.py = p.y
  }
  const breathe = (on: boolean) => { st.current.breathing = on; setBreathing(on) }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const r = 80 - s.nerves * 30
  const inLight = Math.hypot(s.px - s.x, s.py - s.y) < r
  return (
    <GameShell title="Interview Spotlight" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Q${Math.min(s.q + 1, QUESTIONS.length)}/${QUESTIONS.length}: “${QUESTIONS[Math.min(s.q, QUESTIONS.length - 1)]}” · keep your pointer in the light · hold Space to breathe`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} role="img" aria-label="Stage spotlight" style={{ cursor: 'none', touchAction: 'none' }}>
        <defs>
          <radialGradient id="is-light"><stop offset="0" stopColor="#fff7d6" stopOpacity={0.95} /><stop offset=".7" stopColor="#fde68a" stopOpacity={0.55} /><stop offset="1" stopColor="#fde68a" stopOpacity={0} /></radialGradient>
        </defs>
        <rect width={W} height={H} fill="#1e1b2e" />
        <path d={`M0 ${H - 70} H${W} V${H} H0Z`} fill="#3f2a1d" />
        {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 66} y={H - 70} width={64} height={70} fill={i % 2 ? '#4a3223' : '#3f2a1d'} />)}
        <path d={`M${W / 2 - 40} 0 L${s.x - r} ${s.y + r * 0.4} L${s.x + r} ${s.y + r * 0.4} L${W / 2 + 40} 0 Z`} fill="#fde68a" opacity={0.08} />
        <ellipse cx={s.x} cy={s.y} rx={r * 1.25} ry={r} fill="url(#is-light)" />
        {/* Audience silhouettes. */}
        {Array.from({ length: 9 }, (_, i) => <g key={i} transform={`translate(${60 + i * 85} ${H - 20})`}><circle cy={-38} r={16} fill="#0f0d17" /><rect x={-22} y={-24} width={44} height={30} rx={14} fill="#0f0d17" /></g>)}
        {/* You (the pointer). */}
        <g transform={`translate(${s.px} ${s.py})`} pointerEvents="none">
          <circle r={12} fill={inLight ? '#fbbf24' : '#64748b'} stroke="#fff" strokeWidth={2} />
          {s.breathing && <circle r={20 + Math.sin(performance.now() / 400) * 6} fill="none" stroke="#93c5fd" strokeWidth={2} />}
        </g>
        {/* Answer progress and nerves. */}
        <g transform="translate(24 24)">
          <text fontSize={12} fill="#e2e8f0">answer</text>
          <rect y={6} width={200} height={8} rx={4} fill="#ffffff22" /><rect y={6} width={200 * s.progress} height={8} rx={4} fill="#fbbf24" />
          <text y={34} fontSize={12} fill="#e2e8f0">nerves</text>
          <rect y={40} width={200} height={8} rx={4} fill="#ffffff22" /><rect y={40} width={200 * s.nerves} height={8} rx={4} fill={s.nerves > 0.65 ? '#ef4444' : '#a78bfa'} />
        </g>
        {s.breathing && <text x={W / 2} y={40} textAnchor="middle" fontSize={18} fill="#93c5fd">breathe in… and out…</text>}
      </svg>
      <div className="cf-tray">
        <button type="button" className={breathing ? 'on' : ''} onPointerDown={() => breathe(true)} onPointerUp={() => breathe(false)} onPointerLeave={() => breathe(false)}>🌬 Hold to breathe</button>
      </div>
    </GameShell>
  )
}
