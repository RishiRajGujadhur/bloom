import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Heartbeat Hero: keep the monitor's heart line alive. Press (Space or tap)
 * in a strong, steady rhythm — the sweet spot is 100–120 beats a minute. Each
 * set of thirty is followed by two big breaths (hold for a second each).
 * Too slow, too fast or uneven and the line starts to flatten.
 */
const W = 780, H = 440
const SETS = 4

export default function HeartbeatHero() {
  const [best, submit] = useBest('heartbeat')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ taps: [] as number[], count: 0, set: 1, phase: 'press' as 'press' | 'breathe', breaths: 0, holdStart: 0, holding: false, life: 0.7, inZone: 0, total: 0, trace: [] as number[], pulse: 0, running: true, bpm: 0 })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { taps: [], count: 0, set: 1, phase: 'press', breaths: 0, holdStart: 0, holding: false, life: 0.7, inZone: 0, total: 0, trace: Array(160).fill(0), pulse: 0, running: true, bpm: 0 }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        const recent = s.taps.filter((t) => now - t < 3000)
        const gaps = recent.slice(1).map((t, i) => t - recent[i])
        s.bpm = gaps.length ? 60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length) : 0
        const steady = gaps.length > 2 ? 1 - Math.min(1, Math.sqrt(gaps.reduce((n, g) => n + (g - 60000 / s.bpm) ** 2, 0) / gaps.length) / 250) : 0
        if (s.phase === 'press') {
          const good = s.bpm >= 100 && s.bpm <= 120 && steady > 0.5
          s.life = Math.max(0, Math.min(1, s.life + (good ? 0.12 : recent.length ? -0.04 : -0.1) * dt))
          if (now - (s.taps[s.taps.length - 1] ?? now) > 2500) s.life = Math.max(0, s.life - dt * 0.2)
        } else s.life = Math.max(0, s.life - dt * 0.02)
        s.pulse = Math.max(0, s.pulse - dt * 4)
        s.trace.shift()
        s.trace.push(s.pulse > 0.6 ? (s.pulse - 0.6) * 2.5 * s.life : Math.sin(now / 90) * 0.02)
        if (s.life <= 0) {
          s.running = false
          const record = submitRef.current(Math.round(s.inZone))
          setResult({ headline: 'The line went flat…', lines: [`Reached set ${s.set} of ${SETS}`, 'Aim for a steady 100–120 a minute', `Score ${Math.round(s.inZone)}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const press = useCallback((down: boolean) => {
    const s = st.current
    if (!s.running) return
    const now = performance.now()
    if (s.phase === 'press') {
      if (!down) return
      s.taps.push(now); s.taps = s.taps.slice(-12); s.count++; s.pulse = 1; s.total++
      if (s.bpm >= 100 && s.bpm <= 120) s.inZone++
      if (s.count >= 30) { s.phase = 'breathe'; s.breaths = 0; s.count = 0 }
    } else {
      if (down) { s.holding = true; s.holdStart = now }
      else if (s.holding) {
        s.holding = false
        if (now - s.holdStart > 700) { s.breaths++; s.life = Math.min(1, s.life + 0.05) }
        if (s.breaths >= 2) {
          if (s.set >= SETS) {
            s.running = false
            const score = Math.round(s.inZone * 2 + s.life * 50)
            const record = submitRef.current(score)
            setResult({ headline: 'Help has arrived — you kept it going! ❤️', lines: [`${SETS} sets of 30`, `${s.inZone} presses in the 100–120 zone`, `Score ${score}`], record })
          } else { s.set++; s.phase = 'press'; s.taps = [] }
        }
      }
    }
  }, [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) press(e.type === 'keydown') } }
    window.addEventListener('keydown', k); window.addEventListener('keyup', k)
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('keyup', k) }
  }, [press])
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const path = s.trace.map((v, i) => `${i ? 'L' : 'M'}${40 + i * 3.1} ${210 - v * 120}`).join(' ')
  const needle = Math.max(40, Math.min(160, s.bpm || 40))
  const na = ((needle - 40) / 120) * Math.PI - Math.PI
  return (
    <GameShell title="Heartbeat Hero" score={s.inZone} best={best} result={result} onRestart={restart}
      hint={s.phase === 'press' ? `Set ${s.set}/${SETS} · press ${30 - s.count} more times at a steady 100–120 a minute (Space or tap)` : `Two big breaths: hold for a second each (${s.breaths}/2)`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Heart monitor" onPointerDown={() => press(true)} onPointerUp={() => press(false)} style={{ cursor: 'pointer', touchAction: 'none' }}>
        <rect width={W} height={H} fill="#0b1220" />
        <rect x={24} y={60} width={520} height={300} rx={16} fill="#04150b" stroke="#14532d" strokeWidth={3} />
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={40 + i * 42} x2={40 + i * 42} y1={70} y2={350} stroke="#0f3a22" />)}
        {Array.from({ length: 7 }, (_, i) => <line key={i} x1={30} x2={540} y1={80 + i * 42} y2={80 + i * 42} stroke="#0f3a22" />)}
        <path d={path} fill="none" stroke={s.life > 0.4 ? '#22c55e' : '#f59e0b'} strokeWidth={3} strokeLinejoin="round" />
        <text x={40} y={90} fontSize={16} fill="#86efac" fontFamily="monospace">♥ {Math.round(s.bpm)} /min</text>
        <text x={40} y={345} fontSize={13} fill="#86efac" fontFamily="monospace">strength {Math.round(s.life * 100)}%</text>
        {/* BPM gauge with the sweet spot. */}
        <g transform="translate(660 220)">
          <path d="M-90 0 A90 90 0 0 1 90 0" fill="none" stroke="#1f2937" strokeWidth={18} />
          <path d={`M${Math.cos(Math.PI - (60 / 120) * Math.PI) * 90} ${-Math.sin(Math.PI - (60 / 120) * Math.PI) * 90} A90 90 0 0 1 ${Math.cos(Math.PI - (80 / 120) * Math.PI) * 90} ${-Math.sin(Math.PI - (80 / 120) * Math.PI) * 90}`} fill="none" stroke="#22c55e" strokeWidth={18} />
          <line x1={0} y1={0} x2={Math.cos(na) * 78} y2={Math.sin(na) * 78} stroke="#f8fafc" strokeWidth={4} strokeLinecap="round" />
          <circle r={8} fill="#f8fafc" />
          <text y={34} textAnchor="middle" fontSize={13} fill="#cbd5e1">100–120</text>
        </g>
        {/* Press counter / breaths. */}
        <g transform="translate(560 320)">
          {s.phase === 'press'
            ? Array.from({ length: 30 }, (_, i) => <circle key={i} cx={(i % 10) * 20} cy={Math.floor(i / 10) * 20} r={6} fill={i < s.count ? '#f43f5e' : '#334155'} />)
            : [0, 1].map((i) => <circle key={i} cx={40 + i * 90} cy={20} r={s.holding && i === s.breaths ? 28 + Math.min(12, (performance.now() - s.holdStart) / 60) : 26} fill={i < s.breaths ? '#60a5fa' : '#1e3a8a'} stroke="#93c5fd" strokeWidth={2} />)}
        </g>
        <circle cx={284} cy={210} r={40 + s.pulse * 18} fill="#f43f5e" opacity={0.08 + s.pulse * 0.25} />
      </svg>
    </GameShell>
  )
}
