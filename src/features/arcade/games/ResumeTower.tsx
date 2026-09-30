import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Resume Tower: stack achievement blocks into a tower an interviewer will
 * notice. Real achievements are solid, square-edged blocks; fluffy buzzwords
 * ("synergy!", "rockstar ninja") are wobbly balloons that look big but roll
 * off. Build as tall as you can with ten drops; only what stays up counts.
 */
type Card = { text: string; solid: boolean; w: number }
const DECK: Card[] = [
  { text: 'Led a team of 4', solid: true, w: 150 }, { text: 'Cut costs by 20%', solid: true, w: 150 }, { text: 'Shipped the app', solid: true, w: 140 },
  { text: 'Taught myself Python', solid: true, w: 170 }, { text: 'Volunteer coach', solid: true, w: 150 }, { text: 'Won regional award', solid: true, w: 160 },
  { text: 'Grew sales 3×', solid: true, w: 130 }, { text: 'Trained 12 new staff', solid: true, w: 170 },
  { text: 'Synergy!', solid: false, w: 120 }, { text: 'Rockstar ninja', solid: false, w: 140 }, { text: 'Thinks outside the box', solid: false, w: 190 }, { text: 'Go-getter', solid: false, w: 120 },
]
const W = 720, H = 540, GROUND = 510
const DROPS = 10

export default function ResumeTower() {
  const [best, submit] = useBest('resume')
  const cv = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ drops: DROPS, height: 0, next: DECK[0] })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ drop: (x: number) => void; skip: () => void; aim: (x: number) => void }>({ drop: () => {}, skip: () => {}, aim: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr)
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    Matter.Composite.add(e.world, [Matter.Bodies.rectangle(W / 2, GROUND + 20, 260, 40, { isStatic: true, friction: 1 })])
    const deck = [...DECK].sort(() => Math.random() - 0.5)
    const s = { drops: DROPS, i: 0, x: W / 2, blocks: [] as { b: Matter.Body; card: Card }[], running: true, settle: 0, skipped: 0 }
    const next = () => deck[s.i % deck.length]
    const sync = () => {
      const top = s.blocks.filter((k) => k.card.solid && k.b.position.y < GROUND && Math.abs(k.b.position.x - W / 2) < 150).reduce((m, k) => Math.min(m, k.b.bounds.min.y), GROUND)
      setHud({ drops: s.drops, height: Math.max(0, Math.round((GROUND - top) / 10)), next: next() })
    }
    api.current.aim = (x) => { s.x = Math.max(120, Math.min(W - 120, x)) }
    api.current.drop = (x) => {
      if (!s.running || s.drops <= 0) return
      s.x = Math.max(120, Math.min(W - 120, x))
      const card = next()
      const b = card.solid
        ? Matter.Bodies.rectangle(s.x, 40, card.w, 34, { friction: 0.9, frictionStatic: 1, restitution: 0, density: 0.004, chamfer: { radius: 4 } })
        : Matter.Bodies.circle(s.x, 40, card.w / 3.2, { friction: 0.02, restitution: 0.5, density: 0.0006 })
      Matter.Composite.add(e.world, b)
      s.blocks.push({ b, card }); s.drops--; s.i++
      sync()
      if (s.drops <= 0) s.settle = 2.5
    }
    api.current.skip = () => { if (s.running && !next().solid) { s.i++; s.skipped++; sync() } }
    sync()
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(33, now - last); last = now
      Matter.Engine.update(e, dt)
      for (const k of s.blocks) if (!k.card.solid) Matter.Body.applyForce(k.b, k.b.position, { x: Math.sin(now / 300 + k.b.id) * 0.00003, y: -0.00035 })
      if (s.running && s.settle > 0) {
        s.settle -= dt / 1000
        if (s.settle <= 0) {
          s.running = false
          const standing = s.blocks.filter((k) => k.card.solid && k.b.position.y < GROUND && Math.abs(k.b.position.x - W / 2) < 150)
          const top = standing.reduce((m, k) => Math.min(m, k.b.bounds.min.y), GROUND)
          const height = Math.round((GROUND - top) / 10)
          const fluff = s.blocks.filter((k) => !k.card.solid).length
          const score = height * 3 + standing.length * 5 + s.skipped * 3
          const record = submitRef.current(score)
          setResult({ headline: height > 25 ? 'Hired! 🎉' : 'Callback for a second interview', lines: [`Tower height ${height}`, `${standing.length} achievements standing`, `${fluff} buzzwords used, ${s.skipped} skipped`, `Score ${score}`], record })
        }
      }
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      ctx.fillStyle = dark ? '#001a08' : '#f8fafc'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = dark ? '#003314' : '#e2e8f0'; for (let i = 0; i < 20; i++) ctx.fillRect(0, GROUND - i * 50, W, 1)
      ctx.fillStyle = dark ? '#00662a' : '#475569'; ctx.fillRect(W / 2 - 130, GROUND, 260, 40)
      ctx.fillStyle = '#94a3b8'; ctx.font = '11px system-ui'; for (let i = 1; i < 10; i++) ctx.fillText(`${i * 5}`, 8, GROUND - i * 50 + 4)
      for (const k of s.blocks) {
        ctx.save(); ctx.translate(k.b.position.x, k.b.position.y); ctx.rotate(k.b.angle)
        if (k.card.solid) {
          ctx.fillStyle = dark ? '#00a044' : '#1e40af'; ctx.beginPath(); ctx.roundRect(-k.card.w / 2, -17, k.card.w, 34, 4); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k.card.text, 0, 1)
        } else {
          const r = k.card.w / 3.2
          ctx.fillStyle = 'rgba(244,114,182,0.75)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill()
          ctx.fillStyle = '#fff'; ctx.font = 'italic bold 11px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k.card.text, 0, 0)
        }
        ctx.restore()
      }
      if (s.running && s.drops > 0) {
        const card = next()
        ctx.globalAlpha = 0.5
        if (card.solid) { ctx.fillStyle = '#1e40af'; ctx.fillRect(s.x - card.w / 2, 23, card.w, 34) } else { ctx.fillStyle = '#f472b6'; ctx.beginPath(); ctx.arc(s.x, 40, card.w / 3.2, 0, 7); ctx.fill() }
        ctx.globalAlpha = 1
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center'; ctx.fillText(card.text, s.x, 44); ctx.textAlign = 'start'
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const pos = (ev: React.PointerEvent<HTMLCanvasElement>) => { const r = ev.currentTarget.getBoundingClientRect(); return ((ev.clientX - r.left) / r.width) * W }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Resume Tower" score={hud.height} best={best} result={result} onRestart={restart}
      hint={`Click to drop “${hud.next.text}” · ${hud.drops} drops left · height ${hud.height} · buzzwords float and roll — skip them`}>
      <canvas key={round} ref={cv} className="pb-canvas" style={{ aspectRatio: '720 / 540', cursor: 'crosshair' }} onPointerMove={(e) => api.current.aim(pos(e))} onPointerDown={(e) => api.current.drop(pos(e))} aria-label="Resume tower" />
      <div className="cf-tray">
        <button type="button" disabled={hud.next.solid} onClick={() => api.current.skip()}>🗑 Skip this buzzword</button>
      </div>
    </GameShell>
  )
}
