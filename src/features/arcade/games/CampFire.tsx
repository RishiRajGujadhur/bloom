import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Camp Fire: build a fire in a stone ring and keep the night warm. Pick
 * tinder, kindling or a log, then click over the pit to drop it. Strike one
 * of three matches. Flames jump between touching pieces: tinder catches from
 * anything, kindling from tinder, logs only from a good bed of kindling. Pile
 * on too much at once and the fire smothers.
 */
type Kind = 'tinder' | 'kindling' | 'log'
const W = 760, H = 500, PIT_X = 380, PIT_Y = 440
const FUEL: Record<Kind, number> = { tinder: 3.5, kindling: 9, log: 28 }
const HEAT: Record<Kind, number> = { tinder: 1, kindling: 2, log: 4 }
const NIGHT = 90
type Piece = Matter.Body & { kind?: Kind; burning?: boolean; fuel?: number; ember?: number }
type Spark = { x: number; y: number; vx: number; vy: number; life: number; hue: number }

export default function CampFire() {
  const [best, submit] = useBest('campfire')
  const cv = useRef<HTMLCanvasElement>(null)
  const [pick, setPick] = useState<Kind>('tinder')
  const [hud, setHud] = useState({ warmth: 0, matches: 3, t: NIGHT, heat: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ drop: (x: number) => void; strike: () => void }>({ drop: () => {}, strike: () => {} })
  const pickRef = useRef<Kind>('tinder')
  useEffect(() => { pickRef.current = pick }, [pick])
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr
    ctx.scale(dpr, dpr)
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    const ring: [number, number][] = [[222, 448], [230, 418], [242, 390], [538, 448], [530, 418], [518, 390]]
    const stones = ring.map(([x, y]) => Matter.Bodies.circle(x, y, 16, { isStatic: true, friction: 0.9 }))
    Matter.Composite.add(e.world, [Matter.Bodies.rectangle(W / 2, H + 10, W * 2, 60, { isStatic: true, friction: 1 }), ...stones])
    const pieces: Piece[] = []
    let sparks: Spark[] = []
    const s = { t: NIGHT, warmth: 0, matches: 3, running: true, peak: 0 }
    api.current.drop = (x: number) => {
      if (!s.running) return
      const k = pickRef.current
      const px = Math.max(PIT_X - 120, Math.min(PIT_X + 120, x))
      const b: Piece = k === 'tinder' ? Matter.Bodies.circle(px, 60, 9, { friction: 0.9, density: 0.0006 })
        : k === 'kindling' ? Matter.Bodies.rectangle(px, 60, 70, 7, { friction: 0.8, density: 0.001, angle: (Math.random() - 0.5) * 0.6 })
          : Matter.Bodies.rectangle(px, 60, 130, 22, { friction: 0.9, density: 0.003, chamfer: { radius: 10 }, angle: (Math.random() - 0.5) * 0.3 })
      b.kind = k; b.fuel = FUEL[k]; b.burning = false; b.ember = 0
      pieces.push(b)
      Matter.Composite.add(e.world, b)
    }
    api.current.strike = () => {
      if (!s.running || s.matches <= 0) return
      s.matches--
      // The match lights whatever is lowest in the pit.
      const unlit = pieces.filter((p) => !p.burning && p.fuel! > 0 && Math.abs(p.position.x - PIT_X) < 160).sort((a, b) => b.position.y - a.position.y)
      const low = unlit.find((p) => p.kind === 'tinder') ?? unlit[0]
      for (let i = 0; i < 20; i++) sparks.push({ x: PIT_X, y: PIT_Y - 20, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 90, life: 0.6, hue: 40 })
      if (low && (low.kind === 'tinder' || Math.random() < 0.15)) low.burning = true
    }
    let last = performance.now()
    let raf = 0
    let hudT = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      Matter.Engine.update(e, dt * 1000)
      if (s.running) s.t -= dt
      // Burning and spreading.
      const packed = pieces.filter((p) => Math.abs(p.position.x - PIT_X) < 150 && p.position.y > PIT_Y - 160).length
      const air = Math.max(0.25, 1 - Math.max(0, packed - 12) * 0.07)
      let heat = 0
      for (const p of pieces) {
        if (!p.burning) continue
        p.fuel! -= dt
        heat += HEAT[p.kind!] * air
        for (const q of pieces) {
          if (q === p || q.burning || q.fuel! <= 0) continue
          const d = Math.hypot(q.position.x - p.position.x, q.position.y - p.position.y)
          const reach = p.kind === 'log' ? 90 : p.kind === 'kindling' ? 70 : 45
          if (d > reach) continue
          const catchRate = q.kind === 'tinder' ? 2.5 : q.kind === 'kindling' ? (p.kind === 'tinder' ? 0.9 : 0.6) : (p.kind === 'tinder' ? 0.02 : 0.22)
          q.ember! += catchRate * air * dt
          if (q.ember! > 1) q.burning = true
        }
        if (Math.random() < dt * 30 * air) sparks.push({ x: p.position.x + (Math.random() - 0.5) * 30, y: p.position.y - 6, vx: (Math.random() - 0.5) * 20, vy: -40 - Math.random() * 60 * HEAT[p.kind!], life: 0.5 + Math.random() * 0.7, hue: 20 + Math.random() * 30 })
        if (p.fuel! <= 0) { p.burning = false; Matter.Composite.remove(e.world, p) }
      }
      for (let i = pieces.length - 1; i >= 0; i--) if (pieces[i].fuel! <= 0) pieces.splice(i, 1)
      if (s.running) { s.warmth += heat * dt; s.peak = Math.max(s.peak, heat) }
      if (s.running && s.t <= 0) {
        s.running = false
        const score = Math.round(s.warmth)
        const record = submitRef.current(score)
        setResult({ headline: 'Morning comes', lines: [`Warmth ${score}`, `Brightest blaze ${Math.round(s.peak)}`, `${3 - s.matches} matches used`], record })
      }
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      const glow = Math.min(1, heat / 20)
      sky.addColorStop(0, dark ? '#001408' : '#0b1030'); sky.addColorStop(1, dark ? '#002a10' : `rgb(${40 + glow * 80}, ${30 + glow * 30}, ${60})`)
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H)
      for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(now / 700 + i)})`; ctx.fillRect((i * 97) % W, (i * 53) % 220, 2, 2) }
      // Pines.
      ctx.fillStyle = dark ? '#003314' : '#0d1a24'
      for (let i = 0; i < 12; i++) { const x = i * 70 - 10, h = 120 + (i % 3) * 40; ctx.beginPath(); ctx.moveTo(x, H - 40); ctx.lineTo(x + 30, H - 40 - h); ctx.lineTo(x + 60, H - 40); ctx.fill() }
      ctx.fillStyle = dark ? '#00220c' : '#2a2320'; ctx.fillRect(0, H - 40, W, 40)
      // Glow.
      if (heat > 0) {
        const g = ctx.createRadialGradient(PIT_X, PIT_Y - 40, 10, PIT_X, PIT_Y - 40, 120 + heat * 12)
        g.addColorStop(0, `rgba(255,170,60,${0.25 + glow * 0.4})`); g.addColorStop(1, 'rgba(255,120,40,0)')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      }
      for (const b of stones) { ctx.fillStyle = '#7d7f86'; ctx.beginPath(); ctx.arc(b.position.x, b.position.y, 16, 0, 7); ctx.fill() }
      for (const p of pieces) {
        ctx.save()
        ctx.translate(p.position.x, p.position.y); ctx.rotate(p.angle)
        const charred = 1 - p.fuel! / FUEL[p.kind!]
        const base = p.kind === 'tinder' ? [214, 190, 110] : p.kind === 'kindling' ? [160, 110, 60] : [120, 80, 45]
        const mix = (v: number) => Math.round(v * (1 - charred * 0.7))
        ctx.fillStyle = p.burning ? `rgb(${Math.min(255, mix(base[0]) + 80)}, ${mix(base[1])}, ${mix(base[2]) - 20})` : `rgb(${mix(base[0])}, ${mix(base[1])}, ${mix(base[2])})`
        if (p.kind === 'tinder') { ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.fill() } else {
          const w = p.kind === 'log' ? 130 : 70, h = p.kind === 'log' ? 22 : 7
          ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, h / 2); ctx.fill()
          if (p.kind === 'log') { ctx.fillStyle = '#d8b07a'; ctx.beginPath(); ctx.ellipse(w / 2 - 4, 0, 5, 10, 0, 0, 7); ctx.fill() }
        }
        ctx.restore()
      }
      sparks = sparks.filter((sp) => (sp.life -= dt) > 0)
      for (const sp of sparks) {
        sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.vy -= 20 * dt
        const a = Math.min(1, sp.life * 1.6)
        ctx.fillStyle = `hsla(${sp.hue}, 100%, ${55 + sp.life * 20}%, ${a})`
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 3 + sp.life * 6, 0, 7); ctx.fill()
      }
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ warmth: Math.round(s.warmth), matches: s.matches, t: Math.max(0, Math.ceil(s.t)), heat: Math.round(heat) }) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const click = (ev: React.PointerEvent<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect()
    api.current.drop(((ev.clientX - r.left) / r.width) * W)
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Camp Fire" score={hud.warmth} best={best} result={result} onRestart={restart}
      hint={`Pick a piece, click over the pit to drop it, strike a match · heat ${hud.heat} · ${hud.t}s till dawn`}>
      <canvas ref={cv} key={round} className="cf-canvas" onPointerDown={click} aria-label="Fire pit" />
      <div className="cf-tray">
        {(['tinder', 'kindling', 'log'] as Kind[]).map((k) => (
          <button key={k} type="button" className={pick === k ? 'on' : ''} onClick={() => setPick(k)}>{k === 'tinder' ? '🌾 Tinder' : k === 'kindling' ? '🥢 Kindling' : '🌲 Log'}</button>
        ))}
        <button type="button" className="cf-match" disabled={!hud.matches} onClick={() => api.current.strike()}>🔥 Strike match ({hud.matches})</button>
      </div>
    </GameShell>
  )
}
