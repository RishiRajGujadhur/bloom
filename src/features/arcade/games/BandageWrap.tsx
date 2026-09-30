import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Bandage Wrap (p5.js): a scraped knee (or elbow, or wrist) needs wrapping.
 * Press and trace the dotted spiral so each turn overlaps the last by about
 * half. Stay on the guide for a snug, even wrap that covers the graze; wander
 * off and the bandage bunches up. Three wraps.
 */
const W = 780, H = 420
const LIMBS = [
  { name: 'Knee', y: 210, r: 70, x0: 170, x1: 610, graze: [340, 440] },
  { name: 'Wrist', y: 210, r: 46, x0: 220, x1: 560, graze: [360, 430] },
  { name: 'Elbow', y: 210, r: 58, x0: 190, x1: 590, graze: [320, 420] },
]
const TURNS = 7

export default function BandageWrap() {
  const [best, submit] = useBest('bandage')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ limb: 1, progress: 0, neat: 100 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    // Guide: a zigzag across the limb (front of each turn), param t in 0..1.
    const guide = (L: typeof LIMBS[number], t: number) => {
      const turn = t * TURNS
      const x = L.x0 + (L.x1 - L.x0) * t
      const up = turn % 1
      const y = L.y + (up < 0.5 ? (up * 4 - 1) : (3 - up * 4)) * L.r * 0.95
      return { x, y }
    }
    const st = { li: 0, t: 0, trail: [] as { x: number; y: number; ok: boolean }[], down: false, off: 0, samples: 0, score: 0, lines: [] as string[], running: true, mouse: { x: 0, y: 0 } }
    const finishLimb = () => {
      const L = LIMBS[st.li]
      const neat = st.samples ? 1 - st.off / st.samples : 0
      const grazeCovered = st.trail.filter((p) => p.ok && p.x >= L.graze[0] && p.x <= L.graze[1]).length > 20
      const pts = Math.round(neat * 70 + (grazeCovered ? 30 : 0))
      st.score += pts; st.lines.push(`${L.name}: ${Math.round(neat * 100)}% neat`)
      if (st.li + 1 >= LIMBS.length) {
        st.running = false
        const record = submitRef.current(st.score)
        setResult({ headline: 'All patched up 🩹', lines: [...st.lines, `Score ${st.score}`], record })
      } else { st.li++; st.t = 0; st.trail = []; st.off = 0; st.samples = 0 }
    }
    let press: (down: boolean, x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dark = document.documentElement.dataset.theme === 'matrix'
        const L = LIMBS[st.li]
        // Advance along the guide while pressing near the next point.
        if (st.running && st.down) {
          // Snap progress to the nearest guide point just ahead of the pointer.
          let bestT = -1, bestD = 40
          for (let t = st.t; t <= Math.min(1, st.t + 0.06); t += 0.002) { const g = guide(L, t); const d = Math.hypot(g.x - st.mouse.x, g.y - st.mouse.y); if (d < bestD) { bestD = d; bestT = t } }
          if (bestT > st.t) {
            const steps = Math.max(1, Math.round((bestT - st.t) / 0.002))
            for (let k = 0; k < steps; k++) {
              st.t = Math.min(1, st.t + 0.002)
              const g = guide(L, st.t)
              st.samples++
              const ok = bestD < 20
              if (!ok) st.off++
              st.trail.push({ x: st.mouse.x * 0.3 + g.x * 0.7, y: st.mouse.y * 0.3 + g.y * 0.7, ok })
            }
          }
          if (st.t >= 1) finishLimb()
        }
        s.background(dark ? s.color(0, 26, 8) : s.color(254, 243, 235))
        s.noStroke()
        // Limb.
        s.fill(dark ? s.color(0, 110, 50) : s.color(240, 196, 160))
        s.rect(L.x0 - 80, L.y - L.r, L.x1 - L.x0 + 160, L.r * 2, L.r)
        s.fill(dark ? s.color(0, 80, 35) : s.color(225, 175, 140)); s.rect(L.x0 - 80, L.y + L.r * 0.4, L.x1 - L.x0 + 160, L.r * 0.6, L.r * 0.5)
        // Graze.
        s.fill(214, 60, 60, 170); for (let i = 0; i < 14; i++) s.ellipse(L.graze[0] + ((i * 37) % (L.graze[1] - L.graze[0])), L.y - L.r * 0.3 + ((i * 23) % (L.r * 0.6)), 10, 5)
        // Guide dots ahead of you.
        for (let t = st.t; t <= 1; t += 0.006) { const g = guide(L, t); s.fill(99, 102, 241, 170); s.circle(g.x, g.y, t - st.t < 0.02 ? 12 : 4) }
        // Bandage laid so far.
        s.noFill()
        for (let i = 1; i < st.trail.length; i++) {
          const a = st.trail[i - 1], b = st.trail[i]
          s.stroke(b.ok ? s.color(255, 255, 255, 235) : s.color(230, 225, 210, 235)); s.strokeWeight(b.ok ? 22 : 30)
          s.line(a.x, a.y, b.x, b.y)
          s.stroke(220, 215, 205); s.strokeWeight(1); s.line(a.x, a.y - 9, b.x, b.y - 9)
        }
        s.noStroke()
        if (st.down) { s.fill(255); s.circle(st.mouse.x, st.mouse.y, 16) }
        if (s.frameCount % 6 === 0) setHud({ limb: st.li + 1, progress: Math.round(st.t * 100), neat: st.samples ? Math.round((1 - st.off / st.samples) * 100) : 100 })
      }
      press = (down, x, y) => { st.mouse = { x, y }; if (down !== undefined) st.down = down }
    }
    const loc = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const down = (e: PointerEvent) => { const p = loc(e); if (p) press(true, p.x, p.y) }
    const move = (e: PointerEvent) => { const p = loc(e); if (p) { st.mouse = p } }
    const up = () => { st.down = false }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointerleave', up); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Bandage Wrap" score={hud.neat} best={best} result={result} onRestart={restart}
      hint={`${LIMBS[hud.limb - 1]?.name ?? ''} ${hud.limb}/3 · press and trace the dotted spiral · ${hud.progress}% wrapped · ${hud.neat}% neat`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
    </GameShell>
  )
}
