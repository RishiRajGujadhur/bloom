import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Step Garden (p5.js): every step you take plants something along the path.
 * Tap left and right in turn (← → or the two halves of the screen) to walk.
 * A steady rhythm grows tall, bright flowers; rushing or tripping (same foot
 * twice) grows weeds. See how lush a garden one walk can make.
 */
const W = 780, H = 440
const WALK = 60

type Plant = { x: number; kind: 'flower' | 'weed'; size: number; hue: number; grow: number }

export default function StepGarden() {
  const [best, submit] = useBest('steps')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ steps: 0, rhythm: 0, t: WALK })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { x: 0, plants: [] as Plant[], lastFoot: '' as '' | 'L' | 'R', lastT: 0, intervals: [] as number[], steps: 0, flowers: 0, weeds: 0, t: WALK, running: true, bob: 0, bestRun: 0, run: 0 }
    const step = (foot: 'L' | 'R') => {
      if (!st.running) return
      const now = performance.now() / 1000
      const gap = st.lastT ? now - st.lastT : 0.6
      st.lastT = now
      const trip = foot === st.lastFoot
      st.lastFoot = foot
      st.intervals.push(gap); if (st.intervals.length > 6) st.intervals.shift()
      const mean = st.intervals.reduce((a, b) => a + b, 0) / st.intervals.length
      const steady = Math.max(0, 1 - Math.abs(gap - mean) / Math.max(0.15, mean)) * (gap > 0.28 && gap < 1.2 ? 1 : 0.3)
      st.steps++
      st.x += 26
      st.bob = 1
      const good = !trip && steady > 0.6
      if (good) { st.flowers++; st.run++; st.bestRun = Math.max(st.bestRun, st.run) } else { st.weeds++; st.run = 0 }
      st.plants.push({ x: st.x - 30 + (Math.random() - 0.5) * 20, kind: good ? 'flower' : 'weed', size: good ? 0.6 + steady * 0.8 + Math.min(0.6, st.run * 0.04) : 0.5, hue: Math.random() * 360, grow: 0 })
    }
    let press: (foot: 'L' | 'R') => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t -= dt
          if (st.t <= 0) {
            st.running = false
            const score = st.flowers * 5 + st.bestRun * 3 - st.weeds * 2
            const record = submitRef.current(Math.max(0, score))
            setResult({ headline: 'What a walk 🌷', lines: [`${st.steps} steps`, `${st.flowers} flowers, ${st.weeds} weeds`, `Longest steady stretch ${st.bestRun} steps`, `Score ${Math.max(0, score)}`], record })
          }
        }
        st.bob = Math.max(0, st.bob - dt * 5)
        const cam = Math.max(0, st.x - 200)
        s.background(dark ? s.color(0, 20, 8) : s.color(204, 236, 255))
        s.noStroke()
        // Parallax hills.
        s.fill(dark ? s.color(0, 60, 25) : s.color(167, 219, 160))
        s.beginShape(); s.vertex(0, H); for (let x = 0; x <= W; x += 20) s.vertex(x, 250 + Math.sin((x + cam * 0.3) * 0.01) * 30); s.vertex(W, H); s.endShape(s.CLOSE)
        s.fill(dark ? s.color(0, 90, 40) : s.color(134, 200, 120))
        s.beginShape(); s.vertex(0, H); for (let x = 0; x <= W; x += 20) s.vertex(x, 300 + Math.sin((x + cam * 0.6) * 0.015 + 2) * 20); s.vertex(W, H); s.endShape(s.CLOSE)
        s.fill(dark ? s.color(0, 40, 15) : s.color(222, 199, 160)); s.rect(0, 350, W, 30)
        s.fill(dark ? s.color(0, 70, 30) : s.color(110, 180, 90)); s.rect(0, 380, W, 60)
        // Plants.
        for (const p of st.plants) {
          p.grow = Math.min(1, p.grow + dt * 1.5)
          const x = p.x - cam
          if (x < -40 || x > W + 40) continue
          const h = 34 * p.size * p.grow
          if (p.kind === 'flower') {
            s.stroke(60, 140, 60); s.strokeWeight(3); s.line(x, 360, x, 360 - h); s.noStroke()
            s.colorMode(s.HSB, 360, 100, 100)
            s.fill(p.hue, 60, 95); for (let k = 0; k < 6; k++) s.ellipse(x + Math.cos(k) * 5 * p.size, 360 - h + Math.sin(k) * 5 * p.size, 7 * p.size, 7 * p.size)
            s.colorMode(s.RGB, 255)
            s.fill(250, 204, 21); s.circle(x, 360 - h, 5 * p.size)
          } else {
            s.stroke(120, 110, 60); s.strokeWeight(2)
            for (let k = -2; k <= 2; k++) s.line(x, 362, x + k * 5, 362 - h * 0.6 + Math.abs(k) * 3)
            s.noStroke()
          }
        }
        // Walker.
        const wx = st.x - cam, wy = 330 - st.bob * 6
        s.fill(dark ? s.color(0, 255, 102) : s.color(59, 130, 246)); s.rect(wx - 10, wy - 34, 20, 34, 8)
        s.fill(255, 214, 170); s.circle(wx, wy - 44, 20)
        s.stroke(dark ? s.color(0, 200, 90) : s.color(30, 64, 175)); s.strokeWeight(5)
        const swing = st.lastFoot === 'L' ? 1 : -1
        s.line(wx - 4, wy, wx - 4 + swing * 8, wy + 18); s.line(wx + 4, wy, wx + 4 - swing * 8, wy + 18); s.noStroke()
        // Rhythm meter.
        const mean = st.intervals.length ? st.intervals.reduce((a, b) => a + b, 0) / st.intervals.length : 0
        s.fill(255, 255, 255, 150); s.rect(20, 20, 160, 10, 5)
        s.fill(34, 197, 94); s.rect(20, 20, 160 * Math.min(1, st.run / 20), 10, 5)
        s.fill(dark ? s.color(0, 255, 102) : s.color(30, 41, 59)); s.textSize(12); s.text(`steady ${st.run}`, 188, 30)
        if (s.frameCount % 6 === 0) setHud({ steps: st.steps, rhythm: Math.round(mean * 100), t: Math.max(0, Math.ceil(st.t)) })
      }
      press = step
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft' || e.key === 'a') { e.preventDefault(); press('L') } if (e.key === 'ArrowRight' || e.key === 'd') { e.preventDefault(); press('R') } }
    const down = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return; const r = c.getBoundingClientRect(); press(e.clientX - r.left < r.width / 2 ? 'L' : 'R') }
    window.addEventListener('keydown', key); el.addEventListener('pointerdown', down)
    const inst = new p5(sketch)
    return () => { dead = true; window.removeEventListener('keydown', key); el.removeEventListener('pointerdown', down); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Step Garden" score={hud.steps} best={best} result={result} onRestart={restart}
      hint={`Left, right, left, right — ← → or tap each half · keep a steady pace for flowers · ${hud.t}s`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
    </GameShell>
  )
}
