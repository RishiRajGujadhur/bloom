import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Team Raft: a raft of six friends shoots the rapids. You can't paddle — you
 * can only decide who paddles where. Click a crew member to swap them between
 * the left and right sides (or let them rest in the middle). More strength on
 * the left pushes the raft right, and tired paddlers weaken until they rest.
 */
const W = 760, H = 520
const TIME = 80
type Crew = { name: string; glyph: string; power: number; side: -1 | 0 | 1; energy: number }
type Rock = { x: number; y: number; r: number }

export default function TeamRaft() {
  const [best, submit] = useBest('raft')
  const cv = useRef<HTMLCanvasElement>(null)
  const [crew, setCrew] = useState<Crew[]>([])
  const [hud, setHud] = useState({ dist: 0, bumps: 0, t: TIME })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const crewRef = useRef<Crew[]>([])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const init: Crew[] = [
      { name: 'Mo', glyph: '💪', power: 1.4, side: -1, energy: 1 },
      { name: 'Ada', glyph: '🧢', power: 1.0, side: 1, energy: 1 },
      { name: 'Kai', glyph: '🎒', power: 0.8, side: -1, energy: 1 },
      { name: 'Zoe', glyph: '🕶️', power: 1.2, side: 1, energy: 1 },
      { name: 'Ben', glyph: '🎧', power: 0.6, side: 0, energy: 1 },
      { name: 'Lia', glyph: '🌻', power: 0.9, side: 0, energy: 1 },
    ]
    crewRef.current = init
    setCrew(init)
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr
    ctx.scale(dpr, dpr)
    const s = { x: W / 2, vx: 0, scroll: 0, t: TIME, bumps: 0, running: true, flash: 0, rocks: [] as Rock[], nextRock: 0 }
    const riverAt = (y: number) => W / 2 + Math.sin((s.scroll - y) * 0.004) * 120 + Math.sin((s.scroll - y) * 0.011) * 40
    let last = performance.now()
    let raf = 0
    let hudT = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (s.running) {
        s.t -= dt
        const speed = 130 + (TIME - s.t) * 1.2
        s.scroll += speed * dt
        // Paddling: force from each side; tired paddlers pull less.
        let force = 0
        for (const m of crewRef.current) {
          if (m.side === 0) m.energy = Math.min(1, m.energy + dt * 0.25)
          else { m.energy = Math.max(0.15, m.energy - dt * 0.06 * m.power); force += -m.side * m.power * m.energy }
        }
        // Current: the river pulls the raft toward its centre-line a little.
        const centre = riverAt(H - 140)
        s.vx += (force * 60 + (centre - s.x) * 0.4) * dt
        s.vx *= 0.96
        s.x += s.vx * dt
        // Banks.
        const bankL = centre - 160, bankR = centre + 160
        if (s.x < bankL + 40 || s.x > bankR - 40) { s.x = Math.max(bankL + 40, Math.min(bankR - 40, s.x)); s.vx *= -0.4; if (s.flash <= 0) { s.bumps++; s.flash = 0.6 } }
        // Rocks.
        s.nextRock -= dt
        if (s.nextRock <= 0) { const y = -40; s.rocks.push({ x: riverAt(y) + (Math.random() - 0.5) * 220, y, r: 18 + Math.random() * 16 }); s.nextRock = Math.max(0.7, 1.8 - (TIME - s.t) * 0.012) }
        for (const r of s.rocks) r.y += speed * dt
        s.rocks = s.rocks.filter((r) => r.y < H + 60)
        for (const r of s.rocks) if (Math.hypot(r.x - s.x, r.y - (H - 140)) < r.r + 34 && s.flash <= 0) { s.bumps++; s.flash = 0.8; s.vx += (s.x > r.x ? 1 : -1) * 120 }
        s.flash = Math.max(0, s.flash - dt)
        if (s.t <= 0 || s.bumps >= 6) {
          s.running = false
          const dist = Math.round(s.scroll / 10)
          const score = Math.max(0, dist - s.bumps * 40)
          const record = submitRef.current(score)
          setResult({ headline: s.bumps >= 6 ? 'Capsized!' : 'Made it to the lake!', lines: [`${dist} m downriver`, `${s.bumps} bumps`, `Score ${score}`], record })
        }
      }
      // Draw river.
      const dark = document.documentElement.dataset.theme === 'matrix'
      ctx.fillStyle = dark ? '#003a18' : '#5f9e4a'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = dark ? '#00220c' : '#2f7fb7'
      ctx.beginPath()
      for (let y = 0; y <= H; y += 10) ctx.lineTo(riverAt(y) - 160, y)
      for (let y = H; y >= 0; y -= 10) ctx.lineTo(riverAt(y) + 160, y)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2
      for (let i = 0; i < 26; i++) {
        const y = ((i * 47 + s.scroll * 1.2) % (H + 40)) - 20
        const x = riverAt(y) + ((i * 71) % 260) - 130
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y + 6, x + 22, y); ctx.stroke()
      }
      for (const r of s.rocks) {
        ctx.fillStyle = '#6b7280'; ctx.beginPath(); ctx.ellipse(r.x, r.y, r.r, r.r * 0.8, 0.3, 0, 7); ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(r.x, r.y - r.r * 0.9, r.r * 0.9, Math.PI * 0.1, Math.PI * 0.9, true); ctx.stroke()
      }
      // Raft.
      const ry = H - 140
      ctx.save(); ctx.translate(s.x, ry); ctx.rotate(s.vx * 0.003)
      if (s.flash > 0 && Math.floor(now / 80) % 2) ctx.globalAlpha = 0.5
      ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.roundRect(-44, -60, 88, 120, 30); ctx.fill()
      ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.roundRect(-34, -50, 68, 100, 22); ctx.fill()
      crewRef.current.forEach((m, i) => {
        const row = Math.floor(i / 2)
        const x = m.side === 0 ? 0 : m.side * 22
        const y = -36 + row * 34 + (m.side === 0 ? (i % 2) * 12 - 6 : 0)
        ctx.fillStyle = m.side === 0 ? '#94a3b8' : `hsl(${120 * m.energy}, 70%, 45%)`
        ctx.beginPath(); ctx.arc(x, y, 11, 0, 7); ctx.fill()
        if (m.side !== 0) {
          const stroke = Math.sin(now / 180 + i) * 12
          ctx.strokeStyle = '#7c4a1e'; ctx.lineWidth = 4
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + m.side * 34, y + stroke); ctx.stroke()
        }
      })
      ctx.restore()
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ dist: Math.round(s.scroll / 10), bumps: s.bumps, t: Math.max(0, Math.ceil(s.t)) }); setCrew([...crewRef.current]) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round])

  const cycle = (i: number) => {
    const m = crewRef.current[i]
    m.side = m.side === -1 ? 0 : m.side === 0 ? 1 : -1
    setCrew([...crewRef.current])
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const side = (v: number) => (v === -1 ? 'left' : v === 1 ? 'right' : 'resting')
  return (
    <GameShell title="Team Raft" score={Math.max(0, hud.dist - hud.bumps * 40)} best={best} result={result} onRestart={restart}
      hint={`Click a crew card to move them left → rest → right · paddling left steers right · ${hud.dist} m · bumps ${hud.bumps}/6 · ${hud.t}s`}>
      <canvas key={round} ref={cv} className="cf-canvas" style={{ aspectRatio: '760 / 520' }} aria-label="River rapids" />
      <div className="cf-tray">
        {crew.map((m, i) => (
          <button key={m.name} type="button" className={`tr-card ${side(m.side)}`} onClick={() => cycle(i)}>
            <span>{m.glyph} {m.name}</span>
            <small>{'★'.repeat(Math.round(m.power * 2))} · {side(m.side)}</small>
            <i style={{ width: `${m.energy * 100}%` }} />
          </button>
        ))}
      </div>
    </GameShell>
  )
}
