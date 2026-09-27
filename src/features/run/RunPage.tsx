import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Flag, Footprints, Map as MapIcon, Medal, Pause, Play, PlusCircle, Route, Square, Trophy } from 'lucide-react'
import { Rail, Segmented, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { RUN_KEY, bests, demoRoute, distanceKm, fmtPace, fmtTime, pace, pointAt, splits, toUnits, weekKm, type Pt, type Run, type RunStore } from './runModel'
import { Strider } from '../showcase/Strider'
import { usePageActions } from '../../components/ui/PageMenu'
import './run.css'

const on = (id: string) => subOn('runTracker', id)
const say = (t: string) => {
  try {
    speechSynthesis.speak(new SpeechSynthesisUtterance(t))
  } catch {
    /* optional */
  }
}

/** Leaflet map with the live route and an optional replay marker. */
function RouteMap({ points, replay }: { points: Pt[]; replay: number | null }) {
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
      if (ll.length > 1) m.fitBounds(L.latLngBounds(ll), { padding: [30, 30], maxZoom: 16, animate: true })
      else m.setView(ll[0], 16)
    }
  }, [points])
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
  const [kind, setKind] = useState<'run' | 'walk'>('run')
  const [points, setPoints] = useState<Pt[]>([])
  const [status, setStatus] = useState<'idle' | 'tracking' | 'paused' | 'demo'>('idle')
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())
  const [startedAt, setStartedAt] = useState(0)
  const [pausedFor, setPausedFor] = useState(0)
  const [replay, setReplay] = useState<number | null>(null)
  const [viewing, setViewing] = useState<Run | null>(null)
  const [manKm, setManKm] = useState(5)
  const [manMin, setManMin] = useState(30)
  const watch = useRef<number | null>(null)
  const pauseStart = useRef(0)
  const spoken = useRef(0)
  const finishBtn = useRef<HTMLButtonElement>(null)

  const km = distanceKm(points)
  const seconds = startedAt ? (status === 'demo' && points.length ? (points[points.length - 1].t - points[0].t) / 1000 : (now - startedAt - pausedFor) / 1000) : 0
  const split = splits(points, units)

  useEffect(() => {
    if (status !== 'tracking') return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [status])
  useEffect(() => {
    if (!on('voiceSplits') || split.length <= spoken.current) return
    spoken.current = split.length
    say(`${split.length} ${units === 'mi' ? 'mile' : 'kilometre'}${split.length > 1 ? 's' : ''}. Last split ${Math.floor(split[split.length - 1] / 60)} minutes ${Math.round(split[split.length - 1] % 60)} seconds.`)
  }, [split, units])

  const start = () => {
    setError('')
    if (!on('gps') || !('geolocation' in navigator)) return setError('GPS isn’t available here. Try the demo route or log a run by hand.')
    setPoints([])
    spoken.current = 0
    setStartedAt(Date.now())
    setPausedFor(0)
    setStatus('tracking')
    watch.current = navigator.geolocation.watchPosition(
      (p) => {
        if (p.coords.accuracy > 40) return
        setPoints((list) => [...list, { lat: p.coords.latitude, lng: p.coords.longitude, t: p.timestamp }])
      },
      () => setError('Location permission was not granted.'),
      { enableHighAccuracy: true, maximumAge: 2000 },
    )
  }
  const pause = () => {
    if (status === 'tracking') {
      pauseStart.current = Date.now()
      setStatus('paused')
    } else if (status === 'paused') {
      setPausedFor((p) => p + Date.now() - pauseStart.current)
      setStatus('tracking')
    }
  }
  const demo = () => {
    const route = demoRoute(undefined, 3, Date.now())
    setStartedAt(route[0].t)
    setStatus('demo')
    spoken.current = 0
    let i = 1
    setPoints(route.slice(0, 1))
    const t = setInterval(() => {
      i += 3
      setPoints(route.slice(0, Math.min(i, route.length)))
      if (i >= route.length) clearInterval(t)
    }, 60)
  }
  const finish = () => {
    if (watch.current !== null) navigator.geolocation.clearWatch(watch.current)
    watch.current = null
    if (km > 0.05) {
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
    const run: Run = { id: crypto.randomUUID(), at: Date.now(), kind, km: units === 'mi' ? manKm * 1.609344 : manKm, seconds: manMin * 60, points: [], manual: true }
    setStore((s) => ({ ...s, runs: [...s.runs, run] }))
    logActivity(kind, { km: run.km })
    burst(null, 'stars')
  }
  const playReplay = (run: Run) => {
    setViewing(run)
    setTab('track')
    setPoints(run.points)
    let f = 0
    const t = setInterval(() => {
      f += 0.01
      setReplay(Math.min(1, f))
      if (f >= 1) {
        clearInterval(t)
        setTimeout(() => setReplay(null), 800)
      }
    }, 40)
  }

  const b = bests(store.runs)
  const week = toUnits(weekKm(store.runs), units)
  const goal = store.weeklyGoal
  const active = status === 'tracking' || status === 'paused' || status === 'demo'

  usePageActions(!active ? [{ id: 'run-go', label: `Start a ${kind}`, icon: kind === 'walk' ? '🚶' : '🏃', run: start }, { id: 'run-demo', label: 'Play a demo route', icon: '🗺️', run: demo }] : status !== 'demo' ? [{ id: 'run-pause', label: status === 'paused' ? 'Resume' : 'Pause', icon: '⏯️', run: pause }] : [])
  const track = () => (
    <div className="studio-split run-split">
      <div className="studio-card run-map-card">{on('map') ? <RouteMap points={points} replay={replay} /> : <div className="studio-center">Map is off</div>}</div>
      <div className="studio-card run-side">
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
                  {status === 'paused' ? <Play size={16} /> : <Pause size={16} />} {status === 'paused' ? 'Resume' : 'Pause'}
                </button>
              )}
              <button ref={finishBtn} type="button" className="studio-go" onClick={finish}>
                <Square size={16} /> Finish
              </button>
            </>
          )}
        </div>
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
      <div className="studio-card run-side">
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

  const records = () => (
    <div className="studio-split">
      <div className="studio-card">
        <h3>
          <Trophy size={17} /> Personal bests
        </h3>
        <div className="studio-stats">
          <Stat value={b.longest ? `${toUnits(b.longest.km, units).toFixed(1)} ${units}` : '—'} label="longest" />
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
        ...(on('bests') ? [{ id: 'records', label: 'Records', icon: <Trophy size={15} />, render: records }] : []),
      ]}
    />
  )
}
