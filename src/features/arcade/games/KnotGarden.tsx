import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Knot Garden: a lantern needs hanging before dusk. Watch the glowing firefly
 * trace a path through the garden pegs, then guide the rope along the same
 * path by clicking the pegs. Each finished path cinches into a real knot
 * (clove hitch, bowline, figure eight, reef, sheet bend) and lifts a lantern.
 */
type Peg = { id: string; x: number; y: number }
type Knot = { name: string; pegs: Peg[]; path: string[] }
const W = 640, H = 480
const KNOTS: Knot[] = [
  { name: 'Clove hitch', pegs: [{ id: 'a', x: 320, y: 120 }, { id: 'b', x: 240, y: 220 }, { id: 'c', x: 400, y: 220 }, { id: 'd', x: 320, y: 300 }, { id: 'e', x: 320, y: 400 }], path: ['a', 'c', 'd', 'b', 'e'] },
  { name: 'Figure eight', pegs: [{ id: 'a', x: 320, y: 90 }, { id: 'b', x: 250, y: 170 }, { id: 'c', x: 390, y: 230 }, { id: 'd', x: 250, y: 300 }, { id: 'e', x: 390, y: 360 }, { id: 'f', x: 320, y: 420 }], path: ['a', 'c', 'b', 'd', 'e', 'f'] },
  { name: 'Bowline', pegs: [{ id: 'hole', x: 320, y: 160 }, { id: 'tree', x: 420, y: 90 }, { id: 'left', x: 220, y: 250 }, { id: 'right', x: 420, y: 250 }, { id: 'loop', x: 320, y: 380 }], path: ['loop', 'hole', 'tree', 'right', 'hole', 'left'] },
  { name: 'Reef knot', pegs: [{ id: 'a', x: 180, y: 200 }, { id: 'b', x: 320, y: 140 }, { id: 'c', x: 460, y: 200 }, { id: 'd', x: 180, y: 320 }, { id: 'e', x: 320, y: 380 }, { id: 'f', x: 460, y: 320 }], path: ['a', 'b', 'c', 'f', 'e', 'd'] },
  { name: 'Sheet bend', pegs: [{ id: 'a', x: 160, y: 240 }, { id: 'b', x: 300, y: 150 }, { id: 'c', x: 420, y: 240 }, { id: 'd', x: 300, y: 330 }, { id: 'e', x: 500, y: 150 }, { id: 'f', x: 500, y: 340 }], path: ['a', 'b', 'c', 'd', 'b', 'e', 'f'] },
]
const SEG = 96
const LINK = 9

type Result = { headline: string; lines: string[]; record: boolean } | null

