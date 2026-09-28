import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { AppData } from '../../model'
import { dayKey } from '../../dates'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { impactExp, SHATTER_SPEED } from './impactModel'
import './impact.css'

/**
 * Physics "impact events" for heavy tasks. When one is completed, its row is
 * replaced by a rigid body that falls, bounces off the screen edges, and can
 * be grabbed and thrown. Hitting a wall hard enough shatters it into debris
 * and grants bonus EXP. Other code calls `launchImpact()`.
 */
export type ImpactRequest = { taskId: string; title: string; rect: DOMRect; weight: number }
const EVENT = 'bloom:impact'
export function launchImpact(request: ImpactRequest) {
  if (prefersReducedMotion()) return false
  window.dispatchEvent(new CustomEvent<ImpactRequest>(EVENT, { detail: request }))
  return true
}

type Matter = typeof import('matter-js')
type Floater = { x: number; y: number; text: string; born: number }

export function ImpactLayer({ setData }: { setData: Dispatch<SetStateAction<AppData>> }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [active, setActive] = useState(false)
  const world = useRef<{
    M: Matter
    engine: import('matter-js').Engine
    bodies: Map<number, { title: string; w: number; h: number; weight: number; taskId: string; hue: number }>
    debris: { body: import('matter-js').Body; born: number; color: string }[]
    floaters: Floater[]
    stop: () => void
  } | null>(null)

  useEffect(() => {
    const onImpact = (event: Event) => {
      const req = (event as CustomEvent<ImpactRequest>).detail
      setActive(true)
      void ensureWorld().then((w) => w && spawn(w, req))
    }
    window.addEventListener(EVENT, onImpact)
    return () => window.removeEventListener(EVENT, onImpact)
    // ensureWorld/spawn read refs only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => world.current?.stop(), [])

  async function ensureWorld() {
    if (world.current) return world.current
    const el = canvas.current
    if (!el) return null
    const M = await import('matter-js')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = () => {
      el.width = window.innerWidth * dpr
      el.height = window.innerHeight * dpr
    }
    size()
    const engine = M.Engine.create({ gravity: { x: 0, y: 1.1 } })
    const W = () => window.innerWidth
    const H = () => window.innerHeight
    const thick = 200
    const walls = [
      M.Bodies.rectangle(W() / 2, H() + thick / 2, W() * 3, thick, { isStatic: true, label: 'wall' }),
      M.Bodies.rectangle(W() / 2, -thick / 2 - 400, W() * 3, thick, { isStatic: true, label: 'wall' }),
      M.Bodies.rectangle(-thick / 2, H() / 2, thick, H() * 3, { isStatic: true, label: 'wall' }),
      M.Bodies.rectangle(W() + thick / 2, H() / 2, thick, H() * 3, { isStatic: true, label: 'wall' }),
    ]
    M.Composite.add(engine.world, walls)
    const mouse = M.Mouse.create(el)
    mouse.pixelRatio = dpr
    const drag = M.MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } })
    M.Composite.add(engine.world, drag)
    const bodies = new Map<number, { title: string; w: number; h: number; weight: number; taskId: string; hue: number }>()
    const debris: { body: import('matter-js').Body; born: number; color: string }[] = []
    const floaters: Floater[] = []

    M.Events.on(engine, 'collisionStart', (e) => {
      for (const pair of e.pairs) {
        const [a, b] = [pair.bodyA, pair.bodyB]
        const task = bodies.has(a.id) ? a : bodies.has(b.id) ? b : null
        const other = task === a ? b : a
        if (!task || other.label !== 'wall') continue
        const speed = Math.hypot(task.velocity.x, task.velocity.y)
        if (speed >= SHATTER_SPEED && subOn('impactTasks', 'shatter')) shatter(task)
      }
    })

    function shatter(body: import('matter-js').Body) {
      const info = bodies.get(body.id)
      if (!info) return
      bodies.delete(body.id)
      M.Composite.remove(engine.world, body)
      const pieces = 10 + info.weight * 6
      for (let i = 0; i < pieces; i++) {
        const shard = M.Bodies.polygon(
          body.position.x + (Math.random() - 0.5) * info.w * 0.6,
          body.position.y + (Math.random() - 0.5) * info.h * 0.6,
          3 + Math.floor(Math.random() * 3),
          5 + Math.random() * 10,
          { restitution: 0.6, frictionAir: 0.02 },
        )
        M.Body.setVelocity(shard, {
          x: body.velocity.x * 0.4 + (Math.random() - 0.5) * 16,
          y: body.velocity.y * 0.4 + (Math.random() - 0.5) * 16,
        })
        M.Body.setAngularVelocity(shard, (Math.random() - 0.5) * 0.6)
        M.Composite.add(engine.world, shard)
        debris.push({ body: shard, born: performance.now(), color: `hsl(${info.hue + Math.random() * 30} 75% ${55 + Math.random() * 20}%)` })
      }
      const exp = impactExp(info.weight)
      if (subOn('impactTasks', 'bonusExp') && exp > 0) {
        setData((d) => {
          const key = `impact:${info.taskId}`
          if (d.rpg.ledger[key]) return d
          return {
            ...d,
            rpg: {
              ...d.rpg,
              ledger: {
                ...d.rpg.ledger,
                [key]: { day: dayKey(), at: Date.now(), exp, stat: 'strength', points: info.weight * 2, gold: 0, active: true, kind: 'impact', sourceId: info.taskId },
              },
            },
          }
        })
        floaters.push({ x: body.position.x, y: body.position.y, text: `+${exp} EXP`, born: performance.now() })
      }
      if (subOn('impactTasks', 'shake')) {
        document.documentElement.classList.remove('impact-shake')
        void document.documentElement.offsetWidth
        document.documentElement.classList.add('impact-shake')
      }
      burst({ x: body.position.x, y: body.position.y }, 'coins')
    }

    const ctx = el.getContext('2d')!
    let raf = 0
    let last = performance.now()
    const idleSince = { t: performance.now() }
    const loop = (now: number) => {
      M.Engine.update(engine, Math.min(32, now - last))
      last = now
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W(), H())
      for (const body of M.Composite.allBodies(engine.world)) {
        const info = bodies.get(body.id)
        if (!info) continue
        ctx.save()
        ctx.translate(body.position.x, body.position.y)
        ctx.rotate(body.angle)
        ctx.shadowColor = 'rgba(0,0,0,.25)'
        ctx.shadowBlur = 18
        ctx.shadowOffsetY = 8
        ctx.fillStyle = `hsl(${info.hue} 70% 96%)`
        ctx.strokeStyle = `hsl(${info.hue} 60% 55%)`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(-info.w / 2, -info.h / 2, info.w, info.h, 14)
        ctx.fill()
        ctx.shadowColor = 'transparent'
        ctx.stroke()
        ctx.fillStyle = '#2b2230'
        ctx.font = '600 15px system-ui, sans-serif'
        ctx.textBaseline = 'middle'
        const text = info.title.length > 42 ? `${info.title.slice(0, 40)}…` : info.title
        ctx.fillText(`✓ ${text}`, -info.w / 2 + 16, 0)
        ctx.restore()
      }
      for (let i = debris.length - 1; i >= 0; i--) {
        const d = debris[i]
        const age = (now - d.born) / 2600
        if (age >= 1) {
          M.Composite.remove(engine.world, d.body)
          debris.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 1 - age
        ctx.fillStyle = d.color
        ctx.beginPath()
        d.body.vertices.forEach((v, j) => (j ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y)))
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        const f = floaters[i]
        const age = (now - f.born) / 1400
        if (age >= 1) {
          floaters.splice(i, 1)
          continue
        }
        ctx.globalAlpha = 1 - age
        ctx.fillStyle = '#e8a200'
        ctx.font = '800 26px system-ui, sans-serif'
        ctx.fillText(f.text, f.x - 50, f.y - age * 70)
        ctx.globalAlpha = 1
      }
      if (bodies.size || debris.length || floaters.length) idleSince.t = now
      // Tasks nobody throws settle and fade away after a while.
      if (bodies.size && now - lastSpawn > 14000 && !drag.body) clearTasks()
      if (now - idleSince.t > 600) {
        // Nothing left: release the screen and pause until the next impact.
        setActive(false)
        running = false
        ctx.clearRect(0, 0, W(), H())
        return
      }
      raf = requestAnimationFrame(loop)
    }
    const clearTasks = () => {
      for (const id of [...bodies.keys()]) {
        const body = M.Composite.allBodies(engine.world).find((b) => b.id === id)
        if (body) M.Composite.remove(engine.world, body)
        bodies.delete(id)
      }
    }
    let running = false
    const start = () => {
      if (running) return
      running = true
      last = performance.now()
      idleSince.t = last
      raf = requestAnimationFrame(loop)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearTasks()
    }
    window.addEventListener('keydown', onKey)
    let lastSpawn = performance.now()
    const onResize = () => size()
    window.addEventListener('resize', onResize)
    world.current = {
      M,
      engine,
      bodies,
      debris,
      floaters,
      stop: () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', onResize)
        window.removeEventListener('keydown', onKey)
        M.Engine.clear(engine)
      },
    }
    ;(world.current as unknown as { markSpawn: () => void }).markSpawn = () => {
      lastSpawn = performance.now()
      start()
    }
    return world.current
  }

  function spawn(w: NonNullable<typeof world.current>, req: ImpactRequest) {
    const { M, engine, bodies } = w
    const width = Math.min(req.rect.width, 460)
    const height = Math.max(46, Math.min(req.rect.height, 64))
    const body = M.Bodies.rectangle(req.rect.left + width / 2, req.rect.top + height / 2, width, height, {
      restitution: 0.55,
      friction: 0.2,
      frictionAir: 0.008,
      chamfer: { radius: 12 },
      density: 0.002 + req.weight * 0.001,
    })
    M.Body.setVelocity(body, { x: (Math.random() - 0.5) * 6, y: -6 - req.weight * 2 })
    M.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08)
    bodies.set(body.id, { title: req.title, w: width, h: height, weight: req.weight, taskId: req.taskId, hue: 18 + req.weight * 12 })
    M.Composite.add(engine.world, body)
    ;(w as unknown as { markSpawn: () => void }).markSpawn()
  }

  return (
    <>
      <canvas ref={canvas} className="impact-canvas" data-active={active} aria-hidden="true" />
      {active && subOn('impactTasks', 'hint') && (
        <p className="impact-hint" role="status">
          Grab it and throw it at the wall to shatter it for bonus EXP · Esc to dismiss
        </p>
      )}
    </>
  )
}
