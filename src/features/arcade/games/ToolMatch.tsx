import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Tool Match: household jobs slide past on a conveyor. Tap the right tool
 * from your toolbelt before each job reaches the end — a screwdriver for the
 * wobbly cupboard hinge, a plunger for the blocked sink, a spanner for the
 * dripping tap. The belt speeds up.
 */
const TOOLS = [
  { id: 'screwdriver', glyph: '🔩', label: 'Screwdriver' }, { id: 'hammer', glyph: '🔨', label: 'Hammer' }, { id: 'spanner', glyph: '🔧', label: 'Spanner' },
  { id: 'plunger', glyph: '🚽', label: 'Plunger' }, { id: 'tape', glyph: '📏', label: 'Tape measure' }, { id: 'brush', glyph: '🖌️', label: 'Paintbrush' },
]
const JOBS = [
  { text: 'Wobbly cupboard hinge', tool: 'screwdriver', glyph: '🚪' }, { text: 'Hang a picture', tool: 'hammer', glyph: '🖼' },
  { text: 'Dripping tap', tool: 'spanner', glyph: '🚰' }, { text: 'Blocked sink', tool: 'plunger', glyph: '🚿' },
  { text: 'Will the sofa fit?', tool: 'tape', glyph: '🛋️' }, { text: 'Scuffed skirting board', tool: 'brush', glyph: '🎨' },
  { text: 'Loose chair leg', tool: 'screwdriver', glyph: '💺' }, { text: 'Tighten bike wheel', tool: 'spanner', glyph: '🚲' },
  { text: 'Nail sticking up', tool: 'hammer', glyph: '📌' }, { text: 'Measure for curtains', tool: 'tape', glyph: '🏠' },
]
const W = 800, H = 420
const TIME = 60

export default function ToolMatch() {
  const [best, submit] = useBest('tools')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ jobs: [] as { id: number; j: typeof JOBS[number]; x: number; done: boolean | null }[], t: TIME, next: 0, id: 1, score: 0, right: 0, wrong: 0, missed: 0, speed: 80, running: true, flash: '' })
  const svg = useRef<SVGSVGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { jobs: [], t: TIME, next: 0, id: 1, score: 0, right: 0, wrong: 0, missed: 0, speed: 80, running: true, flash: '' }
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now
      const s = st.current
      if (s.running) {
        s.t -= dt; s.next -= dt; s.speed = 80 + (TIME - s.t) * 1.6
        if (s.next <= 0) { s.jobs.push({ id: s.id++, j: JOBS[Math.floor(Math.random() * JOBS.length)], x: -100, done: null }); s.next = Math.max(1.3, 2.6 - (TIME - s.t) * 0.02) }
        for (const job of s.jobs) { job.x += s.speed * dt; if (job.done === null && job.x > W - 60) { job.done = false; s.missed++ } }
        s.jobs = s.jobs.filter((job) => job.x < W + 120)
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Handy with the toolbox 🧰', lines: [`${s.right} jobs fixed`, `${s.wrong} wrong tools grabbed`, `${s.missed} jobs left undone`, `Score ${s.score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const applyTool = (tool: string) => {
    const s = st.current
    if (!s.running) return
    const job = s.jobs.filter((j) => j.done === null).sort((a, b) => b.x - a.x)[0]
    if (!job) return
    if (job.j.tool === tool) { job.done = true; s.right++; s.score += 10 + Math.round(s.speed / 20); s.flash = `${job.j.text} ✓` }
    else { s.wrong++; s.score = Math.max(0, s.score - 4); s.flash = `A ${TOOLS.find((t) => t.id === tool)!.label.toLowerCase()} won’t help with that` }
    const el = svg.current?.querySelector(`[data-job="${job.id}"]`)
    if (el && !reducedMotion()) gsap.fromTo(el, { y: 0 }, { y: job.done ? -16 : 6, duration: 0.15, yoyo: true, repeat: 1 })
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => { const n = Number(e.key); if (n >= 1 && n <= TOOLS.length) applyTool(TOOLS[n - 1].id) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const front = s.jobs.filter((j) => j.done === null).sort((a, b) => b.x - a.x)[0]
  return (
    <GameShell title="Tool Match" score={s.score} best={best} result={result} onRestart={restart}
      hint={`Tap the right tool (or keys 1–6) for the job nearest the end · ${s.flash} · ${Math.max(0, Math.ceil(s.t))}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Conveyor of jobs">
        <rect width={W} height={H} fill="#fffbeb" />
        <rect y={200} width={W} height={40} fill="#57534e" />
        {Array.from({ length: 30 }, (_, i) => <line key={i} x1={((i * 40 + performance.now() * s.speed / 1000) % (W + 40)) - 20} x2={((i * 40 + performance.now() * s.speed / 1000) % (W + 40)) - 20} y1={202} y2={238} stroke="#78716c" strokeWidth={3} />)}
        <rect x={W - 60} y={60} width={60} height={180} fill="#ef444433" />
        <text x={W - 30} y={80} textAnchor="middle" fontSize={11} fill="#b91c1c" fontWeight={800}>too late</text>
        {s.jobs.map((job) => (
          <g key={job.id} data-job={job.id} transform={`translate(${job.x} 150)`} opacity={job.done === null ? 1 : 0.5}>
            <rect x={-80} y={-40} width={160} height={88} rx={12} fill={job.done ? '#dcfce7' : job.done === false ? '#fee2e2' : '#fff'} stroke={job === front ? '#f59e0b' : '#d6d3d1'} strokeWidth={job === front ? 4 : 2} />
            <text textAnchor="middle" y={4} fontSize={32}>{job.j.glyph}</text>
            <text textAnchor="middle" y={34} fontSize={12} fontWeight={700} fill="#292524">{job.j.text}</text>
          </g>
        ))}
      </svg>
      <div className="cf-tray">
        {TOOLS.map((t, i) => <button key={t.id} type="button" onClick={() => applyTool(t.id)}>{t.glyph} {t.label} <small style={{ opacity: 0.5 }}>{i + 1}</small></button>)}
      </div>
    </GameShell>
  )
}
