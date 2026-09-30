import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Insurance Umbrella (p5.js): six little houses and a sky full of weather.
 * Tap a house to open (or close) an umbrella over it — each open umbrella
 * costs a coin every season. Storms roll in at random; a covered house shrugs
 * them off, an uncovered one needs expensive repairs. Twelve seasons.
 */
const W = 780, H = 480
const HOUSES = 6
const SEASONS = 12
const SEASON_S = 4.5
const PREMIUM = 1
const REPAIR = 9

export default function InsuranceUmbrella() {
  const [best, submit] = useBest('umbrella')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ coins: 30, season: 1, covered: 0, msg: 'Tap houses to open umbrellas (1 coin per season each).' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { coins: 30, season: 1, t: 0, covered: Array(HOUSES).fill(false) as boolean[], dmg: Array(HOUSES).fill(0) as number[], storms: [] as { x: number; target: number; strike: number; hit: boolean }[], paid: 0, repairs: 0, saved: 0, running: true, flash: 0, msg: 'Tap houses to open umbrellas (1 coin per season each).', bolts: [] as { x: number; life: number }[] }
    const hx = (i: number) => 90 + i * 120
    let press: (x: number, y: number) => void = () => {}
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t += dt
          if (st.t >= SEASON_S) {
            st.t = 0
            const n = st.covered.filter(Boolean).length
            st.coins += 6 - n * PREMIUM; st.paid += n * PREMIUM
            st.season++
            // Storms for next season: 0-3, sometimes a big one.
            const count = Math.random() < 0.15 ? 3 : Math.floor(Math.random() * 3)
            for (let i = 0; i < count; i++) st.storms.push({ x: -80 - i * 140, target: Math.floor(Math.random() * HOUSES), strike: 0, hit: false })
            if (st.season > SEASONS || st.coins < 0) {
              st.running = false
              const score = Math.max(0, st.coins)
              const record = submitRef.current(score)
              setResult({ headline: st.coins < 0 ? 'Broke!' : 'Twelve seasons weathered', lines: [`Coins left ${st.coins}`, `Paid ${st.paid} in umbrellas`, `Paid ${st.repairs} in repairs`, `${st.saved} storms shrugged off`, `Score ${score}`], record })
            }
          }
          for (const c of st.storms) {
            const tx = hx(c.target)
            c.x += (tx - c.x) * dt * 1.2 + 20 * dt
            if (!c.hit && Math.abs(c.x - tx) < 12) {
              c.hit = true
              st.bolts.push({ x: tx, life: 0.35 })
              if (st.covered[c.target]) { st.saved++; st.msg = 'Umbrella held! 🌂' }
              else { st.coins -= REPAIR; st.repairs += REPAIR; st.dmg[c.target] = 1; st.msg = `Ouch — ${REPAIR} coins of repairs.` }
            }
          }
          st.storms = st.storms.filter((c) => !(c.hit && c.x > W + 100))
          for (const c of st.storms) if (c.hit) c.x += 160 * dt
        }
        // Sky.
        const stormy = st.storms.some((c) => !c.hit)
        s.background(dark ? s.color(0, 26, 8) : stormy ? s.color(120, 140, 170) : s.color(170, 210, 245))
        for (const b of st.bolts) {
          b.life -= dt
          s.stroke(255, 240, 150, 255 * Math.max(0, b.life / 0.35)); s.strokeWeight(4); s.noFill()
          s.beginShape(); s.vertex(b.x, 80); s.vertex(b.x - 14, 170); s.vertex(b.x + 8, 170); s.vertex(b.x - 10, 300); s.endShape()
        }
        st.bolts = st.bolts.filter((b) => b.life > 0)
        s.noStroke()
        for (const c of st.storms) {
          s.fill(dark ? s.color(0, 90, 40) : s.color(70, 80, 100))
          for (let k = 0; k < 4; k++) s.ellipse(c.x + k * 26 - 40, 80 + (k % 2) * 10, 70, 50)
          if (!c.hit) { s.stroke(150, 190, 255, 180); s.strokeWeight(2); for (let k = 0; k < 6; k++) { const rx = c.x - 40 + k * 16, ry = 110 + ((s.frameCount * 6 + k * 23) % 60); s.line(rx, ry, rx - 3, ry + 10) } s.noStroke() }
        }
        // Ground and houses.
        s.fill(dark ? s.color(0, 60, 25) : s.color(120, 190, 110)); s.rect(0, 400, W, 80)
        for (let i = 0; i < HOUSES; i++) {
          const x = hx(i)
          st.dmg[i] = Math.max(0, st.dmg[i] - dt * 0.3)
          s.push(); s.translate(x, 400)
          if (st.dmg[i] > 0) s.rotate(Math.sin(s.frameCount * 0.5) * 0.02 * st.dmg[i])
          s.fill(dark ? s.color(0, 160, 70) : s.color(240, 220, 190)); s.rect(-38, -60, 76, 60)
          s.fill(dark ? s.color(0, 110, 50) : s.color(200, 90, 70)); s.triangle(-46, -60, 46, -60, 0, -100)
          s.fill(90, 60, 40); s.rect(-10, -30, 20, 30)
          s.fill(255, 230, 150); s.rect(-30, -48, 14, 12); s.rect(16, -48, 14, 12)
          if (st.dmg[i] > 0.1) { s.stroke(60); s.strokeWeight(2); s.line(-20, -80, 10, -64); s.noStroke() }
          if (st.covered[i]) {
            s.fill(dark ? s.color(0, 255, 102) : s.color(233, 30, 99)); s.arc(0, -130, 130, 70, Math.PI, 0, s.CHORD)
            s.stroke(60); s.strokeWeight(3); s.line(0, -130, 0, -100); s.noStroke()
          }
          s.pop()
        }
        s.fill(dark ? s.color(0, 255, 102) : s.color(30, 41, 59)); s.textSize(14); s.textStyle(s.BOLD)
        s.text(`coins ${st.coins}`, 20, 30); s.text(`season ${Math.min(st.season, SEASONS)}/${SEASONS}`, 20, 52)
        s.fill(255, 255, 255, 120); s.rect(W - 220, 20, 200, 8, 4); s.fill(dark ? s.color(0, 255, 102) : s.color(59, 130, 246)); s.rect(W - 220, 20, 200 * (st.t / SEASON_S), 8, 4)
        if (s.frameCount % 6 === 0) setHud({ coins: st.coins, season: Math.min(st.season, SEASONS), covered: st.covered.filter(Boolean).length, msg: st.msg })
      }
      press = (x) => {
        if (!st.running) return
        const i = Math.round((x - 90) / 120)
        if (i >= 0 && i < HOUSES && Math.abs(x - hx(i)) < 60) st.covered[i] = !st.covered[i]
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
    <GameShell title="Insurance Umbrella" score={Math.max(0, hud.coins)} best={best} result={result} onRestart={restart}
      hint={`Tap a house to open/close its umbrella · +6 coins a season · ${hud.covered} covered (costs ${hud.covered}/season) · repairs cost ${REPAIR} · ${hud.msg}`}>
      <div ref={host} className="kg-host" />
    </GameShell>
  )
}
