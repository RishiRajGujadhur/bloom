import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Procrastination Pinball: flip the ball up into the glowing START targets to
 * get today's tasks going. The bouncy gremlins — "just one more video",
 * "snack?", "later…" — are fun to hit but drain your focus. Clear the task
 * lights before focus runs out. ← / → or tap the left/right half to flip.
 */
const W = 520, H = 700
type Tag = 'start' | 'gremlin' | 'flipper' | 'wall' | 'ball'
type B = Matter.Body & { tag?: Tag; label2?: string; lit?: boolean; flash?: number }

export default function ProcrastinationPinball() {
  const [best, submit] = useBest('pinball')
  const cv = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ score: 0, focus: 100, balls: 3, tasks: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const flip = useRef({ l: false, r: false })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr
    ctx.scale(dpr, dpr)
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    e.positionIterations = 10; e.velocityIterations = 8
    const st = { isStatic: true, restitution: 0.5, friction: 0 }
    const wall = (x: number, y: number, w: number, h: number, a = 0) => { const b: B = Matter.Bodies.rectangle(x, y, w, h, { ...st, angle: a }); b.tag = 'wall'; return b }
    const walls = [wall(W / 2, -10, W, 20), wall(-10, H / 2, 20, H), wall(W + 10, H / 2, 20, H), wall(70, 560, 160, 16, 0.5), wall(W - 70, 560, 160, 16, -0.5), wall(40, 300, 16, 300), wall(W - 40, 300, 16, 300), wall(120, 70, 220, 16, -0.35), wall(W - 120, 70, 220, 16, 0.35)]
    const starts: B[] = [0, 1, 2, 3, 4].map((i) => { const b: B = Matter.Bodies.rectangle(110 + i * 75, 150, 44, 14, { ...st, restitution: 0.9 }); b.tag = 'start'; b.lit = false; b.flash = 0; return b })
    const names = ['one more video', 'snack?', 'later…', 'check phone']
    const gremlins: B[] = [[160, 290], [360, 290], [260, 390], [260, 230]].map(([x, y], i) => { const b: B = Matter.Bodies.circle(x, y, 28, { ...st, restitution: 1.3 }); b.tag = 'gremlin'; b.label2 = names[i]; b.flash = 0; return b })
    const mkFlipper = (x: number, left: boolean) => {
      const f: B = Matter.Bodies.rectangle(x + (left ? 40 : -40), 615, 96, 16, { density: 0.02, friction: 0, chamfer: { radius: 8 } })
      f.tag = 'flipper'
      const pivot = Matter.Constraint.create({ pointA: { x, y: 615 }, bodyB: f, pointB: { x: left ? -40 : 40, y: 0 }, stiffness: 1, length: 0 })
      return { f, pivot, left, x }
    }
    const L = mkFlipper(150, true), R = mkFlipper(W - 150, false)
    Matter.Composite.add(e.world, [...walls, ...starts, ...gremlins, L.f, R.f, L.pivot, R.pivot])
    const s = { score: 0, focus: 100, balls: 3, tasks: 0, running: true, ball: null as B | null }
    const serve = () => {
      const b: B = Matter.Bodies.circle(W - 70, 120, 11, { restitution: 0.55, friction: 0.001, frictionAir: 0.0008, density: 0.004 })
      b.tag = 'ball'
      Matter.Body.setVelocity(b, { x: -3 - Math.random() * 3, y: 2 })
      Matter.Composite.add(e.world, b)
      s.ball = b
    }
    serve()
    Matter.Events.on(e, 'collisionStart', (ev) => {
      for (const p of ev.pairs) {
        const o = (p.bodyA as B).tag === 'ball' ? (p.bodyB as B) : (p.bodyB as B).tag === 'ball' ? (p.bodyA as B) : null
        if (!o || !s.running) continue
        if (o.tag === 'start' && !o.lit) { o.lit = true; o.flash = 1; s.score += 50; s.focus = Math.min(100, s.focus + 6) }
        else if (o.tag === 'start') { s.score += 5 }
        else if (o.tag === 'gremlin') { o.flash = 1; s.score += 3; s.focus = Math.max(0, s.focus - 7) }
      }
    })
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'ArrowLeft' || ev.key === 'z') { ev.preventDefault(); flip.current.l = ev.type === 'keydown' }
      if (ev.key === 'ArrowRight' || ev.key === '/') { ev.preventDefault(); flip.current.r = ev.type === 'keydown' }
    }
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKey)
    let last = performance.now()
    let raf = 0
    let hudT = 0
    const steer = (fl: typeof L, up: boolean) => {
      const rest = fl.left ? 0.45 : -0.45, top = fl.left ? -0.5 : 0.5
      const target = up ? top : rest
      const av = (target - fl.f.angle) * 0.45
      Matter.Body.setAngularVelocity(fl.f, av)
      if (fl.left ? fl.f.angle < top : fl.f.angle > top) Matter.Body.setAngle(fl.f, top)
    }
    const loop = (now: number) => {
      const dt = Math.min(33, now - last)
      last = now
      steer(L, flip.current.l); steer(R, flip.current.r)
      for (let i = 0; i < 2; i++) Matter.Engine.update(e, dt / 2)
      if (s.running) {
        s.focus = Math.max(0, s.focus - dt * 0.0012)
        const b = s.ball
        if (b && b.position.y > H + 30) {
          Matter.Composite.remove(e.world, b); s.balls--; s.ball = null
          if (s.balls > 0) setTimeout(serve, 700)
        }
        if (starts.every((x) => x.lit)) { s.tasks++; s.score += 200; starts.forEach((x) => { x.lit = false; x.flash = 1 }) }
        if (s.balls <= 0 || s.focus <= 0) {
          s.running = false
          const record = submitRef.current(s.score)
          setResult({ headline: s.focus <= 0 ? 'Focus fizzled out' : 'Out of balls', lines: [`${s.tasks} full sets of tasks started`, `Focus left ${Math.round(s.focus)}`, `Score ${s.score}`], record })
        }
      }
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, dark ? '#001a08' : '#1e1b4b'); g.addColorStop(1, dark ? '#003a18' : '#312e81')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff10'; for (let i = 0; i < 30; i++) ctx.fillRect((i * 97) % W, (i * 131) % H, 2, 2)
      ctx.fillStyle = '#a5b4fc'; ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 6; ctx.lineJoin = 'round'
      for (const w of walls) { const v = w.vertices; ctx.beginPath(); v.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.stroke() }
      for (const t of starts) {
        t.flash = Math.max(0, (t.flash ?? 0) - dt / 600)
        ctx.fillStyle = t.lit ? '#22c55e' : `rgba(250, 204, 21, ${0.5 + 0.5 * Math.sin(now / 200)})`
        ctx.shadowColor = t.lit ? '#22c55e' : '#facc15'; ctx.shadowBlur = 14 + (t.flash ?? 0) * 20
        ctx.fillRect(t.position.x - 22, t.position.y - 7, 44, 14)
        ctx.shadowBlur = 0
      }
      ctx.fillStyle = '#e0e7ff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('START THE TASK', W / 2, 128)
      for (const gr of gremlins) {
        gr.flash = Math.max(0, (gr.flash ?? 0) - dt / 400)
        const r = 28 + (gr.flash ?? 0) * 6
        ctx.fillStyle = `hsl(${320 + (gr.flash ?? 0) * 40}, 80%, 60%)`
        ctx.beginPath(); ctx.arc(gr.position.x, gr.position.y, r, 0, 7); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(gr.position.x - 9, gr.position.y - 6, 6, 0, 7); ctx.arc(gr.position.x + 9, gr.position.y - 6, 6, 0, 7); ctx.fill()
        ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(gr.position.x - 8, gr.position.y - 5, 3, 0, 7); ctx.arc(gr.position.x + 10, gr.position.y - 5, 3, 0, 7); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '10px system-ui'; ctx.fillText(gr.label2 ?? '', gr.position.x, gr.position.y + 44)
      }
      for (const fl of [L, R]) {
        ctx.save(); ctx.translate(fl.f.position.x, fl.f.position.y); ctx.rotate(fl.f.angle)
        ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.roundRect(-48, -8, 96, 16, 8); ctx.fill(); ctx.restore()
        ctx.fillStyle = '#fde68a'; ctx.beginPath(); ctx.arc(fl.x, 615, 6, 0, 7); ctx.fill()
      }
      if (s.ball) {
        const b = s.ball
        const rg = ctx.createRadialGradient(b.position.x - 4, b.position.y - 4, 2, b.position.x, b.position.y, 11)
        rg.addColorStop(0, '#fff'); rg.addColorStop(1, '#94a3b8')
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 11, 0, 7); ctx.fill()
      }
      // Focus bar.
      ctx.fillStyle = '#ffffff22'; ctx.fillRect(20, H - 22, W - 40, 10)
      ctx.fillStyle = s.focus > 40 ? '#22c55e' : '#ef4444'; ctx.fillRect(20, H - 22, (W - 40) * (s.focus / 100), 10)
      if ((hudT += dt) > 200) { hudT = 0; setHud({ score: s.score, focus: Math.round(s.focus), balls: s.balls, tasks: s.tasks }) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); Matter.Engine.clear(e) }
  }, [round])

  const press = (ev: React.PointerEvent<HTMLCanvasElement>, down: boolean) => {
    const r = ev.currentTarget.getBoundingClientRect()
    const left = ev.clientX - r.left < r.width / 2
    if (down) flip.current[left ? 'l' : 'r'] = true
    else { flip.current.l = false; flip.current.r = false }
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Procrastination Pinball" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`← / → or tap left/right to flip · light all five START targets · focus ${hud.focus} · balls ${hud.balls} · task sets ${hud.tasks}`}>
      <canvas key={round} ref={cv} className="pb-canvas" onPointerDown={(e) => press(e, true)} onPointerUp={(e) => press(e, false)} onPointerLeave={(e) => press(e, false)} aria-label="Pinball table" />
    </GameShell>
  )
}
