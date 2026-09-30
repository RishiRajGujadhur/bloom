import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Listening Pond (p5.js): koi drift beneath lily pads. They only rise when the
 * pond is still. Tap right on a fish as it breaks the surface to catch a
 * glimpse; tap anywhere else and the ripple sends every fish deep again.
 */
const W = 760, H = 480
const ROUND = 75
type Fish = { x: number; y: number; a: number; depth: number; hue: number; gold: boolean; cool: number }
type Ripple = { x: number; y: number; r: number; a: number }

export default function ListeningPond() {
  const [best, submit] = useBest('pond')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ score: 0, calm: 0, t: ROUND })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { score: 0, calm: 0.3, t: ROUND, glimpses: 0, golds: 0, splashes: 0, running: true }
    const fish: Fish[] = Array.from({ length: 7 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, a: Math.random() * 6.28, depth: 0, hue: i === 0 ? 45 : [10, 20, 0, 30, 350, 15][i % 6], gold: i === 0, cool: 0 }))
    const ripples: Ripple[] = []
    const pads = Array.from({ length: 6 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 30 + Math.random() * 26, rot: Math.random() * 6 }))
    let press: (x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t -= dt
          st.calm = Math.min(1, st.calm + dt * 0.09)
          if (st.t <= 0) {
            st.running = false
            const record = submitRef.current(st.score)
            setResult({ headline: 'The pond settles', lines: [`${st.glimpses} koi glimpsed`, `${st.golds} golden`, `${st.splashes} splashes`, `Score ${st.score}`], record })
          }
        }
        // Water.
        const ctx = s.drawingContext as CanvasRenderingContext2D
        const g = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.7)
        g.addColorStop(0, dark ? '#003a18' : '#2f7f86'); g.addColorStop(1, dark ? '#001a08' : '#123f55')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
        // Caustic shimmer.
        s.noFill()
        for (let i = 0; i < 18; i++) {
          s.stroke(255, 255, 255, 10 + 8 * Math.sin(s.frameCount * 0.02 + i))
          const y = (i * 29 + s.frameCount * 0.3) % H
          s.bezier(0, y, W / 3, y + 12 * Math.sin(i + s.frameCount * 0.01), (2 * W) / 3, y - 12, W, y)
        }
        // Fish.
        for (const f of fish) {
          f.cool = Math.max(0, f.cool - dt)
          const want = f.cool > 0 ? 0 : Math.min(1, st.calm * (0.6 + 0.5 * Math.sin(s.frameCount * 0.013 + f.hue)))
          f.depth += (want - f.depth) * dt * (f.cool > 0 ? 3 : 0.8)
          f.a += (s.noise(f.x * 0.004, f.y * 0.004, s.frameCount * 0.004) - 0.5) * 0.08
          const sp = 30 + (f.cool > 0 ? 90 : 0)
          f.x = (f.x + Math.cos(f.a) * sp * dt + W) % W
          f.y = (f.y + Math.sin(f.a) * sp * dt + H) % H
          const alpha = 120 + f.depth * 135
          const size = 26 + f.depth * 14
          s.push()
          s.translate(f.x, f.y)
          s.rotate(f.a)
          s.noStroke()
          const a = (alpha / 255).toFixed(2)
          s.fill(f.gold ? `rgba(255, 196, 40, ${a})` : `hsla(${f.hue}, 85%, 55%, ${a})`)
          s.ellipse(0, 0, size * 1.6, size * 0.7)
          const tail = Math.sin(s.frameCount * 0.25 + f.hue) * 0.4
          s.triangle(-size * 0.7, 0, -size * 1.25, -size * 0.35 + tail * 8, -size * 1.25, size * 0.35 + tail * 8)
          if (!f.gold) { s.fill(`rgba(255, 255, 255, ${a})`); s.ellipse(size * 0.1, -size * 0.05, size * 0.5, size * 0.3) }
          s.pop()
          if (f.depth > 0.8) { s.noFill(); s.stroke(255, 255, 255, 60); s.circle(f.x, f.y, size * 2 + Math.sin(s.frameCount * 0.2) * 4) }
        }
        // Lily pads.
        for (const p of pads) {
          p.x = (p.x + 0.08) % (W + 60)
          s.noStroke()
          s.fill(dark ? s.color(0, 140, 60) : s.color(70, 150, 80))
          s.arc(p.x, p.y, p.r * 2, p.r * 2, p.rot + 0.12, p.rot + 6.1, s.PIE)
          s.fill(255, 190, 210)
          if (p.r > 45) s.circle(p.x + 4, p.y - 4, 12)
        }
        // Ripples.
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i]
          r.r += 160 * dt; r.a -= 180 * dt
          s.noFill(); s.stroke(255, 255, 255, r.a); s.strokeWeight(2)
          s.circle(r.x, r.y, r.r * 2); s.circle(r.x, r.y, r.r * 1.4)
          s.strokeWeight(1)
          if (r.a <= 0) ripples.splice(i, 1)
        }
        // Calm meter.
        s.noStroke(); s.fill(255, 255, 255, 40); s.rect(20, 20, 200, 10, 5)
        s.fill(dark ? s.color(0, 255, 102) : s.color(180, 240, 255)); s.rect(20, 20, 200 * st.calm, 10, 5)
        s.fill(255); s.textSize(12); s.text('stillness', 20, 46)
        if (s.frameCount % 6 === 0) setHud({ score: st.score, calm: st.calm, t: Math.max(0, Math.ceil(st.t)) })
      }
      press = (x, y) => {
        if (!st.running) return
        const hit = fish.find((f) => f.depth > 0.75 && Math.hypot(f.x - x, f.y - y) < 44)
        if (hit) {
          st.glimpses++
          if (hit.gold) st.golds++
          st.score += hit.gold ? 30 : 10
          hit.cool = 2.5
          ripples.push({ x, y, r: 6, a: 120 })
        } else {
          st.splashes++
          st.calm = Math.max(0, st.calm - 0.45)
          fish.forEach((f) => { f.cool = Math.max(f.cool, 1.4) })
          ripples.push({ x, y, r: 6, a: 255 }, { x, y, r: 0, a: 200 })
        }
      }
    }
    const onDown = (e: PointerEvent) => {
      const c = el.querySelector('canvas')
      if (!c) return
      const r = c.getBoundingClientRect()
      press(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H)
    }
    el.addEventListener('pointerdown', onDown)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', onDown); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Listening Pond" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Wait for the pond to still · tap a koi right as it rises · ${hud.t}s`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
