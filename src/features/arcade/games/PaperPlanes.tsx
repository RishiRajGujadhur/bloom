import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Thank-You Paper Planes (Three.js): neighbours did lovely things this week.
 * Each note says who it's for. Drag back from the plane and let go to throw it
 * at the right window — they'll wave when it lands. Gentle throws float,
 * hard ones dive.
 */
const NEIGHBOURS = [
  { glyph: '👵', prop: '🍲', why: 'the soup when I was ill' },
  { glyph: '👷', prop: '🚲', why: 'fixing my bike' },
  { glyph: '👩', prop: '🎂', why: 'the birthday cake' },
  { glyph: '👴', prop: '🌿', why: 'watering my plants' },
  { glyph: '🧑', prop: '📚', why: 'help with my homework' },
  { glyph: '👧', prop: '🐕', why: 'walking my dog' },
]
const THROWS = 10

const emojiTexture = (e: string, prop: string, bg: string) => {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  g.fillStyle = bg; g.fillRect(0, 0, 128, 128)
  g.font = '78px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 54, 64)
  g.font = '44px system-ui'; g.fillText(prop, 100, 100)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function PaperPlanes() {
  const [best, submit] = useBest('planes')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ note: '', left: THROWS, score: 0, msg: 'Drag back from the plane and release.' })
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
    scene.background = new THREE.Color(dark ? 0x001a08 : 0xbfe3ff)
    scene.fog = new THREE.Fog(scene.background as THREE.Color, 30, 60)
    const cam = new THREE.PerspectiveCamera(50, w / h, 0.1, 200)
    cam.position.set(0, 2.2, 16)
    cam.lookAt(0, 4.5, 0)
    scene.add(new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.3))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(6, 12, 10); scene.add(sun)
    // Building with a 3×2 grid of windows.
    const wall = new THREE.Mesh(new THREE.BoxGeometry(14, 11, 1), new THREE.MeshStandardMaterial({ color: dark ? 0x00461c : 0xe9b98f }))
    wall.position.set(0, 5.5, -0.5); scene.add(wall)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 60), new THREE.MeshStandardMaterial({ color: dark ? 0x002a10 : 0x8fd18a }))
    ground.rotation.x = -Math.PI / 2; ground.position.z = 10; scene.add(ground)
    type Win = { x: number; y: number; who: number; sprite: THREE.Mesh; wave: number }
    const wins: Win[] = []
    const order = [...NEIGHBOURS.keys()].sort(() => Math.random() - 0.5)
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const x = -4.2 + c * 4.2, y = 3.3 + r * 4
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 0.2), new THREE.MeshStandardMaterial({ color: 0xffffff }))
      frame.position.set(x, y, 0.05); scene.add(frame)
      const who = order[r * 3 + c]
      const sprite = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2), new THREE.MeshBasicMaterial({ map: emojiTexture(NEIGHBOURS[who].glyph, NEIGHBOURS[who].prop, '#fff6d6') }))
      sprite.position.set(x, y, 0.17); scene.add(sprite)
      const sill = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.2, 0.5), new THREE.MeshStandardMaterial({ color: 0xd97706 }))
      sill.position.set(x, y - 1.3, 0.3); scene.add(sill)
      wins.push({ x, y, who, sprite, wave: 0 })
    }
    // The plane.
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.6, -0.45, 0, 0.35, 0, 0.08, 0.35, 0, 0, -0.6, 0, 0.08, 0.35, 0.45, 0, 0.35, 0, 0, -0.6, 0, -0.15, 0.35, 0, 0.08, 0.35], 3))
    geo.computeVertexNormals()
    const plane = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide, flatShading: true }))
    scene.add(plane)
    const START = new THREE.Vector3(0, 1.4, 12)
    const aim = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xff7a59, dashSize: 0.2, gapSize: 0.15 }))
    scene.add(aim)

    const s = { left: THROWS, score: 0, target: 0, flying: false, vel: new THREE.Vector3(), running: true, hits: 0, misses: 0 }
    const pickNote = () => { s.target = wins[Math.floor(Math.random() * wins.length)].who }
    pickNote()
    const reset = () => { plane.position.copy(START); plane.rotation.set(0, 0, 0); s.flying = false; aim.visible = false }
    reset()
    const sync = (msg?: string) => setHud((hh) => ({ note: `For ${NEIGHBOURS[s.target].why}`, left: s.left, score: s.score, msg: msg ?? hh.msg }))
    sync()

    const cv = renderer.domElement
    let drag: { x: number; y: number } | null = null
    const pull = new THREE.Vector2()
    const velFrom = (p: THREE.Vector2) => new THREE.Vector3(-p.x * 0.05, 5 + p.y * 0.05, -9 - p.length() * 0.035)
    cv.addEventListener('pointerdown', (e) => { if (s.flying || !s.running) return; drag = { x: e.clientX, y: e.clientY }; cv.setPointerCapture(e.pointerId) })
    cv.addEventListener('pointermove', (e) => {
      if (!drag) return
      pull.set(e.clientX - drag.x, e.clientY - drag.y)
      // Preview arc.
      const v = velFrom(pull), p = START.clone(), pts: THREE.Vector3[] = []
      for (let i = 0; i < 30; i++) { pts.push(p.clone()); v.y -= 9.8 * 0.05 * 0.55; p.addScaledVector(v, 0.05) }
      aim.geometry.setFromPoints(pts); aim.computeLineDistances(); aim.visible = true
    })
    cv.addEventListener('pointerup', () => {
      if (!drag) return
      drag = null
      if (pull.length() < 10) { aim.visible = false; return }
      s.vel = velFrom(pull); s.flying = true; aim.visible = false
      s.left--
    })

    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const dt = Math.min(0.033, clock.getDelta())
      if (s.flying) {
        // Paper planes fall slowly: a little lift against gravity.
        s.vel.y -= 9.8 * 0.55 * dt
        s.vel.multiplyScalar(0.995)
        plane.position.addScaledVector(s.vel, dt)
        plane.lookAt(plane.position.clone().sub(s.vel))
        if (plane.position.z <= 0.4) {
          const hit = wins.find((wn) => Math.abs(wn.x - plane.position.x) < 1.3 && Math.abs(wn.y - plane.position.y) < 1.2)
          if (hit && hit.who === s.target) { s.score += 20; s.hits++; hit.wave = 1.5; sync('Delivered! They’re waving 👋') }
          else if (hit) { s.score += 3; s.misses++; hit.wave = 0.6; sync(`That’s a different neighbour — sweet, but not the one.`) }
          else { s.misses++; sync('Bounced off the wall.') }
          finishThrow()
        } else if (plane.position.y < 0.1) { s.misses++; sync('Nose-dived into the grass.'); finishThrow() }
      }
      for (const wn of wins) {
        wn.wave = Math.max(0, wn.wave - dt)
        wn.sprite.rotation.z = wn.wave > 0 ? Math.sin(clock.elapsedTime * 18) * 0.15 : 0
        wn.sprite.scale.setScalar(1 + (wn.wave > 0 ? 0.08 : 0))
      }
      if (!s.flying) plane.position.y = START.y + Math.sin(clock.elapsedTime * 2) * 0.05
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    const finishThrow = () => {
      s.flying = false
      if (s.left <= 0) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: 'Notes delivered', lines: [`${s.hits} thank-yous reached the right window`, `${s.misses} went astray`, `Score ${s.score}`], record })
      }
      setTimeout(() => { reset(); pickNote(); sync() }, 700)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); renderer.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Thank-You Planes" score={hud.score} best={best} result={result} onRestart={restart}
      hint={`✉️ ${hud.note} · ${hud.left} planes left · ${hud.msg}`}>
      <div ref={host} className="fl-host" style={{ cursor: 'grab' }} />
    </GameShell>
  )
}
