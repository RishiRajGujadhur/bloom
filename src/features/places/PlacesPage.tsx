import { subOn } from '../subFeatures'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Circle, CircleMarker, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BookOpen, Crosshair, MapPin, ShieldCheck, Trash2 } from 'lucide-react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import type { FeaturePageProps } from '../shared/pageProps'
import { toggleHabit } from '../../model'
import { readStore } from '../../components/studio/Studio'
import { MONEY_KEY, emptyMoney, categoryOf, formatMoney, type MoneyStore } from '../money/moneyModel'
import { opfsRead } from '../../platform/opfs'
import { ago, insideHabits, memoriesNear, moodExtremes, moodHexes, spendByPlace, spendRadius, type Shop } from './lifeMap'
import { clusterPlaces, readPlaces, savePlaces, type PlaceHabit, type PlacesState } from './placesStore'
import './places.css'

const moodColor = (mood: number | null) =>
  mood === null ? '#9aa3b2' : ['#6b7fd7', '#8f7ae5', '#e3a857', '#f2a65a', '#3fb07a'][Math.round(mood) - 1]

/**
 * Tile layer that keeps tiles in Cache Storage, so places you've seen render
 * offline. Falls back to the network when a tile isn't cached yet.
 */
function CachedTiles() {
  const map = useMap()
  useEffect(() => {
    const Cached = L.TileLayer.extend({
      createTile(coords: L.Coords, done: L.DoneCallback) {
        const tile = document.createElement('img')
        tile.alt = ''
        const url = (this as L.TileLayer).getTileUrl(coords)
        const load = async () => {
          try {
            if ('caches' in window && subOn('placesMap', 'offlineTiles')) {
              const cache = await caches.open('bloom-map-tiles')
              let response = await cache.match(url)
              if (!response) {
                response = await fetch(url, { mode: 'cors' })
                if (response.ok) await cache.put(url, response.clone())
              }
              tile.src = URL.createObjectURL(await response.blob())
            } else tile.src = url
          } catch {
            tile.src = url
          }
        }
        tile.onload = () => done(undefined, tile)
        tile.onerror = () => done(new Error('tile'), tile)
        void load()
        return tile
      },
    })
    const layer = new (Cached as unknown as typeof L.TileLayer)('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      className: 'places-tiles',
    })
    layer.addTo(map)
    return () => {
      layer.remove()
    }
  }, [map])
  return null
}

