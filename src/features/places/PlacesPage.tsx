import { subOn } from '../subFeatures'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Circle, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Crosshair, MapPin, ShieldCheck, Trash2 } from 'lucide-react'
import { clusterPlaces, readPlaces, savePlaces, type PlacesState } from './placesStore'
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

function FitTo({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), { padding: [40, 40], maxZoom: 15 })
  }, [points, map])
  return null
}

export function PlacesPage() {
  const [state, setState] = useState<PlacesState>(readPlaces)
  const [status, setStatus] = useState('')
  const update = (next: PlacesState) => {
    savePlaces(next)
    setState(next)
  }
  const clusters = useMemo(() => clusterPlaces(state.points), [state.points])
  const happiest = [...clusters].filter((c) => c.mood !== null).sort((a, b) => b.mood! - a.mood!)[0]
  const logHere = () => {
    if (!navigator.geolocation) return setStatus('Location is not available in this browser.')
    setStatus('Finding you…')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = readPlaces()
        update({
          ...next,
          points: [
            ...next.points,
            {
              id: crypto.randomUUID(),
              lat: Math.round(pos.coords.latitude * 10000) / 10000,
              lng: Math.round(pos.coords.longitude * 10000) / 10000,
              at: Date.now(),
              kind: 'manual',
              mood: null,
            },
          ],
        })
        setStatus('Saved this place.')
      },
      () => setStatus('Location permission was not granted.'),
      { timeout: 10000 },
    )
  }

  if (!state.enabled)
    return (
      <section className="places-consent" aria-label="Places">
        <ShieldCheck size={32} aria-hidden="true" />
        <h2>See where you feel your best</h2>
        <p>
          When you turn this on, Bloom saves an approximate location (about 10 m) with each mood check-in and
          completed Daybook page. It never leaves this browser. Map tiles are loaded from OpenStreetMap and cached
          so the map works offline.
        </p>
        <button className="ov-primary" onClick={() => update({ ...state, enabled: true })}>
          <MapPin size={17} aria-hidden="true" /> Turn on places
        </button>
      </section>
    )

  return (
    <section className="places-page" aria-label="Places">
      <div className="places-map">
        <MapContainer center={[51.5, -0.12]} zoom={3} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
          <CachedTiles />
          <FitTo points={clusters} />
          {subOn('placesMap', 'heat') && clusters.map((c) => (
            <Circle
              key={`heat-${c.key}`}
              center={[c.lat, c.lng]}
              radius={60 + c.visits * 25}
              pathOptions={{ color: moodColor(c.mood), fillOpacity: 0.18, weight: 0 }}
            />
          ))}
          {clusters.map((c) => (
            <CircleMarker
              key={c.key}
              center={[c.lat, c.lng]}
              radius={7 + Math.min(10, c.visits)}
              pathOptions={{ color: '#fff', weight: 2, fillColor: moodColor(c.mood), fillOpacity: 0.95 }}
            >
              <Tooltip>
                {state.names[c.key] ?? 'Unnamed place'} · {c.visits} visit{c.visits === 1 ? '' : 's'}
                {c.mood !== null && ` · mood ${c.mood.toFixed(1)}`}
              </Tooltip>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
      <aside className="places-side">
        <button className="ov-primary" onClick={logHere}>
          <Crosshair size={17} aria-hidden="true" /> Log where I am
        </button>
        {status && <p className="wb-muted" role="status">{status}</p>}
        {happiest && (
          <p className="places-insight">
            🌟 You feel best at <strong>{state.names[happiest.key] ?? 'a spot you visit'}</strong> (mood{' '}
            {happiest.mood!.toFixed(1)}).
          </p>
        )}
        <h3>Your places</h3>
        {clusters.length === 0 && <p className="wb-muted">Check in your mood to start filling the map.</p>}
        <ul className="places-list">
          {clusters.slice(0, 12).map((c) => (
            <li key={c.key}>
              <span className="places-dot" style={{ background: moodColor(c.mood) }} aria-hidden="true" />
              <input
                aria-label="Name this place"
                placeholder="Name this place"
                value={state.names[c.key] ?? ''}
                maxLength={40}
                onChange={(e) => update({ ...state, names: { ...state.names, [c.key]: e.target.value } })}
              />
              <small>
                {c.visits}× {c.mood !== null && `· ${c.mood.toFixed(1)}`}
              </small>
            </li>
          ))}
        </ul>
        <button
          className="ov-secondary"
          onClick={() => {
            update({ enabled: false, points: [], names: {} })
            void caches?.delete?.('bloom-map-tiles')
          }}
        >
          <Trash2 size={16} aria-hidden="true" /> Turn off and erase
        </button>
      </aside>
    </section>
  )
}
