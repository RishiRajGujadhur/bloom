import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Color3, Color4, DirectionalLight, Engine, GlowLayer, HemisphericLight, Matrix, Mesh, MeshBuilder, PointerEventTypes, Scene, ShadowGenerator, StandardMaterial, Vector3 } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Car Care Garage (Babylon.js): cars roll in for a quick check before a road
 * trip. Drag to walk round the car and tap the parts to inspect them — each
 * tyre, the oil under the bonnet, the lights, the wipers. Anything that needs
 * attention glows once you've found it; tap it again to fix it. Five cars.
 */
type Part = { id: string; label: string; mesh: Mesh; issue: boolean; checked: boolean; fixed: boolean }
const CARS = 5
const COLORS = [new Color3(0.85, 0.2, 0.25), new Color3(0.2, 0.45, 0.85), new Color3(0.95, 0.75, 0.2), new Color3(0.25, 0.65, 0.4), new Color3(0.6, 0.35, 0.8)]

export default function CarCare() {
  const [best, submit] = useBest('garage')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ car: 1, found: 0, issues: 0, msg: 'Drag to walk round. Tap parts to check them.', t: 0 })
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
    const engine = new Engine(cv, true)
    engine.resize()
    const scene = new Scene(engine)
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.clearColor = dark ? new Color4(0, 0.06, 0.02, 1) : new Color4(0.82, 0.86, 0.9, 1)
    const cam = new ArcRotateCamera('c', -Math.PI / 3, 1.1, 8.5, new Vector3(0, 0.8, 0), scene)
    cam.lowerRadiusLimit = 7; cam.upperRadiusLimit = 14; cam.upperBetaLimit = 1.45
    cam.attachControl(cv, true)
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.8
    const sun = new DirectionalLight('s', new Vector3(-0.4, -1, 0.5), scene); sun.position = new Vector3(6, 10, -6); sun.intensity = 0.9
    const shadows = new ShadowGenerator(1024, sun); shadows.useBlurExponentialShadowMap = true
    const glow = new GlowLayer('g', scene); glow.intensity = 0.7
    const mat = (c: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = c; if (e) m.emissiveColor = e; m.specularColor = new Color3(0.3, 0.3, 0.3); return m }
    const floor = MeshBuilder.CreateGround('floor', { width: 30, height: 30 }, scene); floor.material = mat(dark ? new Color3(0, 0.15, 0.06) : new Color3(0.55, 0.57, 0.6)); floor.receiveShadows = true
    for (let i = -2; i <= 2; i++) { const line = MeshBuilder.CreateGround('l', { width: 0.12, height: 8 }, scene); line.position = new Vector3(i * 3.6, 0.01, 0); line.material = mat(new Color3(0.95, 0.85, 0.2)) }
    const car = new Mesh('car', scene)
    const bodyM = mat(COLORS[0])
    const body = MeshBuilder.CreateBox('body', { width: 4.2, height: 0.9, depth: 1.9 }, scene); body.position.y = 0.85; body.material = bodyM; body.parent = car
    const cabin = MeshBuilder.CreateBox('cabin', { width: 2.3, height: 0.8, depth: 1.7 }, scene); cabin.position = new Vector3(-0.2, 1.65, 0); cabin.material = mat(new Color3(0.7, 0.85, 0.95)); cabin.parent = car
    const bonnet = MeshBuilder.CreateBox('bonnet', { width: 1.2, height: 0.08, depth: 1.8 }, scene); bonnet.position = new Vector3(1.45, 1.33, 0); bonnet.material = bodyM; bonnet.parent = car
    ;[body, cabin].forEach((m) => shadows.addShadowCaster(m))
    const parts: Part[] = []
    const add = (id: string, label: string, mesh: Mesh) => { mesh.parent = car; mesh.metadata = { part: id }; parts.push({ id, label, mesh, issue: false, checked: false, fixed: false }); shadows.addShadowCaster(mesh) }
    const tyreM = mat(new Color3(0.1, 0.1, 0.1))
    for (const [x, z, n] of [[1.4, 0.95, 'front-right tyre'], [1.4, -0.95, 'front-left tyre'], [-1.4, 0.95, 'rear-right tyre'], [-1.4, -0.95, 'rear-left tyre']] as [number, number, string][]) {
      const t = MeshBuilder.CreateCylinder(n, { diameter: 0.9, height: 0.35, tessellation: 24 }, scene)
      t.rotation.x = Math.PI / 2; t.position = new Vector3(x, 0.45, z); t.material = tyreM
      add(n, n, t)
    }
    const oil = MeshBuilder.CreateCylinder('oil', { diameter: 0.18, height: 0.3 }, scene); oil.position = new Vector3(1.5, 1.45, 0.4); oil.material = mat(new Color3(0.95, 0.75, 0.1)); add('oil', 'engine oil', oil)
    for (const z of [0.6, -0.6]) { const l = MeshBuilder.CreateSphere(`light${z}`, { diameter: 0.3 }, scene); l.position = new Vector3(2.1, 0.95, z); l.material = mat(new Color3(1, 1, 0.9), new Color3(0.3, 0.3, 0.25)); add(`light${z}`, z > 0 ? 'right headlight' : 'left headlight', l) }
    const wiper = MeshBuilder.CreateBox('wiper', { width: 0.05, height: 0.05, depth: 1.2 }, scene); wiper.position = new Vector3(0.95, 1.5, 0); wiper.rotation.z = 0.5; wiper.material = mat(new Color3(0.15, 0.15, 0.15)); add('wiper', 'wipers', wiper)
    const issueM = mat(new Color3(1, 0.3, 0.2), new Color3(0.9, 0.2, 0.1))
    const okM = mat(new Color3(0.3, 0.9, 0.5), new Color3(0.1, 0.5, 0.2))
    const orig = new Map(parts.map((p) => [p.id, p.mesh.material]))
    const s = { car: 1, score: 0, found: 0, missed: 0, t0: performance.now(), rolling: 0, lines: [] as string[], running: true }
    const setup = () => {
      bodyM.diffuseColor = COLORS[(s.car - 1) % COLORS.length]
      const n = 2 + Math.floor(Math.random() * 2)
      const shuffled = [...parts].sort(() => Math.random() - 0.5)
      parts.forEach((p) => { p.issue = false; p.checked = false; p.fixed = false; p.mesh.material = orig.get(p.id)!; p.mesh.scaling = Vector3.One() })
      shuffled.slice(0, n).forEach((p) => { p.issue = true; if (p.id.includes('tyre')) p.mesh.scaling = new Vector3(1, 1, 0.8) })
      s.t0 = performance.now()
      s.rolling = 1
      car.position.x = -12
    }
    setup()
    const sync = (msg?: string) => setHud((h) => ({ car: s.car, found: parts.filter((p) => p.issue && p.fixed).length, issues: parts.filter((p) => p.issue).length, msg: msg ?? h.msg, t: Math.round((performance.now() - s.t0) / 1000) }))
    const done = () => {
      const secs = (performance.now() - s.t0) / 1000
      const pts = Math.max(10, Math.round(60 - secs * 1.5)) + parts.filter((p) => p.issue && p.fixed).length * 10
      s.score += pts; s.lines.push(`Car ${s.car}: ${Math.round(secs)}s`)
      if (s.car >= CARS) {
        s.running = false
        const record = submitRef.current(s.score)
        setResult({ headline: 'Road-trip ready! 🚗', lines: [...s.lines.slice(-3), `Score ${s.score}`], record })
      } else { s.car++; s.rolling = -1 }
    }
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERTAP || !s.running || s.rolling !== 0) return
      const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      const k = engine.getRenderWidth() / cv.clientWidth
      const px = scene.pointerX * k, py = scene.pointerY * k
      const hit = scene.pick(scene.pointerX, scene.pointerY, (m) => !!m.metadata?.part)
      let part = parts.find((p) => p.id === hit?.pickedMesh?.metadata?.part)
      if (!part) {
        let bestD = 40 * k
        for (const p of parts) { const sp = Vector3.Project(p.mesh.getAbsolutePosition(), Matrix.Identity(), scene.getTransformMatrix(), vp); const d = Math.hypot(sp.x - px, sp.y - py); if (d < bestD) { bestD = d; part = p } }
      }
      if (!part) return
      if (!part.checked) {
        part.checked = true
        part.mesh.material = part.issue ? issueM : okM
        sync(part.issue ? `${part.label}: needs attention — tap to fix` : `${part.label}: all good`)
      } else if (part.issue && !part.fixed) {
        part.fixed = true; part.mesh.material = okM; part.mesh.scaling = Vector3.One()
        sync(`Fixed the ${part.label}.`)
        if (parts.filter((p) => p.issue).every((p) => p.fixed)) { sync('All done — next car!'); setTimeout(done, 600) }
      }
    })
    let hudT = 0
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000
      if (s.rolling === 1) { car.position.x = Math.min(0, car.position.x + dt * 14); if (car.position.x >= 0) s.rolling = 0 }
      if (s.rolling === -1) { car.position.x += dt * 16; if (car.position.x > 12) setup() }
      parts.filter((p) => p.id.includes('tyre')).forEach((p) => { if (s.rolling) p.mesh.rotation.y += dt * 8 })
      if ((hudT += dt) > 0.5) { hudT = 0; sync() }
    })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Car Care Garage" score={hud.car * 10} best={best} result={result} onRestart={restart}
      hint={`Car ${hud.car}/${CARS} · fixed ${hud.found}/${hud.issues} · ${hud.msg} · ${hud.t}s`}>
      <div ref={host} />
    </GameShell>
  )
}
