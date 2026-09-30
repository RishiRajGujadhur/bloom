import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Stretch Snap: a glowing outline shows a stretch. Drag the figure's hands
 * and feet into it, then hold still while the breath ring fills. Snap as many
 * poses as you can in 75 seconds; each held pose earns more when you're quick
 * to find it.
 */
type P = [number, number]
type Pose = { name: string; lh: P; rh: P; lf: P; rf: P }
const W = 760, H = 500
const SHOULDER_L: P = [340, 190], SHOULDER_R: P = [420, 190], HIP_L: P = [355, 300], HIP_R: P = [405, 300]
const ARM = 78, LEG = 86
const POSES: Pose[] = [
  { name: 'Reach for the sky', lh: [330, 50], rh: [430, 50], lf: [350, 450], rf: [410, 450] },
  { name: 'Star', lh: [220, 110], rh: [540, 110], lf: [280, 440], rf: [480, 440] },
  { name: 'Side bend left', lh: [230, 180], rh: [300, 70], lf: [340, 450], rf: [420, 450] },
  { name: 'Side bend right', lh: [460, 70], rh: [530, 180], lf: [340, 450], rf: [420, 450] },
  { name: 'T-pose', lh: [210, 190], rh: [550, 190], lf: [350, 450], rf: [410, 450] },
  { name: 'Lunge', lh: [300, 120], rh: [460, 120], lf: [250, 430], rf: [500, 440] },
  { name: 'Airplane', lh: [220, 230], rh: [540, 150], lf: [360, 450], rf: [520, 300] },
]
const TIME = 75
// Two-bone IK: where the elbow/knee goes for a reach from a to b.
const joint = (a: P, b: P, len: number, bendRight: boolean): P => {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const d = Math.min(len * 2 - 1, Math.hypot(dx, dy))
  const h = Math.sqrt(Math.max(0, len * len - (d / 2) ** 2))
  const mx = a[0] + (dx / 2) * (d / Math.hypot(dx, dy) || 1), my = a[1] + (dy / 2) * (d / Math.hypot(dx, dy) || 1)
  const nx = -dy / (Math.hypot(dx, dy) || 1), ny = dx / (Math.hypot(dx, dy) || 1)
  return bendRight ? [mx + nx * h, my + ny * h] : [mx - nx * h, my - ny * h]
}
const clampReach = (from: P, to: P, max: number): P => {
  const dx = to[0] - from[0], dy = to[1] - from[1], d = Math.hypot(dx, dy)
  return d <= max ? to : [from[0] + (dx / d) * max, from[1] + (dy / d) * max]
}

