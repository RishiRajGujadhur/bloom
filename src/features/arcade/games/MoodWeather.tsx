import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Mood Weather: little clouds drift over a town, each carrying a moment ("my
 * friend cancelled plans", "I got the job!"). Drag each cloud to the word
 * that best names the feeling. Named clouds melt away and the sky clears;
 * unnamed ones gather into a storm.
 */
type Feel = 'happy' | 'sad' | 'angry' | 'worried' | 'proud' | 'lonely'
const FEELS: { id: Feel; label: string; color: string; glyph: string }[] = [
  { id: 'happy', label: 'Happy', color: '#facc15', glyph: '😊' }, { id: 'sad', label: 'Sad', color: '#60a5fa', glyph: '😢' },
  { id: 'angry', label: 'Frustrated', color: '#ef4444', glyph: '😤' }, { id: 'worried', label: 'Worried', color: '#a78bfa', glyph: '😟' },
  { id: 'proud', label: 'Proud', color: '#f97316', glyph: '😌' }, { id: 'lonely', label: 'Lonely', color: '#94a3b8', glyph: '🥺' },
]
const MOMENTS: { text: string; feel: Feel }[] = [
  { text: 'I got the job!', feel: 'happy' }, { text: 'Sunny picnic with friends', feel: 'happy' }, { text: 'My cat is poorly', feel: 'sad' },
  { text: 'Missed the last bus', feel: 'angry' }, { text: 'Someone pushed in the queue', feel: 'angry' }, { text: 'Big exam tomorrow', feel: 'worried' },
  { text: 'Waiting for test results', feel: 'worried' }, { text: 'Finished my first 5k!', feel: 'proud' }, { text: 'Fixed the tap myself', feel: 'proud' },
  { text: 'Everyone’s busy this weekend', feel: 'lonely' }, { text: 'New city, no friends yet', feel: 'lonely' }, { text: 'Grandad moved away', feel: 'sad' },
]
const W = 800, H = 480
type Cloud = { id: number; text: string; feel: Feel; x: number; y: number }

export default function MoodWeather() {
  const [best, submit] = useBest('moodweather')
  const [clouds, setClouds] = useState<Cloud[]>([])
  const [storm, setStorm] = useState(0)
  const [score, setScore] = useState(0)
  const [msg, setMsg] = useState('')
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const st = useRef({ i: 0, score: 0, right: 0, stormy: 0, queue: [] as typeof MOMENTS, id: 1, running: true })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { i: 0, score: 0, right: 0, stormy: 0, queue: [...MOMENTS].sort(() => Math.random() - 0.5), id: 1, running: true }
    setClouds([]); setStorm(0); setScore(0); setMsg('')
    const spawn = () => {
      const s = st.current
      if (!s.running) return
      if (s.i >= s.queue.length) {
        if (!document.querySelector('.mw-cloud')) finish()
        return
      }
      const m = s.queue[s.i++]
      setClouds((cs) => [...cs, { id: s.id++, text: m.text, feel: m.feel, x: -120, y: 60 + (s.i % 3) * 75 }])
    }
    const finish = () => {
      const s = st.current
      if (!s.running) return
      s.running = false
      const record = submitRef.current(s.score)
      setResult({ headline: s.stormy ? 'The sky’s mostly clear' : 'Clear blue sky ☀️', lines: [`${s.right} feelings named well`, `${s.stormy} drifted into the storm`, `Score ${s.score}`], record })
    }
    const sp = setInterval(spawn, 4200); spawn()
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      setClouds((cs) => {
        const next: Cloud[] = []
        for (const c of cs) {
          if (drag.current?.id === c.id) { next.push(c); continue }
          const nx = c.x + 38 * dt
          if (nx > W + 60) { st.current.stormy++; setStorm((v) => v + 1); continue }
          next.push({ ...c, x: nx })
        }
        if (!next.length && st.current.i >= st.current.queue.length && st.current.running) setTimeout(finish, 300)
        return next
      })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { clearInterval(sp); cancelAnimationFrame(raf) }
  }, [round])

  const pt = (e: React.PointerEvent) => { const m = svg.current?.getScreenCTM(); return m ? new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse()) : { x: 0, y: 0 } }
  const up = () => {
    const d = drag.current; drag.current = null
    if (!d) return
    const c = clouds.find((x) => x.id === d.id)
    if (!c) return
    const fi = FEELS.findIndex((_, i) => Math.abs(c.x - (70 + i * 132)) < 70 && c.y > 330)
    if (fi < 0) return
    const s = st.current
    const ok = FEELS[fi].id === c.feel
    if (ok) { s.right++; s.score += 10; setMsg(`“${c.text}” — ${FEELS[fi].label.toLowerCase()}, yes.`) } else { s.score += 3; setMsg(`Maybe — though “${c.text}” sounds more ${FEELS.find((f) => f.id === c.feel)!.label.toLowerCase()}.`) }
    setScore(s.score)
    setClouds((cs) => cs.filter((x) => x.id !== c.id))
    const el = svg.current?.querySelector(`[data-feel="${FEELS[fi].id}"]`)
    if (el && !reducedMotion()) gsap.fromTo(el, { scale: 1.15 }, { scale: 1, duration: 0.4, ease: 'back.out(3)', transformOrigin: '50% 50%' })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const gloom = Math.min(1, storm / 5)
  return (
    <GameShell title="Mood Weather" score={score} best={best} result={result} onRestart={restart}
      hint={`Drag each cloud to the word that names the feeling · ${msg}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={(e) => { const d = drag.current; if (!d) return; const p = pt(e); setClouds((cs) => cs.map((c) => (c.id === d.id ? { ...c, x: p.x - d.dx, y: p.y - d.dy } : c))) }} onPointerUp={up} role="img" aria-label="Sky of feelings" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill={`rgb(${190 - gloom * 100}, ${225 - gloom * 110}, ${250 - gloom * 90})`} />
        <circle cx={700} cy={60} r={36} fill="#fde047" opacity={1 - gloom * 0.8} />
        {gloom > 0 && <g opacity={gloom}><ellipse cx={740} cy={80} rx={120} ry={45} fill="#475569" /><path d="M720 110 l-12 24 h12 l-10 22" stroke="#facc15" strokeWidth={4} fill="none" /></g>}
        <path d={`M0 300 ${Array.from({ length: 9 }, (_, i) => `L${i * 100} ${260 + (i % 2) * 20} L${i * 100 + 50} ${260 + (i % 2) * 20}`).join(' ')} L800 300 Z`} fill="#94a3b8" opacity={0.5} />
        {FEELS.map((f, i) => (
          <g key={f.id} data-feel={f.id}>
            <rect x={10 + i * 132} y={340} width={120} height={110} rx={16} fill="#fff" stroke={f.color} strokeWidth={4} />
            <text x={70 + i * 132} y={392} textAnchor="middle" fontSize={34}>{f.glyph}</text>
            <text x={70 + i * 132} y={428} textAnchor="middle" fontSize={14} fontWeight={800} fill="#1e293b">{f.label}</text>
          </g>
        ))}
        {clouds.map((c) => (
          <g key={c.id} className="mw-cloud" transform={`translate(${c.x} ${c.y})`} onPointerDown={(e) => { const p = pt(e); drag.current = { id: c.id, dx: p.x - c.x, dy: p.y - c.y } }} style={{ cursor: 'grab' }}>
            <ellipse rx={90} ry={34} fill="#fff" /><ellipse cx={-40} cy={-14} rx={40} ry={30} fill="#fff" /><ellipse cx={30} cy={-20} rx={46} ry={32} fill="#fff" />
            <text textAnchor="middle" y={6} fontSize={13} fontWeight={700} fill="#334155">{c.text}</text>
          </g>
        ))}
      </svg>
    </GameShell>
  )
}
