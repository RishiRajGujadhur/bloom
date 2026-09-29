import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import chroma from 'chroma-js'
import type { SceneFactory } from '../../platform/offscreen'
import type { FileStat } from './cityModel'

/**
 * The code city as a portable scene (worker on an OffscreenCanvas, or main
 * thread). Every file is a building laid out by folder with a squarified
 * treemap; footprint = size, height = changes, colour = late-night share.
 * Pointer input arrives as messages; hover results are posted back.
 */
type Node = { name: string; children?: Node[]; file?: FileStat }
const heat = chroma.scale(['#3b82f6', '#8b5cf6', '#ec4899', '#f97316']).mode('lch')

function tree(files: FileStat[]): Node {
  const root: Node = { name: '', children: [] }
  for (const f of files) {
    let n = root
    const parts = f.path.split('/')
    parts.forEach((p, i) => {
      if (i === parts.length - 1) { n.children!.push({ name: p, file: f }); return }
      let c = n.children!.find((x) => x.name === p && x.children)
      if (!c) { c = { name: p, children: [] }; n.children!.push(c) }
      n = c
    })
  }
  return root
}

export const createCityScene: SceneFactory<FileStat[]> = async (canvas, o) => {
  const THREE = await import('three/webgpu')
  const files = o.data
  const renderer = new THREE.WebGPURenderer({ canvas: canvas as HTMLCanvasElement, antialias: true, alpha: true })
  renderer.setPixelRatio(o.dpr)
  renderer.setSize(o.width, o.height, false)
  await renderer.init()
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'
  const scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0x05060f, 60, 140)
  const camera = new THREE.PerspectiveCamera(42, o.width / o.height, 0.1, 400)

  const S = 60
  const root = hierarchy<Node>(tree(files)).sum((d) => (d.file ? Math.sqrt(d.file.size + 200) : 0)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  treemap<Node>().tile(treemapSquarify).size([S, S]).paddingInner(0.35).paddingOuter(0.6).paddingTop(0.6)(root)
  const maxChurn = Math.max(1, ...files.map((f) => f.churn))
  type R = { x0: number; x1: number; y0: number; y1: number; depth: number; data: Node }
  const leaves = root.leaves() as unknown as R[]
  const blocks = (root.descendants() as unknown as R[]).filter((d) => d.data.children && d.depth > 0)
  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const plates = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x1b2140, roughness: 0.9 }), Math.max(1, blocks.length))
  blocks.forEach((b, i) => {
    m.compose(new THREE.Vector3((b.x0 + b.x1) / 2 - S / 2, b.depth * 0.12, (b.y0 + b.y1) / 2 - S / 2), q, new THREE.Vector3(b.x1 - b.x0, 0.12, b.y1 - b.y0))
    plates.setMatrixAt(i, m)
  })
  scene.add(plates)
  const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.08 }), leaves.length)
  const heights = leaves.map((l) => 0.3 + Math.pow(l.data.file!.churn / maxChurn, 0.6) * 14)
  leaves.forEach((l, i) => {
    const f = l.data.file!
    const late = f.churn ? f.late / f.churn : 0
    towers.setColorAt(i, new THREE.Color(f.churn ? heat(Math.min(1, late * 2)).hex() : '#2a3050'))
  })
  const place = (k: number) => {
    leaves.forEach((l, i) => {
      const h = heights[i] * k + 0.01
      m.compose(new THREE.Vector3((l.x0 + l.x1) / 2 - S / 2, l.depth * 0.12 + h / 2, (l.y0 + l.y1) / 2 - S / 2), q, new THREE.Vector3(Math.max(0.15, l.x1 - l.x0), h, Math.max(0.15, l.y1 - l.y0)))
      towers.setMatrixAt(i, m)
    })
    towers.instanceMatrix.needsUpdate = true
  }
  place(o.reducedMotion ? 1 : 0)
  scene.add(towers, new THREE.HemisphereLight(0x9fb6ff, 0x0a0a1a, 1.1))
  const sun = new THREE.DirectionalLight(0xffffff, 2)
  sun.position.set(30, 60, 20)
  scene.add(sun)
  const grid = new THREE.GridHelper(120, 60, 0x1e2a5a, 0x10163a)
  grid.position.y = -0.01
  scene.add(grid)

  let yaw = 0.7
  let pitch = 0.62
  let dragging = false
  let lastX = 0
  let lastY = 0
  const ray = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let hovered = -2
  let raf = 0
  const t0 = performance.now()
  const loop = () => {
    const s = (performance.now() - t0) / 1000
    if (!o.reducedMotion && s < 1.8) place(1 - Math.pow(1 - Math.min(1, s / 1.6), 3))
    if (!dragging && !o.reducedMotion) yaw += 0.0015
    const dist = 78
    camera.position.set(Math.cos(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.sin(yaw) * Math.cos(pitch) * dist)
    camera.lookAt(0, 2, 0)
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
  return {
    backend,
    resize: (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() },
    message: (type, p) => {
      if (type !== 'pointer') return
      const e = p as { kind: string; x: number; y: number; w: number; h: number }
      if (e.kind === 'pointerdown') { dragging = true; lastX = e.x; lastY = e.y; return }
      if (e.kind === 'pointerup') { dragging = false; return }
      if (e.kind === 'pointerleave') { dragging = false; hovered = -2; o.post('hover', null); return }
      if (dragging) {
        yaw -= (e.x - lastX) * 0.006
        pitch = Math.max(0.2, Math.min(1.3, pitch + (e.y - lastY) * 0.004))
        lastX = e.x
        lastY = e.y
      }
      mouse.set((e.x / e.w) * 2 - 1, -(e.y / e.h) * 2 + 1)
      ray.setFromCamera(mouse, camera)
      const hit = ray.intersectObject(towers)[0]
      const id = hit?.instanceId ?? -1
      if (id !== hovered || id >= 0) {
        hovered = id
        o.post('hover', id >= 0 ? { f: leaves[id].data.file, x: e.x, y: e.y } : null)
      }
    },
    dispose: () => { cancelAnimationFrame(raf); renderer.dispose() },
  }
}
