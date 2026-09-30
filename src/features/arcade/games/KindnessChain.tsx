import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Color3, Color4, Engine, GlowLayer, HemisphericLight, Matrix, Mesh, MeshBuilder, ParticleSystem, PointerEventTypes, Scene, StandardMaterial, Texture, Vector3 } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Kindness Chain (Babylon.js): a grey, busy town square. You hold a small warm
 * light. Tap someone close enough to pass it on — they glow, and they can pass
 * it too. The light fades if it sits still for too long, so keep the chain
 * moving and light up the whole square.
 */
const PEOPLE = 34
const TIME = 70

export default function KindnessChain() {
  const [best, submit] = useBest('kindness')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ lit: 1, warmth: 100, t: TIME })
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
    scene.clearColor = dark ? new Color4(0, 0.05, 0.02, 1) : new Color4(0.16, 0.17, 0.22, 1)
    const cam = new ArcRotateCamera('c', -Math.PI / 2, 0.85, 30, Vector3.Zero(), scene)
    cam.lowerRadiusLimit = 22; cam.upperRadiusLimit = 40; cam.upperBetaLimit = 1.2
    cam.attachControl(cv, true)
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.95
    const glow = new GlowLayer('g', scene); glow.intensity = 1.1
    const mat = (c: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = c; if (e) m.emissiveColor = e; m.specularColor = Color3.Black(); return m }
    const square = MeshBuilder.CreateDisc('sq', { radius: 16, tessellation: 64 }, scene)
    square.rotation.x = Math.PI / 2
    square.material = mat(dark ? new Color3(0, 0.12, 0.05) : new Color3(0.32, 0.33, 0.38))
    const fountain = MeshBuilder.CreateCylinder('f', { diameter: 3, height: 0.8 }, scene); fountain.position.y = 0.4; fountain.material = mat(new Color3(0.5, 0.52, 0.58))
    const greyM = mat(new Color3(0.45, 0.46, 0.5))
    const warmM = mat(new Color3(1, 0.75, 0.35), new Color3(1, 0.55, 0.15))
    type P = { body: Mesh; head: Mesh; lit: boolean; v: Vector3 }
    const people: P[] = []
    for (let i = 0; i < PEOPLE; i++) {
      const a = Math.random() * Math.PI * 2, r = 3.5 + Math.random() * 11
      const body = MeshBuilder.CreateCapsule('p', { radius: 0.35, height: 1.4 }, scene)
      body.position = new Vector3(Math.cos(a) * r, 0.7, Math.sin(a) * r)
      body.material = greyM
      const head = MeshBuilder.CreateSphere('h', { diameter: 0.5 }, scene)
      head.parent = body; head.position.y = 0.95; head.material = greyM
      body.metadata = { person: i }; head.metadata = { person: i }
      people.push({ body, head, lit: false, v: new Vector3((Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2) })
    }
    // The light you carry: an orb with a spark trail.
    const orb = MeshBuilder.CreateSphere('orb', { diameter: 0.55 }, scene)
    orb.material = mat(new Color3(1, 0.85, 0.4), new Color3(1, 0.8, 0.3))
    const ps = new ParticleSystem('sparks', 400, scene)
    const tex = document.createElement('canvas'); tex.width = tex.height = 32
    const tg = tex.getContext('2d')!; const rg = tg.createRadialGradient(16, 16, 0, 16, 16, 16); rg.addColorStop(0, '#fff'); rg.addColorStop(1, 'rgba(255,255,255,0)'); tg.fillStyle = rg; tg.fillRect(0, 0, 32, 32)
    ps.particleTexture = new Texture(tex.toDataURL(), scene)
    ps.emitter = orb
    ps.color1 = new Color4(1, 0.85, 0.4, 1); ps.color2 = new Color4(1, 0.5, 0.2, 1); ps.colorDead = new Color4(1, 0.3, 0.1, 0)
    ps.minSize = 0.08; ps.maxSize = 0.22; ps.minLifeTime = 0.3; ps.maxLifeTime = 0.8; ps.emitRate = 90
    ps.direction1 = new Vector3(-0.5, 1, -0.5); ps.direction2 = new Vector3(0.5, 1.5, 0.5); ps.minEmitPower = 0.3; ps.maxEmitPower = 0.8
    ps.blendMode = ParticleSystem.BLENDMODE_ADD
    ps.start()
    const s = { holder: 0, warmth: 100, t: TIME, running: true, passes: 0, fly: null as null | { from: Vector3; to: number; t: number } }
    people[0].lit = true; people[0].body.material = warmM; people[0].head.material = warmM
    const REACH = 5.5
    const ring = MeshBuilder.CreateTorus('ring', { diameter: REACH * 2, thickness: 0.05, tessellation: 64 }, scene)
    ring.material = mat(new Color3(1, 0.8, 0.4), new Color3(0.6, 0.4, 0.1))
    const finish = () => {
      s.running = false
      const lit = people.filter((p) => p.lit).length
      const score = lit * 10 + (lit === PEOPLE ? Math.round(s.t) * 3 : 0)
      const record = submitRef.current(score)
      setResult({ headline: lit === PEOPLE ? 'The whole square is glowing!' : 'The light rests for tonight', lines: [`${lit} of ${PEOPLE} people lit up`, `${s.passes} passes`, `Score ${score}`], record })
    }
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERTAP || !s.running || s.fly) return
      const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      const k = engine.getRenderWidth() / cv.clientWidth
      const px = scene.pointerX * k, py = scene.pointerY * k
      let bestI = -1, bestD = 36 * k
      people.forEach((p, i) => {
        const sp = Vector3.Project(p.body.position, Matrix.Identity(), scene.getTransformMatrix(), vp)
        const d = Math.hypot(sp.x - px, sp.y - py)
        if (d < bestD) { bestD = d; bestI = i }
      })
      if (bestI < 0 || bestI === s.holder) return
      const dist = Vector3.Distance(people[bestI].body.position, people[s.holder].body.position)
      if (dist > REACH) return
      s.fly = { from: orb.position.clone(), to: bestI, t: 0 }
    })
    let hudT = 0
    scene.onBeforeRenderObservable.add(() => {
      const dt = engine.getDeltaTime() / 1000
      if (s.running) {
        s.t -= dt
        s.warmth = Math.max(0, s.warmth - dt * 9)
        if (s.warmth <= 0 || s.t <= 0 || people.every((p) => p.lit)) finish()
      }
      // People wander; lit people drift toward the unlit a little (kindness spreads).
      for (const p of people) {
        p.v.x += (Math.random() - 0.5) * dt * 2; p.v.z += (Math.random() - 0.5) * dt * 2
        p.v.scaleInPlace(0.98)
        p.body.position.addInPlace(p.v.scale(dt))
        const r = Math.hypot(p.body.position.x, p.body.position.z)
        if (r > 15 || r < 2.2) { p.v.x *= -1; p.v.z *= -1; p.body.position.x *= r > 15 ? 0.99 : 1.02; p.body.position.z *= r > 15 ? 0.99 : 1.02 }
        if (p.lit) p.body.scaling.y = 1 + Math.sin(performance.now() / 200 + p.body.position.x) * 0.04
      }
      const holder = people[s.holder]
      if (s.fly) {
        s.fly.t = Math.min(1, s.fly.t + dt * 2.5)
        const target = people[s.fly.to].body.position.add(new Vector3(0, 1.8, 0))
        const mid = Vector3.Lerp(s.fly.from, target, 0.5).add(new Vector3(0, 2.5, 0))
        const t = s.fly.t
        orb.position = s.fly.from.scale((1 - t) ** 2).add(mid.scale(2 * (1 - t) * t)).add(target.scale(t * t))
        if (t >= 1) {
          const p = people[s.fly.to]
          if (!p.lit) { p.lit = true; p.body.material = warmM; p.head.material = warmM; s.warmth = Math.min(100, s.warmth + 35) } else s.warmth = Math.min(100, s.warmth + 8)
          s.holder = s.fly.to; s.passes++; s.fly = null
        }
      } else orb.position = holder.body.position.add(new Vector3(0, 1.8 + Math.sin(performance.now() / 250) * 0.1, 0))
      ring.position = holder.body.position.add(new Vector3(0, 0.05, 0))
      ring.visibility = s.fly ? 0.2 : 0.8
      ps.emitRate = 30 + s.warmth
      orb.scaling.setAll(0.6 + s.warmth / 160)
      cam.alpha += 0.0005
      if ((hudT += dt) > 0.2) { hudT = 0; setHud({ lit: people.filter((p) => p.lit).length, warmth: Math.round(s.warmth), t: Math.max(0, Math.ceil(s.t)) }) }
    })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Kindness Chain" score={hud.lit * 10} best={best} result={result} onRestart={restart}
      hint={`Tap someone inside the glow ring to pass the light on · ${hud.lit}/${PEOPLE} glowing · warmth ${hud.warmth} · ${hud.t}s`}>
      <div ref={host} />
    </GameShell>
  )
}
