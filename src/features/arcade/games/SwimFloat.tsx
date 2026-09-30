import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Swim Float (p5.js): you've drifted out past the buoys. Hold to swim toward
 * the pointer — it's strong but tiring. Let go to roll onto your back and
 * float, which slowly brings your breath back. Frantic tapping makes you
 * panic and tire faster. Big waves come in sets; float through them and
 * swim in the calm between. Reach the beach.
 */
const W = 780, H = 460
const SHORE = 690

export default function SwimFloat() {
  const [best, submit] = useBest('swim')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ breath: 100, panic: 0, dist: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { x: 90, y: 250, vx: 0, vy: 0, breath: 100, panic: 0, swimming: false, aimX: 400, aimY: 250, t: 0, taps: [] as number[], running: true, floatTime: 0, dunked: 0 }
    const water = (x: number, t: number) => 230 + Math.sin(x * 0.012 + t * 1.4) * (8 + 26 * Math.max(0, Math.sin(t * 0.35)) ** 3) + Math.sin(x * 0.03 - t * 2) * 4
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        st.t += dt
        const surf = water(st.x, st.t)
        if (st.running) {
          const now = performance.now()
          st.taps = st.taps.filter((x) => now - x < 1500)
          st.panic = Math.max(0, Math.min(100, st.panic + (st.taps.length > 5 ? 40 : -12) * dt))
          if (st.swimming) {
            const dx = st.aimX - st.x, dy = st.aimY - st.y, d = Math.hypot(dx, dy) || 1
            st.vx += (dx / d) * 120 * dt; st.vy += (dy / d) * 90 * dt
            st.breath -= dt * (9 + st.panic * 0.15)
          } else {
            // Floating on your back: bob at the surface and recover.
            st.vy += (surf - 6 - st.y) * dt * 3
            st.breath = Math.min(100, st.breath + dt * (7 - st.panic * 0.06))
            st.floatTime += dt
          }
          // A gentle rip pulls you back out; big waves push you around.
          st.vx -= 10 * dt
          st.vy += 20 * dt
          st.vx *= 0.97; st.vy *= 0.94
          st.x = Math.max(40, Math.min(W - 30, st.x + st.vx * dt))
          st.y = Math.max(150, Math.min(H - 30, st.y + st.vy * dt))
          if (st.y > surf + 22) { st.breath -= dt * 18; if (s.frameCount % 30 === 0) st.dunked++ }
          if (st.x >= SHORE) {
            st.running = false
            const score = Math.round(st.breath + 100 + Math.max(0, 60 - st.t) * 2)
            const record = submitRef.current(score)
            setResult({ headline: 'Feet on the sand 🏖️', lines: [`Made it in ${Math.round(st.t)}s`, `Breath left ${Math.round(st.breath)}`, `${Math.round(st.floatTime)}s spent floating`, `Score ${score}`], record })
          } else if (st.breath <= 0) {
            st.running = false
            const score = Math.round((st.x / SHORE) * 80)
            const record = submitRef.current(score)
            setResult({ headline: 'The lifeguard pulled you in', lines: [`Got ${Math.round((st.x / SHORE) * 100)}% of the way`, 'Floating on your back buys time', `Score ${score}`], record })
          }
        }
        // Scene.
        const skyTop = dark ? s.color(0, 20, 8) : s.color(135, 206, 250)
        s.background(skyTop)
        s.noStroke()
        s.fill(dark ? s.color(0, 90, 40) : s.color(250, 225, 170)); s.beginShape(); s.vertex(SHORE - 20, H); s.vertex(SHORE + 10, 225); s.vertex(W, 210); s.vertex(W, H); s.endShape(s.CLOSE)
        s.fill(dark ? s.color(0, 120, 50) : s.color(46, 139, 87)); s.ellipse(W - 40, 190, 50, 70)
        s.fill(dark ? s.color(0, 60, 25) : s.color(30, 120, 190, 230))
        s.beginShape(); s.vertex(0, H)
        for (let x = 0; x <= SHORE + 20; x += 10) s.vertex(x, water(x, st.t))
        s.vertex(SHORE + 20, H); s.endShape(s.CLOSE)
        s.stroke(255, 255, 255, 120); s.strokeWeight(2); s.noFill()
        s.beginShape(); for (let x = 0; x <= SHORE; x += 10) s.vertex(x, water(x, st.t) + 2); s.endShape()
        s.noStroke()
        // Buoys.
        for (const bx of [150, 360]) { const by = water(bx, st.t); s.fill(255, 90, 60); s.ellipse(bx, by - 4, 18, 18) }
        // Swimmer.
        s.push(); s.translate(st.x, st.y)
        if (st.swimming) {
          s.rotate(Math.atan2(st.vy, st.vx) * 0.5)
          s.fill(dark ? s.color(0, 255, 102) : s.color(255, 200, 160)); s.ellipse(14, -4, 18, 18)
          s.fill(dark ? s.color(0, 200, 90) : s.color(230, 60, 80)); s.rect(-24, -6, 34, 12, 6)
          s.stroke(dark ? s.color(0, 200, 90) : s.color(255, 200, 160)); s.strokeWeight(5)
          const k = Math.sin(st.t * 12) * 10
          s.line(10, 0, 26, k); s.line(-24, 0, -40, -k)
        } else {
          s.fill(dark ? s.color(0, 200, 90) : s.color(230, 60, 80)); s.ellipse(0, 0, 50, 14)
          s.fill(dark ? s.color(0, 255, 102) : s.color(255, 200, 160)); s.ellipse(24, -4, 16, 16)
          s.stroke(dark ? s.color(0, 255, 102) : s.color(255, 200, 160)); s.strokeWeight(4); s.line(-6, -2, -22, -18); s.line(6, -2, 20, -20)
        }
        s.pop(); s.noStroke()
        if (st.y > surf + 22) { s.fill(255, 255, 255, 180); for (let i = 0; i < 3; i++) s.ellipse(st.x + 10, st.y - 20 - ((st.t * 60 + i * 12) % 30), 6, 6) }
        // Meters.
        s.fill(255, 255, 255, 150); s.rect(20, 20, 200, 10, 5); s.rect(20, 42, 200, 10, 5)
        s.fill(dark ? s.color(0, 255, 102) : s.color(56, 189, 248)); s.rect(20, 20, 2 * Math.max(0, st.breath), 10, 5)
        s.fill(239, 68, 68); s.rect(20, 42, 2 * st.panic, 10, 5)
        s.fill(dark ? s.color(0, 255, 102) : s.color(15, 23, 42)); s.textSize(12); s.text('breath', 228, 30); s.text('panic', 228, 52)
        s.text(st.swimming ? 'swimming' : 'floating on your back', 20, 72)
        if (s.frameCount % 6 === 0) setHud({ breath: Math.round(Math.max(0, st.breath)), panic: Math.round(st.panic), dist: Math.round((st.x / SHORE) * 100) })
      }
    }
    const toLocal = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const down = (e: PointerEvent) => { const p = toLocal(e); if (!p) return; st.swimming = true; st.aimX = p.x; st.aimY = p.y; st.taps.push(performance.now()) }
    const move = (e: PointerEvent) => { const p = toLocal(e); if (p) { st.aimX = p.x; st.aimY = p.y } }
    const up = () => { st.swimming = false }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointerleave', up); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Swim Float" score={hud.dist} best={best} result={result} onRestart={restart}
      hint={`Hold to swim toward the pointer · let go to float and get your breath back · don't panic-tap · ${hud.dist}% of the way in`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
