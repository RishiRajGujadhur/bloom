import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Plate Painter: a plate spins on a lazy Susan. Pick a colour and paint the
 * meal onto it while it turns: greens, a protein, some grains. Each plate has
 * a sketch in the corner of how the chef likes it; the closer your plate,
 * the bigger the tip. Five plates, fifteen seconds each.
 */
type Food = 'veg' | 'protein' | 'grain'
const FOODS: { id: Food; label: string; color: string }[] = [
  { id: 'veg', label: '🥦 Veg & fruit', color: '#4caf50' },
  { id: 'protein', label: '🍗 Protein', color: '#e76f51' },
  { id: 'grain', label: '🍞 Grains', color: '#e9c46a' },
]
const PLATES: { name: string; target: Record<Food, number> }[] = [
  { name: 'Lunch', target: { veg: 0.5, protein: 0.25, grain: 0.25 } },
  { name: 'Dinner', target: { veg: 0.5, protein: 0.25, grain: 0.25 } },
  { name: 'Salad bowl', target: { veg: 0.65, protein: 0.2, grain: 0.15 } },
  { name: 'Post-run refuel', target: { veg: 0.4, protein: 0.25, grain: 0.35 } },
  { name: 'Light supper', target: { veg: 0.55, protein: 0.3, grain: 0.15 } },
]
const W = 760, H = 480, CX = 330, CY = 250, R = 170
const SECS = 15
type Stamp = { x: number; y: number; f: Food }

const measure = (stamps: Stamp[]) => {
  const count: Record<Food, number> = { veg: 0, protein: 0, grain: 0 }
  let inside = 0, painted = 0
  for (let gx = -R; gx <= R; gx += 10) for (let gy = -R; gy <= R; gy += 10) {
    if (gx * gx + gy * gy > R * R) continue
    inside++
    for (let i = stamps.length - 1; i >= 0; i--) {
      const s = stamps[i]
      if ((s.x - gx) ** 2 + (s.y - gy) ** 2 < 20 * 20) { count[s.f]++; painted++; break }
    }
  }
  return { cover: painted / inside, share: { veg: count.veg / Math.max(1, painted), protein: count.protein / Math.max(1, painted), grain: count.grain / Math.max(1, painted) } }
}

