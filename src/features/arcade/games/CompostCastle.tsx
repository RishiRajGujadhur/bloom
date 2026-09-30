import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Compost Castle (p5.js falling sand): pour greens (kitchen scraps, grass)
 * and browns (leaves, cardboard) into the bin, add a splash of water, and
 * turn the pile with the fork now and then. A good mix warms up, steams and
 * slowly turns to rich dark compost. Too green and it gets smelly; too dry or
 * too brown and it just sits there.
 */
const COLS = 110, ROWS = 70, CELL = 6
const W = COLS * CELL, H = ROWS * CELL
const EMPTY = 0, GREEN = 1, BROWN = 2, WATER = 3, DONE = 4
const BIN_L = 25, BIN_R = 85, BIN_TOP = 22
const TIME = 90

export default function CompostCastle() {
  const [best, submit] = useBest('compost')
  const host = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<'green' | 'brown' | 'water'>('green')
  const toolRef = useRef(tool)
  useEffect(() => { toolRef.current = tool }, [tool])
  const [hud, setHud] = useState({ heat: 0, done: 0, smell: 0, t: TIME })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef({ turn: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const g = new Uint8Array(COLS * ROWS)
    const idx = (x: number, y: number) => y * COLS + x
    const wall = (x: number, y: number) => y >= ROWS - 1 || (y >= BIN_TOP && (x === BIN_L || x === BIN_R))
    const st = { heat: 0, moist: 0.3, sinceTurn: 0, done: 0, smell: 0, t: TIME, pouring: false, px: 0, running: true, peakHeat: 0 }
    api.current.turn = () => {
      // Mix the pile: shuffle cells inside the bin.
      const cells: number[] = []
      for (let y = BIN_TOP; y < ROWS - 1; y++) for (let x = BIN_L + 1; x < BIN_R; x++) if (g[idx(x, y)] !== EMPTY) cells.push(idx(x, y))
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const a = g[cells[i]]; g[cells[i]] = g[cells[j]]; g[cells[j]] = a }
      st.sinceTurn = 0
    }
    let press: (down: boolean, x: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(1); s.noSmooth() }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        // Pour.
        if (st.pouring && st.running) {
          const t = toolRef.current
          for (let k = 0; k < 3; k++) {
            const x = Math.max(1, Math.min(COLS - 2, Math.round(st.px + (Math.random() - 0.5) * 4)))
            if (g[idx(x, 1)] === EMPTY) g[idx(x, 1)] = t === 'green' ? GREEN : t === 'brown' ? BROWN : WATER
          }
        }
        // Falling sand, bottom-up.
        for (let y = ROWS - 2; y >= 0; y--) {
          const ltr = Math.random() < 0.5
          for (let i = 0; i < COLS; i++) {
            const x = ltr ? i : COLS - 1 - i
            const v = g[idx(x, y)]
            if (v === EMPTY || wall(x, y)) continue
            const below = y + 1
            const tryMove = (nx: number, ny: number) => { if (nx < 0 || nx >= COLS || wall(nx, ny) || g[idx(nx, ny)] !== EMPTY) return false; g[idx(nx, ny)] = v; g[idx(x, y)] = EMPTY; return true }
            if (tryMove(x, below)) continue
            const d = Math.random() < 0.5 ? -1 : 1
            if (tryMove(x + d, below) || tryMove(x - d, below)) continue
            if (v === WATER && (tryMove(x + d, y) || tryMove(x - d, y))) continue
          }
        }
        // Water soaks into the pile.
        let greens = 0, browns = 0, done = 0
        for (let y = BIN_TOP; y < ROWS - 1; y++) for (let x = BIN_L + 1; x < BIN_R; x++) {
          const v = g[idx(x, y)]
          if (v === GREEN) greens++; else if (v === BROWN) browns++; else if (v === WATER) { if (Math.random() < 0.02) { g[idx(x, y)] = EMPTY; st.moist = Math.min(1, st.moist + 0.004) } } else if (v === DONE) done++
        }
        if (st.running) {
          st.t -= dt
          st.sinceTurn += dt
          st.moist = Math.max(0, st.moist - dt * 0.008 * (1 + st.heat))
          const organic = greens + browns
          const ratio = organic ? greens / organic : 0 // ideal ~0.35 greens
          const mixGood = organic > 200 ? Math.max(0, 1 - Math.abs(ratio - 0.35) * 3) : 0
          const moistGood = Math.max(0, 1 - Math.abs(st.moist - 0.55) * 2.5)
          const airGood = Math.max(0.2, 1 - st.sinceTurn / 25)
          const target = mixGood * moistGood * airGood
          st.heat += (target - st.heat) * dt * 0.4
          st.peakHeat = Math.max(st.peakHeat, st.heat)
          st.smell = Math.max(0, Math.min(1, st.smell + ((ratio > 0.6 && organic > 150) || st.moist > 0.85 ? dt * 0.1 : -dt * 0.05)))
          // Hot piles turn organic cells into finished compost.
          const conversions = Math.floor(st.heat * 6 * (0.5 + Math.random()))
          for (let k = 0; k < conversions; k++) {
            const x = BIN_L + 1 + Math.floor(Math.random() * (BIN_R - BIN_L - 1)), y = BIN_TOP + Math.floor(Math.random() * (ROWS - 1 - BIN_TOP))
            const v = g[idx(x, y)]
            if (v === GREEN || v === BROWN) g[idx(x, y)] = DONE
          }
          st.done = done
          if (st.t <= 0) {
            st.running = false
            const score = Math.round(done / 4 - st.smell * 60)
            const record = submitRef.current(Math.max(0, score))
            setResult({ headline: 'The garden says thanks', lines: [`${done} scoops of finished compost`, `Hottest the pile got: ${Math.round(st.peakHeat * 70)}°C`, st.smell > 0.4 ? 'It got a bit whiffy' : 'Smelled like a forest floor', `Score ${Math.max(0, score)}`], record })
          }
        }
        // Draw.
        s.background(dark ? s.color(0, 20, 8) : s.color(214, 234, 248))
        s.noStroke()
        s.fill(dark ? s.color(0, 60, 25) : s.color(120, 170, 90)); s.rect(0, (ROWS - 1) * CELL, W, CELL)
        const cols: Record<number, [number, number, number]> = { [GREEN]: [110, 180, 70], [BROWN]: [170, 110, 60], [WATER]: [90, 160, 230], [DONE]: [60, 40, 30] }
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const v = g[idx(x, y)]
          if (v === EMPTY) continue
          const c = cols[v]
          const n = ((x * 31 + y * 17) % 7) * 4
          s.fill(c[0] + n, c[1] + n, c[2] + n); s.rect(x * CELL, y * CELL, CELL, CELL)
        }
        // Bin walls.
        s.fill(dark ? s.color(0, 120, 50) : s.color(88, 110, 70))
        s.rect(BIN_L * CELL, BIN_TOP * CELL, CELL, (ROWS - BIN_TOP) * CELL); s.rect(BIN_R * CELL, BIN_TOP * CELL, CELL, (ROWS - BIN_TOP) * CELL)
        // Steam and smell.
        for (let i = 0; i < Math.floor(st.heat * 10); i++) {
          s.fill(255, 255, 255, 90); const sx = (BIN_L + 6 + ((i * 13 + s.frameCount) % (BIN_R - BIN_L - 10))) * CELL; const sy = BIN_TOP * CELL - ((s.frameCount * 1.5 + i * 23) % 80)
          s.ellipse(sx, sy, 16, 10)
        }
        if (st.smell > 0.3) { s.stroke(140, 160, 60, 160 * st.smell); s.strokeWeight(3); s.noFill(); for (let i = 0; i < 3; i++) { const bx = (BIN_L + 10 + i * 18) * CELL; s.bezier(bx, BIN_TOP * CELL, bx + 12, BIN_TOP * CELL - 20, bx - 12, BIN_TOP * CELL - 40, bx, BIN_TOP * CELL - 60) } s.noStroke() }
        // Thermometer.
        s.fill(255); s.rect(W - 40, 30, 14, 160, 7)
        s.fill(st.heat > 0.6 ? s.color(239, 68, 68) : st.heat > 0.3 ? s.color(245, 158, 11) : s.color(96, 165, 250)); s.rect(W - 40, 30 + 160 * (1 - st.heat), 14, 160 * st.heat, 7)
        s.circle(W - 33, 196, 24)
        s.fill(dark ? s.color(0, 255, 102) : s.color(30, 41, 59)); s.textSize(11); s.text('heat', W - 48, 22)
        s.fill(255, 255, 255, 150); s.rect(20, 20, 120, 8, 4); s.fill(96, 165, 250); s.rect(20, 20, 120 * st.moist, 8, 4)
        s.fill(dark ? s.color(0, 255, 102) : s.color(30, 41, 59)); s.text('moisture', 146, 28)
        if (st.pouring) { s.fill(0, 0, 0, 40); s.triangle(st.px * CELL - 14, 0, st.px * CELL + 14, 0, st.px * CELL, 14) }
        if (s.frameCount % 8 === 0) setHud({ heat: Math.round(st.heat * 70), done, smell: st.smell, t: Math.max(0, Math.ceil(st.t)) })
      }
      press = (down, x) => { st.pouring = down; st.px = x / CELL }
    }
    const loc = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return null; const r = c.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * W }
    const down = (e: PointerEvent) => { const x = loc(e); if (x != null) press(true, x) }
    const move = (e: PointerEvent) => { const x = loc(e); if (x != null && e.buttons) press(true, x) }
    const up = () => press(false, 0)
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointerleave', up); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Compost Castle" score={Math.round(hud.done / 4)} best={best} result={result} onRestart={restart}
      hint={`Pick greens, browns or water and hold over the bin to pour · turn the pile now and then · heat ${hud.heat}°C · ${hud.t}s`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
      <div className="cf-tray">
        <button type="button" className={tool === 'green' ? 'on' : ''} onClick={() => setTool('green')}>🥬 Greens</button>
        <button type="button" className={tool === 'brown' ? 'on' : ''} onClick={() => setTool('brown')}>🍂 Browns</button>
        <button type="button" className={tool === 'water' ? 'on' : ''} onClick={() => setTool('water')}>💧 Water</button>
        <button type="button" className="cf-match" onClick={() => api.current.turn()}>🔱 Turn the pile</button>
      </div>
    </GameShell>
  )
}
