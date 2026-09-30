import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import { GameShell, useBest } from '../shell'

/**
 * Deadline Dominoes: each domino is a task, and the bell at the end is the
 * deadline. Click along the shelf to stand dominoes up (tall ones reach
 * further when they fall), then tip the first one. Gaps wider than a domino
 * is tall stop the chain dead. Use as few as you can. Three shelves.
 */
const W = 820, H = 420, SHELF = 320
const LEVELS = [{ bell: 560, tray: { s: 10, t: 3 } }, { bell: 660, tray: { s: 8, t: 5 } }, { bell: 760, tray: { s: 7, t: 6 } }]
type Kind = 's' | 't'
const SIZE: Record<Kind, [number, number]> = { s: [12, 60], t: [14, 96] }

export default function DeadlineDominoes() {
  const [best, submit] = useBest('dominoes')
  const cv = useRef<HTMLCanvasElement>(null)
  const [kind, setKind] = useState<Kind>('s')
  const kindRef = useRef(kind)
  useEffect(() => { kindRef.current = kind }, [kind])
  const [hud, setHud] = useState({ level: 1, s: 10, t: 3, placed: 0, running: false, msg: 'Stand dominoes on the shelf, then tip the first one.' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ place: (x: number) => void; tip: () => void; clear: () => void }>({ place: () => {}, tip: () => {}, clear: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const dpr = Math.min(2, devicePixelRatio)
    c.width = W * dpr; c.height = H * dpr; ctx.scale(dpr, dpr)
    const e = Matter.Engine.create({ gravity: { x: 0, y: 1 } })
    e.positionIterations = 12
    const s = { level: 0, tray: { ...LEVELS[0].tray }, dominoes: [] as { b: Matter.Body; kind: Kind }[], bell: null as Matter.Body | null, running: false, rang: false, t0: 0, score: 0, used: 0, lines: [] as string[] }
    const shelf = Matter.Bodies.rectangle(W / 2, SHELF + 10, W * 2, 20, { isStatic: true, friction: 0.9 })
    Matter.Composite.add(e.world, shelf)
    const setupLevel = () => {
      s.dominoes.forEach((d) => Matter.Composite.remove(e.world, d.b)); s.dominoes = []
      if (s.bell) Matter.Composite.remove(e.world, s.bell)
      const L = LEVELS[s.level]
      s.bell = Matter.Bodies.rectangle(L.bell, SHELF - 40, 30, 80, { isStatic: true, isSensor: true })
      Matter.Composite.add(e.world, s.bell)
      s.tray = { ...L.tray }; s.running = false; s.rang = false
      sync('Stand dominoes on the shelf, then tip the first one.')
    }
    const sync = (msg?: string) => setHud((h) => ({ level: s.level + 1, s: s.tray.s, t: s.tray.t, placed: s.dominoes.length, running: s.running, msg: msg ?? h.msg }))
    api.current.place = (x: number) => {
      if (s.running) return
      const k = kindRef.current
      if (s.tray[k] <= 0 || x < 60 || x > LEVELS[s.level].bell - 20) return
      if (s.dominoes.some((d) => Math.abs(d.b.position.x - x) < 16)) return
      const [w, h] = SIZE[k]
      const b = Matter.Bodies.rectangle(x, SHELF - h / 2, w, h, { friction: 0.25, frictionStatic: 0.4, restitution: 0, density: 0.002, slop: 0.01 })
      Matter.Composite.add(e.world, b)
      s.dominoes.push({ b, kind: k }); s.tray[k]--
      s.dominoes.sort((a, bb) => a.b.position.x - bb.b.position.x)
      sync()
    }
    api.current.clear = () => { if (!s.running) setupLevel() }
    api.current.tip = () => {
      if (s.running || !s.dominoes.length) return
      s.running = true; s.t0 = performance.now()
      const first = s.dominoes[0].b
      Matter.Body.applyForce(first, { x: first.position.x, y: first.bounds.min.y }, { x: 0.006, y: 0 })
      sync('Here goes…')
    }
    setupLevel()
    let last = performance.now(), raf = 0
    const loop = (now: number) => {
      const dt = Math.min(20, now - last); last = now
      Matter.Engine.update(e, dt / 2); Matter.Engine.update(e, dt / 2)
      if (s.running) {
        // A falling domino tips its neighbour when the gap is shorter than its height.
        for (let i = 0; i < s.dominoes.length - 1; i++) {
          const d = s.dominoes[i], n = s.dominoes[i + 1]
          const h = SIZE[d.kind][1]
          if (d.b.angle > 0.35 && n.b.angle < 0.1 && n.b.position.x - d.b.position.x < h * 0.95 && n.b.angularVelocity < 0.02) Matter.Body.setAngularVelocity(n.b, 0.06)
        }
        const lastD = s.dominoes[s.dominoes.length - 1]
        if (lastD && lastD.b.angle > 0.35 && LEVELS[s.level].bell - lastD.b.position.x < SIZE[lastD.kind][1] * 0.95) lastD.b.angle = Math.max(lastD.b.angle, 0.5)
      }
      if (s.running && !s.rang) {
        // The bell rings if a falling domino reaches it.
        const L = LEVELS[s.level]
        if (s.dominoes.some((d) => d.b.angle > 0.4 && L.bell - d.b.position.x < SIZE[d.kind][1] * 0.95)) {
          s.rang = true
          const pts = 60 - s.dominoes.length * 3 + s.tray.s + s.tray.t * 2
          s.score += Math.max(15, pts); s.used += s.dominoes.length
          s.lines.push(`Shelf ${s.level + 1}: rang with ${s.dominoes.length} dominoes`)
          sync('🔔 Ding! Deadline met.')
          setTimeout(() => {
            if (s.level + 1 >= LEVELS.length) { const record = submitRef.current(s.score); setResult({ headline: 'Every deadline met 🔔', lines: [...s.lines, `Score ${s.score}`], record }) }
            else { s.level++; setupLevel() }
          }, 1400)
        } else if (now - s.t0 > 5000 && s.dominoes.every((d) => d.b.speed < 0.05)) {
          s.running = false
          sync('The chain stopped. Close the gap and try again (Clear to restart the shelf).')
        }
      }
      // Draw.
      const dark = document.documentElement.dataset.theme === 'matrix'
      ctx.fillStyle = dark ? '#001a08' : '#f5f3ff'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = dark ? '#003314' : '#a78bfa33'; for (let i = 0; i < 10; i++) ctx.fillRect(i * 90, 40, 70, 90)
      ctx.fillStyle = dark ? '#00ff66' : '#7c3aed'; ctx.fillRect(0, SHELF, W, 20)
      const L = LEVELS[s.level]
      // Bell.
      ctx.save(); ctx.translate(L.bell, SHELF - 80)
      if (s.rang) ctx.rotate(Math.sin(now / 60) * 0.3)
      ctx.fillStyle = '#eab308'; ctx.beginPath(); ctx.moveTo(-26, 60); ctx.quadraticCurveTo(-26, 0, 0, 0); ctx.quadraticCurveTo(26, 0, 26, 60); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#a16207'; ctx.beginPath(); ctx.arc(0, 64, 7, 0, 7); ctx.fill(); ctx.restore()
      ctx.fillStyle = '#475569'; ctx.font = '12px system-ui'; ctx.fillText('deadline', L.bell - 24, SHELF + 40)
      for (const d of s.dominoes) {
        ctx.save(); ctx.translate(d.b.position.x, d.b.position.y); ctx.rotate(d.b.angle)
        const [w, h] = SIZE[d.kind]
        ctx.fillStyle = d.kind === 't' ? '#1e293b' : '#334155'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 3); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -h / 4, 2.5, 0, 7); ctx.arc(0, h / 4, 2.5, 0, 7); ctx.fill()
        ctx.restore()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); Matter.Engine.clear(e) }
  }, [round])

  const click = (ev: React.PointerEvent<HTMLCanvasElement>) => { const r = ev.currentTarget.getBoundingClientRect(); api.current.place(((ev.clientX - r.left) / r.width) * W) }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Deadline Dominoes" score={hud.level * 10} best={best} result={result} onRestart={restart}
      hint={`Shelf ${hud.level}/3 · click the shelf to stand a domino · ${hud.msg}`}>
      <canvas key={round} ref={cv} className="cf-canvas" style={{ aspectRatio: '820 / 420', cursor: 'copy' }} onPointerDown={click} aria-label="Domino shelf" />
      <div className="cf-tray">
        <button type="button" className={kind === 's' ? 'on' : ''} onClick={() => setKind('s')}>▮ Short ({hud.s})</button>
        <button type="button" className={kind === 't' ? 'on' : ''} onClick={() => setKind('t')}>▮▮ Tall ({hud.t})</button>
        <button type="button" disabled={hud.running} onClick={() => api.current.clear()}>Clear shelf</button>
        <button type="button" className="cf-match" disabled={hud.running || !hud.placed} onClick={() => api.current.tip()}>👉 Tip the first</button>
      </div>
    </GameShell>
  )
}
