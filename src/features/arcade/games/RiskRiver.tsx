import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Risk River (p5.js): hop a frog across the river on drifting stones. Point
 * where you want to go, hold to charge the leap, release to jump. Grey stones
 * are steady, brown ones wobble and sink if you linger, lily pads barely hold
 * you at all — and the shiny stones with coins always seem just a bit too
 * far. Three splashes and you're out.
 */
const W = 520, H = 640
type Stone = { x: number; y: number; r: number; kind: 'rock' | 'wobble' | 'lily' | 'gold'; vx: number; sink: number; coin: boolean }

export default function RiskRiver() {
  const [best, submit] = useBest('river')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ score: 0, lives: 3, dist: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const stones: Stone[] = []
    const mk = (y: number): Stone => {
      const r = Math.random()
      const kind: Stone['kind'] = r < 0.4 ? 'rock' : r < 0.7 ? 'wobble' : r < 0.9 ? 'lily' : 'gold'
      return { x: 60 + Math.random() * (W - 120), y, r: kind === 'lily' ? 20 : kind === 'gold' ? 22 : 28 + Math.random() * 8, kind, vx: (Math.random() - 0.5) * 30, sink: 0, coin: kind === 'gold' || Math.random() < 0.15 }
    }
    for (let y = H - 120; y > -H; y -= 95) stones.push(mk(y))
    const st = { on: stones[0] as Stone | null, fx: stones[0].x, fy: stones[0].y, charging: false, charge: 0, aim: { x: W / 2, y: 0 }, jump: null as null | { from: { x: number; y: number }; to: { x: number; y: number }; t: number }, cam: 0, lives: 3, coins: 0, dist: 0, running: true, splash: 0 }
    stones[0].kind = 'rock'; stones[0].coin = false; stones[0].x = W / 2; stones[0].vx = 0; st.fx = W / 2
    let press: (down: boolean, x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        // Drift and sinking.
        for (const k of stones) {
          k.x += k.vx * dt
          if (k.x < 40 || k.x > W - 40) k.vx *= -1
          if (st.on === k && !st.jump) {
            const rate = k.kind === 'wobble' ? 0.55 : k.kind === 'lily' ? 1.6 : k.kind === 'gold' ? 0.8 : 0
            k.sink += rate * dt
          } else k.sink = Math.max(0, k.sink - dt * 0.3)
        }
        if (st.running) {
          if (st.charging) st.charge = Math.min(1, st.charge + dt * 0.9)
          if (st.jump) {
            st.jump.t += dt * 2.2
            const t = Math.min(1, st.jump.t)
            st.fx = st.jump.from.x + (st.jump.to.x - st.jump.from.x) * t
            st.fy = st.jump.from.y + (st.jump.to.y - st.jump.from.y) * t
            if (t >= 1) {
              const land = stones.find((k) => k.sink < 1 && Math.hypot(k.x - st.fx, k.y - st.fy) < k.r + 4)
              st.jump = null
              if (land) {
                st.on = land
                if (land.coin) { land.coin = false; st.coins += land.kind === 'gold' ? 5 : 1 }
                st.dist = Math.max(st.dist, Math.round((H - 120 - land.y) / 10))
              } else splash()
            }
          } else if (st.on) {
            st.fx = st.on.x; st.fy = st.on.y
            if (st.on.sink >= 1) splash()
          }
          // Camera follows upward; recycle stones.
          st.cam += ((H - 180 - st.fy) - st.cam) * dt * 2
          for (const k of stones) if (k.y + st.cam > H + 60) { const top = Math.min(...stones.map((q) => q.y)); Object.assign(k, mk(top - 95)) }
        }
        st.splash = Math.max(0, st.splash - dt)
        // Draw river.
        s.background(dark ? s.color(0, 30, 12) : s.color(56, 140, 190))
        s.stroke(255, 255, 255, 50); s.strokeWeight(2)
        for (let i = 0; i < 24; i++) { const y = ((i * 57 + s.frameCount * 1.5) % (H + 40)) - 20; const x = (i * 97) % W; s.line(x, y, x + 24, y + 4) }
        s.noStroke()
        s.push(); s.translate(0, st.cam)
        for (const k of stones) {
          const a = 1 - Math.min(1, k.sink)
          const bob = k.kind === 'wobble' || k.kind === 'lily' ? Math.sin(s.frameCount * 0.2 + k.x) * k.sink * 3 : 0
          s.fill(255, 255, 255, 60 * a); s.ellipse(k.x, k.y + 6, k.r * 2.2, k.r * 1.1)
          const c = k.kind === 'rock' ? [140, 140, 150] : k.kind === 'wobble' ? [150, 110, 70] : k.kind === 'lily' ? [70, 170, 80] : [230, 190, 60]
          s.fill(c[0], c[1], c[2], 255 * a); s.ellipse(k.x + bob, k.y, k.r * 2, k.r * 1.6)
          if (k.kind === 'lily') { s.fill(dark ? s.color(0, 26, 8) : s.color(56, 140, 190)); s.triangle(k.x, k.y, k.x + k.r, k.y - 6, k.x + k.r, k.y + 6) }
          if (k.coin) { s.fill(255, 215, 0, 255 * a); s.circle(k.x, k.y - 4, 12); s.fill(180, 130, 0, 255 * a); s.textSize(9); s.textAlign(s.CENTER, s.CENTER); s.text('✦', k.x, k.y - 4) }
        }
        // Aim arc while charging.
        if (st.charging && !st.jump) {
          const target = aimPoint()
          s.stroke(255, 255, 255, 180); s.strokeWeight(2); s.noFill()
          const n = 12
          for (let i = 0; i < n; i++) { const t = i / n; const x = st.fx + (target.x - st.fx) * t, y = st.fy + (target.y - st.fy) * t - Math.sin(t * Math.PI) * 30; s.point(x, y) }
          s.circle(target.x, target.y, 16)
          s.noStroke()
        }
        // Frog.
        const hop = st.jump ? Math.sin(Math.min(1, st.jump.t) * Math.PI) : 0
        s.fill(0, 0, 0, 40); s.ellipse(st.fx, st.fy + 6, 30, 12)
        s.fill(dark ? s.color(0, 255, 102) : s.color(120, 200, 80)); s.ellipse(st.fx, st.fy - 6 - hop * 26, 30 + hop * 6, 24 + hop * 4)
        s.fill(255); s.circle(st.fx - 8, st.fy - 16 - hop * 26, 9); s.circle(st.fx + 8, st.fy - 16 - hop * 26, 9)
        s.fill(0); s.circle(st.fx - 8, st.fy - 16 - hop * 26, 4); s.circle(st.fx + 8, st.fy - 16 - hop * 26, 4)
        if (st.splash > 0) { s.noFill(); s.stroke(255); s.strokeWeight(3); s.circle(st.fx, st.fy, (1 - st.splash) * 90); s.noStroke() }
        s.pop()
        // Charge bar.
        s.fill(255, 255, 255, 90); s.rect(20, H - 30, W - 40, 10, 5)
        s.fill(250, 204, 21); s.rect(20, H - 30, (W - 40) * st.charge, 10, 5)
        if (s.frameCount % 6 === 0) setHud({ score: st.coins * 10 + st.dist, lives: st.lives, dist: st.dist })
      }
      const aimPoint = () => {
        const dx = st.aim.x - st.fx, dy = (st.aim.y - st.cam) - st.fy
        const d = Math.hypot(dx, dy) || 1
        const len = 40 + st.charge * 200
        return { x: st.fx + (dx / d) * len, y: st.fy + (dy / d) * len }
      }
      const splash = () => {
        st.lives--; st.splash = 1; st.jump = null
        // Swim back to the nearest safe rock behind.
        const safe = stones.filter((k) => k.kind === 'rock' && k.y >= st.fy - 20).sort((a, b) => Math.hypot(a.x - st.fx, a.y - st.fy) - Math.hypot(b.x - st.fx, b.y - st.fy))[0] ?? stones[0]
        safe.sink = 0; st.on = safe
        if (st.lives <= 0) {
          st.running = false
          const score = st.coins * 10 + st.dist
          const record = submitRef.current(score)
          setResult({ headline: 'Soggy frog', lines: [`${st.dist} m upstream`, `${st.coins} coins`, `Score ${score}`], record })
        }
      }
      press = (down, x, y) => {
        if (!st.running) return
        st.aim = { x, y }
        if (down && !st.jump) { st.charging = true; st.charge = 0 }
        if (!down && st.charging) {
          st.charging = false
          const to = aimPoint()
          st.jump = { from: { x: st.fx, y: st.fy }, to, t: 0 }
          st.on = null
          st.charge = 0
        }
      }
    }
    const loc = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const down = (e: PointerEvent) => { const p = loc(e); if (p) press(true, p.x, p.y) }
    const up = (e: PointerEvent) => { const p = loc(e); if (p) press(false, p.x, p.y) }
    const move = (e: PointerEvent) => { const p = loc(e); if (p) st.aim = { x: p.x, y: p.y } }
    el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointermove', move)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', down); el.removeEventListener('pointerup', up); el.removeEventListener('pointermove', move); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Risk River" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Point, hold to charge, release to leap · grey = steady, brown = wobbly, lily = barely · ${'🐸'.repeat(Math.max(0, hud.lives))} · ${hud.dist} m`}>
      <div ref={host} className="rr-host" />
    </GameShell>
  )
}