export default function StretchSnap() {
  const [best, submit] = useBest('stretch')
  const [pi, setPi] = useState(0)
  const [body, setBody] = useState({ lh: [300, 280] as P, rh: [460, 280] as P, lf: [350, 450] as P, rf: [410, 450] as P })
  const [hold, setHold] = useState(0)
  const [time, setTime] = useState(TIME)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const drag = useRef<keyof typeof body | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const ghost = useRef<SVGGElement>(null)
  const st = useRef({ t: TIME, score: 0, snapped: 0, since: 0, running: true, hold: 0 })
  const bodyRef = useRef(body)
  useEffect(() => { bodyRef.current = body }, [body])
  const piRef = useRef(pi)
  useEffect(() => { piRef.current = pi }, [pi])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { t: TIME, score: 0, snapped: 0, since: 0, running: true, hold: 0 }
    setPi(0); setScore(0); setHold(0)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt; s.since += dt
        const pose = POSES[piRef.current % POSES.length]
        const b = bodyRef.current
        const ok = (['lh', 'rh', 'lf', 'rf'] as const).every((k) => Math.hypot(b[k][0] - pose[k][0], b[k][1] - pose[k][1]) < 34)
        s.hold = ok ? s.hold + dt : Math.max(0, s.hold - dt * 2)
        setHold(s.hold)
        if (s.hold >= 2) {
          s.snapped++; s.score += 20 + Math.max(0, Math.round(15 - s.since)); s.hold = 0; s.since = 0
          setScore(s.score)
          setPi((x) => x + 1)
          if (ghost.current && !reducedMotion()) gsap.fromTo(ghost.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, svgOrigin: '380 250' })
        }
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: 'Nicely stretched!', lines: [`${s.snapped} poses held`, `Score ${s.score}`], record })
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const pt = (e: React.PointerEvent): P => {
    const m = svg.current?.getScreenCTM()
    if (!m) return [0, 0]
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return [p.x, p.y]
  }
  const move = (e: React.PointerEvent) => {
    const k = drag.current
    if (!k) return
    const p = pt(e)
    const from = k === 'lh' ? SHOULDER_L : k === 'rh' ? SHOULDER_R : k === 'lf' ? HIP_L : HIP_R
    setBody((b) => ({ ...b, [k]: clampReach(from, p, (k.endsWith('h') ? ARM : LEG) * 2 - 2) }))
  }
  const restart = useCallback(() => { setResult(null); setBody({ lh: [300, 280], rh: [460, 280], lf: [350, 450], rf: [410, 450] }); setRound((r) => r + 1) }, [])
  const pose = POSES[pi % POSES.length]
  const limb = (a: P, b: P, len: number, right: boolean, color: string, width: number) => {
    const j = joint(a, b, len, right)
    return <path d={`M${a[0]} ${a[1]} L${j[0]} ${j[1]} L${b[0]} ${b[1]}`} stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  }
  const figure = (b: typeof body, color: string, width: number) => (
    <>
      {limb(SHOULDER_L, b.lh, ARM, false, color, width)}
      {limb(SHOULDER_R, b.rh, ARM, true, color, width)}
      {limb(HIP_L, b.lf, LEG, true, color, width)}
      {limb(HIP_R, b.rf, LEG, false, color, width)}
      <path d={`M${SHOULDER_L[0]} ${SHOULDER_L[1]} L${SHOULDER_R[0]} ${SHOULDER_R[1]} L${HIP_R[0]} ${HIP_R[1]} L${HIP_L[0]} ${HIP_L[1]} Z`} fill={color} stroke={color} strokeWidth={width} strokeLinejoin="round" />
      <circle cx={380} cy={140} r={34} fill={color} />
    </>
  )
  return (
    <GameShell title="Stretch Snap" score={score} best={best} result={result} onRestart={restart}
      hint={`${pose.name} · drag hands and feet into the glow, then hold still · ${time}s`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerUp={() => { drag.current = null }} onPointerLeave={() => { drag.current = null }} role="img" aria-label="Stretching figure" style={{ touchAction: 'none' }}>
        <defs><filter id="ss-glow"><feGaussianBlur stdDeviation="6" /></filter></defs>
        <rect width={W} height={H} fill="#f2f7ff" />
        <rect y={462} width={W} height={38} fill="#cfe0f7" />
        <g ref={ghost} opacity={1}>
          <g filter="url(#ss-glow)" opacity={0.6}>{figure(pose, '#7dd3fc', 26)}</g>
          {(['lh', 'rh', 'lf', 'rf'] as const).map((k) => <circle key={k} cx={pose[k][0]} cy={pose[k][1]} r={34} fill="#bae6fd" opacity={0.6} />)}
        </g>
        <g>{figure(body, '#f97316', 16)}</g>
        {(['lh', 'rh', 'lf', 'rf'] as const).map((k) => (
          <circle key={k} cx={body[k][0]} cy={body[k][1]} r={17} fill="#fff" stroke="#f97316" strokeWidth={5} style={{ cursor: 'grab' }}
            onPointerDown={(e) => { drag.current = k; (e.target as Element).setPointerCapture?.(e.pointerId) }} />
        ))}
        <g transform="translate(660 70)">
          <circle r={40} fill="none" stroke="#e2e8f0" strokeWidth={8} />
          <circle r={40} fill="none" stroke="#22c55e" strokeWidth={8} strokeDasharray={`${(hold / 2) * 251} 251`} transform="rotate(-90)" />
          <text y={5} textAnchor="middle" fontSize={13} fill="#334155">{hold > 0 ? 'breathe…' : 'hold'}</text>
        </g>
      </svg>
    </GameShell>
  )
}
