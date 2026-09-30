import { useCallback, useEffect, useRef, useState } from 'react'
import { Animation, ArcRotateCamera, Color3, Color4, CubicEase, DirectionalLight, EasingFunction, Engine, HemisphericLight, Matrix, Mesh, MeshBuilder, PointerEventTypes, Scene, ShadowGenerator, StandardMaterial, Vector3, VertexBuffer, VertexData } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Goal Mountain (Babylon.js): the summit looks impossibly far. Hop from ledge
 * to ledge instead: click any glowing ledge inside today's reach ring to make
 * camp there. Big leaps tire you and shrink tomorrow's reach; small, steady
 * steps keep it strong. Storm days shorten everyone's reach. Summit before
 * supplies run out.
 */
const DAYS = 16
const PEAK = new Vector3(0, 9.6, 0)

export default function GoalMountain() {
  const [best, submit] = useBest('mountain')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ day: 1, energy: 100, storm: false, msg: 'Click a ledge inside the ring.' })
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
    scene.clearColor = dark ? new Color4(0, 0.06, 0.02, 1) : new Color4(0.72, 0.85, 0.97, 1)
    scene.fogMode = Scene.FOGMODE_LINEAR; scene.fogStart = 30; scene.fogEnd = 70
    scene.fogColor = dark ? new Color3(0, 0.06, 0.02) : new Color3(0.72, 0.85, 0.97)
    const cam = new ArcRotateCamera('c', -Math.PI / 2.4, 1.15, 30, new Vector3(0, 4, 0), scene)
    cam.lowerRadiusLimit = 18; cam.upperRadiusLimit = 40; cam.upperBetaLimit = 1.4
    cam.attachControl(cv, true)
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.7
    const sun = new DirectionalLight('s', new Vector3(-0.5, -1, 0.6), scene); sun.position = new Vector3(20, 30, -20); sun.intensity = 1.1
    const shadows = new ShadowGenerator(1024, sun); shadows.useBlurExponentialShadowMap = true
    const mat = (c: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = c; if (e) m.emissiveColor = e; m.specularColor = new Color3(0.05, 0.05, 0.05); return m }

    // A craggy mountain from a displaced ground.
    const ground = MeshBuilder.CreateGround('mtn', { width: 40, height: 40, subdivisions: 90, updatable: true }, scene)
    const pos = ground.getVerticesData(VertexBuffer.PositionKind)!
    const colors: number[] = []
    const hAt = (x: number, z: number) => {
      const r = Math.hypot(x, z)
      const base = Math.max(0, 10 - r * 0.72)
      return base + Math.sin(x * 0.9) * Math.cos(z * 0.8) * 0.5 + Math.sin(x * 2.1 + z * 1.7) * 0.18
    }
    for (let i = 0; i < pos.length; i += 3) {
      const y = hAt(pos[i], pos[i + 2]); pos[i + 1] = y
      const snow = y > 7.2
      const c = dark ? [0, 0.25 + y * 0.05, 0.1] : snow ? [0.96, 0.97, 1] : y > 4 ? [0.55, 0.52, 0.5] : [0.36, 0.56 - y * 0.02, 0.3]
      colors.push(c[0], c[1], c[2], 1)
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, pos)
    ground.setVerticesData(VertexBuffer.ColorKind, colors)
    const normals: number[] = []
    VertexData.ComputeNormals(pos, ground.getIndices(), normals)
    ground.updateVerticesData(VertexBuffer.NormalKind, normals)
    const gm = new StandardMaterial('gm', scene); gm.specularColor = new Color3(0, 0, 0)
    ground.material = gm
    ground.receiveShadows = true

    // Ledges spiralling up to the peak.
    type Ledge = { p: Vector3; mesh: Mesh }
    const ledges: Ledge[] = []
    const ledgeM = mat(new Color3(1, 0.8, 0.3), new Color3(0.5, 0.35, 0.05))
    for (let i = 0; i < 46; i++) {
      const t = i / 45
      const r = 12.5 * (1 - t) + 0.6
      const a = t * Math.PI * 4.2 + (Math.random() - 0.5) * 0.9
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      const p = new Vector3(x, hAt(x, z) + 0.15, z)
      const m = MeshBuilder.CreateCylinder('ledge', { diameter: 0.7, height: 0.18 }, scene)
      m.position = p; m.material = ledgeM; m.metadata = { ledge: i }
      ledges.push({ p, mesh: m })
    }
    const peakFlag = MeshBuilder.CreateCylinder('pole', { diameter: 0.08, height: 1.6 }, scene)
    peakFlag.position = PEAK.add(new Vector3(0, 0.8, 0))
    const flag = MeshBuilder.CreatePlane('flag', { width: 0.9, height: 0.5, sideOrientation: Mesh.DOUBLESIDE }, scene)
    flag.position = PEAK.add(new Vector3(0.45, 1.35, 0)); flag.material = mat(new Color3(0.9, 0.2, 0.25))

    // Climber and today's reach ring.
    const climber = MeshBuilder.CreateCapsule('me', { radius: 0.22, height: 0.9 }, scene)
    climber.material = mat(new Color3(0.2, 0.45, 0.95)); shadows.addShadowCaster(climber)
    const ring = MeshBuilder.CreateTorus('ring', { diameter: 2, thickness: 0.06, tessellation: 64 }, scene)
    ring.material = mat(new Color3(0.3, 0.9, 0.5), new Color3(0.2, 0.7, 0.3))
    const campM = mat(new Color3(0.95, 0.5, 0.2))

    const start = new Vector3(Math.cos(0) * 15, hAt(15, 0) + 0.3, 0)
    const s = { at: start.clone(), day: 1, energy: 100, storm: false, running: true, moving: false, leaps: 0 }
    climber.position = s.at.add(new Vector3(0, 0.45, 0))
    const reach = () => (1.4 + s.energy * 0.035) * (s.storm ? 0.65 : 1)
    const layout = () => {
      const R = reach()
      ring.position = s.at.add(new Vector3(0, 0.1, 0))
      ring.scaling = new Vector3(R, 1, R)
      ledges.forEach((l) => { const d = Vector3.Distance(l.p, s.at); l.mesh.visibility = d <= R ? 1 : 0.35 })
      setHud({ day: s.day, energy: Math.round(s.energy), storm: s.storm, msg: s.storm ? 'Storm today — shorter reach.' : 'Click a ledge inside the ring.' })
    }
    layout()
    const summit = () => {
      s.running = false
      const score = Math.max(50, (DAYS - s.day + 1) * 40 + Math.round(s.energy))
      const record = submitRef.current(score)
      setResult({ headline: 'Summit! 🏔️', lines: [`Reached the top on day ${s.day}`, `${s.leaps} camps along the way`, `Energy left ${Math.round(s.energy)}`, `Score ${score}`], record })
    }
    const moveTo = (target: Vector3) => {
      s.moving = true
      const a = new Animation('m', 'position', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT)
      const from = climber.position.clone(), to = target.add(new Vector3(0, 0.45, 0))
      const mid = Vector3.Lerp(from, to, 0.5).add(new Vector3(0, 1.2, 0))
      a.setKeys([{ frame: 0, value: from }, { frame: 20, value: mid }, { frame: 40, value: to }])
      const e = new CubicEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT); a.setEasingFunction(e)
      scene.beginDirectAnimation(climber, [a], 0, 40, false, 1, () => {
        s.moving = false
        const camp = MeshBuilder.CreateCylinder('tent', { diameterTop: 0, diameterBottom: 0.6, height: 0.5, tessellation: 4 }, scene)
        camp.position = target.add(new Vector3(0.35, 0.25, 0.2)); camp.material = campM; shadows.addShadowCaster(camp)
        if (Vector3.Distance(s.at, PEAK) < 1.4) summit()
        else if (s.day > DAYS) { s.running = false; const record = submitRef.current(s.leaps * 5); setResult({ headline: 'Supplies ran out', lines: [`${s.leaps} camps made`, `${Vector3.Distance(s.at, PEAK).toFixed(1)} km short of the summit`, `Score ${s.leaps * 5}`], record }) }
        else layout()
      })
    }
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERTAP || !s.running || s.moving) return
      // Forgiving: nearest ledge (or the peak) on screen within ~40px.
      const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      const k = engine.getRenderWidth() / cv.clientWidth
      const px = scene.pointerX * k, py = scene.pointerY * k
      let bestP: Vector3 | null = null, bestD = 40 * k
      for (const target of [...ledges.map((l) => l.p), PEAK]) {
        const sp = Vector3.Project(target, Matrix.Identity(), scene.getTransformMatrix(), vp)
        const d = Math.hypot(sp.x - px, sp.y - py)
        if (d < bestD) { bestD = d; bestP = target }
      }
      if (!bestP) return
      const dist = Vector3.Distance(bestP, s.at)
      if (dist > reach()) { setHud((h) => ({ ...h, msg: 'Too far for today — pick a closer ledge.' })); return }
      if (dist < 0.3) return
      // Effort grows faster than distance: big leaps are expensive.
      const cost = dist * dist * 4.2
      s.energy = Math.max(5, Math.min(100, s.energy - cost + 22))
      s.at = bestP.clone(); s.day++; s.leaps++
      s.storm = Math.random() < 0.22
      moveTo(bestP)
    })
    let t = 0
    scene.onBeforeRenderObservable.add(() => {
      t += engine.getDeltaTime() / 1000
      flag.rotation.y = Math.sin(t * 3) * 0.3
      ring.rotation.y += 0.01
      cam.alpha += 0.0004
    })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Goal Mountain" score={Math.max(0, (DAYS - hud.day + 1) * 10)} best={best} result={result} onRestart={restart}
      hint={`Day ${hud.day}/${DAYS} · energy ${hud.energy} ${hud.storm ? '· ⛈ storm' : ''} · ${hud.msg} · drag to look around`}>
      <div ref={host} />
    </GameShell>
  )
}
