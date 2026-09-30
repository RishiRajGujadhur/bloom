import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Conflict Knots (p5.js): two ropes lie tangled on a table. Drag any part of
 * either rope to tease them apart until they no longer cross. Yank too fast
 * and the tangle tightens — the ropes lock up for a moment and you'll have to
 * breathe and try again, gently. Five tangles.
 */
const W = 760, H = 480, N = 34, LINK = 16
type Pt = { x: number; y: number; px: number; py: number }

export default function ConflictKnots() {
  const [best, submit] = useBest('knots2')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ crossings: 0, tangle: 1, tension: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const mkRope = (seed: number, level: number): Pt[] => {
      const pts: Pt[] = []
      for (let i = 0; i < N; i++) {
        const t = i / (N - 1)
        const x = 120 + t * 520
        const y = 240 + Math.sin(t * Math.PI * (1.5 + level * 0.6) + seed) * (90 + level * 12)
        pts.push({ x, y, px: x, py: y })
      }
      return pts
    }
    const st = { level: 1, ropes: [mkRope(0, 1), mkRope(Math.PI, 1)], drag: null as null | { r: number; i: number }, tension: 0, locked: 0, score: 0, gentle: 0, running: true, start: performance.now(), mouse: { x: 0, y: 0, px: 0, py: 0 } }
    const load = (level: number) => { st.level = level; st.ropes = [mkRope(Math.random() * 6, level), mkRope(Math.random() * 6 + Math.PI, level)]; st.tension = 0; st.start = performance.now() }
    const segX = (a: Pt, b: Pt, c: Pt, d: Pt) => {
      const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x))
      return o(a, b, c) !== o(a, b, d) && o(c, d, a) !== o(c, d, b)
    }
    const crossings = () => {
      let n = 0
      const [A, B] = st.ropes
      for (let i = 1; i < A.length; i++) for (let j = 1; j < B.length; j++) if (segX(A[i - 1], A[i], B[j - 1], B[j])) n++
      return n
    }
    let press: (down: boolean, x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        // Drag + tension from speed.
        const speed = Math.hypot(st.mouse.x - st.mouse.px, st.mouse.y - st.mouse.py) / Math.max(0.001, dt)
        st.mouse.px = st.mouse.x; st.mouse.py = st.mouse.y
        if (st.drag && st.locked <= 0) {
          st.tension = Math.min(1.2, st.tension + (speed > 900 ? dt * 1.8 : -dt * 0.4))
          if (st.tension >= 1) { st.locked = 2; st.drag = null }
          else { const p = st.ropes[st.drag.r][st.drag.i]; p.x = st.mouse.x; p.y = st.mouse.y }
        } else st.tension = Math.max(0, st.tension - dt * 0.5)
        st.locked = Math.max(0, st.locked - dt)
        // Verlet rope physics (on a table: no gravity, some friction).
        for (const rope of st.ropes) {
          for (const p of rope) { const vx = (p.x - p.px) * 0.86, vy = (p.y - p.py) * 0.86; p.px = p.x; p.py = p.y; p.x += vx; p.y += vy }
          const len = LINK * (1 - st.tension * 0.25)
          for (let it = 0; it < 8; it++) for (let i = 1; i < rope.length; i++) {
            const a = rope[i - 1], b = rope[i]
            const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1
            const diff = (d - len) / d / 2
            const aFixed = st.drag && rope === st.ropes[st.drag.r] && st.drag.i === i - 1
            const bFixed = st.drag && rope === st.ropes[st.drag.r] && st.drag.i === i
            if (!aFixed) { a.x += dx * diff * (bFixed ? 2 : 1); a.y += dy * diff * (bFixed ? 2 : 1) }
            if (!bFixed) { b.x -= dx * diff * (aFixed ? 2 : 1); b.y -= dy * diff * (aFixed ? 2 : 1) }
          }
          for (const p of rope) { p.x = Math.max(10, Math.min(W - 10, p.x)); p.y = Math.max(10, Math.min(H - 10, p.y)) }
        }
        const c = crossings()
        if (st.running && c === 0 && !st.drag) {
          const secs = (performance.now() - st.start) / 1000
          st.score += Math.max(10, Math.round(60 - secs)) + st.level * 10
          if (st.level >= 5) {
            st.running = false
            const record = submitRef.current(st.score)
            setResult({ headline: 'All untangled 🧵', lines: ['Five knots teased apart', `Score ${st.score}`], record })
          } else load(st.level + 1)
        }
        // Draw.
        s.background(dark ? s.color(0, 26, 8) : s.color(236, 222, 200))
        s.stroke(dark ? s.color(0, 60, 25) : s.color(220, 200, 170)); s.strokeWeight(1)
        for (let x = 0; x < W; x += 40) s.line(x, 0, x, H)
        const drawRope = (rope: Pt[], col: [number, number, number]) => {
          s.noFill()
          s.stroke(0, 0, 0, 40); s.strokeWeight(12); s.beginShape(); rope.forEach((p) => s.splineVertex(p.x + 2, p.y + 3)); s.endShape()
          s.stroke(col[0], col[1], col[2]); s.strokeWeight(10); s.beginShape(); rope.forEach((p) => s.splineVertex(p.x, p.y)); s.endShape()
          s.stroke(255, 255, 255, 90); s.strokeWeight(2); s.beginShape(); rope.forEach((p) => s.splineVertex(p.x - 1, p.y - 2)); s.endShape()
        }
        const locked = st.locked > 0
        drawRope(st.ropes[0], locked ? [150, 60, 60] : [220, 90, 60])
        drawRope(st.ropes[1], locked ? [60, 60, 150] : [60, 120, 220])
        s.noStroke()
        for (const rope of st.ropes) { s.fill(80); s.circle(rope[0].x, rope[0].y, 14); s.circle(rope[N - 1].x, rope[N - 1].y, 14) }
        // Tension meter.
        s.fill(255, 255, 255, 120); s.rect(20, 20, 180, 10, 5)
        s.fill(st.tension > 0.7 ? s.color(239, 68, 68) : s.color(250, 204, 21)); s.rect(20, 20, 180 * Math.min(1, st.tension), 10, 5)
        s.fill(dark ? s.color(0, 255, 102) : s.color(60, 40, 20)); s.textSize(12); s.text(locked ? 'too tight — breathe…' : 'tension', 210, 30)
        s.textSize(14); s.text(`crossings ${c}`, W - 130, 30)
        if (s.frameCount % 6 === 0) setHud({ crossings: c, tangle: st.level, tension: st.tension })
      }
      press = (down, x, y) => {
        st.mouse.x = x; st.mouse.y = y
        if (down && st.locked <= 0) {
          let bestD = 26, hit: { r: number; i: number } | null = null
          st.ropes.forEach((rope, r) => rope.forEach((p, i) => { const d = Math.hypot(p.x - x, p.y - y); if (d < bestD) { bestD = d; hit = { r, i } } }))
          st.drag = hit
          st.mouse.px = x; st.mouse.py = y
        }
      }
    }
    const loc = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const down = (e: PointerEvent) => { const p = loc(e); if (p) press(true, p.x, p.y) }
    const move = (e: PointerEvent) => { const p = loc(e); if (p) press(false, p.x, p.y) }
    const up = () => { st.drag = null }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointerleave', up); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Conflict Knots" score={hud.tangle * 10} best={best} result={result} onRestart={restart}
      hint={`Tangle ${hud.tangle}/5 · drag the ropes apart until they don't cross (${hud.crossings} left) · gentle moves — yanking locks them up`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
    </GameShell>
  )
}
