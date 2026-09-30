import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Meeting Meteor (Three.js): you're chairing the meeting — a little planet
 * called Agenda. Topics hurtle in from all sides. Glowing blue ones are on
 * the agenda: let them land. Grey-red rambles ("did anyone watch…?", "one
 * more thing…") knock the meeting off course: click them to nudge them past.
 * Get through the agenda before the hour's up.
 */
const ON = ['Budget', 'Launch date', 'Hiring', 'Q3 goals', 'Risks', 'Next steps', 'Owners', 'Timeline']
const OFF = ['Did anyone see the match?', 'Quick tangent…', 'One more thing', 'Let’s revisit last week', 'Who took my stapler?', 'Big-picture musing', 'Reply-all saga']
const TIME = 70
type Rock = { m: THREE.Mesh; label: THREE.Sprite; v: THREE.Vector3; on: boolean; text: string; deflected: boolean }

const labelSprite = (text: string, on: boolean) => {
  const c = document.createElement('canvas'); c.width = 512; c.height = 96
  const g = c.getContext('2d')!
  g.fillStyle = on ? 'rgba(30,64,175,0.85)' : 'rgba(80,40,40,0.85)'; g.beginPath(); g.roundRect(0, 8, 512, 80, 40); g.fill()
  g.fillStyle = '#fff'; g.font = 'bold 40px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 256, 50)
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))
  s.scale.set(3.4, 0.64, 1)
  return s
}

export default function MeetingMeteor() {
  const [best, submit] = useBest('meeting')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ agenda: 0, derail: 0, t: TIME })
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
    scene.background = new THREE.Color(dark ? 0x000a04 : 0x0b0f24)
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 200); cam.position.set(0, 0, 16)
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(5, 6, 8); scene.add(sun)
    const sg = new THREE.BufferGeometry(); const sp: number[] = []
    for (let i = 0; i < 700; i++) sp.push((Math.random() - 0.5) * 80, (Math.random() - 0.5) * 50, -20 - Math.random() * 30)
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12 })))
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.8, 48, 32), new THREE.MeshStandardMaterial({ color: dark ? 0x00aa44 : 0x4f9dff, roughness: 0.6, emissive: dark ? 0x002a10 : 0x0a1a40 }))
    scene.add(planet)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 8, 96), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }))
    ring.rotation.x = 1.2; scene.add(ring)
    const rocks: Rock[] = []
    const onM = new THREE.MeshStandardMaterial({ color: 0x60a5fa, emissive: 0x1e40af, emissiveIntensity: 0.9, roughness: 0.4 })
    const offM = new THREE.MeshStandardMaterial({ color: 0x9ca3af, emissive: 0x7f1d1d, emissiveIntensity: 0.4, roughness: 0.9, flatShading: true })
    const s = { t: TIME, agenda: 0, derail: 0, next: 0.5, running: true, shake: 0 }
    const spawn = () => {
      const on = Math.random() < 0.45
      const text = on ? ON[Math.floor(Math.random() * ON.length)] : OFF[Math.floor(Math.random() * OFF.length)]
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(on ? 0.45 : 0.55, on ? 1 : 0), on ? onM : offM)
      const a = Math.random() * Math.PI * 2
      m.position.set(Math.cos(a) * 13, Math.sin(a) * 8, 0)
      const label = labelSprite(text, on)
      scene.add(m, label)
      const speed = 1.6 + (TIME - s.t) * 0.03
      rocks.push({ m, label, v: m.position.clone().multiplyScalar(-1).normalize().multiplyScalar(speed), on, text, deflected: false })
    }
    const ray = new THREE.Raycaster()
    const cv = renderer.domElement
    const onDown = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), cam)
      // Forgiving: nearest rock to the ray.
      let bestR: Rock | null = null, bestD = 0.9
      for (const k of rocks) { const d = ray.ray.distanceToPoint(k.m.position); if (d < bestD) { bestD = d; bestR = k } }
      if (!bestR || bestR.deflected) return
      bestR.deflected = true
      // Nudge it sideways past the planet.
      const side = new THREE.Vector3(-bestR.v.y, bestR.v.x, 0).normalize().multiplyScalar(4)
      bestR.v.add(side).multiplyScalar(1.4)
      if (bestR.on) s.derail = Math.min(100, s.derail + 6) // flicked away a real agenda item
    }
    cv.addEventListener('pointerdown', onDown)
    const clock = new THREE.Clock()
    let raf = 0, hudT = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      if (s.running) {
        s.t -= dt
        s.next -= dt
        if (s.next <= 0) { spawn(); s.next = Math.max(0.55, 1.5 - (TIME - s.t) * 0.012) }
        s.derail = Math.max(0, s.derail - dt * 1.5)
        if (s.t <= 0 || s.derail >= 100) {
          s.running = false
          const score = s.agenda * 10 - Math.round(s.derail)
          const record = submitRef.current(Math.max(0, score))
          setResult({ headline: s.derail >= 100 ? 'The meeting went off the rails' : 'Meeting wrapped on time ✅', lines: [`${s.agenda} agenda items covered`, `Derailment ${Math.round(s.derail)}%`, `Score ${Math.max(0, score)}`], record })
        }
      }
      for (let i = rocks.length - 1; i >= 0; i--) {
        const k = rocks[i]
        k.m.position.addScaledVector(k.v, dt)
        k.m.rotation.x += dt * 1.5; k.m.rotation.y += dt
        k.label.position.copy(k.m.position).add(new THREE.Vector3(0, 0.8, 0.2))
        const d = k.m.position.length()
        if (d < 2.1 && !k.deflected) {
          if (k.on) s.agenda++; else { s.derail = Math.min(100, s.derail + 18); s.shake = 0.4 }
          scene.remove(k.m, k.label); rocks.splice(i, 1)
        } else if (d > 18) { scene.remove(k.m, k.label); rocks.splice(i, 1) }
      }
      s.shake = Math.max(0, s.shake - dt)
      planet.position.set((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake, 0)
      planet.rotation.y += dt * 0.2
      ring.rotation.z += dt * 0.3
      ;(planet.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5 + s.derail / 60
      ;(planet.material as THREE.MeshStandardMaterial).emissive.set(s.derail > 50 ? 0x7f1d1d : dark ? 0x002a10 : 0x0a1a40)
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ agenda: s.agenda, derail: Math.round(s.derail), t: Math.max(0, Math.ceil(s.t)) }) }
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', onDown); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Meeting Meteor" score={hud.agenda * 10} best={best} result={result} onRestart={restart}
      hint={`Let the blue agenda items land · click grey tangents to nudge them past · ${hud.agenda} covered · derailment ${hud.derail}% · ${hud.t}s`}>
      <div ref={host} className="fl-host" style={{ cursor: 'crosshair' }} />
    </GameShell>
  )
}
