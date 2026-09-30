import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Morning Flow: the tram leaves at 7:30. Tap a card to start it. Some jobs
 * need you the whole time; others (the kettle, toast, washing machine) just
 * need starting and then run by themselves while you do something else. Get
 * all the must-dos done and reach the door before the tram.
 */
type Job = { id: string; label: string; glyph: string; mins: number; hands: boolean; must: boolean; needs?: string }
const JOBS: Job[] = [
  { id: 'kettle', label: 'Boil kettle', glyph: '☕', mins: 4, hands: false, must: false },
  { id: 'tea', label: 'Make tea', glyph: '🍵', mins: 2, hands: true, must: false, needs: 'kettle' },
  { id: 'toast', label: 'Toast on', glyph: '🍞', mins: 3, hands: false, must: false },
  { id: 'eat', label: 'Eat breakfast', glyph: '🥣', mins: 6, hands: true, must: true },
  { id: 'shower', label: 'Shower', glyph: '🚿', mins: 7, hands: true, must: true },
  { id: 'dress', label: 'Get dressed', glyph: '👔', mins: 4, hands: true, must: true, needs: 'shower' },
  { id: 'wash', label: 'Start washing', glyph: '🧺', mins: 12, hands: false, must: false },
  { id: 'bag', label: 'Pack bag', glyph: '🎒', mins: 3, hands: true, must: true },
  { id: 'teeth', label: 'Brush teeth', glyph: '🦷', mins: 2, hands: true, must: true, needs: 'eat' },
  { id: 'plants', label: 'Water plants', glyph: '🌿', mins: 2, hands: true, must: false },
]
const START = 7 * 60, TRAM = 7 * 60 + 30
const TICK = 0.8 // real seconds per game minute
const W = 800, H = 480

