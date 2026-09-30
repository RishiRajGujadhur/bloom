import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Star Compass (Three.js): you're out under a real northern sky with no phone.
 * Drag to look around and click the Pole Star. The Plough's two end stars
 * point at it, and Cassiopeia's W sits on the other side. Every night the sky
 * has turned and you're at a different latitude. Five nights, and the faster
 * you find north the better.
 */
const NIGHTS = 5
const deg = Math.PI / 180
type Star = { name: string; ra: number; dec: number; mag: number }
const NAMED: Star[] = [
  { name: 'Polaris', ra: 2.53, dec: 89.26, mag: 2.0 },
  { name: 'Dubhe', ra: 11.06, dec: 61.75, mag: 1.8 }, { name: 'Merak', ra: 11.03, dec: 56.38, mag: 2.4 },
  { name: 'Phecda', ra: 11.9, dec: 53.7, mag: 2.4 }, { name: 'Megrez', ra: 12.26, dec: 57.03, mag: 3.3 },
  { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.8 }, { name: 'Mizar', ra: 13.4, dec: 54.9, mag: 2.2 }, { name: 'Alkaid', ra: 13.79, dec: 49.3, mag: 1.9 },
  { name: 'Schedar', ra: 0.67, dec: 56.5, mag: 2.2 }, { name: 'Caph', ra: 0.15, dec: 59.1, mag: 2.3 }, { name: 'Navi', ra: 0.95, dec: 60.7, mag: 2.4 },
  { name: 'Ruchbah', ra: 1.43, dec: 60.2, mag: 2.7 }, { name: 'Segin', ra: 1.9, dec: 63.7, mag: 3.4 },
  { name: 'Kochab', ra: 14.85, dec: 74.2, mag: 2.1 }, { name: 'Pherkad', ra: 15.35, dec: 71.8, mag: 3.0 },
  { name: 'Vega', ra: 18.6, dec: 38.8, mag: 0.0 }, { name: 'Capella', ra: 5.28, dec: 46.0, mag: 0.1 }, { name: 'Deneb', ra: 20.7, dec: 45.3, mag: 1.3 },
  { name: 'Arcturus', ra: 14.26, dec: 19.2, mag: 0.0 },
]
const PLOUGH = ['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Alioth', 'Mizar', 'Alkaid']
const LINES: [string, string][] = [['Merak', 'Dubhe'], ['Dubhe', 'Megrez'], ['Megrez', 'Phecda'], ['Phecda', 'Merak'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid'], ['Caph', 'Schedar'], ['Schedar', 'Navi'], ['Navi', 'Ruchbah'], ['Ruchbah', 'Segin']]

export default function StarCompass() {
  const [best, submit] = useBest('stars')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ night: 1, msg: 'Drag to look around. Find the Pole Star.', score: 0, lat: 52 })
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
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.background = new THREE.Color(dark ? 0x000a04 : 0x050a1c)
    const cam = new THREE.PerspectiveCamera(70, w / h, 0.1, 500)
    const sky = new THREE.Group()
    scene.add(sky)

    // Ground and treeline.
    const ground = new THREE.Mesh(new THREE.CircleGeometry(600, 64), new THREE.MeshBasicMaterial({ color: dark ? 0x001a08 : 0x0a0f14 }))
    ground.rotation.x = -Math.PI / 2; ground.position.y = -2
    scene.add(ground)
    const hills = new THREE.Group()
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2
      const t = new THREE.Mesh(new THREE.ConeGeometry(3 + Math.random() * 3, 8 + Math.random() * 10, 5), new THREE.MeshBasicMaterial({ color: dark ? 0x002a10 : 0x0b1320 }))
      t.position.set(Math.cos(a) * 90, 2, Math.sin(a) * 90)
      hills.add(t)
    }
    scene.add(hills)

    // Stars on a sphere, in equatorial coordinates (z = celestial pole).
    const R = 150
    const eq = (ra: number, dec: number) => new THREE.Vector3(Math.cos(dec * deg) * Math.cos(ra * 15 * deg), Math.sin(dec * deg), -Math.cos(dec * deg) * Math.sin(ra * 15 * deg)).multiplyScalar(R)
    // In this frame the pole is +Y; we tilt the whole sky group per night.
    const bgGeo = new THREE.BufferGeometry()
    const bg: number[] = [], bgSize: number[] = []
    for (let i = 0; i < 1400; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(R + 1)
      bg.push(v.x, v.y, v.z); bgSize.push(Math.random() < 0.08 ? 2.2 : 1.1)
    }
    bgGeo.setAttribute('position', new THREE.Float32BufferAttribute(bg, 3))
    sky.add(new THREE.Points(bgGeo, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 1.1, sizeAttenuation: false, transparent: true, opacity: 0.75 })))
    const starTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64
      const g = c.getContext('2d')!
      const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,250,230,0.8)'); r.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = r; g.fillRect(0, 0, 64, 64)
      return new THREE.CanvasTexture(c)
    })()
    const named = new Map<string, THREE.Sprite>()
    for (const s of NAMED) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: starTex, color: s.name === 'Vega' || s.name === 'Deneb' ? 0xcfe0ff : 0xfff6e0, depthWrite: false }))
      sp.position.copy(eq(s.ra, s.dec))
      const size = 11 - s.mag * 2.6
      sp.scale.set(size, size, 1)
      sp.userData.name = s.name
      sky.add(sp)
      named.set(s.name, sp)
    }
    const lineMat = new THREE.LineBasicMaterial({ color: 0x8fb3ff, transparent: true, opacity: 0 })
    const lineGeo = new THREE.BufferGeometry().setFromPoints(LINES.flatMap(([a, b]) => [named.get(a)!.position, named.get(b)!.position]))
    sky.add(new THREE.LineSegments(lineGeo, lineMat))
    const pointer = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xffd76a, dashSize: 3, gapSize: 3, transparent: true, opacity: 0 }))
    sky.add(pointer)

    // Compass letters on the horizon, revealed once north is found.
    const letters = new THREE.Group()
    const label = (t: string, a: number) => {
      const c = document.createElement('canvas'); c.width = 128; c.height = 128
      const g = c.getContext('2d')!
      g.fillStyle = '#ffd76a'; g.font = 'bold 90px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, 64, 64)
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }))
      s.position.set(Math.sin(a) * 80, 6, -Math.cos(a) * 80); s.scale.set(10, 10, 1)
      letters.add(s)
    }
    label('N', 0); label('E', Math.PI / 2); label('S', Math.PI); label('W', -Math.PI / 2)
    letters.visible = false
    scene.add(letters)

    const s = { night: 1, score: 0, started: performance.now(), solved: false, yaw: Math.random() * Math.PI * 2, pitch: 0.35, found: [] as number[], wrong: 0, running: true, lat: 52 }
    const setNight = () => {
      s.lat = 35 + Math.random() * 30
      const spin = Math.random() * Math.PI * 2
      // Pole (+Y in sky frame) must sit at altitude = latitude, due north (−Z).
      sky.rotation.set(0, 0, 0)
      sky.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), spin)
      sky.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), -(90 - s.lat) * deg)
      // Finally turn the world so north is somewhere random behind you.
      const north = Math.random() * Math.PI * 2
      sky.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), north)
      letters.rotation.y = north
      letters.visible = false
      lineMat.opacity = 0
      ;(pointer.material as THREE.LineDashedMaterial).opacity = 0
      s.started = performance.now(); s.solved = false; s.wrong = 0
      setHud({ night: s.night, msg: 'Drag to look around. Find the Pole Star.', score: s.score, lat: Math.round(s.lat) })
      if (s.night === 1) {
        // The first night starts facing the Plough, as a gentle nudge.
        sky.updateMatrixWorld(true)
        const d = named.get('Megrez')!.getWorldPosition(new THREE.Vector3()).normalize()
        s.yaw = Math.atan2(-d.x, -d.z)
        s.pitch = Math.max(0.15, Math.min(0.7, Math.asin(d.y)))
      }
    }
    setNight()

    let drag: { x: number; y: number; moved: number } | null = null
    const cv = renderer.domElement
    const down = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; cv.setPointerCapture(e.pointerId) }
    const move = (e: PointerEvent) => {
      if (!drag) return
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y
      drag.moved += Math.abs(dx) + Math.abs(dy)
      s.yaw -= dx * 0.005; s.pitch = Math.max(-0.1, Math.min(1.45, s.pitch + dy * 0.005))
      drag.x = e.clientX; drag.y = e.clientY
    }
    const ray = new THREE.Raycaster()
    const up = (e: PointerEvent) => {
      const d = drag; drag = null
      if (!d || d.moved > 6 || !s.running) return
      if (s.solved) { next(); return }
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      let bestStar: THREE.Sprite | null = null, bestAng = 0.05
      for (const sp of named.values()) {
        const p = sp.getWorldPosition(new THREE.Vector3()).normalize()
        const a = ray.ray.direction.angleTo(p)
        if (a < bestAng) { bestAng = a; bestStar = sp }
      }
      if (!bestStar) return
      const name = bestStar.userData.name as string
      if (name === 'Polaris') {
        const secs = (performance.now() - s.started) / 1000
        const pts = Math.max(20, Math.round(100 - secs * 2.5 - s.wrong * 10))
        s.score += pts
        s.found.push(secs)
        s.solved = true
        letters.visible = true
        lineMat.opacity = 0.55
        pointer.geometry.setFromPoints([named.get('Merak')!.position, named.get('Dubhe')!.position.clone().lerp(named.get('Polaris')!.position, 1)])
        pointer.computeLineDistances()
        ;(pointer.material as THREE.LineDashedMaterial).opacity = 0.9
        setHud({ night: s.night, msg: `North found in ${secs.toFixed(1)}s (+${pts}). Click anywhere for the next night.`, score: s.score, lat: Math.round(s.lat) })
      } else {
        s.wrong++
        const inPlough = PLOUGH.includes(name)
        setHud({ night: s.night, msg: inPlough ? `That's ${name}, part of the Plough. Its two end stars point the way…` : `That's ${name}. Not quite — keep looking.`, score: s.score, lat: Math.round(s.lat) })
        if (s.wrong >= 3) lineMat.opacity = 0.35
      }
    }
    const next = () => {
      if (s.night >= NIGHTS) {
        s.running = false
        const avg = s.found.reduce((n, x) => n + x, 0) / Math.max(1, s.found.length)
        const record = submitRef.current(s.score)
        setResult({ headline: 'Home by the stars', lines: [`${s.found.length} nights navigated`, `Average ${avg.toFixed(1)}s to find north`, `Score ${s.score}`], record })
        return
      }
      s.night++
      setNight()
    }
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up)
    let raf = 0
    const loop = () => {
      cam.rotation.set(0, 0, 0)
      cam.rotation.order = 'YXZ'
      cam.rotation.y = s.yaw; cam.rotation.x = s.pitch
      sky.children.forEach((c) => { if (c instanceof THREE.Sprite && c.userData.name) c.material.opacity = 0.85 + 0.15 * Math.sin(performance.now() / 300 + c.position.x) })
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    const onResize = () => { const nw = el.clientWidth; renderer.setSize(nw, h); cam.aspect = nw / h; cam.updateProjectionMatrix() }
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      cv.removeEventListener('pointerdown', down); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up)
      renderer.dispose(); el.replaceChildren()
    }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Star Compass" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`Night ${hud.night}/${NIGHTS} · latitude ${hud.lat}°N · ${hud.msg}`}>
      <div ref={host} className="fl-host" style={{ cursor: 'grab' }} />
    </GameShell>
  )
}
