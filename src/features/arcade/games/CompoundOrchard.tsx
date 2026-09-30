import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Color3, Color4, DirectionalLight, Engine, HemisphericLight, Mesh, MeshBuilder, PointerEventTypes, Scene, ShadowGenerator, StandardMaterial, Vector3, Animation, CubicEase, EasingFunction } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Compound Orchard (Babylon.js): a floating island with sixteen plots. Seeds
 * cost two coins. Every season each tree grows by a fifth of its size, and the
 * fruit it drops on harvest matches its size. Trees grow old after twelve
 * seasons and wither if nobody harvests them. Twenty seasons per game.
 */
const SEASONS = 20
const SEASON_MS = 2600
const GROWTH = 1.2
const OLD = 12
const COST = 2
const N = 4

type Tree = { value: number; age: number; mesh: Mesh }

export default function CompoundOrchard() {
  const [best, submit] = useBest('orchard')
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState({ coins: 6, season: 1, trees: 0, lost: 0 })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const cv = canvas.current
    if (!cv) return
    const engine = new Engine(cv, true, { preserveDrawingBuffer: true, stencil: true })
    engine.resize()
    const scene = new Scene(engine)
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.clearColor = dark ? new Color4(0, 0.08, 0.03, 1) : new Color4(0.86, 0.93, 0.98, 1)
    const cam = new ArcRotateCamera('cam', -Math.PI / 4, 1.0, 17, new Vector3(0, 0, 0), scene)
    cam.lowerRadiusLimit = 12; cam.upperRadiusLimit = 24; cam.upperBetaLimit = 1.3
    cam.attachControl(cv, true)
    cam.wheelPrecision = 30
    new HemisphericLight('sky', new Vector3(0, 1, 0), scene).intensity = 0.45
    const sun = new DirectionalLight('sun', new Vector3(-0.6, -1, 0.4), scene)
    sun.position = new Vector3(10, 20, -8)
    sun.intensity = 0.9
    const shadows = new ShadowGenerator(1024, sun)
    shadows.useBlurExponentialShadowMap = true

    const mat = (name: string, c: Color3) => { const m = new StandardMaterial(name, scene); m.diffuseColor = c; m.specularColor = new Color3(0.05, 0.05, 0.05); return m }
    const grassM = mat('grass', dark ? new Color3(0, 0.5, 0.2) : new Color3(0.3, 0.52, 0.26))
    const soilM = mat('soil', new Color3(0.42, 0.28, 0.18))
    const soilHover = mat('soilHover', new Color3(0.6, 0.42, 0.26))
    const trunkM = mat('trunk', new Color3(0.45, 0.3, 0.18))
    const leafM = mat('leaf', dark ? new Color3(0, 0.9, 0.4) : new Color3(0.25, 0.62, 0.3))
    const oldM = mat('old', new Color3(0.78, 0.6, 0.25))
    const fruitM = mat('fruit', new Color3(0.93, 0.28, 0.24))
    fruitM.emissiveColor = new Color3(0.25, 0.05, 0.03)

    const island = MeshBuilder.CreateCylinder('island', { diameterTop: 13, diameterBottom: 7, height: 2.4, tessellation: 40 }, scene)
    island.position.y = -1.3
    island.material = mat('rock', new Color3(0.55, 0.47, 0.4))
    const top = MeshBuilder.CreateCylinder('top', { diameter: 13.2, height: 0.3, tessellation: 40 }, scene)
    top.position.y = 0
    top.material = grassM
    top.receiveShadows = true

    const plots: Mesh[] = []
    const trees: (Tree | null)[] = Array(N * N).fill(null)
    for (let i = 0; i < N * N; i++) {
      const p = MeshBuilder.CreateBox(`plot${i}`, { width: 1.9, depth: 1.9, height: 0.2 }, scene)
      p.position = new Vector3((i % N - 1.5) * 2.3, 0.2, (Math.floor(i / N) - 1.5) * 2.3)
      p.material = soilM
      p.receiveShadows = true
      p.metadata = { plot: i }
      plots.push(p)
    }

    const s = { coins: 6, season: 1, lost: 0, harvested: 0, running: true }
    const sync = () => setHud({ coins: Math.floor(s.coins), season: s.season, trees: trees.filter(Boolean).length, lost: s.lost })

    const pop = (m: Mesh, to: number) => {
      const a = new Animation('grow', 'scaling', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT)
      a.setKeys([{ frame: 0, value: m.scaling.clone() }, { frame: 24, value: new Vector3(to, to, to) }])
      const e = new CubicEase(); e.setEasingMode(EasingFunction.EASINGMODE_EASEOUT)
      a.setEasingFunction(e)
      scene.beginDirectAnimation(m, [a], 0, 24, false)
    }
    const makeTree = (i: number) => {
      const root = new Mesh(`tree${i}`, scene)
      const trunk = MeshBuilder.CreateCylinder('t', { diameterTop: 0.18, diameterBottom: 0.3, height: 1.2 }, scene)
      trunk.position.y = 0.6; trunk.material = trunkM; trunk.parent = root
      const crown = MeshBuilder.CreateSphere('c', { diameter: 1.4, segments: 10 }, scene)
      crown.position.y = 1.5; crown.material = leafM; crown.parent = root
      for (let f = 0; f < 5; f++) {
        const fr = MeshBuilder.CreateSphere('f', { diameter: 0.22 }, scene)
        const a = (f / 5) * Math.PI * 2
        fr.position = new Vector3(Math.cos(a) * 0.62, 1.35 + (f % 2) * 0.3, Math.sin(a) * 0.62)
        fr.material = fruitM; fr.parent = root
      }
      root.getChildMeshes().forEach((m) => { shadows.addShadowCaster(m); m.metadata = { plot: i } })
      root.position = plots[i].position.add(new Vector3(0, 0.1, 0))
      root.scaling = new Vector3(0.01, 0.01, 0.01)
      pop(root, 0.55)
      return root
    }
    const sizeFor = (v: number) => Math.min(1.5, 0.55 + Math.log(v) * 0.36)
    const burst = (at: Vector3, n: number) => {
      for (let k = 0; k < Math.min(12, n); k++) {
        const c = MeshBuilder.CreateCylinder('coin', { diameter: 0.35, height: 0.06 }, scene)
        const cm = mat('coinM', new Color3(0.98, 0.78, 0.2)); cm.emissiveColor = new Color3(0.3, 0.2, 0)
        c.material = cm
        c.position = at.add(new Vector3(0, 1.4, 0))
        const v = new Vector3((Math.random() - 0.5) * 0.12, 0.16 + Math.random() * 0.06, (Math.random() - 0.5) * 0.12)
        let life = 50
        const obs = scene.onBeforeRenderObservable.add(() => {
          v.y -= 0.009; c.position.addInPlace(v); c.rotation.x += 0.3
          if (--life <= 0) { scene.onBeforeRenderObservable.remove(obs); c.dispose(); cm.dispose() }
        })
      }
    }

    let hover: Mesh | null = null
    scene.onPointerObservable.add((pi) => {
      const pick = pi.pickInfo
      const i = pick?.pickedMesh?.metadata?.plot as number | undefined
      if (pi.type === PointerEventTypes.POINTERMOVE) {
        if (hover) hover.material = soilM
        hover = i != null ? plots[i] : null
        if (hover) hover.material = soilHover
        cv.style.cursor = i != null ? 'pointer' : 'grab'
      }
      if (pi.type !== PointerEventTypes.POINTERTAP || i == null || !s.running) return
      const t = trees[i]
      if (!t && s.coins >= COST) {
        s.coins -= COST
        trees[i] = { value: 1, age: 0, mesh: makeTree(i) }
      } else if (t) {
        const gain = Math.floor(t.value)
        s.coins += gain
        s.harvested += gain
        burst(t.mesh.position, gain)
        t.mesh.dispose()
        trees[i] = null
      }
      sync()
    })

    const tick = setInterval(() => {
      if (!s.running) return
      s.season++
      s.coins += 1 // a small allowance each season
      trees.forEach((t, i) => {
        if (!t) return
        t.age++
        t.value *= GROWTH
        if (t.age >= OLD) {
          const crown = t.mesh.getChildMeshes().find((m) => m.name === 'c')
          if (crown) crown.material = oldM
        }
        if (t.age >= OLD + 3) { s.lost += Math.floor(t.value); t.mesh.dispose(); trees[i] = null; return }
        pop(t.mesh, sizeFor(t.value))
      })
      if (s.season > SEASONS) {
        s.running = false
        s.season = SEASONS
        let standing = 0
        trees.forEach((t) => { if (t) standing += Math.floor(t.value) })
        const score = Math.floor(s.coins) + standing
        const record = submitRef.current(score)
        setResult({ headline: 'Harvest festival', lines: [`${Math.floor(s.coins)} coins in the basket`, `${standing} still hanging on trees`, `${s.lost} withered unpicked`, `Score ${score}`], record })
      }
      sync()
    }, SEASON_MS)

    // A slow drift around the island.
    scene.onBeforeRenderObservable.add(() => { cam.alpha += 0.0006 })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    sync()
    return () => { clearInterval(tick); window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const score = hud.coins
  return (
    <GameShell title="Compound Orchard" score={score} best={best} result={result} onRestart={restart}
      hint={`Season ${hud.season}/${SEASONS} · ${hud.coins} coins · click soil to plant (2 coins) · click a tree to harvest its fruit · +1 coin each season · old trees turn gold, then wither`}>
      <canvas key={round} ref={canvas} className="co-canvas" aria-label="Orchard island" />
    </GameShell>
  )
}
