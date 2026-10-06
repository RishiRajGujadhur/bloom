import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import gsap from 'gsap'
import chroma from 'chroma-js'
import { mountScene, type MountedScene } from '../../platform/offscreen'
import { speedColors, type Cam, type TerrainData } from './terrainRender'
import TerrainWorker from './terrainWorker?worker'
import { Pause, Play } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { getFft } from '../../platform/pffft'
import { fmtPace, fmtTime, pace, toUnits, type Run } from './runModel'
import { fftSizeFor, lowpass, profile, type Profile } from './terrainModel'

/**
 * Terrain Replay: a drone flies along your route. The 3D scene (three.js
 * WebGPURenderer) raises the route on a curtain of its own elevation,
 * coloured by speed. The existing Leaflet map shows a speed-heat line in sync,
 * and an SVG elevation profile tracks the same moment.
 */
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** The 3D replay, rendered on its own thread (OffscreenCanvas in a worker). */
function Scene({ run, prof, progress, cam }: { run: Run; prof: Profile; progress: number; cam: Cam }) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<MountedScene | null>(null)
  const [info, setInfo] = useState<{ backend: string; offscreen: boolean } | null>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const m = mountScene<TerrainData>(el, {
      data: { points: run.points, prof },
      makeWorker: () => new TerrainWorker(),
      loadFactory: () => import('./terrainRender').then((x) => x.createTerrainScene),
      onEvent: (e) => { if (e.type === 'ready') setInfo(e.payload as { backend: string; offscreen: boolean }) },
    })
    scene.current = m
    return () => { m.dispose(); scene.current = null }
  }, [run, prof])
  useEffect(() => scene.current?.send('progress', progress), [progress])
  useEffect(() => scene.current?.send('cam', cam), [cam])
  return (
    <div className="tr-scene" role="img" aria-label="3D replay of the route with its elevation">
      <div ref={host} className="tr-canvas" />
      {info ? <span className="tr-backend">{info.backend}{info.offscreen ? ' · render thread' : ''}</span> : null}
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
        <CapsBadge caps={['gpu', 'oc', 'simd', 'fsa']} />
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
      <div className="tr-controls bloom-controls">
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
