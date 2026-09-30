import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Toothbrush Tempo: a sparkly smile in eight zones — top and bottom, left
 * and right, fronts and backs. The glowing zone is where the song wants you;
 * press and scrub little back-and-forth strokes over it to lift the plaque.
 * Zones move on every few beats whether you're done or not.
 */
const W = 760, H = 480, CX = 380, CY = 240
type Zone = { name: string; upper: boolean; from: number; to: number; outer: boolean }
const ZONES: Zone[] = [
  { name: 'top left, outside', upper: true, from: 180, to: 250, outer: true }, { name: 'top front', upper: true, from: 250, to: 290, outer: true },
  { name: 'top right, outside', upper: true, from: 290, to: 360, outer: true }, { name: 'top, inside', upper: true, from: 200, to: 340, outer: false },
  { name: 'bottom right, outside', upper: false, from: 0, to: 70, outer: true }, { name: 'bottom front', upper: false, from: 70, to: 110, outer: true },
  { name: 'bottom left, outside', upper: false, from: 110, to: 180, outer: true }, { name: 'bottom, inside', upper: false, from: 20, to: 160, outer: false },
]
const ZONE_S = 6
type Tooth = { a: number; upper: boolean; plaque: number[] } // plaque per [outer, inner]

export default function ToothbrushTempo() {
  const [best, submit] = useBest('teeth')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ teeth: [] as Tooth[], zone: 0, zt: 0, down: false, last: { x: 0, y: 0, dir: 0 }, strokes: 0, running: true, brush: { x: CX, y: CY } })
  const svg = useRef<SVGSVGElement>(null)
  const brushEl = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const toothPos = (t: Tooth, inner = false) => {
    const rx = inner ? 120 : 175, ry = inner ? 80 : 125
    const ang = (t.a * Math.PI) / 180
    return { x: CX + Math.cos(ang) * rx, y: CY + (t.upper ? -20 : 20) + Math.sin(ang) * ry * (t.upper ? 1 : 1) }
  }
  useEffect(() => {
    const teeth: Tooth[] = []
    for (let i = 0; i < 14; i++) { teeth.push({ a: 185 + i * 12.5, upper: true, plaque: [0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.2] }); teeth.push({ a: 5 + i * 12.5, upper: false, plaque: [0.8 + Math.random() * 0.2, 0.8 + Math.random() * 0.2] }) }
    st.current = { teeth, zone: 0, zt: 0, down: false, last: { x: 0, y: 0, dir: 0 }, strokes: 0, running: true, brush: { x: CX, y: CY } }
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.zt += dt
        if (s.zt >= ZONE_S) {
          s.zt = 0; s.zone++
          if (s.zone >= ZONES.length) {
            s.running = false
            const left = s.teeth.reduce((n, t) => n + t.plaque[0] + t.plaque[1], 0) / (s.teeth.length * 2)
            const score = Math.round((1 - left) * 100)
            const worst = ZONES.map((z, i) => ({ z, v: s.teeth.filter((t) => inZone(t, i)).reduce((n, t) => n + t.plaque[z.outer ? 0 : 1], 0) })).sort((a, b) => b.v - a.v)[0]
            const record = submitRef.current(score)
            setResult({ headline: score > 80 ? 'Sparkling! ✨' : 'Good effort!', lines: [`${score}% of plaque gone`, `${s.strokes} scrubbing strokes`, `Missed the most: ${worst.z.name}`], record })
          }
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const inZone = (t: Tooth, zi: number) => { const z = ZONES[zi]; if (t.upper !== z.upper) return false; const a = ((t.a % 360) + 360) % 360; return a >= z.from && a <= z.to }
  const scrub = (e: React.PointerEvent) => {
    const s = st.current
    const m = svg.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    s.brush = { x: p.x, y: p.y }
    if (brushEl.current) brushEl.current.setAttribute('transform', `translate(${p.x} ${p.y})`)
    if (!s.down || !s.running) { s.last = { x: p.x, y: p.y, dir: s.last.dir }; return }
    const dx = p.x - s.last.x
    const dir = Math.sign(dx)
    // A direction change is one little stroke.
    if (dir && dir !== s.last.dir && Math.abs(dx) > 1) s.strokes++
    const z = ZONES[s.zone]
    for (const t of s.teeth) {
      if (!inZone(t, s.zone)) continue
      const q = toothPos(t, !z.outer)
      if (Math.hypot(q.x - p.x, q.y - p.y) < 40) t.plaque[z.outer ? 0 : 1] = Math.max(0, t.plaque[z.outer ? 0 : 1] - Math.min(0.08, Math.abs(dx) * 0.004))
    }
    s.last = { x: p.x, y: p.y, dir: dir || s.last.dir }
    if (brushEl.current && !reducedMotion() && Math.random() < 0.2) {
      const b = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      b.setAttribute('cx', String(p.x + (Math.random() - 0.5) * 30)); b.setAttribute('cy', String(p.y + (Math.random() - 0.5) * 20)); b.setAttribute('r', '5'); b.setAttribute('fill', '#fff'); b.setAttribute('stroke', '#bae6fd')
      svg.current?.appendChild(b)
      gsap.to(b, { attr: { r: 10 }, opacity: 0, y: -14, duration: 0.8, onComplete: () => b.remove() })
    }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const z = ZONES[Math.min(s.zone, ZONES.length - 1)]
  return (
    <GameShell title="Toothbrush Tempo" score={Math.round((1 - s.teeth.reduce((n, t) => n + t.plaque[0] + t.plaque[1], 0) / Math.max(1, s.teeth.length * 2)) * 100)} best={best} result={result} onRestart={restart}
      hint={`Zone ${Math.min(s.zone + 1, 8)}/8: ${z.name} · press and scrub little back-and-forth strokes · ♪ ${Math.ceil(ZONE_S - s.zt)} beats left here`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerDown={(e) => { st.current.down = true; scrub(e) }} onPointerMove={scrub} onPointerUp={() => { st.current.down = false }} onPointerLeave={() => { st.current.down = false }} role="img" aria-label="Teeth" style={{ touchAction: 'none', cursor: 'none' }}>
        <rect width={W} height={H} fill="#fdf2f8" />
        <ellipse cx={CX} cy={CY} rx={260} ry={200} fill="#f9a8d4" />
        <ellipse cx={CX} cy={CY} rx={210} ry={160} fill="#be185d" opacity={0.25} />
        <ellipse cx={CX} cy={CY + 10} rx={100} ry={60} fill="#fb7185" opacity={0.5} />
        {/* Zone glow. */}
        {s.teeth.filter((t) => inZone(t, s.zone)).map((t, i) => { const q = toothPos(t, !z.outer); return <circle key={i} cx={q.x} cy={q.y} r={26} fill="#fde047" opacity={0.25 + 0.15 * Math.sin(performance.now() / 150)} /> })}
        {s.teeth.map((t, i) => {
          const q = toothPos(t)
          const qi = toothPos(t, true)
          const ang = t.a + 90
          return (
            <g key={i}>
              <g transform={`translate(${q.x} ${q.y}) rotate(${ang})`}>
                <rect x={-13} y={-18} width={26} height={36} rx={9} fill="#fffbeb" stroke="#e5e7eb" />
                <rect x={-13} y={-18} width={26} height={36} rx={9} fill="#eab308" opacity={t.plaque[0] * 0.75} />
              </g>
              <circle cx={qi.x} cy={qi.y} r={7} fill="#fef3c7" />
              <circle cx={qi.x} cy={qi.y} r={7} fill="#ca8a04" opacity={t.plaque[1] * 0.7} />
            </g>
          )
        })}
        <g ref={brushEl} pointerEvents="none" transform={`translate(${s.brush.x} ${s.brush.y})`}>
          <rect x={-8} y={-6} width={120} height={12} rx={6} fill="#38bdf8" transform="rotate(20)" />
          <rect x={-22} y={-14} width={30} height={20} rx={4} fill="#f0f9ff" stroke="#7dd3fc" transform="rotate(20)" />
        </g>
        <g transform="translate(24 24)">
          {ZONES.map((_, i) => <rect key={i} x={i * 26} y={0} width={20} height={8} rx={4} fill={i < s.zone ? '#22c55e' : i === s.zone ? '#facc15' : '#fbcfe8'} />)}
        </g>
      </svg>
    </GameShell>
  )
}
