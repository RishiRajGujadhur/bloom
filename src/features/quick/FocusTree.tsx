import { useEffect, useId, useRef } from 'react'
import gsap from 'gsap'
import type { BufferGeometry } from 'three'
import { prefersReducedMotion } from '../../utils/motion'
import './focusTree.css'

const clusters = [
  [0, 2.9, 0], [-.85, 2.6, .2], [.8, 2.65, -.1], [-1.2, 2.1, .1],
  [1.15, 2.05, .3], [-.6, 3.15, -.25], [.5, 3.25, .1], [0, 2.4, .65],
]
const random = (n: number) => { const v = Math.sin(n * 127.1) * 43758.5453; return v - Math.floor(v) }

/** A small, locally rendered blossom garden; SVG remains usable without WebGL. */
export function FocusTree({ progress, extra = 0 }: { progress: number; extra?: number }) {
  const root = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const growth = useRef({ value: 0 })
  const draw = useRef<(() => void) | null>(null)
  const id = useId().replace(/:/g, '')
  const fraction = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0

  useEffect(() => {
    const tween = gsap.to(growth.current, { value: fraction, duration: prefersReducedMotion() || document.documentElement.dataset.bloomMotion === 'paused' ? 0 : 1.1, ease: 'power2.out', onUpdate: () => draw.current?.() })
    return () => { tween.kill() }
  }, [fraction])

  useEffect(() => {
    const element = root.current
    const target = canvas.current
    if (!element || !target) return
    let disposed = false
    let cleanup = () => {}
    void import('three').then(THREE => {
      if (disposed) return
      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try { renderer = new THREE.WebGLRenderer({ canvas: target, alpha: true, antialias: true, powerPreference: 'low-power' }) }
      catch { return }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(35, 1.25, .1, 50)
      camera.position.set(5.4, 4.2, 7.5)
      camera.lookAt(0, 1.55, 0)
      scene.add(new THREE.HemisphereLight(0xfff7eb, 0x718454, 3))
      const sun = new THREE.DirectionalLight(0xffe9dd, 3.4)
      sun.position.set(-3, 6, 5)
      scene.add(sun)
      const garden = new THREE.Group()
      scene.add(garden)
      const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .86 })
      const bark = material(0xa77360)
      const grass = material(0xc2d583)
      const soil = material(0x8fae78)
      const rock = material(0xb1ad91)
      const leaf = material(0x92b765)
      const pink = [material(0xf2b7c8), material(0xf7d4de), material(0xda92ae)]
      const gold = material(0xf4ce8c)
      const mesh = (geometry: BufferGeometry, mat: InstanceType<typeof THREE.Material>, parent = garden) => {
        const item = new THREE.Mesh(geometry, mat)
        parent.add(item)
        return item
      }
      mesh(new THREE.CylinderGeometry(2, 1.85, .26, 6), soil).position.y = -.12
      mesh(new THREE.CylinderGeometry(2, 2, .09, 6), grass).position.y = .04
      const branch = (points: number[][], radius: number) => {
        const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p as [number, number, number])))
        mesh(new THREE.TubeGeometry(curve, 18, radius, 7, false), bark)
      }
      branch([[0, .12, 0], [-.25, .7, .1], [.05, 1.4, 0], [-.2, 2.1, -.1], [0, 2.95, 0]], .16)
      clusters.forEach(([x, y, z], i) => branch([[0, 1.1 + i % 3 * .25, 0], [x * .65, y - .65, z * .7], [x, y, z]], .065))
      for (let i = 0; i < 12; i++) {
        const angle = i * 2.4
        const distance = 1.1 + random(i + 3) * .65
        const stone = mesh(new THREE.DodecahedronGeometry(.13 + random(i + 2) * .17, 0), rock)
        stone.position.set(Math.cos(angle) * distance, .16, Math.sin(angle) * distance)
        stone.scale.y = .65
        stone.rotation.set(i, i * .3, i * .6)
        const sprout = mesh(new THREE.SphereGeometry(.1, 6, 4), leaf)
        sprout.position.copy(stone.position).add(new THREE.Vector3(.19, .05, .08))
        sprout.scale.set(.6, 2, .6)
      }
      // A miniature lantern anchors the quiet garden, as in the visual reference.
      const lantern = new THREE.Group()
      garden.add(lantern)
      lantern.position.set(1.12, .12, .55)
      mesh(new THREE.CylinderGeometry(.18, .24, .08, 8), rock, lantern)
      mesh(new THREE.CylinderGeometry(.07, .1, .3, 8), rock, lantern).position.y = .18
      mesh(new THREE.CylinderGeometry(.18, .18, .24, 8), gold, lantern).position.y = .43
      mesh(new THREE.ConeGeometry(.35, .15, 8), leaf, lantern).position.y = .64
      const crown = new THREE.Group()
      garden.add(crown)
      const flowerGeometry = new THREE.SphereGeometry(.13, 6, 4)
      const flowers: InstanceType<typeof THREE.Object3D>[] = []
      // Instance the petals: hundreds of blossoms need only four draw calls.
      const petals = pink.map(mat => new THREE.InstancedMesh(flowerGeometry, mat, 190))
      petals.forEach(item => crown.add(item))
      const centers = new THREE.InstancedMesh(new THREE.SphereGeometry(.032, 5, 4), gold, 112)
      crown.add(centers)
      const petalTransforms = Array.from({ length: 5 }, (_, petal) => new THREE.Matrix4().compose(
        new THREE.Vector3(Math.cos(petal * Math.PI * .4) * .105, Math.sin(petal * Math.PI * .4) * .105, 0),
        new THREE.Quaternion(), new THREE.Vector3(1, 1, .48)))
      const centerTransform = new THREE.Matrix4().makeTranslation(0, 0, .03)
      const matrix = new THREE.Matrix4()
      for (let i = 0; i < 112; i++) {
        const center = clusters[i % clusters.length]
        const angle = random(i + 15) * Math.PI * 2
        const height = random(i + 45) * 2 - 1
        const radius = Math.sqrt(1 - height * height) * (.32 + random(i + 99) * .24)
        const bloom = new THREE.Object3D()
        bloom.position.set(center[0] + Math.cos(angle) * radius, center[1] + height * .45, center[2] + Math.sin(angle) * radius)
        bloom.rotation.set(random(i) * 2, random(i + 10) * 3, random(i + 20) * 2)
        flowers.push(bloom)
      }
      const petalGeometry = new THREE.SphereGeometry(.045, 5, 3)
      const drifting = Array.from({ length: 9 }, (_, i) => {
        const petal = mesh(petalGeometry, pink[i % 3])
        petal.scale.set(1, .4, .7)
        return petal
      })
      let frame = 0
      let last = 0
      let visible = true
      let reduced = false
      let contextLost = false
      let elapsed = 0
      const media = window.matchMedia('(prefers-reduced-motion: reduce)')
      let renderedGrowth = -1
      const render = () => {
        if (contextLost || disposed) return
        if (renderedGrowth !== growth.current.value) {
          renderedGrowth = growth.current.value
          const counts = [0, 0, 0]
          flowers.forEach((flower, i) => {
            flower.scale.setScalar(.75 + .45 * Math.max(0, Math.min(1, renderedGrowth * 1.6 - i / flowers.length * .6)))
            flower.updateMatrix()
            petalTransforms.forEach(transform => petals[i % 3].setMatrixAt(counts[i % 3]++, matrix.multiplyMatrices(flower.matrix, transform)))
            centers.setMatrixAt(i, matrix.multiplyMatrices(flower.matrix, centerTransform))
          })
          petals.forEach((item, i) => { item.count = counts[i]; item.instanceMatrix.needsUpdate = true; item.computeBoundingSphere() })
          centers.instanceMatrix.needsUpdate = true
          centers.computeBoundingSphere()
        }
        renderer.render(scene, camera)
      }
      draw.current = render
      const tick = (time: number) => {
        frame = 0
        if (disposed || contextLost || !visible || document.hidden || reduced) return
        if (time - last >= 32) {
          elapsed += Math.min(.05, (time - last) / 1000)
          last = time
          crown.rotation.z = Math.sin(elapsed * .65) * .018
          garden.rotation.y = Math.sin(elapsed * .22) * .045
          drifting.forEach((petal, i) => {
            const phase = (elapsed * .16 + i / 9) % 1
            petal.position.set(Math.sin(elapsed * .5 + i * 2) * 1.5, 3.3 * (1 - phase), Math.cos(i * 3) * .9)
            petal.rotation.z = elapsed * .6 + i
          })
          render()
        }
        frame = requestAnimationFrame(tick)
      }
      const sync = () => {
        reduced = media.matches || prefersReducedMotion() || document.documentElement.dataset.bloomMotion === 'paused'
        if (reduced) gsap.getTweensOf(growth.current).forEach(tween => tween.progress(1))
        cancelAnimationFrame(frame)
        frame = 0
        drifting.forEach(petal => { petal.visible = !reduced })
        render()
        if (!reduced && !contextLost && visible && !document.hidden) { last = performance.now(); frame = requestAnimationFrame(tick) }
      }
      const resize = new ResizeObserver(() => {
        const { width, height } = element.getBoundingClientRect()
        if (!width || !height) return
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        sync()
      })
      resize.observe(element)
      const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync() })
      intersection.observe(element)
      const motion = new MutationObserver(sync)
      motion.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduce-motion', 'data-bloom-motion'] })
      media.addEventListener('change', sync)
      document.addEventListener('visibilitychange', sync)
      const lost = () => { contextLost = true; element.dataset.rendered = 'false'; cancelAnimationFrame(frame) }
      target.addEventListener('webglcontextlost', lost)
      element.dataset.rendered = 'true'
      sync()
      cleanup = () => {
        draw.current = null
        cancelAnimationFrame(frame)
        resize.disconnect(); intersection.disconnect(); motion.disconnect()
        media.removeEventListener('change', sync)
        document.removeEventListener('visibilitychange', sync)
        target.removeEventListener('webglcontextlost', lost)
        const geometries = new Set<InstanceType<typeof THREE.BufferGeometry>>()
        const materials = new Set<InstanceType<typeof THREE.Material>>()
        scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
            geometries.add(object.geometry)
            const list = Array.isArray(object.material) ? object.material : [object.material]
            list.forEach(value => materials.add(value))
          }
        })
        geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose())
        renderer.dispose()
        delete element.dataset.rendered
      }
    }).catch(() => { /* SVG garden is the offline / unsupported-device fallback. */ })
    return () => { disposed = true; cleanup() }
  }, [])

  useEffect(() => {
    const element = root.current
    if (!element) return
    const context = gsap.context(() => {
      if (!prefersReducedMotion() && document.documentElement.dataset.bloomMotion !== 'paused') {
        gsap.from('.focus-tree-art', { opacity: 0, y: 12, duration: .7, ease: 'power2.out' })
      }
    }, element)
    return () => context.revert()
  }, [])

  return (
    <div className="focus-tree grow-scene" ref={root} role="img" aria-label={`Blossom focus tree: ${Math.round(fraction * 100)}% of session grown${extra ? `, ${extra} sessions today` : ''}`}>
      <svg className="focus-tree-art" viewBox="0 0 400 320" aria-hidden="true">
        <defs>
          <radialGradient id={`${id}-halo`}><stop stopColor="var(--accent-soft)" stopOpacity=".7"/><stop offset="1" stopColor="var(--bg-surface)" stopOpacity="0"/></radialGradient>
          <linearGradient id={`${id}-bark`}><stop stopColor="#b98370"/><stop offset="1" stopColor="#805647"/></linearGradient>
        </defs>
        <ellipse cx="200" cy="162" rx="170" ry="150" fill={`url(#${id}-halo)`}/>
        <ellipse cx="200" cy="278" rx="108" ry="13" fill="var(--accent-color)" opacity=".08"/>
        <g className="focus-tree-fallback">
          <path d="M74 242 195 205 327 242 206 296Z" fill="#90af7c"/>
          <path d="M74 231 195 194 327 231 206 285Z" fill="#c2d583"/>
          <path d="M204 244 Q177 218 193 184 Q214 145 195 102 M195 185 Q154 158 130 121 M203 157 Q249 140 275 110 M197 124 Q228 96 229 72" fill="none" stroke={`url(#${id}-bark)`} strokeWidth="15" strokeLinecap="round"/>
          {Array.from({ length: 64 }, (_, i) => {
            const angle = random(i + 4) * Math.PI * 2
            const radius = Math.sqrt(random(i + 32))
            return <g key={i} transform={`translate(${200 + Math.cos(angle) * radius * 105} ${112 + Math.sin(angle) * radius * 66}) scale(${.65 + fraction * .35})`}>
              {[0, 72, 144, 216, 288].map(rotation => <ellipse key={rotation} rx="4" ry="6" transform={`rotate(${rotation}) translate(0 -4)`} fill={i % 2 ? '#f2b7c8' : '#f7d4de'}/>)}
              <circle r="2" fill="#f4ce8c"/>
            </g>
          })}
          <ellipse cx="254" cy="240" rx="18" ry="9" fill="#b1ad91"/>
          <ellipse cx="136" cy="230" rx="14" ry="8" fill="#b1ad91"/>
        </g>
        <g fill="var(--accent-color)" opacity=".4"><path d="m64 112 3-7 3 7-3 7Z"/><path d="m329 158 3-7 3 7-3 7Z"/><circle cx="300" cy="64" r="2"/></g>
      </svg>
      <canvas ref={canvas} className="focus-tree-canvas" aria-hidden="true" />
      <span className="focus-tree-caption" aria-hidden="true">{fraction >= 1 ? 'A moment well grown' : fraction > 0 ? 'One quiet moment at a time' : 'Your little garden awaits'}</span>
    </div>
  )
}
