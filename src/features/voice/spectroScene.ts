import chroma from 'chroma-js'
import type { SceneFactory } from '../../platform/offscreen'

/**
 * The spectral mountain scene, written against a bare canvas so it runs the
 * same on the main thread or inside a worker on an OffscreenCanvas.
 * Messages: 'data' {before, after}, 'morph' 0..1, 'play' 0..1.
 */
const COLS = 160
const ROWS = 64
const heat = chroma.scale(['#0b0420', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']).mode('lab')
const lut = Array.from({ length: 256 }, (_, i) => heat(i / 255).gl())

export type SpectroData = { before: Uint8Array; after: Uint8Array | null }

export const createSpectroScene: SceneFactory<SpectroData> = async (canvas, o) => {
  const THREE = await import('three/webgpu')
  const renderer = new THREE.WebGPURenderer({ canvas: canvas as HTMLCanvasElement, antialias: true, alpha: true })
  renderer.setPixelRatio(o.dpr)
  renderer.setSize(o.width, o.height, false)
  await renderer.init()
  const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(38, o.width / o.height, 0.1, 100)
  camera.position.set(0, 5.2, 8.5)
  camera.lookAt(0, 0, -0.4)

  const geo = new THREE.PlaneGeometry(9, 6, ROWS - 1, COLS - 1)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position as InstanceType<typeof THREE.BufferAttribute>
  const colors = new Float32Array(pos.count * 3)
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const a = new Float32Array(pos.count)
  const b = new Float32Array(pos.count)
  const load = (d: SpectroData) => {
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
      const v = c * ROWS + r
      const src = (COLS - 1 - c) * ROWS + r
      a[v] = d.before[src] / 255
      b[v] = (d.after ?? d.before)[src] / 255
    }
  }
  let t = 0
  let target = 0
  const morph = (k: number) => {
    for (let v = 0; v < pos.count; v++) {
      const raw = a[v] + (b[v] - a[v]) * k
      const h = Math.max(0, (raw - 0.3) / 0.7)
      pos.setY(v, h * h * 2.6)
      const col = lut[Math.round(h * 255)]
      colors[v * 3] = col[0]
      colors[v * 3 + 1] = col[1]
      colors[v * 3 + 2] = col[2]
    }
    pos.needsUpdate = true
    ;(geo.attributes.color as InstanceType<typeof THREE.BufferAttribute>).needsUpdate = true
    geo.computeVertexNormals()
  }
  load(o.data)
  morph(0)
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1, flatShading: true }))
  const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 }))
  scene.add(mesh, wire, new THREE.AmbientLight(0xffffff, 0.45))
  const sun = new THREE.DirectionalLight(0xffffff, 1.6)
  sun.position.set(-3, 6, 4)
  scene.add(sun)
  const head = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.7, 0.02), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.22 }))
  const beam = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0xbffcff }))
  beam.position.y = 0.35
  head.add(beam)
  head.position.set(0, 0.35, 3)
  scene.add(head)

  let raf = 0
  const start = performance.now()
  const loop = () => {
    const s = (performance.now() - start) / 1000
    // Ease the morph towards its target (≈ a 1 s power ease).
    if (Math.abs(target - t) > 0.002) { t += (target - t) * (o.reducedMotion ? 1 : 0.08); morph(t) }
    if (!o.reducedMotion) { mesh.rotation.y = Math.sin(s * 0.15) * 0.18; wire.rotation.y = mesh.rotation.y; head.rotation.y = mesh.rotation.y }
    renderer.render(scene, camera)
    raf = requestAnimationFrame(loop)
  }
  loop()
  return {
    backend,
    resize: (w, h) => { renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix() },
    message: (type, p) => {
      if (type === 'data') { load(p as SpectroData); morph(t) }
      if (type === 'morph') target = p as number
      if (type === 'play') head.position.z = 3 - (p as number) * 6
    },
    dispose: () => { cancelAnimationFrame(raf); geo.dispose(); renderer.dispose() },
  }
}