/** Right-click the map to copy that spot's coordinates. */
function CopyCoords() {
  useMapEvents({
    contextmenu: (e) => {
      const text = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`
      void navigator.clipboard?.writeText(text).then(() => window.dispatchEvent(new CustomEvent('bloom:toast', { detail: `Copied ${text}` })))
    },
  })
  return null
}

function FitTo({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 })
  }, [points, map])
  return null
}

const hexColor = chroma.scale(['#6b7fd7', '#8f7ae5', '#e3a857', '#f2a65a', '#3fb07a']).domain([1, 5]).mode('lch')
type Layer = 'moods' | 'hexes' | 'money' | 'memories' | 'habits'
const LAYERS: { id: Layer; label: string; sub?: string }[] = [
  { id: 'moods', label: '📍 Places' },
  { id: 'hexes', label: '⬡ Mood geography', sub: 'moodHexes' },
  { id: 'money', label: '💸 Money', sub: 'moneyLayer' },
  { id: 'memories', label: '📖 Memories', sub: 'memoryPins' },
  { id: 'habits', label: '🎯 Habits', sub: 'placeHabits' },
]
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Receipt thumbnails for a shop, read from the Origin Private File System. */
function ShopReceipts({ shop, money }: { shop: Shop; money: MoneyStore }) {
  const [urls, setUrls] = useState<string[]>([])
  useEffect(() => {
    let off = false
    const made: string[] = []
    void Promise.all(money.txns.filter((t) => shop.refs.includes(t.id) && t.receipt).slice(0, 4).map((t) => opfsRead(t.receipt!))).then((blobs) => {
      if (off) return
      blobs.forEach((b) => { if (b) made.push(URL.createObjectURL(b)) })
      setUrls(made)
    })
    return () => { off = true; made.forEach((u) => URL.revokeObjectURL(u)) }
  }, [shop, money.txns])
  return urls.length ? <div className="lm-receipts">{urls.map((u) => <img loading="lazy" decoding="async" key={u} src={u} alt="Receipt" />)}</div> : null
}

/**
 * Life Map: the Places map with a layer per feature. Mood check-ins become
 * privacy-friendly H3 hexagons, purchases become spend circles (with their
 * receipts), Daybook pages and voice memos become memory pins that resurface
 * "on this spot", and habits can be tied to places for an arrival check-in.
 */
export function PlacesPage({ data, setData, today, onNavigate }: FeaturePageProps) {
  const [state, setState] = useState<PlacesState>(readPlaces)
  const [status, setStatus] = useState('')
  // Layers and range are remembered between visits.
  const [layers, setLayersState] = useState<Set<Layer>>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('bloom-places-layers') ?? 'null') as Layer[] | null
      if (Array.isArray(saved)) return new Set<Layer>(saved)
    } catch { /* defaults */ }
    return new Set<Layer>(['hexes', 'money', 'memories', 'habits'])
  })
  const setLayers = (f: Set<Layer> | ((s: Set<Layer>) => Set<Layer>)) =>
    setLayersState((s) => {
      const n = typeof f === 'function' ? f(s) : f
      try { localStorage.setItem('bloom-places-layers', JSON.stringify([...n])) } catch { /* optional */ }
      return n
    })
  const [range, setRangeState] = useState<7 | 30 | 365 | 0>(() => {
    const v = Number(localStorage.getItem('bloom-places-range'))
    return v === 7 || v === 30 || v === 365 ? v : 0
  })
  const setRange = (r: 7 | 30 | 365 | 0) => {
    setRangeState(r)
    try { localStorage.setItem('bloom-places-range', String(r)) } catch { /* optional */ }
  }
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null)
  const [shop, setShop] = useState<Shop | null>(null)
  const [habitPick, setHabitPick] = useState('')
  const spot = useRef<HTMLDivElement>(null)
  const update = (next: PlacesState) => {
    savePlaces(next)
    setState(next)
  }
  const money = useMemo(() => readStore<MoneyStore>(MONEY_KEY, emptyMoney), [])
  const pts = useMemo(() => (range ? state.points.filter((p) => p.at >= Date.now() - range * 864e5) : state.points), [state.points, range])
  const clusters = useMemo(() => clusterPlaces(pts.filter((p) => p.kind !== 'spend')), [pts])
  const hexes = useMemo(() => moodHexes(pts), [pts])
  const extremes = moodExtremes(hexes)
  const shops = useMemo(() => spendByPlace(pts), [pts])
  const fit = useMemo(() => [...clusters, ...shops], [clusters, shops])
  const maxShop = Math.max(1, ...shops.map((s) => s.total))
  const memories = pts.filter((p) => p.kind === 'daybook' || p.kind === 'memo')
  const coffee = spendRadius(state.points, 'dining')
  const happiest = [...clusters].filter((c) => c.mood !== null).sort((a, b) => b.mood! - a.mood!)[0]
  const on = (l: Layer) => layers.has(l)
  const nearby = here && subOn('placesMap', 'onThisSpot') ? memoriesNear(state.points, here) : []
  const inside = here ? insideHabits(state.habits ?? [], here) : []

  // "On this spot…" flips in when a memory is nearby.
  useLayoutEffect(() => {
    if (!nearby.length || !spot.current || reduced()) return
    gsap.fromTo(spot.current, { y: 30, opacity: 0, rotateX: -30 }, { y: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'back.out(1.6)' })
  }, [nearby.length])

  const locate = (then?: (p: { lat: number; lng: number }) => void) => {
    if (!navigator.geolocation) return setStatus('Location is not available in this browser.')
    setStatus('Finding you…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: Math.round(pos.coords.latitude * 10000) / 10000, lng: Math.round(pos.coords.longitude * 10000) / 10000 }
        setHere(p)
        setStatus('')
        then?.(p)
      },
      () => setStatus('Location permission was not granted.'),
      { timeout: 10000 },
    )
  }
  const logHere = () => locate((p) => {
    const next = readPlaces()
    update({ ...next, points: [...next.points, { id: crypto.randomUUID(), ...p, at: Date.now(), kind: 'manual', mood: null }] })
    setStatus('Saved this place.')
  })
  const pinHabit = () => {
    const h = data.habits.find((x) => x.id === habitPick)
    if (!h) return
    locate((p) => {
      const next = readPlaces()
      const ph: PlaceHabit = { id: crypto.randomUUID(), habitId: h.id, ...p, radius: 120, label: h.title }
      update({ ...next, habits: [...(next.habits ?? []), ph] })
      setStatus(`“${h.title}” is now tied to this spot. Arrive here with Bloom open to check in.`)
    })
  }
  const checkIn = (ph: PlaceHabit) => setData((d) => (d.habits.find((h) => h.id === ph.habitId)?.dates.includes(today) ? d : toggleHabit(d, ph.habitId, today)))

  if (!state.enabled)
    return (
      <section className="places-consent" aria-label="Places">
        <ShieldCheck size={32} aria-hidden="true" />
        <h2>Your life, on a map</h2>
        <p>
          When you turn this on, Bloom saves an approximate location (about 10 m) with each mood check-in, finished
          Daybook page, voice memo and purchase. Moods are shown on hexagons, never exact spots. Nothing leaves this
          browser. Map tiles come from OpenStreetMap and are cached so the map works offline.
        </p>
        <button className="ov-primary" onClick={() => update({ ...state, enabled: true })}>
          <MapPin size={17} aria-hidden="true" /> Turn on places
        </button>
      </section>
    )

  return (
    <section className="places-page" aria-label="Life map">
      <div className="places-map">
        <div className="lm-layers" role="group" aria-label="Map layers">
          {LAYERS.filter((l) => !l.sub || subOn('placesMap', l.sub)).map((l) => (
            <button key={l.id} type="button" aria-pressed={on(l.id)} className={on(l.id) ? 'on' : ''} onClick={() => setLayers((s) => { const n = new Set(s); if (n.has(l.id)) n.delete(l.id); else n.add(l.id); return n })}>{l.label}</button>
          ))}
          <select aria-label="Time range" value={range} onChange={(e) => setRange(Number(e.target.value) as 7 | 30 | 365 | 0)}>
            <option value={0}>All time</option>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={365}>This year</option>
          </select>
        </div>
        <MapContainer center={[51.5, -0.12]} zoom={3} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <CachedTiles />
          <FitTo points={fit} />
          {on('hexes') && hexes.map((h) => (
            <Polygon key={h.id} positions={h.boundary} pathOptions={{ color: hexColor(h.mood).hex(), weight: 1.5, fillColor: hexColor(h.mood).hex(), fillOpacity: 0.35 + Math.min(0.35, h.count * 0.05) }}>
              <Tooltip>Mood {h.mood.toFixed(1)} · {h.count} check-in{h.count === 1 ? '' : 's'}</Tooltip>
            </Polygon>
          ))}
          {on('moods') && subOn('placesMap', 'heat') && clusters.map((c) => (
            <Circle key={`heat-${c.key}`} center={[c.lat, c.lng]} radius={60 + c.visits * 25} pathOptions={{ color: moodColor(c.mood), fillOpacity: 0.18, weight: 0 }} />
          ))}
          {on('moods') && clusters.map((c) => (
            <CircleMarker key={c.key} center={[c.lat, c.lng]} radius={7 + Math.min(10, c.visits)} pathOptions={{ color: '#fff', weight: 2, fillColor: moodColor(c.mood), fillOpacity: 0.95 }}>
              <Tooltip>{state.names[c.key] ?? 'Unnamed place'} · {c.visits} visit{c.visits === 1 ? '' : 's'}{c.mood !== null && ` · mood ${c.mood.toFixed(1)}`}</Tooltip>
            </CircleMarker>
          ))}
          {on('money') && shops.map((s) => (
            <CircleMarker key={s.key} center={[s.lat, s.lng]} radius={6 + Math.sqrt(s.total / maxShop) * 20} pathOptions={{ color: '#ffd166', weight: 2, fillColor: categoryOf(s.category ?? 'other').color, fillOpacity: 0.75 }} eventHandlers={{ click: () => setShop(s) }}>
              <Tooltip>{s.label} · {formatMoney(s.total, money.currency)} over {s.visits} visit{s.visits === 1 ? '' : 's'}</Tooltip>
            </CircleMarker>
          ))}
          {on('memories') && memories.map((m) => (
            <CircleMarker key={m.id} center={[m.lat, m.lng]} radius={6} pathOptions={{ color: '#fff', weight: 2, fillColor: m.kind === 'memo' ? '#ff8a3d' : '#7c5cff', fillOpacity: 1 }}>
              <Tooltip>{m.kind === 'memo' ? '🎙️' : '📖'} {m.label ?? 'A note'} · {ago(m.at)}</Tooltip>
            </CircleMarker>
          ))}
          {on('habits') && (state.habits ?? []).map((h) => (
            <Circle key={h.id} center={[h.lat, h.lng]} radius={h.radius} pathOptions={{ color: '#22c55e', weight: 2, dashArray: '6 6', fillOpacity: 0.12 }}>
              <Tooltip permanent direction="top">🎯 {h.label}</Tooltip>
            </Circle>
          ))}
          <CopyCoords />
          {here && (
            <CircleMarker center={[here.lat, here.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#0ea5e9', fillOpacity: 1 }}>
              <Tooltip>You are here</Tooltip>
            </CircleMarker>
          )}
        </MapContainer>
      </div>
      <aside className="places-side">
        <div className="lm-row bloom-controls">
          <button className="ov-primary" onClick={logHere}><Crosshair size={17} aria-hidden="true" /> Log where I am</button>
          {subOn('placesMap', 'onThisSpot') && <button className="ov-secondary" onClick={() => locate()}><BookOpen size={16} aria-hidden="true" /> What happened here?</button>}
        </div>
        {status && <p className="wb-muted" role="status">{status}</p>}
        {nearby.length > 0 && (
          <div ref={spot} className="lm-spot">
            <p className="lm-spot-eyebrow">On this spot…</p>
            <p><b>{nearby[0].p.kind === 'memo' ? '🎙️ You recorded' : '📖 You wrote'} “{nearby[0].p.label ?? 'a note'}”</b> {ago(nearby[0].p.at)}.</p>
            <button type="button" className="ov-secondary" onClick={() => onNavigate(nearby[0].p.kind === 'memo' ? 'voice' : 'daybook')}>Open it</button>
          </div>
        )}
        {inside.map((ph) => {
          const done = data.habits.find((h) => h.id === ph.habitId)?.dates.includes(today)
          return (
            <div key={ph.id} className="lm-habit-here">
              <span>🎯 You’re at <b>{ph.label}</b></span>
              <button type="button" className="ov-primary" disabled={done} onClick={() => checkIn(ph)}>{done ? 'Checked in ✓' : 'Check in'}</button>
            </div>
          )
        })}
        {extremes && subOn('placesMap', 'moodHexes') && (
          <p className="places-insight">⬡ Your moods average <strong>{extremes.best.mood.toFixed(1)}</strong> in your brightest area and <strong>{extremes.worst.mood.toFixed(1)}</strong> in your lowest.</p>
        )}
        {happiest && !extremes && <p className="places-insight">🌟 You feel best at <strong>{state.names[happiest.key] ?? 'a spot you visit'}</strong> (mood {happiest.mood!.toFixed(1)}).</p>}
        {coffee != null && subOn('placesMap', 'moneyLayer') && <p className="places-insight">☕ Your eating-out radius is <strong>{coffee < 1000 ? `${coffee} m` : `${(coffee / 1000).toFixed(1)} km`}</strong> from home.</p>}
        {shop && (
          <div className="lm-shop">
            <h3>{shop.label}</h3>
            <p>{formatMoney(shop.total, money.currency)} over {shop.visits} visit{shop.visits === 1 ? '' : 's'} · {categoryOf(shop.category ?? 'other').emoji} {categoryOf(shop.category ?? 'other').name}</p>
            <ShopReceipts shop={shop} money={money} />
          </div>
        )}
        {subOn('placesMap', 'placeHabits') && data.habits.length > 0 && (
          <div className="lm-pin">
            <h3>Tie a habit to a place</h3>
            <div className="lm-row bloom-controls">
              <select aria-label="Habit" value={habitPick} onChange={(e) => setHabitPick(e.target.value)}>
                <option value="">Choose a habit…</option>
                {data.habits.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
              </select>
              <button type="button" className="ov-secondary" disabled={!habitPick} onClick={pinHabit}>📍 Pin here</button>
            </div>
          </div>
        )}
        <h3>Your places</h3>
        {clusters.length === 0 && <p className="wb-muted">Check in your mood to start filling the map.</p>}
        <ul className="places-list bloom-list">
          {clusters.slice(0, 12).map((c) => (
            <li key={c.key}>
              <span className="places-dot" style={{ background: moodColor(c.mood) }} aria-hidden="true" />
              {subOn('placesMap', 'naming') ? (
                <input aria-label="Name this place" placeholder="Name this place" value={state.names[c.key] ?? ''} maxLength={40} onChange={(e) => update({ ...state, names: { ...state.names, [c.key]: e.target.value } })} />
              ) : (
                <span>{state.names[c.key] ?? `${c.lat.toFixed(3)}, ${c.lng.toFixed(3)}`}</span>
              )}
              <small>{c.visits}× {c.mood !== null && `· ${c.mood.toFixed(1)}`}</small>
            </li>
          ))}
        </ul>
        <button className="ov-secondary" onClick={() => { update({ enabled: false, points: [], names: {}, habits: [] }); void caches?.delete?.('bloom-map-tiles') }}>
          <Trash2 size={16} aria-hidden="true" /> Turn off and erase
        </button>
      </aside>
    </section>
  )
}
