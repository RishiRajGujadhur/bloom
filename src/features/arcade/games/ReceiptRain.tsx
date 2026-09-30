import { useCallback, useEffect, useRef, useState } from 'react'
import p5 from 'p5'
import { GameShell, useBest } from '../shell'

/**
 * Receipt Rain (p5.js): your month's receipts flutter down. Most are fine, but
 * some hide a mistake — charged twice, a subscription you cancelled, a price
 * that doesn't match the shelf. Catch the dodgy ones in your folder to
 * dispute them; let the honest ones fall.
 */
const W = 780, H = 480
const TIME = 60
const GOOD = ['Coffee £2.80', 'Bus fare £1.75', 'Groceries £34.20', 'Book £8.99', 'Lunch £6.50', 'Haircut £15.00', 'Petrol £40.00', 'Cinema £9.50']
const BAD = ['Coffee £2.80 ×2 (charged twice)', 'Gym £29 (you cancelled!)', 'Milk £4.99 (shelf said £1.29)', 'Streaming £12 (free trial ended?)', 'Parking £60 (was £6)', 'Delivery £5 (said free)']
type R = { x: number; y: number; vx: number; rot: number; text: string; bad: boolean; caught: boolean }

export default function ReceiptRain() {
  const [best, submit] = useBest('receipts')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ score: 0, t: TIME })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    let dead = false
    const st = { folder: W / 2, rs: [] as R[], t: TIME, next: 0.3, score: 0, caughtBad: 0, caughtGood: 0, missed: 0, running: true }
    const sketch = (s: p5) => {
      s.setup = () => { if (dead) { s.remove(); return } s.createCanvas(W, H).parent(el); s.pixelDensity(Math.min(2, window.devicePixelRatio)) }
      s.draw = () => {
        const dt = Math.min(0.05, s.deltaTime / 1000)
        const dark = document.documentElement.dataset.theme === 'matrix'
        if (st.running) {
          st.t -= dt; st.next -= dt
          if (st.next <= 0) {
            const bad = Math.random() < 0.35
            st.rs.push({ x: 60 + Math.random() * (W - 120), y: -40, vx: (Math.random() - 0.5) * 40, rot: Math.random(), text: bad ? BAD[Math.floor(Math.random() * BAD.length)] : GOOD[Math.floor(Math.random() * GOOD.length)], bad, caught: false })
            st.next = Math.max(0.5, 1.2 - (TIME - st.t) * 0.01)
          }
          for (const r of st.rs) {
            r.y += (60 + (TIME - st.t)) * dt; r.x += Math.sin(r.y * 0.03 + r.rot * 6) * 40 * dt; r.rot += dt * 0.5
            if (!r.caught && r.y > 400 && r.y < 430 && Math.abs(r.x - st.folder) < 70) {
              r.caught = true
              if (r.bad) { st.caughtBad++; st.score += 15 } else { st.caughtGood++; st.score = Math.max(0, st.score - 5) }
            }
            if (!r.caught && r.y > H && r.bad) { r.caught = true; st.missed++ }
          }
          st.rs = st.rs.filter((r) => !r.caught && r.y < H + 50)
          if (st.t <= 0) {
            st.running = false
            const record = submitRef.current(st.score)
            setResult({ headline: 'Statement checked 🧾', lines: [`${st.caughtBad} dodgy charges disputed`, `${st.missed} slipped through`, `${st.caughtGood} honest receipts filed by mistake`, `Score ${st.score}`], record })
          }
        }
        s.background(dark ? s.color(0, 26, 8) : s.color(241, 245, 249))
        for (const r of st.rs) {
          s.push(); s.translate(r.x, r.y); s.rotate(Math.sin(r.rot * 3) * 0.3)
          s.fill(255); s.stroke(203, 213, 225); s.rect(-80, -22, 160, 44)
          s.noStroke(); s.fill(30, 41, 59); s.textSize(11); s.textAlign(s.CENTER, s.CENTER); s.text(r.text, 0, 0)
          s.stroke(203, 213, 225); for (let i = -80; i < 80; i += 8) s.line(i, 22, i + 4, 26)
          s.pop()
        }
        s.noStroke(); s.fill(dark ? s.color(0, 150, 60) : s.color(234, 88, 12)); s.rect(st.folder - 70, 410, 140, 50, 6)
        s.fill(255); s.textSize(13); s.textAlign(s.CENTER, s.CENTER); s.text('DISPUTE 📂', st.folder, 435)
        if (s.frameCount % 6 === 0) setHud({ score: st.score, t: Math.max(0, Math.ceil(st.t)) })
      }
    }
    const move = (e: PointerEvent) => { const c = el.querySelector('canvas'); if (!c) return; const r = c.getBoundingClientRect(); st.folder = Math.max(70, Math.min(W - 70, ((e.clientX - r.left) / r.width) * W)) }
    el.addEventListener('pointermove', move)
    const inst = new p5(sketch)
    return () => { dead = true; el.removeEventListener('pointermove', move); inst.remove(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Receipt Rain" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Move the folder under receipts with mistakes; let the honest ones fall · ${hud.t}s`}>
      <div ref={host} className="kg-host" style={{ touchAction: 'none' }} />
    </GameShell>
  )
}
