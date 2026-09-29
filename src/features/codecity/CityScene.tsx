import { useEffect, useRef, useState } from 'react'
import { hierarchy, treemap, treemapSquarify } from 'd3-hierarchy'
import chroma from 'chroma-js'
import type { FileStat } from './cityModel'

/**
 * The city: every file is a building laid out by folder (a squarified
 * treemap, d3-hierarchy). Footprint = file size, height = how often it
 * changed, glow = how much of that happened late at night. One InstancedMesh
 * draws them all with three.js's WebGPURenderer; drag to orbit, hover to read.
 */
type Node = { name: string; children?: Node[]; file?: FileStat }
const heat = chroma.scale(['#3b82f6', '#8b5cf6', '#ec4899', '#f97316']).mode('lch')
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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

export function CityScene({ files }: { files: FileStat[] }) {
  const host = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<{ f: FileStat; x: number; y: number } | null>(null)
  const [backend, setBackend] = useState('')
  useEffect(() => {
    const el = host.current
    if (!el || !files.length) return
    let disposed = false
    let cleanup = () => {}
    void (async () => {
      const THREE = await import('three/webgpu')
      if (disposed) return
      const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(2, devicePixelRatio))
      renderer.setSize(el.clientWidth || 700, el.clientHeight || 420)
      await renderer.init()
      if (disposed) { renderer.dispose(); return }
      setBackend((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2')
      renderer.domElement.setAttribute('data-matrix-native', '')
      el.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x05060f, 60, 140)
      const camera = new THREE.PerspectiveCamera(42, (el.clientWidth || 700) / (el.clientHeight || 420), 0.1, 400)

      const S = 60
      const root = hierarchy<Node>(tree(files)).sum((d) => (d.file ? Math.sqrt(d.file.size + 200) : 0)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
      treemap<Node>().tile(treemapSquarify).size([S, S]).paddingInner(0.35).paddingOuter(0.6).paddingTop(0.6)(root)
      const maxChurn = Math.max(1, ...files.map((f) => f.churn))
      type R = { x0: number; x1: number; y0: number; y1: number; depth: number; data: Node }
      const leaves = root.leaves() as unknown as R[]
      const blocks = (root.descendants() as unknown as R[]).filter((d) => d.data.children && d.depth > 0)

      // District plates, one per folder, stepping up with depth.
      const plateGeo = new THREE.BoxGeometry(1, 1, 1)
      const plates = new THREE.InstancedMesh(plateGeo, new THREE.MeshStandardMaterial({ color: 0x1b2140, roughness: 0.9 }), blocks.length)
      const m = new THREE.Matrix4()
      blocks.forEach((b, i) => {
        m.compose(new THREE.Vector3((b.x0 + b.x1) / 2 - S / 2, b.depth * 0.12, (b.y0 + b.y1) / 2 - S / 2), new THREE.Quaternion(), new THREE.Vector3(b.x1 - b.x0, 0.12, b.y1 - b.y0))
        plates.setMatrixAt(i, m)
      })
      scene.add(plates)

      const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.2, emissive: 0xffffff, emissiveIntensity: 0.08 }), leaves.length)
      const heights: number[] = []
      leaves.forEach((l, i) => {
        const f = l.data.file!
        const h = 0.3 + Math.pow(f.churn / maxChurn, 0.6) * 14
        heights.push(h)
        const w = Math.max(0.15, l.x1 - l.x0)
        const d = Math.max(0.15, l.y1 - l.y0)
        m.compose(new THREE.Vector3((l.x0 + l.x1) / 2 - S / 2, l.depth * 0.12 + h / 2, (l.y0 + l.y1) / 2 - S / 2), new THREE.Quaternion(), new THREE.Vector3(w, h, d))
        towers.setMatrixAt(i, m)
        const lateShare = f.churn ? f.late / f.churn : 0
        towers.setColorAt(i, new THREE.Color(f.churn ? heat(Math.min(1, lateShare * 2)).hex() : '#2a3050'))
      })
      scene.add(towers)
      scene.add(new THREE.HemisphereLight(0x9fb6ff, 0x0a0a1a, 1.1))
      const sun = new THREE.DirectionalLight(0xffffff, 2)
      sun.position.set(30, 60, 20)
      scene.add(sun)
      const grid = new THREE.GridHelper(120, 60, 0x1e2a5a, 0x10163a)
      grid.position.y = -0.01
      scene.add(grid)

      // Buildings rise from the ground on load.
      const rise = { t: reduced() ? 1 : 0 }
      const base = new THREE.Matrix4()
      const applyRise = () => {
        leaves.forEach((l, i) => {
          const h = heights[i] * rise.t + 0.01
          base.compose(new THREE.Vector3((l.x0 + l.x1) / 2 - S / 2, l.depth * 0.12 + h / 2, (l.y0 + l.y1) / 2 - S / 2), new THREE.Quaternion(), new THREE.Vector3(Math.max(0.15, l.x1 - l.x0), h, Math.max(0.15, l.y1 - l.y0)))
          towers.setMatrixAt(i, base)
        })
        towers.instanceMatrix.needsUpdate = true
      }
      applyRise()

      let yaw = 0.7
      let pitch = 0.62
      let dragging = false
      let lastX = 0
      let lastY = 0
      const onDown = (e: PointerEvent) => { dragging = true; lastX = e.clientX; lastY = e.clientY }
      const onUp = () => { dragging = false }
      const ray = new THREE.Raycaster()
      const mouse = new THREE.Vector2()
      const onMove = (e: PointerEvent) => {
        if (dragging) {
          yaw -= (e.clientX - lastX) * 0.006
          pitch = Math.max(0.2, Math.min(1.3, pitch + (e.clientY - lastY) * 0.004))
          lastX = e.clientX
          lastY = e.clientY
        }
        const r = renderer.domElement.getBoundingClientRect()
        mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
        ray.setFromCamera(mouse, camera)
        const hit = ray.intersectObject(towers)[0]
        setHover(hit?.instanceId != null ? { f: leaves[hit.instanceId].data.file!, x: e.clientX - r.left, y: e.clientY - r.top } : null)
      }
      renderer.domElement.addEventListener('pointerdown', onDown)
      window.addEventListener('pointerup', onUp)
      renderer.domElement.addEventListener('pointermove', onMove)
      renderer.domElement.addEventListener('pointerleave', () => setHover(null))

      let raf = 0
      const t0 = performance.now()
      const loop = () => {
        const s = (performance.now() - t0) / 1000
        if (rise.t < 1) { rise.t = Math.min(1, s / 1.6); const e = 1 - Math.pow(1 - rise.t, 3); rise.t = e; applyRise(); rise.t = Math.min(1, s / 1.6) }
        if (!dragging && !reduced()) yaw += 0.0015
        const dist = 78
        camera.position.set(Math.cos(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.sin(yaw) * Math.cos(pitch) * dist)
        camera.lookAt(0, 2, 0)
        renderer.render(scene, camera)
        raf = requestAnimationFrame(loop)
      }
      loop()
      const ro = new ResizeObserver(() => {
        if (!el.clientWidth) return
        renderer.setSize(el.clientWidth, el.clientHeight)
        camera.aspect = el.clientWidth / el.clientHeight
        camera.updateProjectionMatrix()
      })
      ro.observe(el)
      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        window.removeEventListener('pointerup', onUp)
        renderer.dispose()
        renderer.domElement.remove()
      }
    })()
    return () => { disposed = true; cleanup() }
  }, [files])
  return (
    <div className="cc-scene" role="img" aria-label={`3D code city of ${files.length} files`}>
      <div ref={host} className="cc-canvas" />
      {backend ? <span className="cc-backend">{backend}</span> : null}
      {hover ? (
        <div className="cc-tip" style={{ left: hover.x + 14, top: hover.y + 10 }}>
          <b>{hover.f.path}</b>
          <span>{hover.f.churn} changes · {hover.f.churn ? Math.round((hover.f.late / hover.f.churn) * 100) : 0}% late-night · {(hover.f.size / 1024).toFixed(1)} KB</span>
        </div>
      ) : null}
    </div>
  )
}
