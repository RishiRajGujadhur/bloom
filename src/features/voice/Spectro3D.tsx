import { useEffect, useRef, useState } from 'react'
import chroma from 'chroma-js'
import gsap from 'gsap'

/**
 * The 3D spectral mountain: time runs away from you, pitch runs left to right,
 * loudness is height. Rendered by three.js's WebGPURenderer (WebGPU where the
 * browser has it, WebGL2 otherwise). Switching A/B morphs the terrain between
 * the original and the cleaned recording; a glowing playhead rides along.
 */
const COLS = 160
const ROWS = 64
const heat = chroma.scale(['#0b0420', '#3b0f70', '#8c2981', '#de4968', '#fe9f6d', '#fcfdbf']).mode('lab')
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function Spectro3D({ before, after, showAfter, progress }: { before: Uint8Array; after: Uint8Array | null; showAfter: boolean; progress: number }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ morph: (t: number) => void; setPlay: (p: number) => void } | null>(null)
  const [backend, setBackend] = useState('')

  useEffect(() => {
    const el = host.current
    if (!el) return
    let disposed = false
    let cleanup = () => {}
    void (async () => {
      const THREE = await import('three/webgpu')
      if (disposed) return
      const w = el.clientWidth || 600
      const h = el.clientHeight || 280
      const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setSize(w, h)
      await renderer.init()
      if (disposed) { renderer.dispose(); return }
      const isGpu = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true
      setBackend(isGpu ? 'WebGPU' : 'WebGL2')
      el.appendChild(renderer.domElement)
      renderer.domElement.setAttribute('data-matrix-native', '')
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100)
      camera.position.set(0, 5.2, 8.5)
      camera.lookAt(0, 0, -0.4)

      const geo = new THREE.PlaneGeometry(9, 6, ROWS - 1, COLS - 1)
      geo.rotateX(-Math.PI / 2)
      const pos = geo.attributes.position as InstanceType<typeof THREE.BufferAttribute>
      const colors = new Float32Array(pos.count * 3)
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      const a = new Float32Array(pos.count)
      const b = new Float32Array(pos.count)
      // PlaneGeometry vertices go row by row along its height (our time axis), columns along width (pitch).
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        const v = c * ROWS + r
        const src = (COLS - 1 - c) * ROWS + r
        a[v] = before[src] / 255
        b[v] = (after ?? before)[src] / 255
      }
      const lut = Array.from({ length: 256 }, (_, i) => heat(i / 255).gl())
      const morph = (t: number) => {
        for (let v = 0; v < pos.count; v++) {
          // Contrast curve: the quiet floor stays low, speech rises into peaks.
          const raw = a[v] + (b[v] - a[v]) * t
          const hgt = Math.max(0, (raw - 0.3) / 0.7)
          pos.setY(v, hgt * hgt * 2.6)
          const col = lut[Math.round(hgt * 255)]
          colors[v * 3] = col[0]; colors[v * 3 + 1] = col[1]; colors[v * 3 + 2] = col[2]
        }
        pos.needsUpdate = true
        ;(geo.attributes.color as InstanceType<typeof THREE.BufferAttribute>).needsUpdate = true
        geo.computeVertexNormals()
      }
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.1, flatShading: true }))
      scene.add(mesh)
      const wire = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 }))
      scene.add(wire)
      scene.add(new THREE.AmbientLight(0xffffff, 0.45))
      const sun = new THREE.DirectionalLight(0xffffff, 1.6)
      sun.position.set(-3, 6, 4)
      scene.add(sun)
      // Playhead: a thin glowing laser sheet sweeping through time.
      const head = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.7, 0.02), new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.22 }))
      const beam = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0xbffcff }))
      beam.position.y = 0.35
      head.add(beam)
      head.position.set(0, 0.35, 3)
      scene.add(head)

      const state = { t: 0 }
      morph(0)
      api.current = {
        morph: (t) => { if (reduced()) { state.t = t; morph(t) } else gsap.to(state, { t, duration: 1.1, ease: 'power3.inOut', onUpdate: () => morph(state.t) }) },
        setPlay: (p) => { head.position.z = 3 - p * 6 },
      }
      let raf = 0
      const start = performance.now()
      const loop = () => {
        const s = (performance.now() - start) / 1000
        if (!reduced()) { mesh.rotation.y = Math.sin(s * 0.15) * 0.18; wire.rotation.y = mesh.rotation.y; head.rotation.y = mesh.rotation.y }
        renderer.render(scene, camera)
        raf = requestAnimationFrame(loop)
      }
      loop()
      const ro = new ResizeObserver(() => {
        const W = el.clientWidth, H = el.clientHeight
        if (!W || !H) return
        renderer.setSize(W, H)
        camera.aspect = W / H
        camera.updateProjectionMatrix()
      })
      ro.observe(el)
      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        geo.dispose()
        renderer.dispose()
        renderer.domElement.remove()
        api.current = null
      }
    })()
    return () => { disposed = true; cleanup() }
  }, [before, after])

  useEffect(() => { api.current?.morph(showAfter && after ? 1 : 0) }, [showAfter, after])
  useEffect(() => { api.current?.setPlay(progress) }, [progress])

  return (
    <div className="sl-mountain" role="img" aria-label={`3D spectrogram of the ${showAfter && after ? 'cleaned' : 'original'} recording`}>
      {/* three.js owns this node; React never touches its children. */}
      <div ref={host} className="sl-canvas-host" />
      {backend ? <span className="sl-backend">{backend}</span> : null}
    </div>
  )
}
