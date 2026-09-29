import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import gsap from 'gsap'
import chroma from 'chroma-js'
import { Pause, Play } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { getFft } from '../../platform/pffft'
import { fmtPace, fmtTime, pace, toUnits, type Run } from './runModel'
import { fftSizeFor, lowpass, profile, toLocal, type Profile } from './terrainModel'

/**
 * Terrain Replay: a drone flies along your route. The 3D scene (three.js
 * WebGPURenderer) raises the route on a curtain of its own elevation,
 * coloured by speed. The existing Leaflet map shows a speed-heat line in sync,
 * and an SVG elevation profile tracks the same moment.
 */
const heat = chroma.scale(['#3b82f6', '#22d3ee', '#a3e635', '#facc15', '#f97316', '#ef4444']).mode('lab')
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
type Cam = 'chase' | 'orbit' | 'top'

function speedColors(p: Profile) {
  const s = [...p.speed].filter((v) => v > 0).sort((a, b) => a - b)
  const lo = s[Math.floor(s.length * 0.05)] ?? 0
  const hi = s[Math.floor(s.length * 0.95)] ?? 1
  return p.speed.map((v) => heat(Math.max(0, Math.min(1, (v - lo) / Math.max(0.1, hi - lo)))))
}

function Scene({ run, prof, progress, cam }: { run: Run; prof: Profile; progress: number; cam: Cam }) {
  const host = useRef<HTMLDivElement>(null)
  const api = useRef<{ set: (p: number) => void; cam: (c: Cam) => void } | null>(null)
  const [backend, setBackend] = useState('')
  useEffect(() => {
    const el = host.current
    if (!el) return
    let disposed = false
    let cleanup = () => {}
    void (async () => {
      const THREE = await import('three/webgpu')
      if (disposed) return
      const renderer = new THREE.WebGPURenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio))
      renderer.setSize(el.clientWidth || 600, el.clientHeight || 360)
      await renderer.init()
      if (disposed) { renderer.dispose(); return }
      setBackend((renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2')
      renderer.domElement.setAttribute('data-matrix-native', '')
      el.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      scene.fog = new THREE.Fog(0x060b18, 30, 70)
      const camera = new THREE.PerspectiveCamera(50, (el.clientWidth || 600) / (el.clientHeight || 360), 0.1, 200)

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
      api.current = { set: (p) => { prog = p; place() }, cam: (c) => { mode = c } }
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
          const a = reduced() ? 0.6 : s * 0.12
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
      const ro = new ResizeObserver(() => {
        const W = el.clientWidth
        const H = el.clientHeight
        if (!W || !H) return
        renderer.setSize(W, H)
        camera.aspect = W / H
        camera.updateProjectionMatrix()
      })
      ro.observe(el)
      cleanup = () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        scene.traverse((o) => (o as { geometry?: { dispose: () => void } }).geometry?.dispose())
        renderer.dispose()
        renderer.domElement.remove()
        api.current = null
      }
    })()
    return () => { disposed = true; cleanup() }
  }, [run, prof])
  useEffect(() => api.current?.set(progress), [progress])
  useEffect(() => api.current?.cam(cam), [cam])
  return (
    <div className="tr-scene" role="img" aria-label="3D replay of the route with its elevation">
      <div ref={host} className="tr-canvas" />
      {backend ? <span className="tr-backend">{backend}</span> : null}
    </div>
  )
}

