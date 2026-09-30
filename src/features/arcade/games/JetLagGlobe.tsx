import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { GameShell, useBest } from '../shell'

/**
 * Jet Lag Globe (Three.js): you're flying round the world. Drag the moon on
 * the flight dial to choose when to nap on the plane, then take off and
 * watch the globe turn beneath you. Sleep while it's night where you're
 * going, stay awake while it's day there, and you'll land fresh. Five trips.
 */
type City = { name: string; lat: number; lon: number; tz: number }
const C: Record<string, City> = {
  london: { name: 'London', lat: 51.5, lon: -0.1, tz: 0 }, tokyo: { name: 'Tokyo', lat: 35.7, lon: 139.7, tz: 9 },
  ny: { name: 'New York', lat: 40.7, lon: -74, tz: -5 }, sydney: { name: 'Sydney', lat: -33.9, lon: 151.2, tz: 10 },
  la: { name: 'Los Angeles', lat: 34, lon: -118.2, tz: -8 }, delhi: { name: 'Delhi', lat: 28.6, lon: 77.2, tz: 5.5 },
  paris: { name: 'Paris', lat: 48.9, lon: 2.35, tz: 1 }, rio: { name: 'Rio', lat: -22.9, lon: -43.2, tz: -3 }, cape: { name: 'Cape Town', lat: -33.9, lon: 18.4, tz: 2 },
}
const TRIPS = [
  { from: 'london', to: 'tokyo', dep: 11, hours: 13 }, { from: 'ny', to: 'london', dep: 19, hours: 7 },
  { from: 'sydney', to: 'la', dep: 10, hours: 14 }, { from: 'delhi', to: 'paris', dep: 2, hours: 9 }, { from: 'rio', to: 'cape', dep: 21, hours: 9 },
]
const NAP = 6
const v3 = (lat: number, lon: number, r = 1) => { const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th)) }
// How much of the nap falls in the destination's night (22:00–07:00 local there).
const scoreNap = (trip: typeof TRIPS[number], napStart: number) => {
  const to = C[trip.to], from = C[trip.from]
  let good = 0, bad = 0
  for (let h = 0; h < trip.hours; h += 0.25) {
    const asleep = h >= napStart && h < napStart + NAP
    const destHour = (((trip.dep - from.tz + to.tz + h) % 24) + 24) % 24
    const night = destHour >= 22 || destHour < 7
    if (asleep && night) good += 0.25
    if (asleep && !night) bad += 0.25
    if (!asleep && night) bad += 0.1
  }
  return Math.max(0, Math.round((good * 10 - bad * 6)))
}

