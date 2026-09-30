import { useCallback, useEffect, useRef, useState } from 'react'
import * as pc from 'playcanvas'
import { GameShell, useBest } from '../shell'

/**
 * Traffic Light Crossing (PlayCanvas): run errands across a busy four-lane
 * street. Click (or ↑ / Space) to step forward a lane, ↓ to step back. The
 * crossing light cycles; cars stop for the red, and crossing on the green
 * man earns a bonus. Three bumps and you head home.
 */
const ROUND = 90
const LANES = [6, 2, -2, -6]
const START = 10, GOAL = -10
const ERRANDS = ['🥖 Bakery', '📮 Post office', '🏫 School run', '💊 Pharmacy', '📚 Library', '🥕 Market', '🏦 Bank', '☕ Café']
type Car = { e: pc.Entity; lane: number; dir: 1 | -1; speed: number; len: number }
type Phase = 'go' | 'amber' | 'stop'

export default function TrafficCrossing() {
  const [best, submit] = useBest('crossing')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ score: 0, lives: 3, t: ROUND, walk: false, errand: ERRANDS[0] })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const cv = document.createElement('canvas')
    cv.className = 'co-canvas'
    cv.setAttribute('aria-label', 'Street crossing')
    el.appendChild(cv)
    const app = new pc.Application(cv, { mouse: new pc.Mouse(cv), touch: new pc.TouchDevice(cv) })
    app.setCanvasFillMode(pc.FILLMODE_NONE)
    app.setCanvasResolution(pc.RESOLUTION_AUTO)
    const resize = () => app.resizeCanvas(cv.clientWidth, cv.clientHeight)
    resize()
    const dark = document.documentElement.dataset.theme === 'matrix'
    const mat = (hex: string, emissive = false) => {
      const m = new pc.StandardMaterial()
      const c = new pc.Color().fromString(hex)
      m.diffuse = c
      if (emissive) { m.emissive = c; m.emissiveIntensity = 1 }
      m.update()
      return m
    }
    const box = (name: string, m: pc.StandardMaterial, pos: [number, number, number], scale: [number, number, number], parent: pc.Entity = app.root) => {
      const e = new pc.Entity(name)
      e.addComponent('render', { type: 'box', material: m })
      e.setLocalPosition(...pos)
      e.setLocalScale(...scale)
      parent.addChild(e)
      return e
    }
    const cam = new pc.Entity('cam')
    cam.addComponent('camera', { clearColor: dark ? new pc.Color(0, 0.08, 0.03) : new pc.Color(0.78, 0.88, 0.96), fov: 45 })
    cam.setPosition(-16, 22, 20)
    cam.lookAt(0, 0, 0)
    app.root.addChild(cam)
    const light = new pc.Entity('sun')
    light.addComponent('light', { type: 'directional', intensity: 1.3, castShadows: true, shadowDistance: 60, shadowResolution: 2048, shadowBias: 0.2, normalOffsetBias: 0.05 })
    light.setEulerAngles(50, 30, 0)
    app.root.addChild(light)
    app.scene.ambientLight = new pc.Color(0.45, 0.47, 0.52)

    // Street.
    box('road', mat(dark ? '#0a2a12' : '#3a3d45'), [0, -0.05, 0], [80, 0.1, 16])
    box('walkA', mat(dark ? '#0f4a20' : '#c9c3b6'), [0, 0.05, 11], [80, 0.3, 6])
    box('walkB', mat(dark ? '#0f4a20' : '#c9c3b6'), [0, 0.05, -11], [80, 0.3, 6])
    for (let i = 0; i < 8; i++) box('zebra', mat('#f2f2f2'), [0, 0.02, -7 + i * 2], [4, 0.04, 1])
    for (let x = -38; x < 40; x += 6) box('dash', mat('#f5d547'), [x, 0.02, 0], [3, 0.03, 0.25])
    // Buildings.
    const hues = ['#e8a87c', '#85c7de', '#f6d186', '#c38d9e', '#a0d995', '#9aa5e8']
    for (let i = 0; i < 12; i++) {
      const hgt = 3 + Math.random() * 6
      box('bld', mat(hues[i % hues.length]), [-33 + i * 6, hgt / 2, -17], [5, hgt, 5])
      box('bld', mat(hues[(i + 3) % hues.length]), [-33 + i * 6, hgt / 2 - 1, 17], [5, hgt - 2, 5])
    }
    // Crossing light.
    const pole = box('pole', mat('#333'), [3, 2, 9], [0.3, 4, 0.3])
    void pole
    const lampRed = box('lampR', mat('#551111'), [3, 4.4, 9], [0.8, 0.8, 0.8])
    const lampGreen = box('lampG', mat('#114411'), [3, 3.5, 9], [0.8, 0.8, 0.8])
    const redOn = mat('#ff3b30', true), redOff = mat('#4a1515'), greenOn = mat('#34d058', true), greenOff = mat('#153a1c')

    // Walker.
    const walker = new pc.Entity('walker')
    app.root.addChild(walker)
    box('body', mat('#ff7a59'), [0, 0.9, 0], [0.9, 1.2, 0.6], walker)
    box('head', mat('#ffd9b3'), [0, 1.8, 0], [0.6, 0.6, 0.6], walker)
    box('bag', mat('#5b8def'), [0.55, 0.9, 0], [0.3, 0.6, 0.5], walker)
    walker.setPosition(0, 0.2, START)

    const cars: Car[] = []
    const carCols = ['#e63946', '#457b9d', '#2a9d8f', '#f4a261', '#8d99ae', '#ffb703', '#6a4c93']
    const spawnCar = (lane: number) => {
      const dir: 1 | -1 = lane < 2 ? 1 : -1
      const len = Math.random() < 0.2 ? 5 : 2.8
      const e = new pc.Entity('car')
      const col = mat(carCols[Math.floor(Math.random() * carCols.length)])
      box('chassis', col, [0, 0.55, 0], [len, 0.9, 1.7], e)
      box('cabin', mat('#dbe9f4'), [-0.2 * dir, 1.25, 0], [len * 0.5, 0.6, 1.5], e)
      e.setPosition(-dir * 42, 0, LANES[lane])
      app.root.addChild(e)
      cars.push({ e, lane, dir, speed: 7 + Math.random() * 6, len })
    }

    const s = { t: ROUND, score: 0, lives: 3, lane: -1, target: START, z: START, phase: 'go' as Phase, phaseT: 6, walkedOnRed: false, errand: 0, running: true, hitFlash: 0, spawn: [0.5, 1.4, 0.9, 2] }
    const lanePos = (l: number) => (l < 0 ? START : l >= LANES.length ? GOAL : LANES[l])
    const step = (d: number) => {
      if (!s.running || Math.abs(s.z - s.target) > 0.3) return
      s.lane = Math.max(-1, Math.min(LANES.length, s.lane + d))
      s.target = lanePos(s.lane)
      if (s.phase !== 'stop' && s.lane >= 0 && s.lane < LANES.length) s.walkedOnRed = true
    }
    const onDown = () => step(1)
    cv.addEventListener('pointerdown', onDown)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.code === 'Space') { e.preventDefault(); step(1) }
      if (e.key === 'ArrowDown') { e.preventDefault(); step(-1) }
    }
    window.addEventListener('keydown', onKey)

    let hudT = 0
    app.on('update', (dt: number) => {
      if (s.running) s.t = Math.max(0, s.t - dt)
      // Light cycle: cars go 6 s, amber 1.5 s, stop 5 s.
      s.phaseT -= dt
      if (s.phaseT <= 0) {
        s.phase = s.phase === 'go' ? 'amber' : s.phase === 'amber' ? 'stop' : 'go'
        s.phaseT = s.phase === 'go' ? 6 : s.phase === 'amber' ? 1.5 : 5
      }
      const walk = s.phase === 'stop'
      lampRed.render!.meshInstances[0].material = walk ? redOff : redOn
      lampGreen.render!.meshInstances[0].material = walk ? greenOn : greenOff
      // Traffic.
      s.spawn = s.spawn.map((v, i) => { v -= dt; if (v <= 0) { spawnCar(i); return 1.6 + Math.random() * 2.6 } return v })
      for (let i = cars.length - 1; i >= 0; i--) {
        const c = cars[i]
        const p = c.e.getPosition()
        const front = p.x + (c.dir * c.len) / 2
        const stopLine = -c.dir * 3
        let v = c.speed
        // Stop for red/amber if not yet over the line.
        if (s.phase !== 'go' && c.dir * (stopLine - front) > 0 && c.dir * (stopLine - front) < 6) v = 0
        // Don't hit the car ahead.
        for (const o of cars) if (o !== c && o.lane === c.lane) {
          const gap = c.dir * (o.e.getPosition().x - p.x)
          if (gap > 0 && gap < (o.len + c.len) / 2 + 1.2) v = 0
        }
        c.e.setPosition(p.x + c.dir * v * dt, 0, p.z)
        if (Math.abs(p.x) > 46) { c.e.destroy(); cars.splice(i, 1) }
      }
      // Walker.
      s.z += Math.sign(s.target - s.z) * Math.min(Math.abs(s.target - s.z), dt * 14)
      const hop = Math.abs(s.target - s.z) > 0.05 ? Math.sin((Math.abs(s.target - s.z) / 4) * Math.PI) * 0.8 : 0
      walker.setPosition(0, 0.2 + hop, s.z)
      if (s.running) {
        for (const c of cars) {
          const p = c.e.getPosition()
          if (Math.abs(p.z - s.z) < 1.2 && Math.abs(p.x) < c.len / 2 + 0.5) {
            s.lives--; s.hitFlash = 0.6
            s.lane = -1; s.target = START; s.z = START; s.walkedOnRed = false
            if (s.lives <= 0) s.t = 0
            break
          }
        }
        if (s.lane >= LANES.length && Math.abs(s.z - GOAL) < 0.1) {
          s.score += 20 + (s.walkedOnRed ? 0 : 10)
          s.errand = (s.errand + 1) % ERRANDS.length
          s.lane = -1; s.target = START; s.z = START; s.walkedOnRed = false
        }
      }
      s.hitFlash = Math.max(0, s.hitFlash - dt)
      walker.setLocalScale(1, s.hitFlash > 0 ? 0.6 : 1, 1)
      if (s.running && s.t <= 0) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: s.lives > 0 ? 'Errands done!' : 'Time to head home', lines: [`${Math.floor(s.score / 20)} crossings`, `${3 - s.lives} bumps`, `Score ${s.score}`], record })
      }
      if ((hudT += dt) > 0.15) { hudT = 0; setHud({ score: s.score, lives: s.lives, t: Math.ceil(s.t), walk, errand: ERRANDS[s.errand] }) }
    })
    app.start()
    window.addEventListener('resize', resize)
    return () => { cv.removeEventListener('pointerdown', onDown); window.removeEventListener('keydown', onKey); window.removeEventListener('resize', resize); app.destroy(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Traffic Light Crossing" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`${hud.errand} is across the road · click / ↑ to step, ↓ to step back · ${hud.walk ? '🟢 walk' : '🔴 wait'} · ${'❤'.repeat(hud.lives)} · ${hud.t}s`}>
      <div ref={host} />
    </GameShell>
  )
}
