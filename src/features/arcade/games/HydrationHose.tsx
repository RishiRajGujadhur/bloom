import { useCallback, useEffect, useRef, useState } from 'react'
import { GameShell, useBest } from '../shell'

/**
 * Hydration Hose: a sunny garden and a leaky old hose. Hold the mouse to spray
 * where you point. Every pot dries out at its own pace — keep each one in its
 * happy band, not parched, not drowned. Joggers puff past now and then; a
 * splash for them is always welcome.
 */
const W = 800, H = 480, NOZ = { x: 60, y: 430 }
const ROUND = 60
type Pot = { x: number; w: number; water: number; rate: number; kind: string; happy: number }
type Drop = { x: number; y: number; vx: number; vy: number }
type Runner = { x: number; dir: 1 | -1; drank: number }

export default function HydrationHose() {
  const [best, submit] = useBest('hose')
  const cv = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ score: 0, t: ROUND })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr
    ctx.scale(dpr, dpr)
    const pots: Pot[] = [
      { x: 230, w: 70, water: 60, rate: 3.2, kind: 'basil', happy: 0 },
      { x: 360, w: 80, water: 55, rate: 1.6, kind: 'cactus', happy: 0 },
      { x: 490, w: 70, water: 65, rate: 4.5, kind: 'fern', happy: 0 },
      { x: 610, w: 80, water: 50, rate: 2.6, kind: 'tomato', happy: 0 },
      { x: 720, w: 60, water: 60, rate: 3.6, kind: 'flower', happy: 0 },
    ]
    const band: Record<string, [number, number]> = { basil: [45, 85], cactus: [15, 45], fern: [55, 95], tomato: [40, 80], flower: [40, 80] }
    let drops: Drop[] = []
    const runners: Runner[] = []
    const s = { t: ROUND, score: 0, spraying: false, aim: { x: 400, y: 200 }, running: true, drowned: 0, splashed: 0, nextRunner: 8 }
    const toLocal = (e: PointerEvent) => { const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H } }
    const down = (e: PointerEvent) => { s.spraying = true; s.aim = toLocal(e); c.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => { s.aim = toLocal(e) }
    const up = () => { s.spraying = false }
    c.addEventListener('pointerdown', down); c.addEventListener('pointermove', move); c.addEventListener('pointerup', up)
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (s.running) {
        s.t -= dt
        // Spray: velocity toward the aim point with a gentle arc.
        if (s.spraying) for (let i = 0; i < 4; i++) {
          const dx = s.aim.x - NOZ.x, dy = s.aim.y - NOZ.y
          const d = Math.hypot(dx, dy) || 1
          const sp = 380 + Math.min(260, d * 0.5)
          drops.push({ x: NOZ.x, y: NOZ.y, vx: (dx / d) * sp + (Math.random() - 0.5) * 30, vy: (dy / d) * sp + (Math.random() - 0.5) * 30 - 60 })
        }
        for (const p of pots) {
          p.water = Math.max(0, p.water - p.rate * dt)
          const [lo, hi] = band[p.kind]
          if (p.water >= lo && p.water <= hi) { p.happy += dt; s.score += dt * 2 }
          if (p.water > 100) { p.water = 70; s.drowned++; s.score = Math.max(0, s.score - 10) }
        }
        s.nextRunner -= dt
        if (s.nextRunner <= 0) { runners.push({ x: -40, dir: 1, drank: 0 }); s.nextRunner = 9 + Math.random() * 6 }
        for (const r of runners) r.x += r.dir * 140 * dt
        if (s.t <= 0) {
          s.running = false
          const score = Math.round(s.score)
          const record = submitRef.current(score)
          const fav = [...pots].sort((a, b) => b.happy - a.happy)[0]
          setResult({ headline: 'Sun’s going down', lines: [`Happiest pot: ${fav.kind} (${Math.round(fav.happy)}s in the green)`, `${s.drowned} overwaterings`, `${s.splashed} joggers refreshed`, `Score ${score}`], record })
        }
      }
      drops = drops.filter((d) => {
        d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt
        for (const r of runners) if (Math.abs(d.x - r.x) < 18 && d.y > 330 && d.y < 420) { r.drank += 1; if (r.drank === 12) { s.splashed++; s.score += 15 } return false }
        if (d.y > 360) {
          const p = pots.find((q) => Math.abs(q.x - d.x) < q.w / 2)
          if (p && d.y < 380) { p.water += 0.35; return false }
          return d.y < H
        }
        return d.x < W + 20
      })
      for (let i = runners.length - 1; i >= 0; i--) if (runners[i].x > W + 50) runners.splice(i, 1)
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, dark ? '#001a08' : '#9bd4ff'); sky.addColorStop(1, dark ? '#003a18' : '#e8f7ff')
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffd84d'; ctx.beginPath(); ctx.arc(700, 70, 36 + Math.sin(now / 400) * 2, 0, 7); ctx.fill()
      ctx.fillStyle = dark ? '#00401a' : '#8fd18a'; ctx.fillRect(0, 420, W, 60)
      ctx.fillStyle = dark ? '#003314' : '#6fb86a'; ctx.fillRect(0, 440, W, 40)
      for (const p of pots) {
        const [lo, hi] = band[p.kind]
        const ok = p.water >= lo && p.water <= hi
        const dry = p.water < lo
        // Plant.
        const droop = dry ? Math.min(1, (lo - p.water) / lo) : 0
        ctx.save(); ctx.translate(p.x, 380)
        ctx.strokeStyle = dry ? '#a3b35a' : '#2e8b3a'; ctx.lineWidth = 4
        for (let k = -2; k <= 2; k++) {
          ctx.beginPath(); ctx.moveTo(0, 0)
          ctx.quadraticCurveTo(k * 10, -40, k * 18 + k * droop * 10, -60 + droop * 40 + Math.abs(k) * 6); ctx.stroke()
          ctx.fillStyle = dry ? '#b5c46a' : p.kind === 'flower' ? '#ff6fa3' : p.kind === 'tomato' ? '#e84c3d' : '#3fae4a'
          ctx.beginPath(); ctx.ellipse(k * 18 + k * droop * 10, -62 + droop * 40 + Math.abs(k) * 6, 9, 6, k * 0.4, 0, 7); ctx.fill()
        }
        ctx.restore()
        ctx.fillStyle = '#c96a3c'; ctx.beginPath(); ctx.moveTo(p.x - p.w / 2, 370); ctx.lineTo(p.x + p.w / 2, 370); ctx.lineTo(p.x + p.w / 2 - 10, 425); ctx.lineTo(p.x - p.w / 2 + 10, 425); ctx.fill()
        // Meter with its happy band.
        ctx.fillStyle = '#ffffffaa'; ctx.fillRect(p.x - 30, 440, 60, 8)
        ctx.fillStyle = '#9be7a5'; ctx.fillRect(p.x - 30 + (lo / 100) * 60, 440, ((hi - lo) / 100) * 60, 8)
        ctx.fillStyle = ok ? '#1f7a34' : p.water > hi ? '#2563eb' : '#b45309'; ctx.fillRect(p.x - 30 + Math.min(1, p.water / 100) * 60 - 2, 436, 4, 16)
        ctx.fillStyle = '#243'; ctx.font = '11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(p.kind, p.x, 466)
      }
      for (const r of runners) {
        const bob = Math.sin(now / 60) * 3
        ctx.fillStyle = r.drank >= 12 ? '#22c55e' : '#f97316'
        ctx.beginPath(); ctx.arc(r.x, 350 + bob, 10, 0, 7); ctx.fill()
        ctx.fillRect(r.x - 7, 360 + bob, 14, 30)
        ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 5
        ctx.beginPath(); ctx.moveTo(r.x, 390 + bob); ctx.lineTo(r.x + Math.sin(now / 90) * 12, 418); ctx.moveTo(r.x, 390 + bob); ctx.lineTo(r.x - Math.sin(now / 90) * 12, 418); ctx.stroke()
        if (r.drank >= 12) { ctx.fillStyle = '#0f5132'; ctx.font = '12px system-ui'; ctx.fillText('ahh!', r.x, 330) }
      }
      ctx.fillStyle = '#5eb6ff'
      for (const d of drops) { ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(d.x, d.y, 3, 0, 7); ctx.fill() }
      ctx.globalAlpha = 1
      // Hose and nozzle.
      const ang = Math.atan2(s.aim.y - NOZ.y, s.aim.x - NOZ.x)
      ctx.strokeStyle = '#16a34a'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 470); ctx.quadraticCurveTo(30, 460, NOZ.x, NOZ.y); ctx.stroke()
      ctx.save(); ctx.translate(NOZ.x, NOZ.y); ctx.rotate(ang); ctx.fillStyle = '#facc15'; ctx.fillRect(0, -7, 30, 14); ctx.restore()
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ score: Math.round(s.score), t: Math.max(0, Math.ceil(s.t)) }) }
      raf = requestAnimationFrame(loop)
    }
    let hudT = 0
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', down); c.removeEventListener('pointermove', move); c.removeEventListener('pointerup', up) }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Hydration Hose" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Hold to spray where you point · keep every pot in its green band · splash the joggers · ${hud.t}s`}>
      <canvas key={round} ref={cv} className="cf-canvas" style={{ aspectRatio: '800 / 480' }} aria-label="Garden" />
    </GameShell>
  )
}
