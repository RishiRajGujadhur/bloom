import { useCallback, useEffect, useRef, useState } from 'react'
import * as pc from 'playcanvas'
import { GameShell, useBest } from '../shell'

/**
 * Shopping Cart Dash (PlayCanvas): the cart follows your pointer round a
 * little supermarket. Grab everything on the list and reach the till within
 * budget. Treat displays have a pull of their own — steer wide or they'll
 * drag your cart in and add themselves to the bill.
 */
const TIME = 70
const BUDGET = 30
const LIST = [
  { name: 'Milk', color: '#f8fafc', price: 1.2 }, { name: 'Bread', color: '#d4a373', price: 1.5 }, { name: 'Eggs', color: '#fde68a', price: 2.2 },
  { name: 'Apples', color: '#ef4444', price: 2 }, { name: 'Rice', color: '#e5e7eb', price: 1.8 }, { name: 'Beans', color: '#f97316', price: 0.9 },
]
const TREATS = [{ name: 'Crisps', price: 2.5, color: '#facc15' }, { name: 'Chocolate', price: 3, color: '#7c2d12' }, { name: 'Fizzy drink', price: 2, color: '#dc2626' }, { name: 'Doughnuts', price: 3.5, color: '#f472b6' }]

export default function CartDash() {
  const [best, submit] = useBest('cart')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ got: [] as string[], spent: 0, treats: 0, t: TIME })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const cv = document.createElement('canvas')
    cv.className = 'co-canvas'
    el.appendChild(cv)
    const app = new pc.Application(cv, { mouse: new pc.Mouse(cv), touch: new pc.TouchDevice(cv) })
    app.setCanvasFillMode(pc.FILLMODE_NONE)
    app.setCanvasResolution(pc.RESOLUTION_AUTO)
    app.resizeCanvas(cv.clientWidth, cv.clientHeight)
    const dark = document.documentElement.dataset.theme === 'matrix'
    const mat = (hex: string, glow = 0) => { const m = new pc.StandardMaterial(); const c = new pc.Color().fromString(hex); m.diffuse = c; if (glow) { m.emissive = c; m.emissiveIntensity = glow } m.update(); return m }
    const box = (pos: [number, number, number], scale: [number, number, number], m: pc.StandardMaterial, parent: pc.Entity = app.root, type = 'box') => {
      const e = new pc.Entity(); e.addComponent('render', { type, material: m }); e.setLocalPosition(...pos); e.setLocalScale(...scale); parent.addChild(e); return e
    }
    const cam = new pc.Entity(); cam.addComponent('camera', { clearColor: dark ? new pc.Color(0, 0.08, 0.03) : new pc.Color(0.93, 0.95, 0.97), fov: 50 })
    cam.setPosition(0, 17, 12); cam.lookAt(0, 0, 0.5); app.root.addChild(cam)
    const sun = new pc.Entity(); sun.addComponent('light', { type: 'directional', intensity: 1.1, castShadows: true, shadowDistance: 50, shadowResolution: 2048 }); sun.setEulerAngles(55, 25, 0); app.root.addChild(sun)
    app.scene.ambientLight = new pc.Color(0.5, 0.5, 0.55)
    box([0, -0.05, 0], [26, 0.1, 18], mat(dark ? '#002a10' : '#f1f5f9'))
    for (let z = -8; z <= 8; z += 2) box([0, 0.02, z], [26, 0.02, 0.06], mat(dark ? '#004a1c' : '#cbd5e1'))
    // Shelves: four aisles.
    const shelves: { x: number; z: number; w: number; d: number }[] = []
    for (const x of [-8, -3, 2, 7]) { box([x, 0.8, -1], [1.2, 1.6, 10], mat('#94a3b8')); shelves.push({ x, z: -1, w: 1.2, d: 10 })
      for (let i = 0; i < 5; i++) box([x, 1.2, -5 + i * 2], [1.3, 0.3, 1.6], mat(['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa'][i])) }
    // Till.
    box([10.5, 0.5, 7], [3, 1, 1.4], mat('#1f2937')); const tillSign = box([10.5, 2, 7], [2.6, 0.8, 0.1], mat('#22c55e', 0.6)); void tillSign
    // List items and treat displays.
    const spots: [number, number][] = [[-10.5, -5], [-5.5, 4], [-0.5, -5], [4.5, 4], [9.5, -4], [-10.5, 5], [-5.5, -6], [4.5, -6], [-0.5, 6]]
    spots.sort(() => Math.random() - 0.5)
    const items = LIST.map((it, i) => { const [x, z] = spots[i]; const e = box([x, 0.6, z], [0.7, 0.7, 0.7], mat(it.color, 0.25)); return { ...it, e, x, z, got: false } })
    const treatSpots: [number, number][] = [[-5.5, -1], [-0.5, 1], [4.5, -1], [9.5, 3]]
    const treats = TREATS.map((t, i) => { const [x, z] = treatSpots[i]; const stand = box([x, 0.5, z], [1.4, 1, 1.4], mat(t.color, 0.4)); return { ...t, e: stand, x, z, cool: 0 } })
    // Cart.
    const cart = new pc.Entity(); app.root.addChild(cart)
    box([0, 0.55, 0], [1.1, 0.6, 1.5], mat('#3b82f6'), cart); box([0, 0.15, 0.55], [1.1, 0.1, 0.1], mat('#111'), cart); box([0, 0.15, -0.55], [1.1, 0.1, 0.1], mat('#111'), cart)
    const s = { x: -11, z: 7, vx: 0, vz: 0, tx: -11, tz: 7, t: TIME, spent: 0, treats: 0, got: [] as string[], running: true }
    cart.setPosition(s.x, 0, s.z)
    const plane = new pc.Plane(new pc.Vec3(0, 1, 0), 0)
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      const from = cam.camera!.screenToWorld(e.clientX - r.left, e.clientY - r.top, cam.camera!.nearClip)
      const to = cam.camera!.screenToWorld(e.clientX - r.left, e.clientY - r.top, cam.camera!.farClip)
      const ray = new pc.Ray(from, to.clone().sub(from).normalize())
      const hit = new pc.Vec3()
      if (plane.intersectsRay(ray, hit)) { s.tx = hit.x; s.tz = hit.z }
    }
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerdown', onMove)
    let hudT = 0
    const blocked = (x: number, z: number) => Math.abs(x) > 12.2 || Math.abs(z) > 8.2 || shelves.some((sh) => Math.abs(x - sh.x) < sh.w / 2 + 0.6 && Math.abs(z - sh.z) < sh.d / 2 + 0.6)
    app.on('update', (dt: number) => {
      if (s.running) {
        s.t -= dt
        // Steer toward the pointer, plus the pull of nearby treats.
        let ax = (s.tx - s.x) * 3, az = (s.tz - s.z) * 3
        for (const t of treats) {
          const dx = t.x - s.x, dz = t.z - s.z, d = Math.hypot(dx, dz)
          if (d < 3.2 && d > 0.01) { ax += (dx / d) * (3.2 - d) * 9; az += (dz / d) * (3.2 - d) * 9 }
          t.cool = Math.max(0, t.cool - dt)
          if (d < 1.2 && t.cool <= 0) { s.spent += t.price; s.treats++; t.cool = 3 }
        }
        s.vx += ax * dt; s.vz += az * dt
        const sp = Math.hypot(s.vx, s.vz), max = 7
        if (sp > max) { s.vx *= max / sp; s.vz *= max / sp }
        s.vx *= 0.9; s.vz *= 0.9
        const nx = s.x + s.vx * dt, nz = s.z + s.vz * dt
        if (!blocked(nx, s.z)) s.x = nx; else s.vx *= -0.3
        if (!blocked(s.x, nz)) s.z = nz; else s.vz *= -0.3
        cart.setPosition(s.x, 0, s.z)
        if (sp > 0.3) cart.setEulerAngles(0, (Math.atan2(s.vx, s.vz) * 180) / Math.PI, 0)
        for (const it of items) if (!it.got && Math.hypot(it.x - s.x, it.z - s.z) < 1.1) { it.got = true; s.spent += it.price; s.got.push(it.name); it.e.enabled = false }
        const atTill = Math.hypot(s.x - 10.5, s.z - 5.8) < 1.6
        if (atTill && s.got.length === LIST.length || s.t <= 0) {
          s.running = false
          const within = s.spent <= BUDGET
          const score = Math.max(0, s.got.length * 20 + (within ? 40 : -20) + (s.got.length === LIST.length ? Math.round(s.t) * 2 : 0) - s.treats * 5)
          const record = submitRef.current(score)
          setResult({ headline: s.got.length === LIST.length && within ? 'Shopping done, on budget!' : s.t <= 0 ? 'Shop’s closing!' : 'Over budget…', lines: [`${s.got.length}/${LIST.length} list items`, `${s.treats} treats snuck in`, `Spent £${s.spent.toFixed(2)} of £${BUDGET}`, `Score ${score}`], record })
        }
      }
      items.forEach((it, i) => { if (!it.got) it.e.setLocalEulerAngles(0, (performance.now() / 20 + i * 40) % 360, 0) })
      treats.forEach((t, i) => t.e.setLocalScale(1.4 + Math.sin(performance.now() / 200 + i) * 0.08, 1, 1.4 + Math.sin(performance.now() / 200 + i) * 0.08))
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ got: [...s.got], spent: s.spent, treats: s.treats, t: Math.max(0, Math.ceil(s.t)) }) }
    })
    app.start()
    const onResize = () => app.resizeCanvas(cv.clientWidth, cv.clientHeight)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); app.destroy(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Shopping Cart Dash" score={hud.got.length * 20} best={best} result={result} onRestart={restart}
      hint={`Point to steer · list: ${LIST.map((l) => (hud.got.includes(l.name) ? `✓${l.name}` : l.name)).join(', ')} · £${hud.spent.toFixed(2)}/£${BUDGET} · then the green till · ${hud.t}s`}>
      <div ref={host} />
    </GameShell>
  )
}
