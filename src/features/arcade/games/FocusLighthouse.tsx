import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Focus Lighthouse (Three.js): night falls on a rocky point. Ships come in out
 * of the dark from every side. Aim the beam with your pointer; a ship that
 * stays in the light long enough turns safely for harbour. Fireworks over the
 * town are pretty, but ships don't wait. Three wrecks and the night is over.
 */
const ROUND = 90
type Ship = { g: THREE.Group; ang: number; dist: number; speed: number; lit: number; safe: boolean; bar: THREE.Mesh }

export default function FocusLighthouse() {
  const [best, submit] = useBest('lighthouse')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ saved: 0, wrecks: 0, t: ROUND })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(560, Math.round(window.innerHeight * 0.66))
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(2, devicePixelRatio))
    renderer.setSize(w, h)
    renderer.shadowMap.enabled = true
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    const night = dark ? 0x001a08 : 0x0b1530
    scene.background = new THREE.Color(night)
    scene.fog = new THREE.Fog(night, 45, 110)
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 200)
    cam.position.set(0, 20, 24)
    cam.lookAt(0, 0, -10)
    scene.add(new THREE.HemisphereLight(0x9fb4ff, 0x1a2440, 1.4))
    const moon = new THREE.DirectionalLight(0xbcd0ff, 1.1)
    moon.position.set(-20, 30, -30)
    scene.add(moon)
    const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(3, 32), new THREE.MeshBasicMaterial({ color: 0xf4f1dc, fog: false }))
    moonDisc.position.set(-30, 26, -80)
    scene.add(moonDisc)

    // Sea: a wavy plane.
    const seaGeo = new THREE.PlaneGeometry(140, 140, 70, 70)
    seaGeo.rotateX(-Math.PI / 2)
    const sea = new THREE.Mesh(seaGeo, new THREE.MeshStandardMaterial({ color: dark ? 0x00602a : 0x2a5a9a, roughness: 0.3, metalness: 0.2, flatShading: true }))
    sea.receiveShadow = true
    scene.add(sea)
    const base = seaGeo.attributes.position.array.slice() as Float32Array

    // Rocks and lighthouse.
    const rockM = new THREE.MeshStandardMaterial({ color: 0x3a3f4a, flatShading: true })
    for (let i = 0; i < 9; i++) {
      const r = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.6, 0), rockM)
      const a = (i / 9) * Math.PI * 2
      r.position.set(Math.cos(a) * 3.2, 0.2, Math.sin(a) * 3.2)
      r.rotation.set(Math.random(), Math.random(), 0)
      scene.add(r)
    }
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.4, 7, 16), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }))
    tower.position.y = 3.6
    scene.add(tower)
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(1.0 + i * 0.12, 1.02 + i * 0.12, 0.8, 16), new THREE.MeshStandardMaterial({ color: 0xd23b3b }))
      band.position.y = 5.8 - i * 2.2
      scene.add(band)
    }
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff2b0 }))
    lamp.position.y = 7.6
    scene.add(lamp)

    // The beam: a spotlight plus a soft visible cone.
    const spot = new THREE.SpotLight(0xfff0b0, 900, 60, 0.22, 0.5, 1.6)
    spot.position.set(0, 7.6, 0)
    spot.castShadow = true
    scene.add(spot, spot.target)
    const coneGeo = new THREE.ConeGeometry(4.2, 34, 32, 1, true)
    coneGeo.translate(0, -17, 0)
    coneGeo.rotateX(-Math.PI / 2)
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }))
    cone.position.copy(spot.position)
    scene.add(cone)

    // Fireworks over the town (distraction).
    const sparks = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }))
    scene.add(sparks)
    let fw: { p: THREE.Vector3; v: THREE.Vector3; c: THREE.Color }[] = []
    const firework = () => {
      const at = new THREE.Vector3(-18 + Math.random() * 36, 14 + Math.random() * 6, -40)
      const col = new THREE.Color().setHSL(Math.random(), 0.9, 0.6)
      for (let i = 0; i < 80; i++) fw.push({ p: at.clone(), v: new THREE.Vector3().randomDirection().multiplyScalar(0.25 + Math.random() * 0.1), c: col })
    }

    // Ships.
    const ships: Ship[] = []
    const hullM = new THREE.MeshStandardMaterial({ color: 0x7b4a2a })
    const sailM = new THREE.MeshStandardMaterial({ color: 0xf5efe0, side: THREE.DoubleSide })
    const spawn = () => {
      const g = new THREE.Group()
      const hull = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 2.8), hullM)
      hull.position.y = 0.3
      const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2), sailM)
      sail.position.set(0, 1.7, 0); sail.rotation.y = Math.PI / 2
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.22), new THREE.MeshBasicMaterial({ color: 0x3ddc84 }))
      bar.position.y = 2.4; bar.scale.x = 0.001
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffc860 }))
      lantern.position.set(0, 0.9, 1.3)
      g.add(hull, sail, bar, lantern)
      g.scale.setScalar(1.5)
      g.traverse((o) => { o.castShadow = true })
      const ang = -Math.PI * (0.1 + Math.random() * 0.8)
      const s: Ship = { g, ang, dist: 42, speed: 2.2 + Math.random() * 1.4 + (ROUND - state.t) * 0.03, lit: 0, safe: false, bar }
      scene.add(g)
      ships.push(s)
    }

    const state = { t: ROUND, saved: 0, wrecks: 0, running: true, nextShip: 1, nextFw: 3 }
    const aim = new THREE.Vector3(0, 0, -20)
    const ray = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const onMove = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      const hit = new THREE.Vector3()
      if (ray.ray.intersectPlane(plane, hit)) aim.copy(hit)
    }
    renderer.domElement.addEventListener('pointermove', onMove)

    const clock = new THREE.Clock()
    let raf = 0
    let hudT = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      const time = clock.elapsedTime
      // Waves.
      const pos = seaGeo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], z = base[i * 3 + 2]
        pos.setY(i, Math.sin(x * 0.18 + time * 1.3) * 0.35 + Math.cos(z * 0.21 + time) * 0.3)
      }
      pos.needsUpdate = true
      seaGeo.computeVertexNormals()
      // Beam follows the pointer smoothly.
      const cur = spot.target.position
      cur.lerp(new THREE.Vector3(aim.x, 0, aim.z), 0.18)
      spot.target.updateMatrixWorld()
      cone.lookAt(cur.x, 0, cur.z)
      const beamDir = new THREE.Vector2(cur.x, cur.z).normalize()
      if (state.running) {
        state.t = Math.max(0, state.t - dt)
        if ((state.nextShip -= dt) <= 0) { spawn(); state.nextShip = Math.max(1.4, 3.6 - (ROUND - state.t) * 0.025) }
        if ((state.nextFw -= dt) <= 0) { firework(); state.nextFw = 4 + Math.random() * 4 }
      }
      for (let i = ships.length - 1; i >= 0; i--) {
        const s = ships[i]
        if (!s.safe) s.dist -= s.speed * dt * (state.running ? 1 : 0)
        else { s.ang += dt * 0.5; s.dist += dt * 3 }
        const x = Math.cos(s.ang) * s.dist, z = Math.sin(s.ang) * s.dist
        s.g.position.set(x, Math.sin(time * 2 + i) * 0.15, z)
        s.g.lookAt(s.safe ? Math.cos(s.ang + 0.4) * s.dist : 0, 0, s.safe ? Math.sin(s.ang + 0.4) * s.dist : 0)
        s.g.rotation.z = Math.sin(time * 1.5 + i) * 0.08
        s.bar.lookAt(cam.position)
        const toShip = new THREE.Vector2(x, z)
        const inBeam = toShip.clone().normalize().dot(beamDir) > 0.975 && toShip.length() < 36
        if (!s.safe && state.running) {
          s.lit = inBeam ? s.lit + dt : Math.max(0, s.lit - dt * 0.3)
          s.bar.scale.x = Math.max(0.001, Math.min(1, s.lit / 1.2))
          if (s.lit >= 1.2) { s.safe = true; state.saved++; s.bar.visible = false }
          if (s.dist < 5) {
            state.wrecks++
            scene.remove(s.g); ships.splice(i, 1)
            if (state.wrecks >= 3) state.t = 0
            continue
          }
        }
        if (s.safe && s.dist > 48) { scene.remove(s.g); ships.splice(i, 1) }
      }
      // Fireworks.
      fw = fw.filter((f) => f.p.y > 4)
      fw.forEach((f) => { f.p.add(f.v); f.v.y -= 0.006; f.v.multiplyScalar(0.985) })
      const arr = new Float32Array(fw.length * 3), col = new Float32Array(fw.length * 3)
      fw.forEach((f, i) => { arr.set([f.p.x, f.p.y, f.p.z], i * 3); col.set([f.c.r, f.c.g, f.c.b], i * 3) })
      sparks.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3))
      sparks.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3))
      if (state.running && state.t <= 0) {
        state.running = false
        const score = state.saved * 10
        const record = submitRef.current(score)
        setResult({ headline: state.wrecks >= 3 ? 'Rough night' : 'Dawn breaks', lines: [`${state.saved} ships guided home`, `${state.wrecks} on the rocks`, `Score ${score}`], record })
      }
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ saved: state.saved, wrecks: state.wrecks, t: Math.ceil(state.t) }) }
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onResize = () => { const nw = el.clientWidth; renderer.setSize(nw, h); cam.aspect = nw / h; cam.updateProjectionMatrix() }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onMove)
      scene.traverse((o) => { const m = o as THREE.Mesh; m.geometry?.dispose?.() })
      renderer.dispose()
      el.replaceChildren()
    }
  }, [round])

  const restart = useCallback(() => { setResult(null); setHud({ saved: 0, wrecks: 0, t: ROUND }); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Focus Lighthouse" score={hud.saved * 10} best={best} result={result} onRestart={restart}
      hint={`Aim the beam with your pointer · hold it on a ship until its bar fills · ${hud.t}s · wrecks ${hud.wrecks}/3`}>
      <div ref={host} className="fl-host" />
    </GameShell>
  )
}