export default function MorningFlow() {
  const [best, submit] = useBest('morning')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ now: START, acc: 0, hands: null as null | { id: string; left: number }, bg: [] as { id: string; left: number }[], done: new Set<string>(), running: true, left: false })
  const tram = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const finish = useCallback((leftHome: boolean) => {
    const s = st.current
    s.running = false
    const musts = JOBS.filter((j) => j.must)
    const missing = musts.filter((j) => !s.done.has(j.id))
    const extras = JOBS.filter((j) => !j.must && s.done.has(j.id)).length
    const caught = leftHome && s.now <= TRAM
    const spare = Math.max(0, TRAM - s.now)
    const score = Math.max(0, (caught ? 60 : 0) + (musts.length - missing.length) * 10 + extras * 8 + spare * 3)
    if (tram.current && !reducedMotion()) gsap.to(tram.current, { x: -900, duration: 1.6, ease: 'power2.in' })
    const record = submitRef.current(score)
    setTimeout(() => setResult({ headline: caught ? (missing.length ? 'Caught it… but forgot things' : 'Caught the tram! 🚋') : 'Missed the tram', lines: [missing.length ? `Forgot: ${missing.map((m) => m.label.toLowerCase()).join(', ')}` : 'Every must-do done', `${extras} nice extras`, caught ? `${spare} minutes to spare` : 'Next one’s in 20 minutes…', `Score ${score}`], record }), reducedMotion() ? 0 : 1200)
  }, [])

  useEffect(() => {
    st.current = { now: START, acc: 0, hands: null, bg: [], done: new Set(), running: true, left: false }
    if (tram.current) gsap.set(tram.current, { x: 0 })
    let last = performance.now()
    let raf = 0
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      const s = st.current
      if (s.running) {
        s.acc += dt
        while (s.acc >= TICK) {
          s.acc -= TICK
          s.now++
          if (s.hands) { s.hands.left--; if (s.hands.left <= 0) { s.done.add(s.hands.id); s.hands = null } }
          s.bg.forEach((b) => { b.left--; if (b.left <= 0) s.done.add(b.id) })
          s.bg = s.bg.filter((b) => b.left > 0)
        }
        if (s.now > TRAM + 2) finish(false)
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, finish])

  const start = (j: Job) => {
    const s = st.current
    if (!s.running || s.done.has(j.id) || s.hands?.id === j.id || s.bg.some((b) => b.id === j.id)) return
    if (j.needs && !s.done.has(j.needs)) return
    if (j.hands) { if (s.hands) return; s.hands = { id: j.id, left: j.mins } }
    else { if (s.hands) return; s.bg.push({ id: j.id, left: j.mins }); s.hands = { id: `start-${j.id}`, left: 1 } }
  }
  const leave = () => { const s = st.current; if (s.running && !s.hands) finish(true) }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const clock = `${Math.floor(s.now / 60)}:${String(s.now % 60).padStart(2, '0')}`
  const status = (j: Job) => s.done.has(j.id) ? 'done' : s.hands?.id === j.id || s.bg.some((b) => b.id === j.id) ? 'busy' : j.needs && !s.done.has(j.needs) ? 'locked' : 'ready'
  return (
    <GameShell title="Morning Flow" score={Math.max(0, TRAM - s.now)} best={best} result={result} onRestart={restart}
      hint={`${clock} · tram at 7:30 · tap to start a job; ⚙ jobs run by themselves once started · gold-edged cards are must-dos`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Morning routine">
        <rect width={W} height={H} fill="#fffbeb" />
        <rect y={390} width={W} height={90} fill="#e7e5e4" />
        <line x1={0} x2={W} y1={440} y2={440} stroke="#a8a29e" strokeWidth={4} strokeDasharray="20 12" />
        <g transform="translate(600 360)"><g ref={tram}>
          <rect width={190} height={70} rx={14} fill="#dc2626" />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={14 + i * 44} y={12} width={32} height={26} rx={4} fill="#bfdbfe" />)}
          <circle cx={40} cy={74} r={10} fill="#1f2937" /><circle cx={150} cy={74} r={10} fill="#1f2937" />
          <text x={95} y={62} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={800}>7:30 CITY</text>
        </g></g>
        <g transform="translate(40 30)">
          <circle r={34} cx={34} cy={34} fill="#fff" stroke="#78716c" strokeWidth={4} />
          <line x1={34} y1={34} x2={34 + Math.sin(((s.now % 60) / 60) * Math.PI * 2) * 24} y2={34 - Math.cos(((s.now % 60) / 60) * Math.PI * 2) * 24} stroke="#dc2626" strokeWidth={3} strokeLinecap="round" />
          <line x1={34} y1={34} x2={34 + Math.sin(((s.now / 60) % 12 / 12) * Math.PI * 2) * 16} y2={34 - Math.cos(((s.now / 60) % 12 / 12) * Math.PI * 2) * 16} stroke="#1c1917" strokeWidth={4} strokeLinecap="round" />
          <text x={84} y={42} fontSize={26} fontWeight={800} fill={s.now > TRAM - 5 ? '#dc2626' : '#1c1917'}>{clock}</text>
        </g>
        {JOBS.map((j, i) => {
          const x = 30 + (i % 5) * 150, y = 110 + Math.floor(i / 5) * 130
          const stt = status(j)
          const run = s.hands?.id === j.id ? s.hands : s.bg.find((b) => b.id === j.id)
          return (
            <g key={j.id} transform={`translate(${x} ${y})`} onPointerDown={() => start(j)} style={{ cursor: stt === 'ready' && !s.hands ? 'pointer' : 'default' }} opacity={stt === 'locked' ? 0.45 : 1}>
              <rect width={136} height={110} rx={14} fill={stt === 'done' ? '#dcfce7' : stt === 'busy' ? '#fef9c3' : '#fff'} stroke={j.must ? '#f59e0b' : '#d6d3d1'} strokeWidth={j.must ? 3 : 2} />
              <text x={14} y={40} fontSize={30}>{j.glyph}</text>
              {!j.hands && <text x={116} y={24} textAnchor="end" fontSize={14}>⚙</text>}
              <text x={14} y={70} fontSize={13} fontWeight={700} fill="#292524">{j.label}</text>
              <text x={14} y={90} fontSize={11} fill="#78716c">{stt === 'done' ? '✓ done' : stt === 'locked' ? `after ${JOBS.find((x) => x.id === j.needs)?.label.toLowerCase()}` : `${j.mins} min${j.hands ? '' : ' (runs itself)'}`}</text>
              {run && <rect x={10} y={98} width={116 * (1 - run.left / j.mins)} height={5} rx={2} fill="#f59e0b" />}
            </g>
          )
        })}
        <g transform="translate(40 380)" onPointerDown={leave} style={{ cursor: 'pointer' }}>
          <rect width={150} height={50} rx={25} fill="#16a34a" />
          <text x={75} y={32} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">🚪 Out the door</text>
        </g>
        {s.hands && !s.hands.id.startsWith('start-') && <text x={220} y={412} fontSize={13} fill="#57534e">busy: {JOBS.find((j) => j.id === s.hands!.id)?.label.toLowerCase()}…</text>}
      </svg>
    </GameShell>
  )
}