export default function JetLagGlobe() {
  const [best, submit] = useBest('jetlag')
  const host = useRef<HTMLDivElement>(null)
  const [ti, setTi] = useState(0)
  const [nap, setNap] = useState(0)
  const [flying, setFlying] = useState(false)
  const [msg, setMsg] = useState('Drag the moon to plan your nap, then take off.')
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const api = useRef<{ fly: (ti: number, nap: number, onDone: () => void) => void; show: (ti: number) => void }>({ fly: () => {}, show: () => {} })
  const dial = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const st = useRef({ score: 0, lines: [] as string[] })
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])
  useEffect(() => { st.current = { score: 0, lines: [] }; setScore(0); setTi(0); setNap(0); setFlying(false) }, [round])

  useEffect(() => {
    const el = host.current
    if (!el) return
    const w = el.clientWidth, h = Math.min(420, Math.round(window.innerHeight * 0.5))
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
    el.appendChild(renderer.domElement)
    const scene = new THREE.Scene()
    const dark = document.documentElement.dataset.theme === 'matrix'
    scene.background = new THREE.Color(dark ? 0x000a04 : 0x0b1026)
    const cam = new THREE.PerspectiveCamera(40, w / h, 0.1, 100); cam.position.set(0, 0.6, 3.6); cam.lookAt(0, 0, 0)
    // Stars.
    const sg = new THREE.BufferGeometry(); const sp: number[] = []
    for (let i = 0; i < 800; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 20); sp.push(v.x, v.y, v.z) }
    sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.08 })))
    // Globe with a day/night shader.
    const sunDir = new THREE.Vector3(1, 0.2, 0.3).normalize()
    const globeMat = new THREE.ShaderMaterial({
      uniforms: { sun: { value: sunDir }, day: { value: new THREE.Color(dark ? 0x00aa44 : 0x3b82f6) }, night: { value: new THREE.Color(dark ? 0x001a08 : 0x0b1d3a) } },
      vertexShader: 'varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(mat3(modelMatrix) * normal); vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 sun; uniform vec3 day; uniform vec3 night; varying vec3 vN; varying vec3 vP; float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719)))*43758.5453); } void main(){ float d = dot(vN, sun); float k = smoothstep(-0.12, 0.12, d); float lat = asin(clamp(vP.y,-1.0,1.0)); float n = sin(vP.x*9.0)*sin(vP.z*7.0+vP.y*5.0)+sin(vP.y*11.0+vP.x*3.0)*0.6; float land = step(0.35, n); vec3 dayC = mix(day, vec3(0.35,0.6,0.3), land*0.9); vec3 nightC = night + land*vec3(0.05,0.05,0.03) + land*step(0.97, hash(floor(vP*60.0)))*vec3(1.0,0.8,0.4); gl_FragColor = vec4(mix(nightC, dayC, k) + (1.0-abs(lat)/1.6)*0.02, 1.0); }',
    })
    const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), globeMat)
    scene.add(globe)
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.06, 48, 32), new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.12, side: THREE.BackSide }))
    scene.add(atm)
    const dots = new THREE.Group(); globe.add(dots)
    const cityMark = (c: City, col: number) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), new THREE.MeshBasicMaterial({ color: col })); m.position.copy(v3(c.lat, c.lon, 1.01)); dots.add(m); return m }
    const arc = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: 0xfacc15, dashSize: 0.04, gapSize: 0.03 }))
    globe.add(arc)
    const plane = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }))
    globe.add(plane)
    let flight: { a: THREE.Vector3; b: THREE.Vector3; t: number; trip: typeof TRIPS[number]; nap: number; done: () => void } | null = null
    const pathPoint = (a: THREE.Vector3, b: THREE.Vector3, t: number) => a.clone().lerp(b, t).normalize().multiplyScalar(1.04 + Math.sin(t * Math.PI) * 0.12)
    api.current.show = (ti: number) => {
      dots.clear()
      const trip = TRIPS[ti]
      const a = v3(C[trip.from].lat, C[trip.from].lon), b = v3(C[trip.to].lat, C[trip.to].lon)
      cityMark(C[trip.from], 0x22c55e); cityMark(C[trip.to], 0xef4444)
      const pts = Array.from({ length: 60 }, (_, i) => pathPoint(a, b, i / 59))
      arc.geometry.setFromPoints(pts); arc.computeLineDistances()
      plane.position.copy(pathPoint(a, b, 0))
      // Turn the globe so the route faces us.
      const mid = a.clone().add(b).normalize()
      globe.rotation.set(0, Math.atan2(mid.x, mid.z) * -1, 0)
      // Put the sun where it is at departure (UTC hour → longitude).
      const utc = trip.dep - C[trip.from].tz
      const lon = -((utc - 12) * 15)
      sunDir.copy(v3(0, lon)).applyEuler(globe.rotation).normalize()
    }
    api.current.fly = (ti, nap, done) => { const trip = TRIPS[ti]; flight = { a: v3(C[trip.from].lat, C[trip.from].lon), b: v3(C[trip.to].lat, C[trip.to].lon), t: 0, trip, nap, done } }
    api.current.show(0)
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      const dt = Math.min(0.05, clock.getDelta())
      if (flight) {
        flight.t = Math.min(1, flight.t + dt / 5)
        const p = pathPoint(flight.a, flight.b, flight.t), q = pathPoint(flight.a, flight.b, Math.min(1, flight.t + 0.01))
        plane.position.copy(p); plane.lookAt(q); plane.rotateX(Math.PI / 2)
        const hour = flight.t * flight.trip.hours
        const asleep = hour >= flight.nap && hour < flight.nap + NAP
        ;(plane.material as THREE.MeshBasicMaterial).color.set(asleep ? 0x818cf8 : 0xffffff)
        // Time passes: the terminator sweeps as Earth turns.
        const utc = flight.trip.dep - C[flight.trip.from].tz + hour
        sunDir.copy(v3(0, -((utc - 12) * 15))).applyEuler(globe.rotation).normalize()
        if (flight.t >= 1) { const d = flight.done; flight = null; d() }
      }
      globeMat.uniforms.sun.value = sunDir
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); renderer.dispose(); el.replaceChildren() }
  }, [round])

  useEffect(() => { api.current.show(ti) }, [ti])
  const trip = TRIPS[ti]
  const setFromPointer = (e: React.PointerEvent) => {
    const m = dial.current?.getScreenCTM()
    if (!m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const frac = Math.max(0, Math.min(1, (p.x - 40) / 520))
    setNap(Math.round(frac * Math.max(0, trip.hours - NAP) * 2) / 2)
  }
  const takeOff = () => {
    if (flying) return
    setFlying(true); setMsg('Wheels up…')
    api.current.fly(ti, nap, () => {
      const pts = scoreNap(trip, nap)
      const s = st.current
      s.score += pts; s.lines.push(`${C[trip.from].name} → ${C[trip.to].name}: ${pts > 50 ? 'landed fresh' : pts > 20 ? 'a bit groggy' : 'zombie mode'}`)
      setScore(s.score)
      setMsg(pts > 50 ? 'You land fresh as a daisy! 🌼' : pts > 20 ? 'Slightly groggy on landing.' : 'Wide awake at 3am local time… 🧟')
      setTimeout(() => {
        if (ti + 1 >= TRIPS.length) { const record = submitRef.current(s.score); setResult({ headline: 'Round the world!', lines: [...s.lines.slice(-4), `Score ${s.score}`], record }) }
        else { setTi(ti + 1); setNap(0); setFlying(false); setMsg('Drag the moon to plan your nap, then take off.') }
      }, 1600)
    })
  }
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const from = C[trip.from], to = C[trip.to]
  const destAt = (h: number) => (((trip.dep - from.tz + to.tz + h) % 24) + 24) % 24
  const X = (h: number) => 40 + (h / trip.hours) * 520
  return (
    <GameShell title="Jet Lag Globe" score={score} best={best} result={result} onRestart={restart}
      hint={`Trip ${ti + 1}/${TRIPS.length}: ${from.name} → ${to.name} · depart ${String(trip.dep).padStart(2, '0')}:00 local · ${trip.hours}h · ${msg}`}>
      <div ref={host} className="fl-host" />
      <svg ref={dial} viewBox="0 0 600 120" style={{ display: 'block', width: '100%', maxWidth: 760, margin: '0 auto', touchAction: 'none' }}
        onPointerDown={(e) => { if (!flying) { dragging.current = true; setFromPointer(e) } }} onPointerMove={(e) => { if (dragging.current) setFromPointer(e) }} onPointerUp={() => { dragging.current = false }} onPointerLeave={() => { dragging.current = false }}>
        {Array.from({ length: trip.hours * 2 }, (_, i) => {
          const hh = destAt(i / 2)
          const night = hh >= 22 || hh < 7
          return <rect key={i} x={X(i / 2)} y={40} width={520 / (trip.hours * 2) + 0.5} height={26} fill={night ? '#1e1b4b' : '#fde68a'} />
        })}
        <rect x={X(nap)} y={36} width={X(nap + NAP) - X(nap)} height={34} rx={8} fill="#818cf8" opacity={0.55} stroke="#4f46e5" strokeWidth={2} />
        <text x={X(nap) + (X(nap + NAP) - X(nap)) / 2} y={60} textAnchor="middle" fontSize={16}>🌙 zzz</text>
        {Array.from({ length: trip.hours + 1 }, (_, i) => (i % 2 === 0 ? <text key={i} x={X(i)} y={88} textAnchor="middle" fontSize={11} fill="#64748b">{String(Math.floor(destAt(i))).padStart(2, '0')}:00</text> : null))}
        <text x={40} y={24} fontSize={12} fill="#64748b">time at {to.name} during the flight (dark = night there)</text>
      </svg>
      <div className="cf-tray"><button type="button" className="cf-match" disabled={flying} onClick={takeOff}>✈ Take off</button></div>
    </GameShell>
  )
}
