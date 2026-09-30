import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Wind-Down Lanterns (Three.js): an evening walk home down a winding path.
 * Tap the lanterns as you pass to light them warm; tap the cold blue screens
 * that pop up in the hedges to fold them away. Warm light makes you sleepy
 * and slow; screens jolt you awake. Arrive at the cottage drowsy and ready
 * for bed.
 */
const LANTERNS = 14

export default function WindDownLanterns() {
  const [best, submit] = useBest('lanterns')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ calm: 30, dist: 0, lit: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(540, Math.round(window.innerHeight * 0.64))
    const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    const sky = dark ? 0x000a04 : 0x141b3a
    scene.background = new THREE.Color(sky); scene.fog = new THREE.Fog(sky, 10, 45)
    const cam = new THREE.PerspectiveCamera(55, w / h, 0.1, 100)
    scene.add(new THREE.HemisphereLight(0x6b7fd7, 0x0b0f1f, 0.6))
    const moon = new THREE.DirectionalLight(0x9fb4ff, 0.6); moon.position.set(-5, 10, 5); scene.add(moon)
    const pathX = (z: number) => Math.sin(z * 0.08) * 4
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 200, 30, 100), new THREE.MeshStandardMaterial({ color: dark ? 0x003314 : 0x1f3a2b, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2; ground.position.z = -90; scene.add(ground)
    for (let z = 0; z > -180; z -= 1.5) { const s = new THREE.Mesh(new THREE.CircleGeometry(1.1, 12), new THREE.MeshStandardMaterial({ color: 0x8b7a5c })); s.rotation.x = -Math.PI / 2; s.position.set(pathX(z), 0.01, z); scene.add(s) }
    // Hedges.
    const hedgeM = new THREE.MeshStandardMaterial({ color: dark ? 0x00401a : 0x234d34 })
    for (let z = 0; z > -180; z -= 3) for (const side of [-1, 1]) { const b = new THREE.Mesh(new THREE.SphereGeometry(1.2 + Math.random() * 0.4, 8, 6), hedgeM); b.position.set(pathX(z) + side * (3 + Math.random()), 0.8, z); scene.add(b) }
    // Cottage at the end.
    const cottage = new THREE.Group()
    const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 3), new THREE.MeshStandardMaterial({ color: 0xe8d7b5 })); body.position.y = 1.5
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2, 4), new THREE.MeshStandardMaterial({ color: 0x7c2d12 })); roof.position.y = 4; roof.rotation.y = Math.PI / 4
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd98a })); win.position.set(0, 1.8, 1.52)
    cottage.add(body, roof, win); cottage.position.set(pathX(-170), 0, -170); scene.add(cottage)
    // Lanterns.
    type L = { post: THREE.Group; bulb: THREE.Mesh; light: THREE.PointLight; lit: boolean; z: number }
    const lanterns: L[] = []
    for (let i = 0; i < LANTERNS; i++) {
      const z = -8 - i * 11, side = i % 2 ? 1 : -1
      const post = new THREE.Group()
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.2), new THREE.MeshStandardMaterial({ color: 0x3f3f46 })); pole.position.y = 1.1
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), new THREE.MeshStandardMaterial({ color: 0x57534e, emissive: 0x000000 })); bulb.position.y = 2.35
      const light = new THREE.PointLight(0xffb45a, 0, 9)
      light.position.y = 2.35
      post.add(pole, bulb, light); post.position.set(pathX(z) + side * 2, 0, z); scene.add(post)
      lanterns.push({ post, bulb, light, lit: false, z })
    }
    // Screens.
    type Sc = { m: THREE.Mesh; z: number; live: boolean }
    const screens: Sc[] = []
    const screenM = new THREE.MeshBasicMaterial({ color: 0x7dd3fc })
    const s = { z: 2, calm: 30, lit: 0, folded: 0, running: true, next: 2 }
    const ray = new THREE.Raycaster()
    const cv = renderer.domElement
    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      let bestD = 1.2, hitL: L | null = null, hitS: Sc | null = null
      for (const l of lanterns) { const d = ray.ray.distanceToPoint(l.bulb.getWorldPosition(new THREE.Vector3())); if (d < bestD && !l.lit) { bestD = d; hitL = l; hitS = null } }
      for (const sc of screens) { if (!sc.live) continue; const d = ray.ray.distanceToPoint(sc.m.position); if (d < bestD) { bestD = d; hitS = sc; hitL = null } }
      if (hitL) { hitL.lit = true; hitL.light.intensity = 6; (hitL.bulb.material as THREE.MeshStandardMaterial).emissive.set(0xffb45a); (hitL.bulb.material as THREE.MeshStandardMaterial).color.set(0xffe2a8); s.lit++; s.calm = Math.min(100, s.calm + 8) }
      if (hitS) { hitS.live = false; s.folded++ }
    }
    cv.addEventListener('pointerdown', onDown)
    const clock = new THREE.Clock()
    let raf = 0, hudT = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      const t = clock.elapsedTime
      if (s.running) {
        // Calmer walkers stroll slower, as they should at bedtime.
        const speed = 4.2 - s.calm * 0.02
        s.z -= speed * dt
        s.next -= dt
        if (s.next <= 0) {
          const z = s.z - 12 - Math.random() * 6, side = Math.random() < 0.5 ? -1 : 1
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.3), screenM.clone())
          m.position.set(pathX(z) + side * 2.6, 1.6, z); m.lookAt(pathX(z + 5), 1.6, z + 10)
          scene.add(m); screens.push({ m, z, live: true })
          s.next = 1.6 + Math.random() * 1.6
        }
        for (const sc of screens) {
          if (sc.live && sc.z > s.z + 1) { sc.live = false; s.calm = Math.max(0, s.calm - 14) } // passed it: it caught your eye
          const mat = sc.m.material as THREE.MeshBasicMaterial
          if (!sc.live) { sc.m.scale.y = Math.max(0.01, sc.m.scale.y - dt * 4); mat.opacity = 0.5 } else mat.color.setHSL(0.55, 0.9, 0.6 + Math.sin(t * 12 + sc.z) * 0.1)
        }
        for (const l of lanterns) if (!l.lit && l.z > s.z + 2) l.lit = true // missed — stays dark
        s.calm = Math.max(0, Math.min(100, s.calm + dt * 0.4))
        if (s.z <= -165) {
          s.running = false
          const score = Math.round(s.calm + s.lit * 5 + s.folded * 3)
          const record = submitRef.current(score)
          setResult({ headline: s.calm > 70 ? 'Home, yawning, ready for bed 😴' : 'Home… but wide awake', lines: [`${s.lit} lanterns lit`, `${s.folded} screens folded away`, `Drowsiness ${Math.round(s.calm)}%`, `Score ${score}`], record })
        }
      }
      cam.position.set(pathX(s.z) * 0.9, 2.4 + Math.sin(t * 3) * 0.04, s.z + 5)
      cam.lookAt(pathX(s.z - 8), 1.4, s.z - 8)
      ;(scene.fog as THREE.Fog).near = 8 + s.calm * 0.05
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ calm: Math.round(s.calm), dist: Math.round((-s.z / 165) * 100), lit: s.lit }) }
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Wind-Down Lanterns" score={hud.calm} best={best} result={result} onRestart={restart}
      hint={`Tap lanterns to light them, tap blue screens to fold them away · drowsiness ${hud.calm}% · ${hud.dist}% of the way home`}>
      <div ref={host} className="fl-host" style={{ cursor: 'pointer' }} />
    </GameShell>
  )
}
