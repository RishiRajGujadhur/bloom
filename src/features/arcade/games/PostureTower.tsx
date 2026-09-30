import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Posture Tower: stack vertebrae into a tall, happy spine. Click to drop the
 * next bone where your pointer is. The chair underneath keeps slumping to one
 * side; move the pointer left/right of centre (or use ← →) to sit it back up.
 * If three bones hit the floor the spine gives up.
 */
const W = 640, H = 540, BASE_Y = 470
type Bone = { id: number; body: Matter.Body; w: number }

export default function PostureTower() {
  const [best, submit] = useBest('posture')
  const [, frame] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ bones: [] as Bone[], tilt: 0, drift: 0.25, input: 0, x: W / 2, fallen: 0, running: true, height: 0, dropped: 0, lastDrop: 0 })
  const engine = useRef<Matter.Engine | null>(null)
  const base = useRef<Matter.Body | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    st.current = { bones: [], tilt: 0, drift: 0.25, input: 0, x: W / 2, fallen: 0, running: true, height: 0, dropped: 0, lastDrop: 0 }
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    engine.current = e
    const b = Matter.Bodies.rectangle(W / 2, BASE_Y, 200, 26, { isStatic: true, friction: 1, chamfer: { radius: 10 } })
    base.current = b
    Matter.Composite.add(e.world, [b, Matter.Bodies.rectangle(W / 2, H + 40, W * 3, 40, { isStatic: true, label: 'floor' })])
    let last = performance.now()
    let raf = 0
    let t = 0
    const keys = { l: false, r: false }
    const kd = (ev: KeyboardEvent) => { if (ev.key === 'ArrowLeft') keys.l = ev.type === 'keydown'; if (ev.key === 'ArrowRight') keys.r = ev.type === 'keydown' }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', kd)
    const loop = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        t += dt
        // Slump: a slow wandering drift that grows with height.
        s.drift = Math.sin(t * 0.35) * (0.18 + s.bones.length * 0.012) + Math.sin(t * 1.3) * 0.04
        const keyIn = (keys.r ? 1 : 0) - (keys.l ? 1 : 0)
        const control = keyIn !== 0 ? keyIn * 0.35 : s.input
        s.tilt += ((s.drift - control) - s.tilt) * dt * 2.2
        s.tilt = Math.max(-0.5, Math.min(0.5, s.tilt))
        Matter.Body.setAngle(b, s.tilt)
        Matter.Engine.update(e, dt * 1000)
        for (let i = s.bones.length - 1; i >= 0; i--) {
          const bn = s.bones[i]
          if (bn.body.position.y > BASE_Y + 40) {
            s.fallen++
            Matter.Composite.remove(e.world, bn.body)
            s.bones.splice(i, 1)
          }
        }
        const top = s.bones.reduce((m, bn) => Math.min(m, bn.body.bounds.min.y), BASE_Y)
        s.height = Math.max(0, Math.round((BASE_Y - top) / 10))
        if (s.fallen >= 3) {
          s.running = false
          const score = s.dropped * 5 + s.height * 3
          const record = submitRef.current(score)
          setResult({ headline: 'Slumped!', lines: [`${s.dropped} vertebrae placed`, `Tallest spine ${s.height}`, `Score ${score}`], record })
        }
      }
      frame((n) => n + 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', kd); Matter.Engine.clear(e) }
  }, [round])

  const toLocal = (ev: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    return m ? new DOMPoint(ev.clientX, ev.clientY).matrixTransform(m.inverse()) : { x: W / 2, y: 0 }
  }
  const move = (ev: React.PointerEvent) => {
    const p = toLocal(ev)
    st.current.x = Math.max(60, Math.min(W - 60, p.x))
    st.current.input = ((p.x - W / 2) / (W / 2)) * 0.6
  }
  const drop = () => {
    const s = st.current
    if (!s.running || !engine.current || performance.now() - s.lastDrop < 450) return
    s.lastDrop = performance.now()
    const top = s.bones.reduce((m, bn) => Math.min(m, bn.body.bounds.min.y), BASE_Y)
    const w = Math.max(56, 120 - s.dropped * 2.2)
    const body = Matter.Bodies.rectangle(s.x, Math.min(60, top - 120), w, 24, { friction: 0.9, frictionStatic: 1, restitution: 0.02, density: 0.002, chamfer: { radius: 10 } })
    Matter.Composite.add(engine.current.world, body)
    s.bones.push({ id: body.id, body, w })
    s.dropped++
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const s = st.current
  const b = base.current
  const nextW = Math.max(56, 120 - s.dropped * 2.2)
  return (
    <GameShell title="Posture Tower" score={s.dropped * 5 + s.height * 3} best={best} result={result} onRestart={restart}
      hint={`Click to drop a vertebra · lean the pointer (or ← →) against the slump · ${3 - s.fallen} slips left · height ${s.height}`}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} onPointerMove={move} onPointerDown={drop} role="img" aria-label="Spine tower" style={{ touchAction: 'none' }}>
        <defs><linearGradient id="pt-bg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e9f5ff" /><stop offset="1" stopColor="#fdf2e6" /></linearGradient></defs>
        <rect width={W} height={H} fill="url(#pt-bg)" />
        {/* Tilt gauge. */}
        <g transform="translate(120 20) scale(.7)">
          <path d="M-100 0 A100 100 0 0 1 100 0" fill="none" stroke="#cbd5e1" strokeWidth={8} transform="translate(0 70)" />
          <line x1={0} y1={70} x2={Math.sin(s.tilt * 2.5) * 90} y2={70 - Math.cos(s.tilt * 2.5) * 90} stroke={Math.abs(s.tilt) > 0.25 ? '#ef4444' : '#22c55e'} strokeWidth={5} strokeLinecap="round" />
          <text y={92} textAnchor="middle" fontSize={12} fill="#475569">{Math.abs(s.tilt) < 0.08 ? 'sitting tall' : s.tilt > 0 ? 'slumping right →' : '← slumping left'}</text>
        </g>
        {/* Chair and base (pelvis). */}
        {b && (
          <g transform={`translate(${b.position.x} ${b.position.y}) rotate(${(b.angle * 180) / Math.PI})`}>
            <rect x={-100} y={-13} width={200} height={26} rx={12} fill="#d9a066" stroke="#9c6b3d" strokeWidth={2} />
            <path d="M-60 13 L-70 60 M60 13 L70 60" stroke="#6b4b2f" strokeWidth={8} strokeLinecap="round" />
          </g>
        )}
        {s.bones.map((bn) => (
          <g key={bn.id} transform={`translate(${bn.body.position.x} ${bn.body.position.y}) rotate(${(bn.body.angle * 180) / Math.PI})`}>
            <rect x={-bn.w / 2} y={-12} width={bn.w} height={24} rx={11} fill="#fbf7ef" stroke="#c8bba5" strokeWidth={2} />
            <ellipse cx={0} cy={0} rx={bn.w / 5} ry={6} fill="#efe6d6" />
            <path d={`M${-bn.w / 2 - 6} 0 l8 -5 v10 z M${bn.w / 2 + 6} 0 l-8 -5 v10 z`} fill="#e8dcc6" />
          </g>
        ))}
        {s.running && (
          <g transform={`translate(${s.x} 60)`} opacity={0.5} pointerEvents="none">
            <rect x={-nextW / 2} y={-12} width={nextW} height={24} rx={11} fill="#fbf7ef" stroke="#c8bba5" strokeWidth={2} strokeDasharray="4 4" />
          </g>
        )}
        <rect y={H - 20} width={W} height={20} fill="#e2d6c3" />
      </svg>
    </GameShell>
  )
}
