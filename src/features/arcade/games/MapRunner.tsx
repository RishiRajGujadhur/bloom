import { useCallback, useEffect, useRef, useState } from 'react'
import { ArcRotateCamera, Color3, Color4, DirectionalLight, Engine, HemisphericLight, Matrix, Mesh, MeshBuilder, PointerEventTypes, Scene, StandardMaterial, Vector3 } from '@babylonjs/core'
import { GameShell, useBest } from '../shell'

/**
 * Map Runner (Babylon.js): a little city on a grid. You need to get to the
 * pin. Tap intersections to plot a route — each block you walk costs a
 * minute; roadworks cost three; the bus line along the main road carries you
 * two blocks for a minute if you hop on at a stop. Plan the quickest route,
 * then go. Five errands.
 */
const N = 7, S = 3
const ERRANDS = 5
type P = [number, number]

export default function MapRunner() {
  const [best, submit] = useBest('maprun')
  const host = useRef<HTMLDivElement>(null)
  const [hud, setHud] = useState({ errand: 1, cost: 0, best: 0, msg: 'Tap intersections next to you to plot a route to the pin.' })
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ go: () => void; undo: () => void }>({ go: () => {}, undo: () => {} })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const cv = document.createElement('canvas'); cv.className = 'co-canvas'; el.appendChild(cv)
    const engine = new Engine(cv, true); engine.resize()
    const scene = new Scene(engine)
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.clearColor = dark ? new Color4(0, 0.06, 0.02, 1) : new Color4(0.85, 0.92, 0.97, 1)
    const c = ((N - 1) * S) / 2
    const cam = new ArcRotateCamera('c', -Math.PI / 2, 0.35, 28, new Vector3(c, 0, c), scene)
    cam.attachControl(cv, true); cam.lowerRadiusLimit = 18; cam.upperRadiusLimit = 34
    new HemisphericLight('h', new Vector3(0, 1, 0), scene).intensity = 0.8
    new DirectionalLight('d', new Vector3(-0.4, -1, 0.3), scene).intensity = 0.7
    const mat = (col: Color3, e?: Color3) => { const m = new StandardMaterial('m', scene); m.diffuseColor = col; if (e) m.emissiveColor = e; return m }
    const ground = MeshBuilder.CreateGround('g', { width: N * S + 4, height: N * S + 4 }, scene); ground.position = new Vector3(c, -0.05, c); ground.material = mat(dark ? new Color3(0, 0.2, 0.08) : new Color3(0.55, 0.6, 0.65))
    // Blocks of buildings between roads.
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < N - 1; j++) {
      const h = 0.4 + ((i * 7 + j * 13) % 5) * 0.25
      const b = MeshBuilder.CreateBox('b', { width: S - 0.9, depth: S - 0.9, height: h }, scene)
      b.position = new Vector3(i * S + S / 2, h / 2, j * S + S / 2)
      b.material = mat(Color3.FromHSV(((i * 40 + j * 70) % 360), 0.25, dark ? 0.35 : 0.9))
    }
    const BUS_ROW = 3
    const road = MeshBuilder.CreateGround('bus', { width: (N - 1) * S, height: 0.5 }, scene); road.position = new Vector3(c, 0.02, BUS_ROW * S); road.material = mat(new Color3(0.9, 0.3, 0.3), new Color3(0.3, 0.05, 0.05))
    const bus = MeshBuilder.CreateBox('busv', { width: 1.4, height: 0.7, depth: 0.7 }, scene); bus.material = mat(new Color3(0.95, 0.75, 0.1)); bus.position.y = 0.4
    const nodes: Mesh[][] = []
    for (let i = 0; i < N; i++) { nodes[i] = []; for (let j = 0; j < N; j++) { const d = MeshBuilder.CreateCylinder('n', { diameter: 0.5, height: 0.1 }, scene); d.position = new Vector3(i * S, 0.05, j * S); d.material = mat(new Color3(1, 1, 1)); d.metadata = { i, j }; nodes[i][j] = d } }
    const edgeKey = (a: P, b: P) => [a, b].sort((x, y) => x[0] - y[0] || x[1] - y[1]).map((p) => p.join(',')).join('|')
    const edgeCost = (a: P, b: P, works: Set<string>) => {
      const bus = a[1] === BUS_ROW && b[1] === BUS_ROW && Math.abs(a[0] - b[0]) === 1
      return works.has(edgeKey(a, b)) ? 3 : bus ? 0.5 : 1
    }
    const shortest = (from: P, to: P, works: Set<string>) => {
      const dist = new Map<string, number>([[from.join(','), 0]]); const q: P[] = [from]
      while (q.length) {
        q.sort((a, b) => dist.get(a.join(','))! - dist.get(b.join(','))!); const p = q.shift()!
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n: P = [p[0] + dx, p[1] + dy]; if (n[0] < 0 || n[1] < 0 || n[0] >= N || n[1] >= N) continue
          const d = dist.get(p.join(','))! + edgeCost(p, n, works)
          if (d < (dist.get(n.join(',')) ?? Infinity)) { dist.set(n.join(','), d); q.push(n) }
        }
      }
      return dist.get(to.join(','))!
    }
    const workMeshes: Mesh[] = []
    const pathMeshes: Mesh[] = []
    const me = MeshBuilder.CreateSphere('me', { diameter: 0.8 }, scene); me.material = mat(new Color3(0.2, 0.5, 1), new Color3(0.05, 0.15, 0.4))
    const pin = MeshBuilder.CreateCylinder('pin', { diameterTop: 0.9, diameterBottom: 0, height: 1.4 }, scene); pin.material = mat(new Color3(1, 0.2, 0.3), new Color3(0.4, 0.05, 0.1))
    const s = { errand: 0, route: [] as P[], works: new Set<string>(), goal: [0, 0] as P, optimal: 0, score: 0, lines: [] as string[], moving: false, running: true }
    const cost = () => { let t = 0; for (let i = 1; i < s.route.length; i++) t += edgeCost(s.route[i - 1], s.route[i], s.works); return t }
    const redraw = () => {
      pathMeshes.forEach((m) => m.dispose()); pathMeshes.length = 0
      for (let i = 1; i < s.route.length; i++) {
        const a = s.route[i - 1], b = s.route[i]
        const seg = MeshBuilder.CreateBox('p', { width: Math.abs(a[0] - b[0]) * S + 0.35, depth: Math.abs(a[1] - b[1]) * S + 0.35, height: 0.08 }, scene)
        seg.position = new Vector3(((a[0] + b[0]) / 2) * S, 0.12, ((a[1] + b[1]) / 2) * S); seg.material = mat(new Color3(0.2, 0.8, 0.4), new Color3(0.05, 0.3, 0.1)); pathMeshes.push(seg)
      }
      const last = s.route[s.route.length - 1]
      me.position = new Vector3(last[0] * S, 0.5, last[1] * S)
      setHud((h) => ({ ...h, cost: cost() }))
    }
    const setup = () => {
      workMeshes.forEach((m) => m.dispose()); workMeshes.length = 0; s.works.clear()
      const start: P = [Math.floor(Math.random() * 2), Math.floor(Math.random() * N)]
      s.goal = [N - 1 - Math.floor(Math.random() * 2), Math.floor(Math.random() * N)]
      for (let k = 0; k < 7; k++) {
        const a: P = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]
        const b: P = Math.random() < 0.5 ? [Math.min(N - 1, a[0] + 1), a[1]] : [a[0], Math.min(N - 1, a[1] + 1)]
        if (a[0] === b[0] && a[1] === b[1]) continue
        s.works.add(edgeKey(a, b))
        const cone = MeshBuilder.CreateCylinder('w', { diameterTop: 0, diameterBottom: 0.6, height: 0.9 }, scene)
        cone.position = new Vector3(((a[0] + b[0]) / 2) * S, 0.45, ((a[1] + b[1]) / 2) * S); cone.material = mat(new Color3(1, 0.5, 0), new Color3(0.3, 0.12, 0)); workMeshes.push(cone)
      }
      s.route = [start]; s.optimal = shortest(start, s.goal, s.works)
      pin.position = new Vector3(s.goal[0] * S, 0.9, s.goal[1] * S)
      redraw()
      setHud({ errand: s.errand + 1, cost: 0, best: s.optimal, msg: 'Tap intersections next to you to plot a route to the pin.' })
    }
    setup()
    scene.onPointerObservable.add((pi) => {
      if (pi.type !== PointerEventTypes.POINTERTAP || s.moving || !s.running) return
      const vp = cam.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight())
      const k = engine.getRenderWidth() / cv.clientWidth
      let bestN: P | null = null, bestD = 40 * k
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const sp = Vector3.Project(nodes[i][j].position, Matrix.Identity(), scene.getTransformMatrix(), vp); const d = Math.hypot(sp.x - scene.pointerX * k, sp.y - scene.pointerY * k); if (d < bestD) { bestD = d; bestN = [i, j] } }
      if (!bestN) return
      const last = s.route[s.route.length - 1]
      if (Math.abs(last[0] - bestN[0]) + Math.abs(last[1] - bestN[1]) !== 1) { setHud((h) => ({ ...h, msg: 'Pick a crossroads right next to where you are.' })); return }
      if (s.route.length > 1 && s.route[s.route.length - 2].join() === bestN.join()) s.route.pop(); else s.route.push(bestN)
      redraw()
    })
    api.current.undo = () => { if (s.route.length > 1 && !s.moving) { s.route.pop(); redraw() } }
    api.current.go = () => {
      const last = s.route[s.route.length - 1]
      if (s.moving || last.join() !== s.goal.join()) { setHud((h) => ({ ...h, msg: 'Your route has to end at the red pin.' })); return }
      const c2 = cost()
      const pts = Math.max(5, Math.round(40 - (c2 - s.optimal) * 10))
      s.score += pts; s.lines.push(`Errand ${s.errand + 1}: ${c2} min (best ${s.optimal})`)
      setHud((h) => ({ ...h, msg: c2 <= s.optimal ? 'The quickest route! 🏃' : `Made it — ${c2 - s.optimal} min slower than the best route.` }))
      s.errand++
      setTimeout(() => {
        if (s.errand >= ERRANDS) { s.running = false; const record = submitRef.current(s.score); setResult({ headline: 'Errands done around town', lines: [...s.lines.slice(-3), `Score ${s.score}`], record }) }
        else setup()
      }, 1200)
    }
    let t = 0
    scene.onBeforeRenderObservable.add(() => { t += engine.getDeltaTime() / 1000; bus.position.x = ((t * 3) % ((N - 1) * S)); bus.position.z = BUS_ROW * S; pin.rotation.y += 0.03 })
    engine.runRenderLoop(() => scene.render())
    const onResize = () => engine.resize(); window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); scene.dispose(); engine.dispose(); el.replaceChildren() }
  }, [round])

  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  return (
    <GameShell title="Map Runner" score={hud.errand * 10} best={best} result={result} onRestart={restart}
      hint={`Errand ${hud.errand}/${ERRANDS} · walking 1 min a block, 🚧 roadworks 3, red bus road ½ · your route: ${hud.cost} min · ${hud.msg}`}>
      <div ref={host} />
      <div className="cf-tray">
        <button type="button" onClick={() => api.current.undo()}>↶ Undo step</button>
        <button type="button" className="cf-match" onClick={() => api.current.go()}>🏃 Go!</button>
      </div>
    </GameShell>
  )
}
