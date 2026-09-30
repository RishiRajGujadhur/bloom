import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Matrix, Color3, Color4, Engine, GlowLayer, HemisphericLight, Mesh, MeshBuilder, PointLight, PointerEventTypes, Scene, StandardMaterial, Vector3 } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Debt Dragon (Babylon.js): a dragon curls round the hoard you borrowed, and
 * every moon it grows a little bigger. Tap the glowing crystals to mine coins.
 * Feed coins to the dragon to shrink it, or spend them on a better pick to
 * mine faster. If it outgrows the cave, it wakes.
 */
const START_DEBT = 60
const RATE = 1.07
const MOON_MS = 4000
const CAVE = 180

export default function DebtDragon() {
  const [best, submit] = useBest('dragon')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ coins: 0, debt: START_DEBT, pick: 1, moon: 1, paid: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef({ feed: () => {}, upgrade: () => {} })
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
    scene.clearColor = dark ? new Color4(0, 0.05, 0.02, 1) : new Color4(0.08, 0.06, 0.1, 1)
    const cam = new ArcRotateCamera('c', -Math.PI / 2, 1.2, 16, new Vector3(0, 1.5, 0), scene)
    cam.lowerRadiusLimit = 12; cam.upperRadiusLimit = 20
    cam.attachControl(cv, true)
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.8
    const fire = new PointLight('fire', new Vector3(0, 3, -1), scene)
    fire.diffuse = new Color3(1, 0.6, 0.3); fire.intensity = 0.8
    const glow = new GlowLayer('glow', scene); glow.intensity = 0.8
    const mat = (c: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = c; if (e) m.emissiveColor = e; m.specularColor = new Color3(0.1, 0.1, 0.1); return m }

    // Cave: a big inverted hemisphere and a floor.
    const cave = MeshBuilder.CreateSphere('cave', { diameter: 30, segments: 12, sideOrientation: Mesh.BACKSIDE, slice: 0.55 }, scene)
    cave.material = mat(dark ? new Color3(0, 0.15, 0.06) : new Color3(0.25, 0.2, 0.22))
    const floor = MeshBuilder.CreateDisc('floor', { radius: 15, tessellation: 40 }, scene)
    floor.rotation.x = Math.PI / 2
    floor.material = mat(dark ? new Color3(0, 0.1, 0.04) : new Color3(0.3, 0.24, 0.2))
    // Hoard.
    const goldM = mat(new Color3(0.95, 0.75, 0.2), new Color3(0.3, 0.2, 0))
    const hoard = MeshBuilder.CreateSphere('hoard', { diameter: 5, slice: 0.5 }, scene)
    hoard.material = goldM; hoard.scaling.y = 0.35
    // Dragon.
    const dragon = new Mesh('dragon', scene)
    const scale = dark ? new Color3(0, 0.7, 0.3) : new Color3(0.55, 0.12, 0.18)
    const dM = mat(scale, scale.scale(0.25))
    const body = MeshBuilder.CreateSphere('b', { diameter: 3, segments: 16 }, scene); body.scaling = new Vector3(1.4, 0.8, 1); body.position.y = 1.4; body.material = dM; body.parent = dragon
    const head = MeshBuilder.CreateSphere('hd', { diameter: 1.4 }, scene); head.position = new Vector3(2.1, 2.2, 0); head.scaling.x = 1.4; head.material = dM; head.parent = dragon
    const eyeM = mat(new Color3(1, 0.9, 0.2), new Color3(1, 0.7, 0))
    for (const z of [-0.35, 0.35]) { const eye = MeshBuilder.CreateSphere('e', { diameter: 0.22 }, scene); eye.position = new Vector3(2.6, 2.45, z); eye.material = eyeM; eye.parent = dragon }
    for (const z of [-1, 1]) {
      const wing = MeshBuilder.CreateDisc('w', { radius: 1.8, tessellation: 3 }, scene)
      wing.position = new Vector3(-0.3, 2.3, z * 0.9); wing.rotation = new Vector3(z * 1.1, 0, 0.4); wing.material = mat(scale.scale(0.7)); wing.material.backFaceCulling = false; wing.parent = dragon
    }
    const tail = MeshBuilder.CreateTube('t', { path: [new Vector3(-1.8, 1, 0), new Vector3(-3, 0.5, 1.2), new Vector3(-2.5, 0.3, 2.6), new Vector3(-0.8, 0.2, 3)], radius: 0.3, tessellation: 8 }, scene)
    tail.material = dM; tail.parent = dragon

    // Crystals on the walls.
    const crystals: Mesh[] = []
    const cM = mat(new Color3(0.4, 0.9, 1), new Color3(0.2, 0.6, 0.9))
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * 0.15 + (i / 8) * Math.PI * 0.7
      const c = MeshBuilder.CreateCylinder('crystal', { height: 1.6, diameterTop: 0, diameterBottom: 0.7, tessellation: 6 }, scene)
      c.position = new Vector3(Math.cos(a + Math.PI) * 11, 0.8 + (i % 3) * 1.4, Math.sin(a + Math.PI) * -6 - 2)
      c.rotation.z = (Math.random() - 0.5) * 0.6
      c.material = cM
      c.metadata = { crystal: true, cool: 0 }
      crystals.push(c)
    }
    const s = { coins: 0, debt: START_DEBT, pick: 1, moon: 1, paid: 0, running: true, mined: 0 }
    const sync = () => setHud({ coins: Math.floor(s.coins), debt: Math.ceil(s.debt), pick: s.pick, moon: s.moon, paid: Math.floor(s.paid) })
    const burst = (from: Vector3, to: Vector3, n: number) => {
      for (let k = 0; k < Math.min(10, n); k++) {
        const coin = MeshBuilder.CreateCylinder('coin', { diameter: 0.3, height: 0.05 }, scene)
        coin.material = goldM
        coin.position = from.clone()
        let t = 0
        const ctrl = from.add(to).scale(0.5).add(new Vector3((Math.random() - 0.5) * 3, 3 + Math.random() * 2, (Math.random() - 0.5) * 3))
        const obs = scene.onBeforeRenderObservable.add(() => {
          t += 0.035
          const a = from.scale((1 - t) * (1 - t)), b = ctrl.scale(2 * (1 - t) * t), c = to.scale(t * t)
          coin.position = a.add(b).add(c); coin.rotation.x += 0.3
          if (t >= 1) { scene.onBeforeRenderObservable.remove(obs); coin.dispose() }
        })
      }
    }
    const size = () => 0.6 + Math.sqrt(s.debt / START_DEBT) * 0.6
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERTAP || !s.running) return
      // Forgiving taps: the nearest crystal on screen within ~48px.
      const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      const px = scene.pointerX * (engine.getRenderWidth() / cv.clientWidth), py = scene.pointerY * (engine.getRenderHeight() / cv.clientHeight)
      let m: Mesh | null = null, bestD = 48 * (engine.getRenderWidth() / cv.clientWidth)
      for (const c of crystals) {
        const p = Vector3.Project(c.getAbsolutePosition(), Matrix.Identity(), scene.getTransformMatrix(), vp)
        const d = Math.hypot(p.x - px, p.y - py)
        if (d < bestD) { bestD = d; m = c }
      }
      if (!m) return
      s.coins += s.pick; s.mined += s.pick
      burst(m.position, new Vector3(0, 0.5, 4), s.pick)
      m.scaling = new Vector3(1.25, 0.8, 1.25)
      sync()
    })
    api.current.feed = () => {
      if (!s.running || s.coins < 1) return
      const n = Math.min(s.coins, s.debt)
      s.debt -= n; s.paid += n; s.coins -= n
      burst(new Vector3(0, 0.5, 4), head.getAbsolutePosition(), Math.ceil(n))
      if (s.debt <= 0.5) {
        s.running = false
        const score = Math.max(50, 400 - s.moon * 12) + Math.floor(s.coins)
        const record = submitRef.current(score)
        setResult({ headline: 'The dragon flies off!', lines: [`Hoard cleared by moon ${s.moon}`, `${Math.floor(s.paid)} coins fed in total`, `${s.mined} coins mined`, `Score ${score}`], record })
      }
      sync()
    }
    api.current.upgrade = () => {
      const cost = s.pick * 12
      if (!s.running || s.coins < cost) return
      s.coins -= cost; s.pick++
      sync()
    }
    const moon = setInterval(() => {
      if (!s.running) return
      s.moon++
      s.debt *= RATE
      if (s.debt > CAVE) {
        s.running = false
        const record = submitRef.current(Math.floor(s.paid))
        setResult({ headline: 'The dragon woke up…', lines: [`It grew to ${Math.ceil(s.debt)} coins`, `You fed it ${Math.floor(s.paid)}`, `Score ${Math.floor(s.paid)}`], record })
      }
      sync()
    }, MOON_MS)
    let t = 0
    scene.onBeforeRenderObservable.add(() => {
      t += engine.getDeltaTime() / 1000
      const k = size()
      const cur = dragon.scaling.x
      const nk = cur + (k - cur) * 0.08
      dragon.scaling = new Vector3(nk, nk, nk)
      body.scaling.y = 0.8 + Math.sin(t * 1.4) * 0.05 // breathing
      fire.intensity = 0.6 + Math.sin(t * 7) * 0.08
      crystals.forEach((c) => { c.scaling = Vector3.Lerp(c.scaling, Vector3.One(), 0.15) })
      cam.alpha += 0.0005
    })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    sync()
    return () => { clearInterval(moon); window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const pct = Math.min(100, (hud.debt / CAVE) * 100)
  return (
    <GameShell title="Debt Dragon" score={hud.paid} best={best} result={result} onRestart={restart}
      hint={`Tap crystals to mine · moon ${hud.moon} · the dragon grows 7% each moon · it wakes at ${CAVE}`}>
      <div ref={host} />
      <div className="cf-tray">
        <span className="dd-meter"><i style={{ width: `${pct}%` }} />dragon {hud.debt}</span>
        <span>💰 {hud.coins}</span>
        <button type="button" className="cf-match" disabled={hud.coins < 1} onClick={() => api.current.feed()}>Feed the dragon</button>
        <button type="button" disabled={hud.coins < hud.pick * 12} onClick={() => api.current.upgrade()}>⛏ Better pick ({hud.pick * 12})</button>
      </div>
    </GameShell>
  )
}
