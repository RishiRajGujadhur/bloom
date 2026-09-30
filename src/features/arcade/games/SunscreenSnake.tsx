import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Sunscreen Snake (p5.js): a sandy snake collects shells along the beach from
 * morning to evening. The sun climbs and the UV meter rises; your sunscreen
 * wears off. Slither over a bottle to top up, or through an umbrella's shade.
 * Burn too much and it's time to go in. Steer with the arrow keys or by
 * tapping where you want to head.
 */
const C = 26, R = 18, CELL = 26
const W = C * CELL, H = R * CELL
const DAY = 75

export default function SunscreenSnake() {
  const [best, submit] = useBest('sunsnake')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ shells: 0, burn: 0, uv: 0, cream: 1 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { body: [[8, 9], [7, 9], [6, 9]] as [number, number][], dir: [1, 0] as [number, number], next: [1, 0] as [number, number], acc: 0, t: 0, shells: 0, burn: 0, cream: 1, running: true, shell: [18, 6] as [number, number], bottle: null as null | [number, number], shades: [[5, 4], [19, 13]] as [number, number][], creamed: 0 }
    const rnd = (): [number, number] => [1 + Math.floor(Math.random() * (C - 2)), 1 + Math.floor(Math.random() * (R - 2))]
    const free = (): [number, number] => { for (;;) { const p = rnd(); if (!st.body.some(([x, y]) => x === p[0] && y === p[1])) return p } }
    const turn = (dx: number, dy: number) => { if (dx === -st.dir[0] && dy === -st.dir[1]) return; st.next = [dx, dy] }
    const key = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
      if (m[e.key]) { e.preventDefault(); turn(...m[e.key]) }
    }
    window.addEventListener('keydown', key)
    let tap: (x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        const dayT = Math.min(1, st.t / DAY)
        const uv = Math.max(0, Math.sin(dayT * Math.PI)) // noon peak
        if (st.running) {
          st.t += dt
          st.cream = Math.max(0, st.cream - dt * 0.03)
          const head = st.body[0]
          const shaded = st.shades.some(([x, y]) => Math.abs(x - head[0]) <= 2 && Math.abs(y - head[1]) <= 2)
          st.burn = Math.min(1, st.burn + dt * uv * 0.05 * (1 - st.cream) * (shaded ? 0.25 : 1))
          if (!st.bottle && Math.random() < dt * 0.25) st.bottle = free()
          st.acc += dt
          const step = Math.max(0.08, 0.16 - st.shells * 0.003)
          while (st.acc >= step) {
            st.acc -= step
            st.dir = st.next
            const nx = head[0] + st.dir[0], ny = head[1] + st.dir[1]
            const wrapX = (nx + C) % C, wrapY = (ny + R) % R
            if (st.body.some(([x, y], i) => i < st.body.length - 1 && x === wrapX && y === wrapY)) { end('Tied in a knot!'); break }
            st.body.unshift([wrapX, wrapY])
            if (wrapX === st.shell[0] && wrapY === st.shell[1]) { st.shells++; st.shell = free() } else st.body.pop()
            if (st.bottle && wrapX === st.bottle[0] && wrapY === st.bottle[1]) { st.cream = 1; st.creamed++; st.bottle = null }
          }
          if (st.burn >= 1) end('Too much sun — time to go inside')
          if (st.t >= DAY) end('Sunset stroll complete')
        }
        // Draw.
        const sky = s.lerpColor(s.color(255, 214, 160), s.color(255, 245, 210), uv)
        s.background(dark ? s.color(0, 30, 12) : sky)
        s.noStroke()
        s.fill(dark ? s.color(0, 90, 40) : s.color(64, 164, 223)); s.rect(0, 0, W, CELL * 1.2)
        for (let i = 0; i < 40; i++) { s.fill(dark ? s.color(0, 60, 25) : s.color(230, 200, 140)); s.circle((i * 97) % W, (i * 53) % H + 30, 3) }
        for (const [x, y] of st.shades) { s.fill(0, 0, 0, 40); s.circle(x * CELL + CELL / 2, y * CELL + CELL / 2, CELL * 5); s.fill(dark ? s.color(0, 255, 102) : s.color(239, 68, 68)); s.arc(x * CELL + CELL / 2, y * CELL + 4, CELL * 3, CELL * 2, Math.PI, 0, s.PIE) }
        s.textAlign(s.CENTER, s.CENTER); s.textSize(CELL * 0.8)
        s.text('🐚', st.shell[0] * CELL + CELL / 2, st.shell[1] * CELL + CELL / 2 + 1)
        if (st.bottle) { s.fill(255, 255, 255); s.rect(st.bottle[0] * CELL + 6, st.bottle[1] * CELL + 3, CELL - 12, CELL - 6, 4); s.fill(251, 146, 60); s.rect(st.bottle[0] * CELL + 6, st.bottle[1] * CELL + 3, CELL - 12, 6, 2) }
        st.body.forEach(([x, y], i) => {
          const redness = st.burn
          const base = dark ? [0, 255 - i * 3, 100] : [60 + redness * 170 - i, 150 - redness * 100, 110 - redness * 70]
          s.fill(base[0], base[1], base[2]); s.rect(x * CELL + 2, y * CELL + 2, CELL - 4, CELL - 4, i === 0 ? 10 : 7)
          if (st.cream > 0.3) { s.fill(255, 255, 255, 60 * st.cream); s.rect(x * CELL + 4, y * CELL + 4, CELL - 8, 5, 3) }
        })
        const [hx, hy] = st.body[0]
        s.fill(0); s.circle(hx * CELL + CELL / 2 - 5 + st.dir[0] * 3, hy * CELL + CELL / 2 - 3 + st.dir[1] * 3, 5); s.circle(hx * CELL + CELL / 2 + 5 + st.dir[0] * 3, hy * CELL + CELL / 2 - 3 + st.dir[1] * 3, 5)
        // Sun arc + UV meter.
        const sx = dayT * W, sy = 90 - uv * 70
        s.fill(255, 220, 60); s.circle(sx, sy, 30 + uv * 16)
        if (s.frameCount % 6 === 0) setHud({ shells: st.shells, burn: Math.round(st.burn * 100), uv: Math.round(uv * 11), cream: st.cream })
      }
      tap = (x, y) => {
        const [hx, hy] = st.body[0]
        const dx = x / CELL - (hx + 0.5), dy = y / CELL - (hy + 0.5)
        if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0); else turn(0, Math.sign(dy))
      }
    }
    const end = (headline: string) => {
      if (!st.running) return
      st.running = false
      const score = st.shells * 10 + Math.round((1 - st.burn) * 40)
      const record = submitRef.current(score)
      setResult({ headline, lines: [`${st.shells} shells`, `${st.creamed} sunscreen top-ups`, `Burn ${Math.round(st.burn * 100)}%`, `Score ${score}`], record })
    }
    const down = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return; const r = c.getBoundingClientRect(); tap(((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H) }
    el.addEventListener('pointerdown', down)
    const inst = new p5(sketch)
    return () => { dead = true; window.removeEventListener('keydown', key); el.removeEventListener('pointerdown', down); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Sunscreen Snake" score={hud.shells * 10} best={best} result={result} onRestart={restart}
      hint={`Arrows or tap to steer · grab shells 🐚 · top up on sunscreen bottles · UV ${hud.uv} · burn ${hud.burn}% · cream ${Math.round(hud.cream * 100)}%`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
