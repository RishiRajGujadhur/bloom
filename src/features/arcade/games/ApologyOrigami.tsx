import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Apology Origami: a folded note says sorry better than a scrap of paper.
 * Each step shows a dashed crease and a glowing corner — drag that corner to
 * the ring and the paper folds over for real. Rushing a fold (letting go in
 * the wrong place) creases it messily. Three notes: a fortune, an envelope
 * and a cup.
 */
type P = [number, number]
type Poly = { pts: P[]; back: boolean }
type Step = { a: P; b: P; from: P; to: P }
const S = 300
const DESIGNS: { name: string; steps: Step[] }[] = [
  { name: 'Envelope', steps: [
    { a: [0, 200], b: [300, 200], from: [150, 300], to: [150, 100] },
    { a: [80, 0], b: [80, 300], from: [0, 150], to: [160, 150] },
    { a: [220, 0], b: [220, 300], from: [300, 150], to: [140, 150] },
    { a: [80, 60], b: [220, 60], from: [150, 0], to: [150, 120] },
  ] },
  { name: 'Fortune', steps: [
    { a: [150, 0], b: [0, 150], from: [0, 0], to: [150, 150] },
    { a: [150, 0], b: [300, 150], from: [300, 0], to: [150, 150] },
    { a: [300, 150], b: [150, 300], from: [300, 300], to: [150, 150] },
    { a: [0, 150], b: [150, 300], from: [0, 300], to: [150, 150] },
  ] },
  { name: 'Cup', steps: [
    { a: [0, 0], b: [300, 300], from: [0, 300], to: [300, 0] },
    { a: [300, 110], b: [110, 110], from: [300, 300], to: [110, 110] },
    { a: [190, 0], b: [190, 190], from: [0, 0], to: [300, 120] },
    { a: [80, 50], b: [230, 50], from: [150, 0], to: [150, 100] },
  ] },
]
const OX = 230, OY = 90 // paper origin on screen
const W = 760, H = 480

// Signed side of p relative to line a→b.
const side = (a: P, b: P, p: P) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
const clip = (poly: P[], a: P, b: P, keepPositive: boolean): P[] => {
  const out: P[] = []
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i], nxt = poly[(i + 1) % poly.length]
    const sc = side(a, b, cur) * (keepPositive ? 1 : -1), sn = side(a, b, nxt) * (keepPositive ? 1 : -1)
    if (sc >= 0) out.push(cur)
    if ((sc >= 0) !== (sn >= 0)) {
      const t = sc / (sc - sn)
      out.push([cur[0] + (nxt[0] - cur[0]) * t, cur[1] + (nxt[1] - cur[1]) * t])
    }
  }
  return out
}
const reflect = (a: P, b: P, p: P, t = 1): P => {
  // Rotate p about line ab by π·t (seen from above, a flip squashes toward the crease and out the other side).
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy)
  const ux = dx / L, uy = dy / L
  const px = p[0] - a[0], py = p[1] - a[1]
  const along = px * ux + py * uy
  const fx = a[0] + ux * along, fy = a[1] + uy * along
  const k = Math.cos(Math.PI * t)
  return [fx + (p[0] - fx) * k, fy + (p[1] - fy) * k]
}

