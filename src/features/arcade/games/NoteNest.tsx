import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Note Nest (p5.js): during a lecture, ideas float up like dandelion seeds and
 * drift away. Move the nest under the bright, important ones to catch them;
 * the faint chatter isn't worth keeping. Tap a caught idea twice to link it
 * with a neighbour — linked notes are worth more when the quiz comes.
 */
const W = 780, H = 460
const LECTURE = 60
const KEY = ['photosynthesis', 'chlorophyll', 'sunlight', 'glucose', 'oxygen', 'carbon dioxide', 'roots', 'water', 'leaves', 'energy']
const CHATTER = ['um…', 'so yeah', 'anyway', 'can everyone hear me?', 'where was I', 'fun fact', 'uh', 'right']
type Seed = { x: number; y: number; vx: number; vy: number; text: string; key: boolean; caught: boolean }

export default function NoteNest() {
  const [best, submit] = useBest('notenest')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ caught: 0, links: 0, t: LECTURE })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { nest: W / 2, seeds: [] as Seed[], notes: [] as { text: string; x: number; y: number }[], links: [] as [number, number][], sel: -1, t: LECTURE, next: 0.3, running: true, clutter: 0 }
    let press: (x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)); s.textFont('system-ui') }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t -= dt; st.next -= dt
          if (st.next <= 0) {
            const key = Math.random() < 0.45
            st.seeds.push({ x: 80 + Math.random() * (W - 160), y: -20, vx: (Math.random() - 0.5) * 20, vy: 38 + Math.random() * 18, text: key ? KEY[Math.floor(Math.random() * KEY.length)] : CHATTER[Math.floor(Math.random() * CHATTER.length)], key, caught: false })
            st.next = 0.9 + Math.random() * 0.6
          }
          for (const sd of st.seeds) {
            sd.vx += Math.sin(s.frameCount * 0.03 + sd.y * 0.02) * 6 * dt
            sd.x += sd.vx * dt; sd.y += sd.vy * dt
            if (!sd.caught && sd.y > 330 && sd.y < 360 && Math.abs(sd.x - st.nest) < 70) {
              sd.caught = true
              if (sd.key) { if (!st.notes.some((n) => n.text === sd.text)) st.notes.push({ text: sd.text, x: 40 + (st.notes.length % 5) * 146, y: 400 + Math.floor(st.notes.length / 5) * 26 }) }
              else st.clutter++
            }
          }
          st.seeds = st.seeds.filter((sd) => !sd.caught && sd.y < H + 20)
          if (st.t <= 0) {
            st.running = false
            const score = st.notes.length * 10 + st.links.length * 15 - st.clutter * 4
            const record = submitRef.current(Math.max(0, score))
            setResult({ headline: 'Quiz time — your notes helped!', lines: [`${st.notes.length} key ideas caught`, `${st.links.length} links made`, `${st.clutter} bits of chatter scribbled down`, `Score ${Math.max(0, score)}`], record })
          }
        }
        // Lecture hall.
        s.background(dark ? s.color(0, 26, 8) : s.color(245, 243, 255))
        s.noStroke(); s.fill(dark ? s.color(0, 60, 25) : s.color(55, 65, 81)); s.rect(60, 20, W - 120, 70, 8)
        s.fill(dark ? s.color(0, 255, 102) : s.color(229, 231, 235)); s.textSize(16); s.textAlign(s.CENTER, s.CENTER); s.text('Today: How plants make food 🌱', W / 2, 55)
        for (const sd of st.seeds) {
          s.stroke(sd.key ? s.color(250, 204, 21) : s.color(148, 163, 184, 120)); s.strokeWeight(1)
          for (let k = 0; k < 8; k++) s.line(sd.x, sd.y, sd.x + Math.cos(k * 0.8) * 10, sd.y - 6 + Math.sin(k * 0.8) * 10)
          s.noStroke()
          s.fill(sd.key ? s.color(dark ? 0 : 124, dark ? 255 : 58, dark ? 102 : 237) : s.color(148, 163, 184, 150))
          s.textSize(sd.key ? 15 : 12); s.textStyle(sd.key ? s.BOLD : s.NORMAL); s.text(sd.text, sd.x, sd.y + 16)
        }
        // Nest.
        s.fill(dark ? s.color(0, 120, 50) : s.color(161, 98, 7)); s.arc(st.nest, 340, 150, 60, 0, Math.PI)
        s.stroke(dark ? s.color(0, 80, 35) : s.color(120, 72, 5)); s.strokeWeight(2); for (let i = 0; i < 8; i++) s.line(st.nest - 70 + i * 20, 342, st.nest - 60 + i * 20, 365)
        s.noStroke()
        // Notebook.
        s.fill(dark ? s.color(0, 40, 15) : s.color(254, 252, 232)); s.rect(20, 380, W - 40, 70, 6)
        for (const [a, b] of st.links) { const A = st.notes[a], B = st.notes[b]; s.stroke(124, 58, 237); s.strokeWeight(2); s.line(A.x + 60, A.y, B.x + 60, B.y); s.noStroke() }
        st.notes.forEach((n, i) => {
          s.fill(i === st.sel ? s.color(221, 214, 254) : s.color(255, 255, 255)); s.rect(n.x, n.y - 10, 124, 20, 10)
          s.fill(dark ? s.color(0, 120, 50) : s.color(76, 29, 149)); s.textSize(12); s.textStyle(s.BOLD); s.text(n.text, n.x + 62, n.y)
        })
        s.textStyle(s.NORMAL)
        if (s.frameCount % 6 === 0) setHud({ caught: st.notes.length, links: st.links.length, t: Math.max(0, Math.ceil(st.t)) })
      }
      press = (x, y) => {
        if (y > 380) {
          const i = st.notes.findIndex((n) => x >= n.x && x <= n.x + 124 && Math.abs(y - n.y) < 12)
          if (i < 0) return
          if (st.sel < 0) st.sel = i
          else if (st.sel !== i) { if (!st.links.some(([a, b]) => (a === st.sel && b === i) || (a === i && b === st.sel))) st.links.push([st.sel, i]); st.sel = -1 }
          else st.sel = -1
        }
      }
    }
    const loc = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const move = (e: PointerEvent) => { const p = loc(e); if (p && p.y < 380) st.nest = Math.max(80, Math.min(W - 80, p.x)) }
    const down = (e: PointerEvent) => { const p = loc(e); if (p) press(p.x, p.y) }
    el.addEventListener('pointermove', move); el.addEventListener('pointerdown', down)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointermove', move); el.removeEventListener('pointerdown', down); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Note Nest" score={hud.caught * 10 + hud.links * 15} best={best} result={result} onRestart={restart}
      hint={`Move the nest under the bright ideas · tap two notes to link them · ${hud.caught} notes, ${hud.links} links · ${hud.t}s`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
    </GameShell>
  )
}
