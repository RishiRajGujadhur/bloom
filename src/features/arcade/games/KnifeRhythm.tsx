import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Knife Rhythm (p5.js): vegetables glide under the knife on a steady beat.
 * Tap (or Space) when each dotted line is under the blade to slice cleanly.
 * Even slices score best; mistimed chops leave wonky chunks. Keep the other
 * hand curled out of the way — it slides back if you rush.
 */
const W = 780, H = 460
const KNIFE_X = 470
const ROUND = 70
type Veg = { name: string; color: string; inner: string; len: number; cuts: number }
const VEG: Veg[] = [
  { name: 'carrot', color: '#f08a24', inner: '#f7b267', len: 260, cuts: 6 },
  { name: 'cucumber', color: '#3f8f3a', inner: '#cfe8b5', len: 300, cuts: 7 },
  { name: 'leek', color: '#7fb069', inner: '#eef5db', len: 320, cuts: 6 },
  { name: 'courgette', color: '#2d6a4f', inner: '#e9f5db', len: 280, cuts: 5 },
  { name: 'celery', color: '#95d5b2', inner: '#d8f3dc', len: 300, cuts: 8 },
]

export default function KnifeRhythm() {
  const [best, submit] = useBest('knife')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ score: 0, combo: 0, t: ROUND, veg: 'carrot' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { t: ROUND, score: 0, combo: 0, bestCombo: 0, perfect: 0, wonky: 0, running: true, speed: 110, x: 0, veg: VEG[0], vi: 0, cuts: [] as { off: number; done: boolean; quality: number }[], knifeY: 0, pieces: [] as { x: number; y: number; w: number; vy: number; vr: number; r: number; c: string; i: string }[], rush: 0 }
    const newVeg = () => {
      st.veg = VEG[st.vi % VEG.length]; st.vi++
      st.x = -st.veg.len - 40
      const gap = st.veg.len / (st.veg.cuts + 1)
      st.cuts = Array.from({ length: st.veg.cuts }, (_, i) => ({ off: gap * (i + 1), done: false, quality: 0 }))
    }
    newVeg()
    let chop = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t -= dt
          st.speed = 110 + (ROUND - st.t) * 1.4
          st.x += st.speed * dt
          // Missed cut lines that slid past the blade.
          for (const c of st.cuts) if (!c.done && st.x + c.off > KNIFE_X + 22) { c.done = true; c.quality = -1; st.combo = 0; st.wonky++ }
          if (st.x > KNIFE_X + 40) newVeg()
          if (st.t <= 0) {
            st.running = false
            const record = submitRef.current(st.score)
            setResult({ headline: 'Mise en place!', lines: [`${st.perfect} perfect slices`, `${st.wonky} wonky or missed`, `Longest rhythm ${st.bestCombo}`, `Score ${st.score}`], record })
          }
        }
        st.knifeY = Math.max(0, st.knifeY - dt * 600)
        st.rush = Math.max(0, st.rush - dt)
        // Board.
        s.background(dark ? s.color(0, 26, 8) : s.color(244, 236, 224))
        s.noStroke()
        s.fill(dark ? s.color(0, 70, 30) : s.color(214, 170, 120)); s.rect(40, 180, W - 80, 200, 20)
        s.stroke(dark ? s.color(0, 100, 40) : s.color(190, 145, 95)); s.strokeWeight(2)
        for (let i = 0; i < 9; i++) s.line(60, 200 + i * 20, W - 60, 202 + i * 20)
        s.noStroke()
        // Beat pulse ring under the knife.
        const beat = (s.millis() / 1000) * (st.speed / 70)
        s.noFill(); s.stroke(255, 255, 255, 80 + 60 * Math.sin(beat * Math.PI * 2)); s.strokeWeight(3)
        s.ellipse(KNIFE_X, 280, 60 + 6 * Math.sin(beat * Math.PI * 2))
        // The vegetable.
        const v = st.veg
        s.noStroke()
        s.fill(v.color); s.rect(st.x, 250, v.len, 60, 30)
        s.fill(255, 255, 255, 40); s.rect(st.x + 10, 256, v.len - 20, 12, 6)
        for (const c of st.cuts) {
          const cx = st.x + c.off
          if (!c.done) { s.stroke(255); s.strokeWeight(2); (s.drawingContext as CanvasRenderingContext2D).setLineDash([4, 5]); s.line(cx, 244, cx, 316); (s.drawingContext as CanvasRenderingContext2D).setLineDash([]) }
          else if (c.quality >= 0) { s.stroke(v.inner); s.strokeWeight(4); s.line(cx, 250, cx, 310) }
        }
        s.noStroke()
        // Flying slices.
        for (const p of st.pieces) {
          p.vy += 900 * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.x += 30 * dt
          s.push(); s.translate(p.x, p.y); s.rotate(p.r); s.fill(p.c); s.ellipse(0, 0, p.w, 60); s.fill(p.i); s.ellipse(0, 0, p.w * 0.7, 44); s.pop()
        }
        st.pieces = st.pieces.filter((p) => p.y < H + 60)
        // Guiding hand (claw) sits just left of the knife; it flinches if you rush.
        const hx = KNIFE_X - 70 - st.rush * 40
        s.fill(dark ? s.color(0, 200, 90) : s.color(247, 212, 182)); s.ellipse(hx, 236, 70, 46)
        for (let k = 0; k < 4; k++) s.ellipse(hx + 26, 222 + k * 10, 22, 12)
        // Knife.
        s.push(); s.translate(KNIFE_X, 150 + st.knifeY * 0.25)
        s.fill(dark ? s.color(0, 255, 120) : s.color(220, 226, 232)); s.beginShape(); s.vertex(-6, 0); s.vertex(8, 0); s.vertex(8, 150); s.vertex(-18, 150); s.endShape(s.CLOSE)
        s.fill(40); s.rect(-8, -60, 18, 64, 6)
        s.pop()
        // HUD bits.
        s.fill(dark ? s.color(0, 255, 102) : s.color(60, 40, 20)); s.textSize(15); s.textStyle(s.BOLD)
        s.text(`${v.name}`, 50, 160)
        if (st.combo > 2) { s.textSize(22); s.text(`${st.combo}× rhythm!`, W - 200, 150) }
        if (s.frameCount % 6 === 0) setHud({ score: st.score, combo: st.combo, t: Math.max(0, Math.ceil(st.t)), veg: v.name })
      }
      chop = () => {
        if (!st.running) return
        st.knifeY = 240
        const next = st.cuts.find((c) => !c.done)
        if (!next) { st.rush = 1; return }
        const d = Math.abs(st.x + next.off - KNIFE_X)
        if (d > 40) { st.rush = 1; st.combo = 0; st.score = Math.max(0, st.score - 2); return }
        next.done = true
        next.quality = d < 8 ? 2 : d < 20 ? 1 : 0
        if (next.quality === 2) { st.perfect++; st.combo++; st.score += 10 + Math.min(20, st.combo) }
        else if (next.quality === 1) { st.combo++; st.score += 6 }
        else { st.wonky++; st.combo = 0; st.score += 2 }
        st.bestCombo = Math.max(st.bestCombo, st.combo)
        const v = st.veg
        st.pieces.push({ x: KNIFE_X + 10, y: 280, w: 14 + d, vy: -200 - Math.random() * 100, vr: (Math.random() - 0.5) * 8, r: 0, c: v.color, i: v.inner })
      }
    }
    const onDown = () => chop()
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') { e.preventDefault(); chop() } }
    el.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Knife Rhythm" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Tap or Space as each dotted line reaches the blade · slicing ${hud.veg} · ${hud.t}s`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