export default function PlatePainter() {
  const [best, submit] = useBest('plate')
  const [food, setFood] = useState<Food>('veg')
  const [stamps, setStamps] = useState<Stamp[]>([])
  const [plate, setPlate] = useState(0)
  const [angle, setAngle] = useState(0)
  const [time, setTime] = useState(SECS)
  const [score, setScore] = useState(0)
  const [tip, setTip] = useState<string | null>(null)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ angle: 0, down: false, t: SECS, plate: 0, score: 0, running: true, tips: [] as number[] })
  const svg = useRef<SVGSVGElement>(null)
  const stampsRef = useRef<Stamp[]>([])
  const tipEl = useRef<SVGTextElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { angle: 0, down: false, t: SECS, plate: 0, score: 0, running: true, tips: [] }
    stampsRef.current = []
    setStamps([]); setPlate(0); setScore(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.angle = (s.angle + dt * (24 + s.plate * 8)) % 360
        s.t -= dt
        setAngle(s.angle)
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) {
          const m = measure(stampsRef.current)
          const tg = PLATES[s.plate].target
          const off = (Object.keys(tg) as Food[]).reduce((n, k) => n + Math.abs(tg[k] - m.share[k]), 0)
          const pts = Math.round(Math.max(0, 100 - off * 100) * Math.min(1, m.cover / 0.8))
          s.score += pts; s.tips.push(pts)
          setScore(s.score)
          setTip(pts > 80 ? `Chef's kiss! +${pts}` : pts > 50 ? `Nice plate +${pts}` : `Hmm… +${pts}`)
          if (tipEl.current && !reducedMotion()) gsap.fromTo(tipEl.current, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(2)', svgOrigin: `${CX} 40` })
          if (s.plate >= PLATES.length - 1) {
            s.running = false
            const record = submitRef.current(s.score)
            setResult({ headline: 'Kitchen closed', lines: [...s.tips.map((p, i) => `${PLATES[i].name}: ${p}`), `Score ${s.score}`], record })
          } else {
            s.plate++; s.t = SECS
            stampsRef.current = []
            setStamps([]); setPlate(s.plate)
          }
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const paint = (e: React.PointerEvent) => {
    const s = st.current
    if (!s.down || !s.running) return
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const dx = p.x - CX, dy = p.y - CY
    if (dx * dx + dy * dy > (R + 10) ** 2) return
    // Into the plate's rotating frame.
    const a = (-s.angle * Math.PI) / 180
    const lx = dx * Math.cos(a) - dy * Math.sin(a), ly = dx * Math.sin(a) + dy * Math.cos(a)
    stampsRef.current = [...stampsRef.current, { x: lx, y: ly, f: food }]
    setStamps(stampsRef.current)
  }
  const restart = useCallback(() => { setResult(null); setTip(null); setRound((r) => r + 1) }, [])
  const m = measure(stamps)
  const tg = PLATES[plate].target
  const pie = (share: Record<Food, number>, cx: number, cy: number, r: number) => {
    let a0 = -Math.PI / 2
    return FOODS.map((f) => {
      const v = share[f.id]
      if (v <= 0.001) return null
      const a1 = a0 + v * Math.PI * 2
      const large = a1 - a0 > Math.PI ? 1 : 0
      const d = v >= 0.999 ? `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${r * 2} 0 a${r} ${r} 0 1 0 ${-r * 2} 0` : `M${cx} ${cy} L${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z`
      a0 = a1
      return <path key={f.id} d={d} fill={f.color} />
    })
  }
  return (
    <GameShell title="Plate Painter" score={score} best={best} result={result} onRestart={restart}
      hint={`Plate ${plate + 1}/${PLATES.length}: ${PLATES[plate].name} · pick a colour and paint on the spinning plate · ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Spinning plate"
        onPointerDown={(e) => { st.current.down = true; paint(e) }} onPointerMove={paint} onPointerUp={() => { st.current.down = false }} onPointerLeave={() => { st.current.down = false }}
        style={{ cursor: 'crosshair', touchAction: 'none' }}>
        <defs><clipPath id="pp-clip"><circle r={R} /></clipPath></defs>
        <rect width={W} height={H} fill="#fbf4ea" />
        <ellipse cx={CX} cy={CY + 20} rx={R + 40} ry={R + 18} fill="#00000014" />
        <g transform={`translate(${CX} ${CY}) rotate(${angle})`}>
          <circle r={R + 22} fill="#ffffff" stroke="#e6ddd0" strokeWidth={3} />
          <circle r={R} fill="#f7f3ee" />
          <g clipPath="url(#pp-clip)">
            {stamps.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={20} fill={FOODS.find((f) => f.id === s.f)!.color} />)}
          </g>
          <circle r={R + 12} fill="none" stroke="#d8cbb8" strokeWidth={2} strokeDasharray="4 10" />
        </g>
        <g transform="translate(620 80)">
          <text textAnchor="middle" fontSize={13} fill="#7a5c3e" y={-50}>the chef’s sketch</text>
          <circle r={40} fill="#fff" stroke="#e6ddd0" />
          {pie(tg, 0, 0, 34)}
          <text textAnchor="middle" fontSize={13} fill="#7a5c3e" y={80}>your plate</text>
          <circle r={40} cy={140} fill="#fff" stroke="#e6ddd0" />
          {pie(m.share, 0, 140, 34)}
          <text textAnchor="middle" fontSize={12} fill="#7a5c3e" y={200}>covered {Math.round(m.cover * 100)}%</text>
        </g>
        {tip && <text ref={tipEl} x={CX} y={40} textAnchor="middle" fontSize={22} fontWeight={800} fill="#e76f51">{tip}</text>}
      </svg>
      <div className="cf-tray">
        {FOODS.map((f) => <button key={f.id} type="button" className={food === f.id ? 'on' : ''} style={food === f.id ? { background: f.color, borderColor: f.color } : undefined} onClick={() => setFood(f.id)}>{f.label}</button>)}
      </div>
    </GameShell>
  )
}
