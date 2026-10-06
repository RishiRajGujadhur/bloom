import { bodySilent } from '../body/bodyPreferences'
import { useBodyPractice } from '../body/bodyPractice'
import { useLeaveGuard } from '../../utils/useLeaveGuard'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Download, Flag, FolderOpen, Footprints, Map as MapIcon, Medal, Mountain, Pause, Play, PlusCircle, Route, Square, Trophy } from 'lucide-react'
import { Rail, Segmented, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { RUN_KEY, MI, bests, demoRoute, distanceKm, fmtPace, fmtTime, isStationary, metresBetween, pace, pointAt, splits, toUnits, weekKm, type Pt, type Run, type RunStore } from './runModel'
import { Strider } from '../showcase/Strider'
import { usePageActions } from '../../components/ui/PageMenu'
import { onLaunchFiles, openFiles, saveFile } from '../../platform/fsa'
import { demoHills, parseGpx, simplifyRoute, toGpx } from './terrainModel'
import './run.css'
import { download } from '../lab/exportSuite'
import './terrain.css'

const TerrainReplay = lazy(() => import('./TerrainReplay').then((m) => ({ default: m.TerrainReplay })))

const on = (id: string) => subOn('runTracker', id)
const say = (t: string) => {
  if (bodySilent()) return
  try {
    speechSynthesis.speak(new SpeechSynthesisUtterance(t))
  } catch {
    /* optional */
  }
}

/** Leaflet map with the live route and an optional replay marker. */
function RouteMap({ points, replay, follow }: { points: Pt[]; replay: number | null; follow: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const line = useRef<L.Polyline | null>(null)
  const dot = useRef<L.CircleMarker | null>(null)
  useEffect(() => {
    if (!host.current || map.current) return
    const m = L.map(host.current, { zoomControl: false, attributionControl: true }).setView([51.5074, -0.1657], 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap', className: 'run-tiles' }).addTo(m)
    line.current = L.polyline([], { color: '#e2553f', weight: 5, opacity: 0.9, lineCap: 'round' }).addTo(m)
    dot.current = L.circleMarker([51.5074, -0.1657], { radius: 8, color: '#fff', weight: 3, fillColor: '#e2553f', fillOpacity: 1 }).addTo(m)
    map.current = m
    return () => {
      m.remove()
      map.current = null
    }
  }, [])
  useEffect(() => {
    const m = map.current
    if (!m || !line.current || !dot.current) return
    const ll = points.map((p) => [p.lat, p.lng] as [number, number])
    line.current.setLatLngs(ll)
    if (ll.length) {
      dot.current.setLatLng(ll[ll.length - 1])
      if (follow && ll.length > 1) m.fitBounds(L.latLngBounds(ll), { padding: [30, 30], maxZoom: 16, animate: true })
      else if (follow) m.setView(ll[0], 16)
    }
  }, [points, follow])
  useEffect(() => {
    if (replay === null || !dot.current) return
    const p = pointAt(points, replay)
    if (p) dot.current.setLatLng([p.lat, p.lng])
  }, [replay, points])
  return <div ref={host} className="run-map" aria-label="Route map" />
}

function PaceChart({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="studio-empty">Splits appear after each full unit.</p>
  const w = 300
  const h = 90
  const max = Math.max(...values)
  const min = Math.min(...values)
  return (
    <svg className="run-pace" viewBox={`0 0 ${w} ${h}`} aria-label="Pace by split">
      {values.map((v, i) => {
        const bh = 20 + ((v - min) / Math.max(1, max - min)) * (h - 30)
        const bw = w / values.length - 6
        return <rect key={i} x={i * (w / values.length) + 3} y={h - bh} width={bw} height={bh} rx="5" data-best={v === min} />
      })}
    </svg>
  )
}

/** Distance per week for the last eight weeks. */
function WeeksChart({ runs, units }: { runs: Run[]; units: 'km' | 'mi' }) {
  const now = Date.now()
  const weeks = Array.from({ length: 8 }, (_, i) => toUnits(weekKm(runs.filter((r) => r.at < now - (7 - i - 1) * 7 * 86400000), now - (7 - i - 1) * 7 * 86400000), units))
  const max = Math.max(1, ...weeks)
  return (
    <div className="run-weeks" aria-label="Distance per week, last 8 weeks">
      {weeks.map((w, i) => (
        <span key={i} style={{ height: `${Math.max(4, (w / max) * 100)}%` }} data-now={i === 7} title={`${w.toFixed(1)} ${units}`} />
      ))}
    </div>
  )
}

export function RunPage() {
  const [store, setStoreState] = useState<RunStore>(() => readStore(RUN_KEY, { runs: [], units: 'km', weeklyGoal: 15 }))
  const setStore = (fn: (s: RunStore) => RunStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(RUN_KEY, n)
      return n
    })
  const units = on('units') ? store.units : 'km'
  const [tab, setTab] = useState('track')
  const [followMap, setFollowMap] = useState(() => readStore('bloom-run-map-follow', true))
  const [kind, setKind] = useState<'run' | 'walk'>('run')
  const [points, setPoints] = useState<Pt[]>([])
  const [status, setStatus] = useState<'idle' | 'tracking' | 'paused' | 'demo'>('idle')
  useLeaveGuard(status === 'tracking' || status === 'paused')
  const [error, setError] = useState('')
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null)
  const gpsGeneration = useRef(0)
  const [now, setNow] = useState(Date.now())
  const [startedAt, setStartedAt] = useState(0)
  const [pausedFor, setPausedFor] = useState(0)
  const [replay, setReplay] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Run | null>(null)
  const [manualSaved, setManualSaved] = useState<Run | null>(null)
  const manualLock = useRef(0)
  const [manKm, setManKm] = useState(5)
  const [manMin, setManMin] = useState(30)
  const watch = useRef<number | null>(null)
  const playback = useRef<ReturnType<typeof setInterval> | null>(null)
  const replayEnd = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stopPlayback = () => { if (playback.current) clearInterval(playback.current); if (replayEnd.current) clearTimeout(replayEnd.current); playback.current = null; replayEnd.current = null }
  const stopGps = () => { gpsGeneration.current++; if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); watch.current = null; autoPaused.current = null }
  useEffect(() => () => { stopPlayback(); stopGps() }, [])
  const pauseStart = useRef(0)
  const spoken = useRef(0)
  const finishBtn = useRef<HTMLButtonElement>(null)
  // Auto-pause: fixes still arrive while paused, but only count while tracking.
  const statusRef = useRef(status)
  statusRef.current = status
  const autoPaused = useRef<Pt | null>(null)
  const lastFix = useRef<Pt | null>(null)
  const autoPauseOn = store.autoPause !== false

  const [sampleRoute, setSampleRoute] = useState<Run | null>(null)
  const [terrainId, setTerrainId] = useState<string | null>(null)
  const routed = store.runs.filter((r) => r.points.length > 10)
  const terrainRun = sampleRoute ?? routed.find((r) => r.id === terrainId) ?? routed[routed.length - 1] ?? null
  /** A route from a GPX file (or the sample) becomes a saved run and opens in 3D. */
  const addRoute = (pts: Pt[], sample = false) => {
    const points = simplifyRoute(pts)
    const km = distanceKm(points)
    const seconds = Math.max(1, (points[points.length - 1].t - points[0].t) / 1000)
    const run: Run = { id: crypto.randomUUID(), at: points[0].t, kind: km / (seconds / 3600) > 7.5 ? 'run' : 'walk', km: Math.round(km * 100) / 100, seconds: Math.round(seconds), points }
    if (sample) setSampleRoute(run)
    else { setSampleRoute(null); setStore((s) => ({ ...s, runs: [...s.runs, run] })) }
    setTerrainId(run.id)
    setTab('terrain')
    setError('')
  }
  const importGpx = async (files: { file: File }[]) => {
    for (const { file } of files) {
      try {
        const { points } = parseGpx(await file.text())
        addRoute(points)
      } catch (e) {
        setError(`${file.name}: ${(e as Error).message}`)
      }
    }
  }
  useEffect(() => onLaunchFiles((f) => void importGpx(f)), []) // eslint-disable-line react-hooks/exhaustive-deps

  const km = distanceKm(points)
  const seconds = startedAt ? (status === 'demo' && points.length ? (points[points.length - 1].t - points[0].t) / 1000 : (now - startedAt - pausedFor) / 1000) : 0
  const split = splits(points, units)

  useEffect(() => {
    if (status !== 'tracking' && status !== 'paused') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [status])
  useEffect(() => {
    if (!autoPauseOn) return
    if (status === 'tracking' && isStationary(points, now)) {
      autoPaused.current = lastFix.current ?? points[points.length - 1]
      pauseStart.current = Date.now()
      setStatus('paused')
    } else if (status === 'paused' && autoPaused.current && lastFix.current && metresBetween(autoPaused.current, lastFix.current) > 15) {
      const fix = lastFix.current
      autoPaused.current = null
      setPausedFor((p) => p + Date.now() - pauseStart.current)
      // Start counting again from where you are now.
      setPoints((list) => [...list, fix])
      setStatus('tracking')
    }
  }, [now, points, status, autoPauseOn])
  useEffect(() => {
    if (!on('voiceSplits') || split.length <= spoken.current) return
    spoken.current = split.length
    say(`${split.length} ${units === 'mi' ? 'mile' : 'kilometre'}${split.length > 1 ? 's' : ''}. Last split ${Math.floor(split[split.length - 1] / 60)} minutes ${Math.round(split[split.length - 1] % 60)} seconds.`)
  }, [split, units])

  // Pace alerts: compare the last minute's pace to your target, at most once a minute.
  const lastAlert = useRef(0)
  useEffect(() => {
    const target = store.targetPace ?? 0
    if (!target || status !== 'tracking' || now - lastAlert.current < 60_000) return
    const recent = points.filter((p) => now - p.t <= 60_000)
    if (recent.length < 3 || now - startedAt < 90_000) return
    const secs = (recent[recent.length - 1].t - recent[0].t) / 1000
    const dist = distanceKm(recent)
    if (dist < 0.02 || secs < 30) return
    const current = secs / (units === 'mi' ? dist / MI : dist)
    const spoken = (v: number) => `${Math.floor(v / 60)} ${String(Math.round(v % 60)).padStart(2, '0')}`
    if (current > target + 20) say(`Pace ${spoken(current)}. A little faster to hit ${spoken(target)}.`)
    else if (current < target - 25) say(`You're ahead of pace. Ease off a touch.`)
    else return
    lastAlert.current = now
  }, [now, points, status, startedAt, store.targetPace, units])

  const watchGps = () => {
    const token = ++gpsGeneration.current
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        if (token !== gpsGeneration.current) return
        setGpsAccuracy(p.coords.accuracy)
        if (!Number.isFinite(p.coords.accuracy) || p.coords.accuracy > 40) { setError('Waiting for a clearer GPS fix (40m accuracy or better).'); return }
        setError('')
        const fix = { lat: p.coords.latitude, lng: p.coords.longitude, t: p.timestamp, ele: p.coords.altitude ?? undefined }
        lastFix.current = fix
        if (statusRef.current !== 'tracking') return
        setPoints((list) => [...list, fix])
      },
      (error) => { if (token !== gpsGeneration.current) return; gpsGeneration.current++; if (watch.current !== null) navigator.geolocation.clearWatch(watch.current); watch.current = null; setError(error.code === 1 ? 'Location permission was not granted. Use manual logging or enable location and retry.' : 'GPS stopped: a location fix could not be obtained. Retry when ready.'); pauseStart.current = Date.now(); setStatus(lastFix.current ? 'paused' : 'idle') },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
    )
  }
  const start = () => {
    stopPlayback(); setReplay(null); setViewing(null); stopGps()
    setError('')
    if (!on('gps') || !('geolocation' in navigator)) return setError('GPS isn’t available here. Try the demo route or log a run by hand.')
    setPoints([])
    spoken.current = 0
    setStartedAt(Date.now())
    setPausedFor(0)
    setStatus('tracking')
    lastFix.current = null; setGpsAccuracy(null); watchGps()
  }
  const pause = () => {
    if (status === 'tracking') {
      pauseStart.current = Date.now()
      autoPaused.current = null
      setStatus('paused')
    } else if (status === 'paused') {
      if (watch.current === null) watchGps()
      autoPaused.current = null
      setPausedFor((p) => p + Date.now() - pauseStart.current)
      setStatus('tracking')
    }
  }
  const demo = () => {
    stopPlayback(); stopGps(); setReplay(null); setViewing(null)
    const route = demoRoute(undefined, 3, Date.now())
    setStartedAt(route[0].t)
    setStatus('demo')
    spoken.current = 0
    let i = 1
    setPoints(route.slice(0, 1))
    playback.current = setInterval(() => {
      i += 3
      setPoints(route.slice(0, Math.min(i, route.length)))
      if (i >= route.length) stopPlayback()
    }, 60)
  }
  const finish = () => {
    stopPlayback(); stopGps(); setReplay(null)
    if (status !== 'demo' && km > 0.05) {
      const run: Run = { id: crypto.randomUUID(), at: Date.now(), kind, km: Math.round(km * 100) / 100, seconds: Math.round(seconds), points }
      setStore((s) => ({ ...s, runs: [...s.runs, run] }))
      logActivity(kind, { km: run.km })
      burst(finishBtn.current, 'stars')
      setViewing(run)
    }
    setStatus('idle')
    setStartedAt(0)
  }
  const addManual = () => {
    if (Date.now() - manualLock.current < 700 || !Number.isFinite(manKm) || !Number.isFinite(manMin) || manKm <= 0 || manMin <= 0) return
    manualLock.current = Date.now()
    const run: Run = { id: crypto.randomUUID(), at: Date.now(), kind, km: units === 'mi' ? manKm * 1.609344 : manKm, seconds: manMin * 60, points: [], manual: true }
    setStore((s) => ({ ...s, runs: [...s.runs, run] }))
    logActivity(kind, { km: run.km })
    setManualSaved(run)
    burst(null, 'stars')
  }
  const playReplay = (run: Run) => {
    stopPlayback(); stopGps(); setStatus('idle'); setStartedAt(0)
    setViewing(run)
    setTab('track')
    setPoints(run.points)
    let f = 0
    playback.current = setInterval(() => {
      f += 0.01
      setReplay(Math.min(1, f))
      if (f >= 1) {
        stopPlayback()
        replayEnd.current = setTimeout(() => setReplay(null), 800)
      }
    }, 40)
  }

  useBodyPractice('run', '', kind === 'run' ? 'Run preparation' : 'Walk preparation', () => { if (status === 'tracking') pause() })
  const b = bests(store.runs)
  const week = toUnits(weekKm(store.runs), units)
  const goal = store.weeklyGoal
  const active = status === 'tracking' || status === 'paused' || status === 'demo'
  // Tab title: live distance while tracking, weekly progress otherwise.
  const runTitle = active ? `${toUnits(km, units).toFixed(2)} ${units} · ${fmtTime(seconds)}` : week > 0 ? `${week.toFixed(1)}/${goal} ${units} this week` : ''
  useEffect(() => {
    if (!runTitle) return
    const before = document.title
    document.title = `${runTitle} · Run`
    return () => {
      document.title = before
    }
  }, [runTitle])

  usePageActions(!active ? [{ id: 'run-go', label: `Start a ${kind}`, icon: kind === 'walk' ? '🚶' : '🏃', run: start }, { id: 'run-demo', label: 'Play a demo route', icon: '🗺️', run: demo }] : status !== 'demo' ? [{ id: 'run-pause', label: status === 'paused' ? 'Resume' : 'Pause', icon: '⏯️', run: pause }] : [])
  const track = () => (
    <div className="studio-split run-split">
      <div className="studio-card run-map-card">{on('map') ? <><button type="button" className="studio-chip" aria-pressed={followMap} onClick={() => { setFollowMap(!followMap); writeStore('bloom-run-map-follow', !followMap) }}>Follow route {followMap ? 'on' : 'off'}</button><RouteMap points={points} replay={replay} follow={followMap} /></> : <div className="studio-center">Map is off</div>}</div>
      <div className="studio-card run-side bloom-start-stack">
        <Segmented label="Activity" value={kind} onChange={setKind} options={[{ id: 'run', label: '🏃 Run' }, { id: 'walk', label: '🚶 Walk' }]} />
        <div className="run-big">
          {on('strider') && <Strider active={active && status !== 'paused'} walk={kind === 'walk'} />}
          <strong>{toUnits(km, units).toFixed(2)}</strong>
          <small>{units}</small>
        </div>
        <div className="studio-stats">
          <Stat value={fmtTime(seconds)} label="time" />
          <span data-hint={`Minutes per ${units}; lower is faster`}><Stat value={fmtPace(pace(km, seconds, units))} label={`pace /${units}`} /></span>
          {on('splits') && <Stat value={split.length} label="splits" />}
          {gpsAccuracy !== null && status !== 'demo' && <Stat value={`±${Math.round(gpsAccuracy)}m`} label={gpsAccuracy <= 40 ? 'GPS accuracy' : 'GPS · waiting for clarity'} />}
        </div>
        {on('paceChart') && <PaceChart values={split} />}
        <div className="iv-buttons">
          {!active ? (
            <>
              <button type="button" className="studio-go" onClick={start}>
                <Play size={18} /> Start
              </button>
              <button type="button" className="studio-go" data-variant="quiet" onClick={demo}>
                <Route size={16} /> Demo route
              </button>
            </>
          ) : (
            <>
              {status !== 'demo' && (
                <button type="button" className="studio-go" data-variant="quiet" onClick={pause}>
                  {status === 'paused' ? <Play size={16} /> : <Pause size={16} />} {status === 'paused' ? (autoPaused.current ? 'Auto-paused · resume' : 'Resume') : 'Pause'}
                </button>
              )}
              {status !== 'demo' && (
                <button type="button" className="studio-chip" aria-pressed={autoPauseOn} title="Pause automatically when you stop for 20 seconds, resume when you move" onClick={() => setStore((s) => ({ ...s, autoPause: !autoPauseOn }))}>
                  Auto-pause {autoPauseOn ? 'on' : 'off'}
                </button>
              )}
              <button ref={finishBtn} type="button" className="studio-go" onClick={finish}>
                <Square size={16} /> Finish
              </button>
            </>
          )}
        </div>
        {!active && (
          <div className="st-scale">
            <Slider
              label="Pace alert"
              value={store.targetPace ?? 0}
              min={0}
              max={720}
              step={15}
              format={(v) => (v ? `${fmtPace(v)} /${units}` : 'off')}
              onChange={(v) => setStore((s) => ({ ...s, targetPace: v }))}
            />
          </div>
        )}
        {status === 'demo' && <p role="status">Demo only · excluded from your history and personal bests.</p>}
        {error && <p className="voice-error">{error}</p>}
        {viewing && !active && (
          <p className="studio-empty">
            Saved: {toUnits(viewing.km, units).toFixed(2)} {units} in {fmtTime(viewing.seconds)}
          </p>
        )}
      </div>
    </div>
  )

  const manual = () => (
    <div className="studio-split">
      <div className="studio-card run-side bloom-start-stack">
        <h3>
          <PlusCircle size={17} /> Log without GPS
        </h3>
        <Segmented label="Activity" value={kind} onChange={setKind} options={[{ id: 'run', label: '🏃 Run' }, { id: 'walk', label: '🚶 Walk' }]} />
        <Slider label="Distance" value={manKm} min={0.5} max={42} step={0.1} unit={units} format={(v) => v.toFixed(1)} onChange={setManKm} />
        <Slider label="Duration" value={manMin} min={5} max={300} step={1} unit="min" onChange={setManMin} />
        <p className="studio-empty">Pace {fmtPace((manMin * 60) / manKm)} /{units}</p>
        <button type="button" className="studio-go" onClick={addManual}>
          Save
        </button>
        {manualSaved && <p role="status">Saved {toUnits(manualSaved.km, units).toFixed(2)} {units}. <button type="button" className="studio-chip" onClick={() => { setStore(s => ({ ...s, runs: s.runs.filter(r => r.id !== manualSaved.id) })); setManualSaved(null) }}>Undo saved activity</button></p>}
      </div>
      <div className="studio-card studio-center">
        {on('weeklyGoal') && (
          <>
            <svg className="run-goal" viewBox="0 0 160 160" aria-label={`${week.toFixed(1)} of ${goal} ${units} this week`}>
              <circle cx="80" cy="80" r="66" className="run-goal-track" />
              <circle cx="80" cy="80" r="66" className="run-goal-arc" strokeDasharray={2 * Math.PI * 66} strokeDashoffset={2 * Math.PI * 66 * (1 - Math.min(1, week / goal))} transform="rotate(-90 80 80)" />
              <text x="80" y="80" textAnchor="middle">
                {week.toFixed(1)}
              </text>
              <text x="80" y="100" textAnchor="middle" className="run-goal-sub">
                of {goal} {units}
              </text>
            </svg>
            <div className="st-scale">
              <Slider label="Weekly goal" value={goal} min={2} max={100} unit={units} onChange={(v) => setStore((s) => ({ ...s, weeklyGoal: v }))} />
            </div>
          </>
        )}
      </div>
    </div>
  )

  const terrain = () => (
    <div className="tr-page bloom-stack">
      <div className="tr-bar bloom-controls">
        {routed.length > 0 && (
          <label className="tr-pick">
            Route
            <select className="studio-input" value={terrainRun?.id ?? ''} onChange={(e) => { setSampleRoute(null); setTerrainId(e.target.value) }}>
              {[...routed].reverse().map((r) => <option key={r.id} value={r.id}>{new Date(r.at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {toUnits(r.km, units).toFixed(1)} {units} {r.kind}</option>)}
            </select>
          </label>
        )}
        {on('gpxImport') && (
          <button type="button" className="studio-chip" onClick={() => void openFiles('GPS tracks', { 'application/gpx+xml': ['.gpx'] }, true).then(importGpx)}>
            <FolderOpen size={14} /> Open GPX
          </button>
        )}
        <button type="button" className="studio-chip" onClick={() => addRoute(demoHills(Date.now() - 50 * 60_000), true)}>
          <Mountain size={14} /> Sample hilly run
        </button>
        {on('gpxExport') && terrainRun && (
          <button type="button" className="studio-chip" onClick={() => void saveFile(new Blob([toGpx(`Bloom ${terrainRun.kind}`, terrainRun.points)], { type: 'application/gpx+xml' }), `bloom-${terrainRun.kind}-${new Date(terrainRun.at).toISOString().slice(0, 10)}.gpx`, { 'application/gpx+xml': ['.gpx'] })}>
            <Download size={14} /> Export GPX
          </button>
        )}
      </div>
      {error && <p className="voice-error">{error}</p>}
      {sampleRoute && <p role="status">Sample route · excluded from activity history.</p>}
      {terrainRun ? (
        <Suspense fallback={<div className="tr tr-wait">Building the terrain…</div>}>
          <TerrainReplay run={terrainRun} units={units} />
        </Suspense>
      ) : (
        <p className="studio-empty">Open a GPX file from your watch or phone, or try the sample hilly run, to fly along it in 3D.</p>
      )}
    </div>
  )

  const records = () => (
    <div className="studio-split">
      <div className="studio-card">
        <h3>
          <Trophy size={17} /> Personal bests
        </h3>
        <div className="studio-stats">
          <Stat value={b.longest ? `${toUnits(b.longest.km, units).toFixed(1)} ${units}` : '—'} label="longest" />
          <Stat value={`${toUnits(store.runs.filter((r) => new Date(r.at).getMonth() === new Date().getMonth() && new Date(r.at).getFullYear() === new Date().getFullYear()).reduce((a, r) => a + r.km, 0), units).toFixed(1)} ${units}`} label="this month" />
          {(() => {
            const month = store.runs.filter((r) => r.kind === 'run' && r.km > 0.5 && new Date(r.at).getMonth() === new Date().getMonth() && new Date(r.at).getFullYear() === new Date().getFullYear())
            const km = month.reduce((a, r) => a + r.km, 0)
            return km > 0 ? <Stat value={fmtPace(pace(km, month.reduce((a, r) => a + r.seconds, 0), units))} label={`avg pace /${units} this month`} /> : null
          })()}
          <Stat value={b.fastest ? fmtPace(pace(b.fastest.km, b.fastest.seconds, units)) : '—'} label={`best pace /${units}`} />
          <Stat value={b.fastestSplit ? fmtTime(b.fastestSplit) : '—'} label="fastest km split" />
          <Stat value={store.runs.length} label="activities" />
        </div>
        <h3 style={{ marginTop: 16 }}>Last 8 weeks</h3>
        <WeeksChart runs={store.runs} units={units} />
        {on('units') && (
          <div style={{ marginTop: 14 }}>
            <Segmented label="Units" value={store.units} onChange={(u) => setStore((s) => ({ ...s, units: u }))} options={[{ id: 'km', label: 'Kilometres' }, { id: 'mi', label: 'Miles' }]} />
          </div>
        )}
      </div>
      <div className="studio-card">
        <h3>
          <Flag size={17} /> Recent
        </h3>
        {store.runs.length ? (
          <Rail label="Recent activities">
            {[...store.runs].reverse().map((r) => (
              <div key={r.id} role="listitem" className="run-item">
                <strong>
                  {r.kind === 'run' ? '🏃' : '🚶'} {toUnits(r.km, units).toFixed(2)} {units}
                </strong>
                <small>
                  {new Date(r.at).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {fmtTime(r.seconds)} · {fmtPace(pace(r.km, r.seconds, units))}
                </small>
                {r.points.length > 1 && (
                  <button
                    type="button"
                    className="studio-chip"
                    title="Download as GPX (Strava, Komoot, Garmin…)"
                    onClick={() => {
                      const pts = r.points.map((p) => `<trkpt lat="${p.lat}" lon="${p.lng}">${p.ele != null ? `<ele>${p.ele}</ele>` : ''}<time>${new Date(p.t).toISOString()}</time></trkpt>`).join('')
                      const gpx = `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="Bloom" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>${r.kind} ${new Date(r.at).toISOString().slice(0, 10)}</name><trkseg>${pts}</trkseg></trk></gpx>`
                      download(new Blob([gpx], { type: 'application/gpx+xml' }), `bloom-${r.kind}-${new Date(r.at).toISOString().slice(0, 10)}.gpx`)
                    }}
                  >
                    GPX
                  </button>
                )}
                {r.points.length > 1 && (
                  <button
                    type="button"
                    className="studio-chip"
                    title="Save the route as a picture to share"
                    onClick={() => {
                      const W = 1080
                      const H = 1080
                      const pad = 120
                      const lats = r.points.map((p) => p.lat)
                      const lngs = r.points.map((p) => p.lng)
                      const [minLat, maxLat, minLng, maxLng] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
                      const k = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180))
                      const span = Math.max((maxLng - minLng) * k, maxLat - minLat) || 1e-6
                      const scale = (W - pad * 2) / span
                      const x = (lng: number) => W / 2 + ((lng - (minLng + maxLng) / 2) * k) * scale
                      const y = (lat: number) => H / 2 - (lat - (minLat + maxLat) / 2) * scale
                      const c = document.createElement('canvas')
                      c.width = W
                      c.height = H
                      const g = c.getContext('2d')!
                      const grad = g.createLinearGradient(0, 0, W, H)
                      grad.addColorStop(0, '#1d2144')
                      grad.addColorStop(1, '#3f6fb5')
                      g.fillStyle = grad
                      g.fillRect(0, 0, W, H)
                      g.strokeStyle = '#ffd36e'
                      g.lineWidth = 12
                      g.lineCap = 'round'
                      g.lineJoin = 'round'
                      g.beginPath()
                      r.points.forEach((p, i) => (i ? g.lineTo(x(p.lng), y(p.lat)) : g.moveTo(x(p.lng), y(p.lat))))
                      g.stroke()
                      g.fillStyle = '#ffffff'
                      g.font = '600 44px system-ui, sans-serif'
                      g.fillText(`${toUnits(r.km, units).toFixed(2)} ${units} · ${fmtTime(r.seconds)}`, 60, H - 60)
                      g.font = '28px system-ui, sans-serif'
                      g.fillText(`${new Date(r.at).toLocaleDateString([], { dateStyle: 'medium' })} · Bloom`, 60, 80)
                      c.toBlob((b) => b && download(b, `bloom-route-${new Date(r.at).toISOString().slice(0, 10)}.png`), 'image/png')
                    }}
                  >
                    🖼
                  </button>
                )}
                <button type="button" className="studio-chip" aria-label="Delete this run" onClick={() => { if (window.confirm('Delete this run? This can’t be undone.')) setStore((s) => ({ ...s, runs: s.runs.filter((x) => x.id !== r.id) })) }}>
                  🗑
                </button>
                {on('replay') && r.points.length > 1 && (
                  <button type="button" className="studio-chip" onClick={() => playReplay(r)}>
                    <MapIcon size={13} /> Replay
                  </button>
                )}
              </div>
            ))}
          </Rail>
        ) : (
          <p className="studio-empty">Your runs and walks will appear here.</p>
        )}
      </div>
    </div>
  )

  return (
    <Studio
      name="run"
      accent="#e2553f"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#ffb199', '#9fd3ff', '#c8e6a0']} line="mountain" />}
      aside={
        on('weeklyGoal') ? (
          <span className="ex-aside">
            <Medal size={15} /> {week.toFixed(1)} / {goal} {units} this week
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'track', label: 'Track', icon: <Footprints size={15} />, render: track },
        ...(on('manual') || on('weeklyGoal') ? [{ id: 'log', label: 'Log & goal', icon: <PlusCircle size={15} />, render: manual }] : []),
        ...(on('terrain') ? [{ id: 'terrain', label: '3D replay', icon: <Mountain size={15} />, render: terrain }] : []),
        ...(on('bests') ? [{ id: 'records', label: 'Records', icon: <Trophy size={15} />, render: records }] : []),
      ]}
    />
  )
}
