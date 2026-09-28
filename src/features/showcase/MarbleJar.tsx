import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'
import type { MoodEntry } from '../wellbeing/store'
import { usePageActions } from '../../components/ui/PageMenu'
import { subOn } from '../subFeatures'
import './showcase.css'

/** Mood 1–5 → marble colour (heavy blue … bright yellow). */
export const marbleColor = (mood: number) => ['#6c8ebf', '#8e9aaf', '#b8c4a9', '#7fc8a9', '#f7c948'][Math.max(1, Math.min(5, Math.round(mood))) - 1]

/**
 * Mood marbles: each check-in drops into a glass jar as a marble (matter-js
 * physics). Hover a marble to see its day; shake the jar to stir memories.
 */
export function MarbleJar({ entries }: { entries: MoodEntry[] }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Matter.Engine | null>(null)
  const [hover, setHover] = useState<MoodEntry | null>(null)
  const list = entries.slice(0, 80)
  const shake = () => {
    const engine = engineRef.current
    if (!engine) return
    for (const b of Matter.Composite.allBodies(engine.world)) if (!b.isStatic) Matter.Body.applyForce(b, b.position, { x: (Math.random() - 0.5) * 0.02, y: -0.03 * Math.random() })
  }
  usePageActions(list.length ? [{ id: 'jar-shake', label: 'Shake the mood jar', icon: '🫙', run: shake }] : [])

  useEffect(() => {
    const el = canvas.current
    if (!el || !list.length || !subOn('moodCheckin', 'marbleJar')) return
    const W = 260
    const H = 300
    const dpr = window.devicePixelRatio || 1
    el.width = W * dpr
    el.height = H * dpr
    const ctx = el.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    const engine = Matter.Engine.create({ gravity: { y: 1 } })
    engineRef.current = engine
    const wall = { isStatic: true, render: { visible: false } }
    Matter.Composite.add(engine.world, [
      Matter.Bodies.rectangle(W / 2, H - 14, W - 50, 20, wall),
      Matter.Bodies.rectangle(28, H / 2 + 20, 16, H - 40, { ...wall, angle: -0.06 }),
      Matter.Bodies.rectangle(W - 28, H / 2 + 20, 16, H - 40, { ...wall, angle: 0.06 }),
    ])
    const reduced = prefersReducedMotion()
    const marbles: { body: Matter.Body; entry: MoodEntry }[] = []
    const drop = (entry: MoodEntry, i: number) => {
      const body = Matter.Bodies.circle(W / 2 + (Math.random() - 0.5) * 80, reduced ? H - 40 - Math.floor(i / 8) * 18 : -20 - i * 4, 9, { restitution: 0.35, friction: 0.05 })
      marbles.push({ body, entry })
      Matter.Composite.add(engine.world, body)
    }
    const timers = [...list].reverse().map((e, i) => window.setTimeout(() => drop(e, i), reduced ? 0 : i * 70))
    let frame = 0
    const draw = () => {
      Matter.Engine.update(engine, 1000 / 60)
      ctx.clearRect(0, 0, W, H)
      // jar glass
      ctx.fillStyle = '#ffffff55'
      ctx.strokeStyle = '#9ec5d9'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(40, 30)
      ctx.lineTo(28, H - 10)
      ctx.quadraticCurveTo(W / 2, H + 8, W - 28, H - 10)
      ctx.lineTo(W - 40, 30)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#c8a27a'
      ctx.fillRect(36, 14, W - 72, 16)
      for (const { body, entry } of marbles) {
        const g = ctx.createRadialGradient(body.position.x - 3, body.position.y - 3, 1, body.position.x, body.position.y, 9)
        g.addColorStop(0, '#fff')
        g.addColorStop(0.35, marbleColor(entry.mood))
        g.addColorStop(1, marbleColor(entry.mood))
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(body.position.x, body.position.y, 9, 0, Math.PI * 2)
        ctx.fill()
      }
      // glass highlight
      ctx.strokeStyle = '#ffffffaa'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(52, 50)
      ctx.lineTo(44, H - 40)
      ctx.stroke()
      frame = requestAnimationFrame(draw)
    }
    frame = requestAnimationFrame(draw)
    const move = (ev: PointerEvent) => {
      const r = el.getBoundingClientRect()
      const x = ((ev.clientX - r.left) / r.width) * W
      const y = ((ev.clientY - r.top) / r.height) * H
      setHover(marbles.find((m) => Math.hypot(m.body.position.x - x, m.body.position.y - y) < 10)?.entry ?? null)
    }
    el.addEventListener('pointermove', move)
    return () => {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(frame)
      el.removeEventListener('pointermove', move)
      Matter.Engine.clear(engine)
      engineRef.current = null
    }
    // Re-run only when the set of entries changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.map((e) => e.id).join()])

  if (!subOn('moodCheckin', 'marbleJar') || !list.length) return null
  return (
    <section className="mj-wrap" aria-label="Mood marble jar">
      <canvas ref={canvas} className="mj-canvas" style={{ width: 260, height: 300 }} role="img" aria-label={`${list.length} mood marbles`} data-cursor-text="Hover" />
      <div className="mj-side">
        <h3>Mood marbles</h3>
        <p className="wb-muted">One marble for each check-in. Yellow is bright, blue is heavy.</p>
        <p className="mj-hover" aria-live="polite">
          {hover ? `${new Date(hover.at).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}${hover.note ? ` · ${hover.note}` : ''}` : 'Hover a marble to see its day.'}
        </p>
        <button type="button" className="quiet-button" onClick={shake}>Shake the jar</button>
        <div className="mj-legend">
          {[1, 2, 3, 4, 5].map((m) => (
            <span key={m} style={{ background: marbleColor(m) }} title={`Mood ${m}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
