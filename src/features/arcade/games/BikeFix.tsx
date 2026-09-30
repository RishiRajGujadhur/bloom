import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Bike Fix (Three.js): a flat tyre sits half-dunked in a tub of water. Drag
 * sideways to turn the wheel; wherever there's a hole, a stream of bubbles
 * gives it away. Click the hole to patch it, then pump the tyre back up.
 * Five wheels before the ride.
 */
const WHEELS = 5
const TIME = 100

export default function BikeFix() {
  const [best, submit] = useBest('bike')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ wheel: 1, holes: 0, pump: 0, phase: 'find' as 'find' | 'pump', score: 0, t: TIME })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef({ pump: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(540, Math.round(window.innerHeight * 0.64))
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, devicePixelRatio))
    renderer.setSize(w, h)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.background = new THREE.Color(dark ? 0x001a08 : 0xeef2f6)
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100)
    cam.position.set(0, 1.4, 13)
    cam.lookAt(0, -0.3, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(4, 8, 6); scene.add(sun)

    // Workshop tub.
    const tub = new THREE.Mesh(new THREE.BoxGeometry(9, 3.2, 3), new THREE.MeshStandardMaterial({ color: 0x9aa6b2, metalness: 0.4, roughness: 0.5, side: THREE.BackSide }))
    tub.position.y = -2.6
    scene.add(tub)
    const water = new THREE.Mesh(new THREE.BoxGeometry(8.8, 2.6, 2.8), new THREE.MeshStandardMaterial({ color: 0x4aa3df, transparent: true, opacity: 0.45, roughness: 0.1 }))
    water.position.y = -2.4
    scene.add(water)
    const WATER_TOP = -1.1
    const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 4), new THREE.MeshStandardMaterial({ color: 0x8b5e3c }))
    bench.position.y = -4.4
    scene.add(bench)

    // Wheel.
    const wheel = new THREE.Group()
    scene.add(wheel)
    const tyreMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(3, 0.42, 20, 90), tyreMat)
    wheel.add(tyre)
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.62, 0.08, 8, 90), new THREE.MeshStandardMaterial({ color: 0xc0c7d1, metalness: 0.9, roughness: 0.25 }))
    wheel.add(rim)
    for (let i = 0; i < 24; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.6), new THREE.MeshStandardMaterial({ color: 0xd0d5dc, metalness: 0.8 }))
      const a = (i / 24) * Math.PI * 2
      sp.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, (i % 2 ? 0.06 : -0.06))
      sp.rotation.z = a - Math.PI / 2
      wheel.add(sp)
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x555b66, metalness: 0.7 }))
    hub.rotation.x = Math.PI / 2
    wheel.add(hub)
    wheel.position.y = 0.5

    const patches: THREE.Mesh[] = []
    const s = { wheel: 1, holes: [] as number[], phase: 'find' as 'find' | 'pump', pump: 0, spin: 0, vel: 0, score: 0, t: TIME, running: true, misses: 0, fixed: 0 }
    const newWheel = () => {
      patches.forEach((p) => wheel.remove(p)); patches.length = 0
      const n = 1 + Math.floor(Math.random() * Math.min(3, s.wheel))
      s.holes = Array.from({ length: n }, () => Math.random() * Math.PI * 2)
      s.phase = 'find'; s.pump = 0
      tyre.scale.set(1, 1, 0.8)
      s.spin = Math.random() * Math.PI * 2
    }
    newWheel()
    const bubbles: { m: THREE.Mesh; v: number }[] = []
    const bubbleGeo = new THREE.SphereGeometry(0.07, 8, 6)
    const bubbleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, roughness: 0 })
    const holeWorld = (a: number) => new THREE.Vector3(Math.cos(a + s.spin) * 3.35, Math.sin(a + s.spin) * 3.35 + wheel.position.y, 0.15)

    api.current.pump = () => {
      if (s.phase !== 'pump' || !s.running) return
      s.pump = Math.min(10, s.pump + 1)
      tyre.scale.z = 0.8 + s.pump * 0.02
      if (s.pump >= 10) {
        s.score += 50; s.fixed++
        if (s.wheel >= WHEELS) { finish('Ready to ride!') } else { s.wheel++; newWheel() }
      }
      sync()
    }
    const finish = (headline: string) => {
      s.running = false
      const score = s.score + Math.max(0, Math.round(s.t))
      const record = submitRef.current(score)
      setResult({ headline, lines: [`${s.fixed} wheels fixed`, `${s.misses} wrong spots poked`, `Score ${score}`], record })
    }
    const sync = () => setHud({ wheel: s.wheel, holes: s.holes.length, pump: s.pump, phase: s.phase, score: s.score, t: Math.max(0, Math.ceil(s.t)) })

    const cv = renderer.domElement
    let drag: { x: number; moved: number } | null = null
    const ray = new THREE.Raycaster()
    cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, moved: 0 }; cv.setPointerCapture(e.pointerId) })
    cv.addEventListener('pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; drag.moved += Math.abs(dx); drag.x = e.clientX; s.vel = -dx * 0.01; s.spin += s.vel })
    cv.addEventListener('pointerup', (e) => {
      const d = drag; drag = null
      if (!d || d.moved > 8 || s.phase !== 'find' || !s.running) return
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      const hit = ray.intersectObject(tyre)[0]
      if (!hit) return
      const local = hit.point.clone().sub(wheel.position)
      const a = Math.atan2(local.y, local.x) - s.spin
      const i = s.holes.findIndex((hA) => Math.abs(Math.atan2(Math.sin(hA - a), Math.cos(hA - a))) < 0.22)
      if (i >= 0) {
        const hA = s.holes[i]
        s.holes.splice(i, 1)
        s.score += 20
        const patch = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.95), new THREE.MeshStandardMaterial({ color: 0xf97316 }))
        patch.position.set(Math.cos(hA) * 3.1, Math.sin(hA) * 3.1, 0)
        patch.rotation.z = hA
        wheel.add(patch); patches.push(patch)
        if (!s.holes.length) s.phase = 'pump'
      } else { s.misses++; s.score = Math.max(0, s.score - 5) }
      sync()
    })

    const clock = new THREE.Clock()
    let raf = 0
    let hudT = 0
    let bubbleT = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      if (s.running) {
        s.t -= dt
        if (s.t <= 0) finish('Out of time')
      }
      if (!drag) { s.spin += s.vel; s.vel *= 0.94 }
      wheel.rotation.z = s.spin
      // Bubbles from holes that are under water.
      bubbleT -= dt
      if (bubbleT <= 0) {
        bubbleT = 0.06
        for (const hA of s.holes) {
          const p = holeWorld(hA)
          if (p.y < WATER_TOP - 0.1) {
            const m = new THREE.Mesh(bubbleGeo, bubbleMat)
            m.position.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.15, 0, 0.35))
            m.scale.setScalar(0.6 + Math.random())
            scene.add(m); bubbles.push({ m, v: 1.5 + Math.random() })
          }
        }
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]
        b.m.position.y += b.v * dt; b.m.position.x += Math.sin(clock.elapsedTime * 8 + i) * 0.004
        if (b.m.position.y > WATER_TOP) { scene.remove(b.m); bubbles.splice(i, 1) }
      }
      water.position.y = -2.4 + Math.sin(clock.elapsedTime * 2) * 0.02
      if ((hudT += dt) > 0.25) { hudT = 0; sync() }
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Bike Fix" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Wheel ${hud.wheel}/${WHEELS} · ${hud.phase === 'find' ? `drag to turn the wheel, watch for bubbles, click the hole (${hud.holes} left)` : 'patched! now pump it up'} · ${hud.t}s`}>
      <div ref={host} className="fl-host" style={{ cursor: 'ew-resize' }} />
      <div className="cf-tray">
        <button type="button" className="cf-match" disabled={hud.phase !== 'pump'} onClick={() => api.current.pump()}>⛽ Pump ({hud.pump}/10)</button>
      </div>
    </GameShell>
  )
}