function HeatMap({ run, prof, progress }: { run: Run; prof: Profile; progress: number }) {
  const host = useRef<HTMLDivElement>(null)
  const dot = useRef<L.CircleMarker | null>(null)
  useEffect(() => {
    if (!host.current) return
    const m = L.map(host.current, { zoomControl: false, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap', className: 'run-tiles' }).addTo(m)
    const cols = speedColors(prof)
    const step = Math.max(1, Math.floor(run.points.length / 400))
    for (let i = 0; i < run.points.length - 1; i += step) {
      const seg = run.points.slice(i, Math.min(run.points.length, i + step + 1)).map((p) => [p.lat, p.lng] as [number, number])
      L.polyline(seg, { color: cols[i].hex(), weight: 6, opacity: 0.95, lineCap: 'round' }).addTo(m)
    }
    const ll = run.points.map((p) => [p.lat, p.lng] as [number, number])
    m.fitBounds(L.latLngBounds(ll), { padding: [24, 24] })
    dot.current = L.circleMarker(ll[0], { radius: 8, color: '#fff', weight: 3, fillColor: '#0ea5e9', fillOpacity: 1 }).addTo(m)
    return () => { m.remove(); dot.current = null }
  }, [run, prof])
  useEffect(() => {
    const i = Math.min(run.points.length - 1, Math.round(progress * (run.points.length - 1)))
    dot.current?.setLatLng([run.points[i].lat, run.points[i].lng])
  }, [progress, run])
  return <div ref={host} className="tr-map" aria-label="Route map coloured by speed" data-matrix-native />
}

function ElevationProfile({ prof, progress, units }: { prof: Profile; progress: number; units: 'km' | 'mi' }) {
  const W = 600
  const H = 120
  const total = prof.dist[prof.dist.length - 1] || 1
  const eR = Math.max(10, prof.maxEle - prof.minEle)
  const x = (d: number) => (d / total) * W
  const y = (e: number) => H - 8 - ((e - prof.minEle) / eR) * (H - 26)
  const line = prof.ele.map((e, i) => `${i ? 'L' : 'M'}${x(prof.dist[i]).toFixed(1)} ${y(e).toFixed(1)}`).join(' ')
  const path = useRef<SVGPathElement>(null)
  useLayoutEffect(() => {
    if (!path.current || reduced()) return
    const len = path.current.getTotalLength()
    gsap.fromTo(path.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.out', clearProps: 'strokeDasharray,strokeDashoffset' })
  }, [line])
  const i = Math.min(prof.ele.length - 1, Math.round(progress * (prof.ele.length - 1)))
  const cx = x(prof.dist[i])
  const cy = y(prof.ele[i])
  // Gradient stops along the path: steep climbs glow red, descents blue.
  const stops = prof.grade.filter((_, j) => j % Math.max(1, Math.floor(prof.grade.length / 60)) === 0)
  return (
    <div className="tr-profile-wrap" data-matrix-native>
      <svg className="tr-profile" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`Elevation profile: ${Math.round(prof.ascent)} m of climbing`}>
        <defs>
          <linearGradient id="tr-grade" x1="0" x2="1">
            {stops.map((g, j) => <stop key={j} offset={j / Math.max(1, stops.length - 1)} stopColor={chroma.scale(['#38bdf8', '#a3e635', '#f97316', '#ef4444']).domain([-8, 0, 6, 12])(g).hex()} />)}
          </linearGradient>
          <linearGradient id="tr-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#7df9ff" stopOpacity="0.35" /><stop offset="1" stopColor="#7df9ff" stopOpacity="0" /></linearGradient>
        </defs>
        <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#tr-fill)" />
        <path ref={path} d={line} fill="none" stroke="url(#tr-grade)" strokeWidth="3" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={cx} x2={cx} y1="4" y2={H} className="tr-cursor" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* HTML overlays so the dot and label stay round and crisp while the SVG stretches. */}
      <span className="tr-cursor-dot" style={{ left: `${(cx / W) * 100}%`, top: `${(cy / H) * 100}%` }} />
      <span className="tr-cursor-label" style={{ left: `${(cx / W) * 100}%`, transform: `translateX(${cx > W - 90 ? '-100%' : cx < 90 ? '0' : '-50%'})` }}>
        {Math.round(prof.ele[i])} m · {toUnits(prof.dist[i], units).toFixed(2)} {units} · {prof.grade[i] >= 0 ? '+' : ''}{prof.grade[i].toFixed(1)}%
      </span>
    </div>
  )
}

export function TerrainReplay({ run, units }: { run: Run; units: 'km' | 'mi' }) {
  const [prof, setProf] = useState<Profile | null>(null)
  const [backend, setBackend] = useState('')
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [cam, setCam] = useState<Cam>('chase')
  const tween = useRef<gsap.core.Tween | null>(null)
  const state = useRef({ p: 0 })

  // Smooth GPS altitude with an FFT low-pass (PFFFT, Wasm SIMD where available).
  useEffect(() => {
    let off = false
    void getFft(fftSizeFor(run.points.length)).then(({ fft, backend: b }) => {
      if (off) return
      setBackend(b)
      setProf(profile(run.points, (v) => lowpass(v, fft, 0.03)))
    })
    return () => { off = true }
  }, [run])

  useEffect(() => {
    state.current.p = 0
    setProgress(0)
    setPlaying(false)
    tween.current?.kill()
  }, [run])
  const play = () => {
    tween.current?.kill()
    if (state.current.p >= 0.999) state.current.p = 0
    tween.current = gsap.to(state.current, {
      p: 1,
      duration: (1 - state.current.p) * (40 / speed),
      ease: 'none',
      onUpdate: () => setProgress(state.current.p),
      onComplete: () => setPlaying(false),
    })
    setPlaying(true)
  }
  const pause = () => { tween.current?.kill(); setPlaying(false) }
  useEffect(() => () => { tween.current?.kill() }, [])
  useEffect(() => { if (playing) play() }, [speed]) // eslint-disable-line react-hooks/exhaustive-deps

  const i = prof ? Math.min(prof.ele.length - 1, Math.round(progress * (prof.ele.length - 1))) : 0
  const elapsed = (run.points[i]?.t - run.points[0]?.t) / 1000 || 0
  const stats = useMemo(() => prof && [
    { v: `${toUnits(run.km, units).toFixed(2)} ${units}`, l: 'distance' },
    { v: `${Math.round(prof.ascent)} m`, l: 'climbed' },
    { v: `${prof.maxGrade.toFixed(1)}%`, l: 'steepest' },
    { v: fmtPace(pace(run.km, run.seconds, units)), l: `avg pace /${units}` },
  ], [prof, run, units])

  if (!prof) return <div className="tr tr-wait">Building the terrain…</div>
  return (
    <section className="tr" aria-label="Terrain replay">
      <header className="tr-head">
        <div>
          <p className="tr-eyebrow">Terrain replay</p>
          <h3>{new Date(run.at).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
        </div>
        <CapsBadge caps={['gpu', 'simd', 'fsa']} />
      </header>
      <div className="tr-grid">
        <Scene run={run} prof={prof} progress={progress} cam={cam} />
        <div className="tr-right">
          <HeatMap run={run} prof={prof} progress={progress} />
          <div className="tr-stats">
            {stats!.map((s) => <div key={s.l}><b>{s.v}</b><small>{s.l}</small></div>)}
          </div>
        </div>
      </div>
      <div className="tr-controls">
        <button type="button" className="tr-play" onClick={playing ? pause : play} aria-label={playing ? 'Pause replay' : 'Play replay'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <input type="range" min={0} max={1000} value={Math.round(progress * 1000)} aria-label="Replay position" onChange={(e) => { pause(); state.current.p = Number(e.target.value) / 1000; setProgress(state.current.p) }} />
        <span className="tr-clock">{fmtTime(elapsed)} · {Math.round(prof.speed[i])} km/h</span>
        <div className="tr-seg" role="radiogroup" aria-label="Replay speed">
          {[1, 2, 4].map((s) => <button key={s} type="button" role="radio" aria-checked={speed === s} className={speed === s ? 'on' : ''} onClick={() => setSpeed(s)}>{s}×</button>)}
        </div>
        <div className="tr-seg" role="radiogroup" aria-label="Camera">
          {(['chase', 'orbit', 'top'] as Cam[]).map((c) => <button key={c} type="button" role="radio" aria-checked={cam === c} className={cam === c ? 'on' : ''} onClick={() => setCam(c)}>{c === 'chase' ? 'Drone chase' : c === 'orbit' ? 'Orbit' : 'Top down'}</button>)}
        </div>
      </div>
      <ElevationProfile prof={prof} progress={progress} units={units} />
      <p className="tr-foot">Elevation smoothed by FFT low-pass · {backend === 'simd' ? 'Wasm SIMD128' : backend === 'wasm' ? 'Wasm' : 'JS'} · colour = speed</p>
    </section>
  )
}
