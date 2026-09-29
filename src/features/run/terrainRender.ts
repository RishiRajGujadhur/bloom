import chroma from 'chroma-js'
import type { SceneFactory } from '../../platform/offscreen'
import type { Pt } from './runModel'
import { toLocal, type Profile } from './terrainModel'

/**
 * Terrain Replay's 3D scene as a portable factory (worker on an OffscreenCanvas,
 * or the main thread): the route raised on a curtain of its own elevation,
 * coloured by speed, with a runner orb and three cameras.
 * Messages: 'progress' 0..1, 'cam' 'chase' | 'orbit' | 'top'.
 */
export type Cam = 'chase' | 'orbit' | 'top'
export type TerrainData = { points: Pt[]; prof: Profile }
const heat = chroma.scale(['#3b82f6', '#22d3ee', '#a3e635', '#facc15', '#f97316', '#ef4444']).mode('lab')

export function speedColors(p: Profile) {
  const s = [...p.speed].filter((v) => v > 0).sort((a, b) => a - b)
  const lo = s[Math.floor(s.length * 0.05)] ?? 0
  const hi = s[Math.floor(s.length * 0.95)] ?? 1
  return p.speed.map((v) => heat(Math.max(0, Math.min(1, (v - lo) / Math.max(0.1, hi - lo)))))
}

export const createTerrainScene: SceneFactory<TerrainData> = async (canvas, o) => {
  const THREE = await import('three/webgpu')
  const { points, prof } = o.data
  const run = { points }
  const renderer = new THREE.WebGPURenderer({ canvas: canvas as HTMLCanvasElement, antialias: true, alpha: true })
  renderer.setPixelRatio(o.dpr)
  renderer.setSize(o.width, o.height, false)
  await renderer.init()
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x060b18, 30, 70)
  const camera = new THREE.PerspectiveCamera(50, o.width / o.height, 0.1, 200)
  // Fit the route into ~24 units; exaggerate height so hills read clearly.
  const loc = toLocal(run.points)
  const span = Math.max(...loc.map((p) => Math.abs(p.x)), ...loc.map((p) => Math.abs(p.z)), 1)
  const k = 12 / span
  const eRange = Math.max(10, prof.maxEle - prof.minEle)
  const hOf = (e: number) => 0.4 + ((e - prof.minEle) / eRange) * 5
  const P = loc.map((p, i) => new THREE.Vector3(p.x * k, hOf(prof.ele[i]), p.z * k))
  const cols = speedColors(prof)

  // Curtain: a wall from the ground up to the route, coloured by speed.
  const n = P.length
  const pos = new Float32Array(n * 2 * 3)
  const col = new Float32Array(n * 2 * 3)
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    const c = cols[i].gl()
    pos.set([P[i].x, 0, P[i].z, P[i].x, P[i].y, P[i].z], i * 6)
    col.set([c[0] * 0.15, c[1] * 0.15, c[2] * 0.25, c[0], c[1], c[2]], i * 6)
    if (i < n - 1) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2)
  }
  const cg = new THREE.BufferGeometry()
  cg.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  cg.setAttribute('color', new THREE.BufferAttribute(col, 3))
  cg.setIndex(idx)
  const curtain = new THREE.Mesh(cg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false }))
  scene.add(curtain)
  // Glowing tube along the top.
  const curve = new THREE.CatmullRomCurve3(P)
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.min(1500, n * 2), 0.07, 6, false), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  scene.add(tube)
  // Ground shadow of the route and a glowing grid.
  const shadow = new THREE.Line(new THREE.BufferGeometry().setFromPoints(P.map((p) => new THREE.Vector3(p.x, 0.01, p.z))), new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35 }))
  scene.add(shadow)
  const grid = new THREE.GridHelper(60, 60, 0x1e3a8a, 0x0f1f45)
  scene.add(grid)

  // The runner: a bright orb with a halo.
  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }))
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.25, depthWrite: false }))
  runner.add(halo)
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.6 }))
  scene.add(runner, beam)

  let mode: Cam = 'chase'
  let prog = 0
  const eye = new THREE.Vector3(0, 18, 22)
  const look = new THREE.Vector3()
  const at = (p: number) => curve.getPointAt(Math.max(0, Math.min(1, p)))
  const place = () => {
    const p = at(prog)
    runner.position.copy(p)
    beam.position.set(p.x, p.y / 2, p.z)
    beam.scale.y = p.y
  }
    place()
  let raf = 0
  const t0 = performance.now()
  const loop = () => {
    const s = (performance.now() - t0) / 1000
    halo.scale.setScalar(1 + 0.25 * Math.sin(s * 5))
    const p = at(prog)
    let target: InstanceType<typeof THREE.Vector3>
    if (mode === 'chase') {
      const ahead = at(prog + 0.02)
      const back = p.clone().sub(ahead).setY(0).normalize()
      target = p.clone().add(back.multiplyScalar(5)).add(new THREE.Vector3(0, 3.2, 0))
      look.lerp(ahead, 0.08)
    } else if (mode === 'top') {
      target = new THREE.Vector3(p.x * 0.3, 30, p.z * 0.3 + 0.01)
      look.lerp(new THREE.Vector3(p.x * 0.3, 0, p.z * 0.3), 0.08)
    } else {
      const a = o.reducedMotion ? 0.6 : s * 0.12
      target = new THREE.Vector3(Math.cos(a) * 20, 14, Math.sin(a) * 20)
      look.lerp(new THREE.Vector3(0, 1.5, 0), 0.08)
    }
    eye.lerp(target, 0.06)
    camera.position.copy(eye)
    camera.lookAt(look)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
  return {
    backend,
    resize: (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() },
    message: (type, p) => {
      if (type === 'progress') { prog = p as number; place() }
      if (type === 'cam') mode = p as Cam
    },
    dispose: () => {
      cancelAnimationFrame(raf)
      scene.traverse((x) => (x as { geometry?: { dispose: () => void } }).geometry?.dispose())
      renderer.dispose()
    },
  }
}