export default function KnotGarden() {
  const [best, submit] = useBest('knots')
  const host = useRef<HTMLDivElement>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<Result>(null)
  const [round, setRound] = useState(0)
  const [label, setLabel] = useState('')
  const api = useRef<{ score: number; slips: number; knots: number; started: number }>({ score: 0, slips: 0, knots: 0, started: 0 })

  const finish = useCallback(() => {
    const a = api.current
    const secs = Math.round((performance.now() - a.started) / 1000)
    const record = submit(a.score)
    setResult({ headline: a.knots === KNOTS.length ? 'Every lantern lit' : 'Night fell', lines: [`${a.knots} of ${KNOTS.length} knots tied`, `${a.slips} slips`, `${secs}s`, `Score ${a.score}`], record })
  }, [submit])

  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])

  useEffect(() => {
    if (!host.current) return
    api.current = { score: 0, slips: 0, knots: 0, started: performance.now() }
    const el = host.current
    let dead = false
    let knotIx = 0
    let done: string[] = []
    let demoT = 0 // 0..1 while the firefly shows the path
    let shake = 0
    let cinch = 0
    const lanterns: { x: number; y: number; lit: number }[] = []
    let rope: { x: number; y: number; px: number; py: number }[] = []
    const reset = () => {
      rope = Array.from({ length: SEG }, (_, i) => { const d = 60 + i * LINK, y = Math.min(d, H - 6), x = 60 + Math.max(0, d - (H - 6)); return { x, y, px: x, py: y } })
      done = []
      demoT = 0
      cinch = 0
      setLabel(KNOTS[knotIx].name)
    }
    reset()
    const pathPts = () => KNOTS[knotIx].path.map((id) => KNOTS[knotIx].pegs.find((p) => p.id === id)!)
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dark = document.documentElement.dataset.theme === 'matrix'
        const ink = dark ? s.color(0, 255, 102) : s.color(60, 50, 40)
        s.background(dark ? s.color(0, 26, 8) : s.color(236, 246, 232))
        // Grass and dusk.
        const dusk = Math.min(1, (performance.now() - api.current.started) / 150000)
        s.noStroke()
        s.fill(dark ? 0 : 20, dark ? 60 : 40, dark ? 20 : 80, 90 * dusk)
        s.rect(0, 0, W, H)
        for (let i = 0; i < 40; i++) {
          s.stroke(dark ? s.color(0, 120, 50) : s.color(120, 170, 110))
          const gx = (i * 16.3) % W
          s.line(gx, H, gx + Math.sin(s.frameCount * 0.02 + i) * 4, H - 18 - (i % 5) * 4)
        }
        const k = KNOTS[knotIx]
        const pts = pathPts()
        // Rope targets: through the clicked pegs, then hanging loose.
        const via = [{ x: 60, y: 60 }, ...done.map((id) => k.pegs.find((p) => p.id === id)!)]
        const targets: { x: number; y: number }[] = []
        const lens = via.slice(1).map((b, i) => Math.hypot(b.x - via[i].x, b.y - via[i].y))
        const total = lens.reduce((n, l) => n + l, 0)
        const used = Math.min(SEG - 4, Math.ceil(total / (LINK * 1.04)))
        for (let i = 0; i < SEG; i++) {
          if (via.length > 1 && i <= used) {
            let d = (i / used) * total
            let j = 0
            while (j < lens.length - 1 && d > lens[j]) { d -= lens[j]; j++ }
            const a = via[j], b = via[j + 1]
            const f = Math.min(1, d / (lens[j] || 1))
            targets.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f })
          } else targets.push({ x: NaN, y: NaN })
        }
        // Verlet rope.
        for (let i = 1; i < rope.length; i++) {
          const r = rope[i]
          const vx = (r.x - r.px) * 0.97, vy = (r.y - r.py) * 0.97
          r.px = r.x; r.py = r.y
          r.x += vx + Math.sin(s.frameCount * 0.03 + i * 0.2) * 0.02 + (shake ? (Math.random() - 0.5) * shake : 0)
          r.y += vy + 0.35
          const t = targets[i]
          if (!Number.isNaN(t.x)) { r.x += (t.x - r.x) * (0.12 + cinch * 0.3); r.y += (t.y - r.y) * (0.12 + cinch * 0.3) }
        }
        for (let it = 0; it < 6; it++) for (let i = 1; i < rope.length; i++) {
          const a = rope[i - 1], b = rope[i]
          const dx = b.x - a.x, dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 1
          const diff = (d - LINK * (1 - cinch * 0.15)) / d
          if (i > 1) { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5 }
          b.x -= dx * diff * (i > 1 ? 0.5 : 1); b.y -= dy * diff * (i > 1 ? 0.5 : 1)
          b.x = Math.max(4, Math.min(W - 4, b.x)); b.y = Math.min(H - 4, b.y)
        }
        rope[0].x = 60; rope[0].y = 60
        shake *= 0.9
        // Pegs.
        k.pegs.forEach((p) => {
          const next = k.path[done.length] === p.id
          s.noStroke()
          s.fill(dark ? s.color(0, 90, 40) : s.color(150, 110, 70))
          s.circle(p.x, p.y, 22)
          s.fill(dark ? s.color(0, 200, 90) : s.color(200, 160, 110))
          s.circle(p.x - 3, p.y - 3, 10)
          if (next && demoT >= 1 && s.frameCount % 60 < 30 && api.current.slips > 0) { s.noFill(); s.stroke(ink); s.circle(p.x, p.y, 34) }
        })
        // Rope with a twisted stripe.
        s.noFill()
        s.strokeWeight(7); s.stroke(dark ? s.color(0, 140, 60) : s.color(196, 150, 90))
        s.beginShape(); rope.forEach((r) => s.splineVertex(r.x, r.y)); s.endShape()
        s.strokeWeight(2); s.stroke(dark ? s.color(0, 255, 120) : s.color(120, 80, 40))
        ;(s.drawingContext as CanvasRenderingContext2D).setLineDash([4, 6])
        s.beginShape(); rope.forEach((r) => s.splineVertex(r.x, r.y)); s.endShape()
        ;(s.drawingContext as CanvasRenderingContext2D).setLineDash([])
        // Firefly demo.
        if (demoT < 1) {
          demoT += Math.min(50, s.deltaTime) / 4500
          const t = demoT * (pts.length - 1)
          const a = pts[Math.floor(t)], b = pts[Math.min(pts.length - 1, Math.floor(t) + 1)]
          const f = t - Math.floor(t)
          const fx = a.x + (b.x - a.x) * f, fy = a.y + (b.y - a.y) * f
          s.noStroke()
          for (let g = 4; g > 0; g--) { s.fill(255, 230, 90, 40); s.circle(fx, fy, g * 10) }
          s.fill(255, 240, 150); s.circle(fx, fy, 8)
        }
        // Lanterns already hung.
        lanterns.forEach((l, i) => {
          l.lit = Math.min(1, l.lit + 0.02)
          const sw = Math.sin(s.frameCount * 0.03 + i) * 4
          s.stroke(ink); s.strokeWeight(1); s.line(l.x, 0, l.x + sw, l.y - 14)
          s.noStroke(); s.fill(255, 200, 80, 60 * l.lit); s.circle(l.x + sw, l.y, 60 * l.lit)
          s.fill(dark ? s.color(0, 255, 102) : s.color(240, 120, 60)); s.rect(l.x + sw - 10, l.y - 14, 20, 28, 6)
        })
        if (cinch > 0 && cinch < 1) {
          cinch = Math.min(1, cinch + 0.02)
          if (cinch >= 1) {
            lanterns.push({ x: 110 + lanterns.length * 105, y: 40 + (lanterns.length % 2) * 16, lit: 0 })
            knotIx++
            if (knotIx >= KNOTS.length) { s.noLoop(); finishRef.current() } else reset()
          }
        }
      }
      press = (mx: number, my: number) => {
        if (demoT < 1 || cinch > 0) return
        const k = KNOTS[knotIx]
        const hit = k.pegs.find((p) => Math.hypot(p.x - mx, p.y - my) < 28)
        if (!hit) return
        if (k.path[done.length] === hit.id) {
          done.push(hit.id)
          api.current.score += 10
          if (done.length === k.path.length) { cinch = 0.01; api.current.knots++; api.current.score += 40 }
        } else {
          api.current.slips++
          api.current.score = Math.max(0, api.current.score - 5)
          shake = 6
        }
        setScore(api.current.score)
      }
      s.keyPressed = () => { if (s.key === ' ' && demoT >= 1 && !done.length) { demoT = 0; return false } }
    }
    let press: (x: number, y: number) => void = () => {}
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

  const restart = useCallback(() => { setResult(null); setScore(0); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Knot Garden" score={score} best={best} result={result} onRestart={restart}
      hint={`${label} · watch the firefly, then click the pegs in the same order · Space replays the firefly`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