export default function ApologyOrigami() {
  const [best, submit] = useBest('origami')
  const [di, setDi] = useState(0)
  const [si, setSi] = useState(0)
  const [layers, setLayers] = useState<Poly[]>([{ pts: [[0, 0], [S, 0], [S, S], [0, S]], back: false }])
  const [drag, setDrag] = useState<P | null>(null)
  const [anim, setAnim] = useState<{ moving: Poly[]; still: Poly[]; step: Step; t: number } | null>(null)
  const [creases, setCreases] = useState(0)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const st = useRef({ score: 0, creases: 0, t0: performance.now(), lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  const flat = (): Poly[] => [{ pts: [[0, 0], [S, 0], [S, S], [0, S]], back: false }]
  useEffect(() => { st.current = { score: 0, creases: 0, t0: performance.now(), lines: [] }; setScore(0); setCreases(0); setDi(0); setSi(0); setLayers(flat()) }, [round])

  const design = DESIGNS[di]
  const step = design.steps[si]
  const toPaper = (e: React.PointerEvent): P => {
    const m = svg.current?.getScreenCTM()
    if (!m) return [0, 0]
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [p.x - OX, p.y - OY]
  }
  const fold = () => {
    const s = step
    // The flap is on the side of the crease where the dragged corner started.
    const flapSign = side(s.a, s.b, s.from) > 0
    const still: Poly[] = [], moving: Poly[] = []
    for (const l of layers) {
      const keep = clip(l.pts, s.a, s.b, !flapSign)
      const flap = clip(l.pts, s.a, s.b, flapSign)
      if (keep.length >= 3) still.push({ pts: keep, back: l.back })
      if (flap.length >= 3) moving.push({ pts: flap, back: l.back })
    }
    setAnim({ moving, still, step: s, t: 0 })
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 550)
      setAnim({ moving, still, step: s, t })
      if (t < 1) requestAnimationFrame(tick)
      else {
        const folded = moving.map((m) => ({ pts: m.pts.map((p) => reflect(s.a, s.b, p)).reverse(), back: !m.back }))
        setLayers([...still, ...folded.reverse()])
        setAnim(null)
        next()
      }
    }
    requestAnimationFrame(tick)
  }
  const next = () => {
    if (si + 1 < design.steps.length) { setSi(si + 1); return }
    const stt = st.current
    const secs = (performance.now() - stt.t0) / 1000
    const pts = Math.max(20, Math.round(90 - secs * 1.5 - stt.creases * 10))
    stt.score += pts; stt.lines.push(`${design.name}: ${pts}`)
    setScore(stt.score)
    setTimeout(() => {
      if (di + 1 >= DESIGNS.length) {
        const record = submitRef.current(stt.score)
        setResult({ headline: 'A neat little stack of sorries', lines: [...stt.lines, `${stt.creases} messy creases`, `Score ${stt.score}`], record })
      } else { setDi(di + 1); setSi(0); setLayers(flat()); stt.creases = 0; setCreases(0); stt.t0 = performance.now() }
    }, 900)
  }
  const down = (e: React.PointerEvent) => {
    if (anim || result) return
    const p = toPaper(e)
    if (Math.hypot(p[0] - step.from[0], p[1] - step.from[1]) < 34) { setDrag(p); (e.target as Element).setPointerCapture?.(e.pointerId) }
  }
  const move = (e: React.PointerEvent) => { if (drag) setDrag(toPaper(e)) }
  const up = () => {
    if (!drag) return
    const ok = Math.hypot(drag[0] - step.to[0], drag[1] - step.to[1]) < 40
    setDrag(null)
    if (ok) fold()
    else if (Math.hypot(drag[0] - step.from[0], drag[1] - step.from[1]) > 40) { st.current.creases++; setCreases(st.current.creases) }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const toS = (p: P) => `${OX + p[0]},${OY + p[1]}`
  const paperFront = '#fecdd3', paperBack = '#fda4af'
  // While dragging, preview the flap following the pointer part-way.
  const previewT = drag ? Math.min(0.9, Math.max(0, 1 - Math.hypot(drag[0] - step.to[0], drag[1] - step.to[1]) / Math.max(1, Math.hypot(step.from[0] - step.to[0], step.from[1] - step.to[1])))) : 0
  const renderFold = (still: Poly[], moving: Poly[], s: Step, t: number) => (
    <>
      {still.map((l, i) => <polygon key={`s${i}`} points={l.pts.map(toS).join(' ')} fill={l.back ? paperBack : paperFront} stroke="#e11d48" strokeWidth={1} />)}
      {moving.map((l, i) => <polygon key={`m${i}`} points={l.pts.map((p) => reflect(s.a, s.b, p, t)).map(toS).join(' ')} fill={t > 0.5 !== l.back ? paperBack : paperFront} stroke="#e11d48" strokeWidth={1} opacity={0.97} />)}
    </>
  )
  let body: React.ReactNode
  if (anim) body = renderFold(anim.still, anim.moving, anim.step, anim.t)
  else if (drag && previewT > 0) {
    const flapSign = side(step.a, step.b, step.from) > 0
    const still: Poly[] = [], moving: Poly[] = []
    for (const l of layers) { const k = clip(l.pts, step.a, step.b, !flapSign), f = clip(l.pts, step.a, step.b, flapSign); if (k.length >= 3) still.push({ pts: k, back: l.back }); if (f.length >= 3) moving.push({ pts: f, back: l.back }) }
    body = renderFold(still, moving, step, previewT)
  } else body = layers.map((l, i) => <polygon key={i} points={l.pts.map(toS).join(' ')} fill={l.back ? paperBack : paperFront} stroke="#e11d48" strokeWidth={1} />)
  return (
    <GameShell title="Apology Origami" score={score} best={best} result={result} onRestart={restart}
      hint={`${design.name} · fold ${si + 1}/${design.steps.length} · drag the glowing corner onto the ring${creases ? ` · ${creases} messy creases` : ''}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} role="img" aria-label="Folding paper" style={{ touchAction: 'none' }}>
        <rect width={W} height={H} fill="#fdf4ff" />
        <rect x={OX - 40} y={OY - 40} width={S + 80} height={S + 80} rx={20} fill="#f5d0fe" opacity={0.35} />
        {body}
        {!anim && !result && (
          <>
            <line x1={OX + step.a[0]} y1={OY + step.a[1]} x2={OX + step.b[0]} y2={OY + step.b[1]} stroke="#7c3aed" strokeWidth={2} strokeDasharray="8 6" />
            <circle cx={OX + step.to[0]} cy={OY + step.to[1]} r={22} fill="none" stroke="#7c3aed" strokeWidth={3} strokeDasharray="4 4" />
            <circle cx={OX + (drag ? drag[0] : step.from[0])} cy={OY + (drag ? drag[1] : step.from[1])} r={12} fill="#a855f7" opacity={0.85}>
              {!drag && <animate attributeName="r" values="10;16;10" dur="1.2s" repeatCount="indefinite" />}
            </circle>
          </>
        )}
        <text x={600} y={120} fontSize={14} fill="#6b21a8" fontWeight={800}>{design.name}</text>
        {design.steps.map((_, i) => <circle key={i} cx={606 + i * 22} cy={140} r={7} fill={i < si ? '#a855f7' : i === si ? '#e9d5ff' : '#f3e8ff'} stroke="#a855f7" />)}
      </svg>
    </GameShell>
  )
}
