import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Big Rocks Jar: a week is a jar. The big rocks are the things that matter
 * most (friends, sleep, that project), the pebbles are errands, the sand is
 * scrolling and small stuff. Pick what to pour and click over the jar to
 * drop it. Everything has to fit under the lid — and the order you pour in
 * changes what fits.
 */
const W = 640, H = 560
const JX = 320, JW = 210, JTOP = 290, JBOT = 520
type Kind = 'rock' | 'pebble' | 'sand'
const ROCKS = ['👫', '😴', '🏃', '📚', '🎨']
type B = Matter.Body & { kind?: Kind; label2?: string }

export default function BigRocks() {
  const [best, submit] = useBest('rocks')
  const cv = useRef<HTMLCanvasElement>(null)
  const [kind, setKind] = useState<Kind>('rock')
  const kindRef = useRef(kind)
  useEffect(() => { kindRef.current = kind }, [kind])
  const [hud, setHud] = useState({ rocks: 5, pebbles: 16, sand: 280, inside: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ drop: (x: number) => void; close: () => void }>({ drop: () => {}, close: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr)
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    const glass = { isStatic: true, friction: 0.3 }
    Matter.Composite.add(e.world, [
      Matter.Bodies.rectangle(JX - JW / 2, (JTOP + JBOT) / 2, 12, JBOT - JTOP, glass),
      Matter.Bodies.rectangle(JX + JW / 2, (JTOP + JBOT) / 2, 12, JBOT - JTOP, glass),
      Matter.Bodies.rectangle(JX, JBOT + 6, JW + 12, 12, glass),
      Matter.Bodies.rectangle(W / 2, H + 30, W * 2, 60, { isStatic: true }),
    ])
    const bodies: B[] = []
    const s = { rocks: 5, pebbles: 16, sand: 280, running: true, rockI: 0 }
    api.current.drop = (x: number) => {
      if (!s.running) return
      const k = kindRef.current
      const px = Math.max(JX - JW / 2 + 30, Math.min(JX + JW / 2 - 30, x))
      if (k === 'rock' && s.rocks > 0) {
        const b: B = Matter.Bodies.polygon(px, 60, 7, 44, { friction: 0.6, restitution: 0.05, density: 0.004 })
        b.kind = 'rock'; b.label2 = ROCKS[s.rockI++ % ROCKS.length]; s.rocks--; bodies.push(b); Matter.Composite.add(e.world, b)
      } else if (k === 'pebble' && s.pebbles > 0) {
        const b: B = Matter.Bodies.polygon(px, 60, 5, 18, { friction: 0.5, restitution: 0.1, density: 0.003 })
        b.kind = 'pebble'; s.pebbles--; bodies.push(b); Matter.Composite.add(e.world, b)
      } else if (k === 'sand' && s.sand > 0) {
        for (let i = 0; i < 16 && s.sand > 0; i++) {
          const b: B = Matter.Bodies.circle(px + (Math.random() - 0.5) * 40, 50 - i * 6, 5, { friction: 0.2, restitution: 0, density: 0.001 })
          b.kind = 'sand'; s.sand--; bodies.push(b); Matter.Composite.add(e.world, b)
        }
      }
    }
    api.current.close = () => {
      if (!s.running) return
      s.running = false
      // The lid sits at the jar top: anything poking out doesn't make it into the week.
      const inside = (k: Kind) => bodies.filter((b) => b.kind === k && b.bounds.min.y > JTOP - 4 && Math.abs(b.position.x - JX) < JW / 2).length
      const r = inside('rock'), p = inside('pebble'), sd = inside('sand')
      const score = r * 30 + p * 4 + Math.round(sd / 4)
      const record = submitRef.current(score)
      setResult({ headline: r === 5 ? 'All the big rocks fit!' : `${5 - r} big rocks didn’t fit`, lines: [`Big rocks ${r}/5`, `Pebbles ${p}`, `Sand ${sd}`, `Score ${score}`], record })
    }
    let last = performance.now()
    let raf = 0
    let hudT = 0
    const loop = (now: number) => {
      const dt = Math.min(33, now - last); last = now
      Matter.Engine.update(e, dt)
      const dark = document.documentElement.dataset.theme === 'matrix'
      ctx.fillStyle = dark ? '#001a08' : '#f5f0e8'; ctx.fillRect(0, 0, W, H)
      // Shelf and jar.
      ctx.fillStyle = dark ? '#003314' : '#d6c3a5'; ctx.fillRect(0, JBOT + 12, W, H)
      ctx.fillStyle = 'rgba(186, 230, 253, 0.25)'; ctx.fillRect(JX - JW / 2, JTOP, JW, JBOT - JTOP)
      ctx.strokeStyle = dark ? '#00ff66' : '#94a3b8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(JX - JW / 2, JTOP - 10); ctx.lineTo(JX - JW / 2, JBOT); ctx.lineTo(JX + JW / 2, JBOT); ctx.lineTo(JX + JW / 2, JTOP - 10); ctx.stroke()
      ctx.setLineDash([8, 8]); ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(JX - JW / 2 - 20, JTOP); ctx.lineTo(JX + JW / 2 + 20, JTOP); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle = '#64748b'; ctx.font = '12px system-ui'; ctx.fillText('lid line', JX + JW / 2 + 24, JTOP + 4)
      for (const b of bodies) {
        const v = b.vertices
        ctx.beginPath(); v.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath()
        ctx.fillStyle = b.kind === 'rock' ? (dark ? '#00b050' : '#78716c') : b.kind === 'pebble' ? (dark ? '#008040' : '#a8a29e') : (dark ? '#00ff66' : '#e7c982')
        ctx.fill()
        if (b.kind === 'rock') { ctx.strokeStyle = '#57534e'; ctx.lineWidth = 2; ctx.stroke(); ctx.font = '26px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.label2 ?? '', b.position.x, b.position.y); ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic' }
      }
      if ((hudT += dt) > 150) { hudT = 0; setHud({ rocks: s.rocks, pebbles: s.pebbles, sand: s.sand, inside: bodies.filter((b) => b.kind === 'rock' && b.bounds.min.y > JTOP).length }) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const click = (ev: React.PointerEvent<HTMLCanvasElement>) => { const r = ev.currentTarget.getBoundingClientRect(); api.current.drop(((ev.clientX - r.left) / r.width) * W) }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Big Rocks Jar" score={hud.inside * 30} best={best} result={result} onRestart={restart}
      hint={`Pick what to pour, click over the jar · everything must end up under the lid line · then close the lid`}>
      <canvas key={round} ref={cv} className="pb-canvas" style={{ aspectRatio: '640 / 560', cursor: 'crosshair' }} onPointerDown={click} aria-label="A jar" />
      <div className="cf-tray">
        <button type="button" className={kind === 'rock' ? 'on' : ''} onClick={() => setKind('rock')}>⛰ Big rocks ({hud.rocks})</button>
        <button type="button" className={kind === 'pebble' ? 'on' : ''} onClick={() => setKind('pebble')}>⚪ Pebbles ({hud.pebbles})</button>
        <button type="button" className={kind === 'sand' ? 'on' : ''} onClick={() => setKind('sand')}>⏳ Sand ({hud.sand})</button>
        <button type="button" className="cf-match" onClick={() => api.current.close()}>Close the lid</button>
      </div>
    </GameShell>
  )
}
