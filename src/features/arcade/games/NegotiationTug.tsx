import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Negotiation Tug: haggle over a price with a stall-holder in a game of
 * tug-of-war. Hold to pull the price your way. When they heave, the rope goes
 * taut — keep pulling then and it snaps (no deal!). Ease off while they pull,
 * pull while they rest. Land the knot in the fair-price zone. Five deals.
 */
const W = 780, H = 420
const DEALS = [
  { item: 'Vintage bike', glyph: '🚲', ask: 180, fair: [120, 140] },
  { item: 'Armchair', glyph: '🛋️', ask: 90, fair: [55, 70] },
  { item: 'Record player', glyph: '📻', ask: 70, fair: [40, 52] },
  { item: 'Box of books', glyph: '📚', ask: 25, fair: [12, 17] },
  { item: 'Guitar', glyph: '🎸', ask: 150, fair: [95, 115] },
]

export default function NegotiationTug() {
  const [best, submit] = useBest('haggle')
  const cv = useRef<HTMLCanvasElement>(null)
  const pulling = useRef(false)
  const [hud, setHud] = useState({ deal: 0, price: DEALS[0].ask, tension: 0, mood: 'calm', msg: 'Hold to pull the price down.', score: 0 })
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
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    // A rope of small links between two hands.
    const links: Matter.Body[] = []
    for (let i = 0; i < 24; i++) links.push(Matter.Bodies.circle(160 + i * 19, 240, 6, { density: 0.002, frictionAir: 0.04, collisionFilter: { group: -1 } }))
    const chain = Matter.Composites.chain(Matter.Composite.create({ bodies: links }), 0.4, 0, -0.4, 0, { stiffness: 0.9, length: 2 })
    const leftHand = Matter.Bodies.circle(140, 240, 10, { isStatic: true })
    const rightHand = Matter.Bodies.circle(640, 240, 10, { isStatic: true })
    Matter.Composite.add(e.world, [chain, leftHand, rightHand,
      Matter.Constraint.create({ bodyA: leftHand, bodyB: links[0], length: 4, stiffness: 1 }),
      Matter.Constraint.create({ bodyA: rightHand, bodyB: links[links.length - 1], length: 4, stiffness: 1 })])
    const s = { deal: 0, offset: -1, tension: 0, their: 0, theirPhase: 0, running: true, score: 0, results: [] as string[], snaps: 0, pause: 0 }
    const knotIndex = 12
    const priceFor = (offset: number) => {
      const d = DEALS[s.deal]
      // offset: -1 (their side, full ask) .. +1 (your side, very low)
      const low = d.fair[0] * 0.6
      return Math.round(d.ask - ((offset + 1) / 2) * (d.ask - low))
    }
    const nextDeal = (outcome: string, pts: number) => {
      s.results.push(outcome); s.score += pts
      if (s.deal >= DEALS.length - 1) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: 'Market’s closing', lines: [...s.results, `Score ${s.score}`], record })
        return
      }
      s.deal++; s.offset = -1; s.tension = 0; s.pause = 1.2
    }
    let last = performance.now()
    let raf = 0
    let hudT = 0
    let msg = 'Hold to pull the price down.'
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (s.running && s.pause <= 0) {
        // The seller heaves in rhythm, a bit irregular.
        s.theirPhase += dt * (1.3 + s.deal * 0.12)
        const heave = Math.max(0, Math.sin(s.theirPhase * Math.PI) ** 3) * (1 + 0.3 * Math.sin(s.theirPhase * 0.7))
        s.their = heave
        const mine = pulling.current ? 1 : 0
        s.offset += (mine * 0.55 - heave * 0.45 - 0.05) * dt
        s.offset = Math.max(-1, Math.min(1, s.offset))
        // Tension builds when both pull at once.
        s.tension = Math.max(0, s.tension + (mine && heave > 0.4 ? dt * 1.6 : -dt * 0.9))
        if (s.tension >= 1) {
          s.snaps++
          msg = 'Snap! They walked off.'
          nextDeal(`${DEALS[s.deal].glyph} No deal (rope snapped)`, 0)
        }
      } else if (s.pause > 0) s.pause -= dt
      // Seal the deal by letting go while the knot sits in the fair zone for a moment.
      if (s.running && s.pause <= 0) {
        const price = priceFor(s.offset)
        const d = DEALS[s.deal]
        if (!pulling.current && s.their < 0.1 && price >= d.fair[0] && price <= d.fair[1]) {
          msg = `Deal at £${price}!`
          nextDeal(`${d.glyph} ${d.item}: £${price} (asked £${d.ask})`, 40 + Math.round((d.fair[1] - price) * 2))
        } else if (price < d.fair[0]) msg = 'Too low — they look offended.'
        else msg = pulling.current ? (s.their > 0.4 ? 'They’re pulling — ease off!' : 'Good, keep pulling.') : 'Hold to pull the price down.'
        if (price < d.fair[0] * 0.8 && !pulling.current) { msg = 'Insulted! They packed up.'; nextDeal(`${d.glyph} No deal (lowballed)`, 0) }
      }
      // Hands move with the offset.
      const x = s.offset * 120
      Matter.Body.setPosition(leftHand, { x: 140 - x * 0.3 + (pulling.current ? -14 : 0), y: 240 })
      Matter.Body.setPosition(rightHand, { x: 640 - x * 0.3 + s.their * 14, y: 240 })
      links.forEach((l) => Matter.Body.translate(l, { x: -x * 0.004, y: 0 }))
      Matter.Engine.update(e, dt * 1000)
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      ctx.fillStyle = dark ? '#001a08' : '#fff7ed'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = dark ? '#003314' : '#fed7aa'; ctx.fillRect(0, 330, W, 90)
      for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#ef4444' : '#fff'; ctx.beginPath(); ctx.moveTo(i * 78, 0); ctx.lineTo(i * 78 + 78, 0); ctx.lineTo(i * 78 + 78, 30); ctx.quadraticCurveTo(i * 78 + 39, 60, i * 78, 30); ctx.fill() }
      // Price scale.
      const d = DEALS[s.deal]
      const px = (p: number) => 640 - ((d.ask - p) / (d.ask - d.fair[0] * 0.6)) * 500
      ctx.fillStyle = '#bbf7d0'; ctx.fillRect(px(d.fair[0]), 290, px(d.fair[1]) - px(d.fair[0]), 22)
      ctx.strokeStyle = '#94a3b8'; ctx.strokeRect(140, 290, 500, 22)
      ctx.fillStyle = '#334155'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'
      ctx.fillText(`£${d.ask}`, 640, 330); ctx.fillText(`£${Math.round(d.fair[0] * 0.6)}`, 140, 330); ctx.fillText('fair', (px(d.fair[0]) + px(d.fair[1])) / 2, 306)
      // Rope.
      const tcol = s.tension > 0.7 ? '#ef4444' : s.tension > 0.35 ? '#f59e0b' : '#a16207'
      ctx.strokeStyle = tcol; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath()
      ctx.moveTo(leftHand.position.x, leftHand.position.y)
      links.forEach((l) => ctx.lineTo(l.position.x, l.position.y))
      ctx.lineTo(rightHand.position.x, rightHand.position.y); ctx.stroke()
      const knot = links[knotIndex].position
      const kx = px(priceFor(s.offset))
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(kx, 301, 8, 0, 7); ctx.fill()
      ctx.fillStyle = '#e11d48'; ctx.beginPath(); ctx.arc(knot.x, knot.y, 9, 0, 7); ctx.fill()
      // People.
      const person = (x: number, face: string, lean: number, label: string) => {
        ctx.save(); ctx.translate(x, 230); ctx.rotate(lean)
        ctx.fillStyle = '#334155'; ctx.fillRect(-18, 10, 36, 80)
        ctx.font = '46px system-ui'; ctx.textAlign = 'center'; ctx.fillText(face, 0, 0)
        ctx.restore()
        ctx.fillStyle = '#334155'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText(label, x, 350)
      }
      person(90, pulling.current ? '😤' : '🙂', pulling.current ? -0.25 : 0, 'you')
      person(690, s.their > 0.5 ? '😠' : s.tension > 0.5 ? '😬' : '😐', s.their * 0.3, 'seller')
      ctx.font = '54px system-ui'; ctx.textAlign = 'center'; ctx.fillText(d.glyph, W / 2, 130)
      ctx.fillStyle = '#334155'; ctx.font = 'bold 20px system-ui'; ctx.fillText(`£${priceFor(s.offset)}`, W / 2, 170)
      // Tension meter.
      ctx.fillStyle = '#e2e8f0'; ctx.fillRect(W / 2 - 80, 190, 160, 8)
      ctx.fillStyle = tcol; ctx.fillRect(W / 2 - 80, 190, 160 * Math.min(1, s.tension), 8)
      if ((hudT += dt) > 0.15) { hudT = 0; setHud({ deal: s.deal, price: priceFor(s.offset), tension: s.tension, mood: s.their > 0.4 ? 'heaving' : 'resting', msg, score: s.score }) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const d = DEALS[hud.deal]
  return (
    <GameShell title="Negotiation Tug" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Deal ${hud.deal + 1}/${DEALS.length}: ${d.item} · hold to pull, ease off when they heave · let go in the green zone to shake on it · ${hud.msg}`}>
      <canvas key={round} ref={cv} className="cf-canvas" style={{ aspectRatio: '780 / 420', cursor: 'pointer' }} aria-label="Tug of war"
        onPointerDown={() => { pulling.current = true }} onPointerUp={() => { pulling.current = false }} onPointerLeave={() => { pulling.current = false }} />
    </GameShell>
  )
}
