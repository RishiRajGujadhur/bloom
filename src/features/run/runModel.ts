import { along, length, lineString } from '@turf/turf'

export type Pt = { lat: number; lng: number; t: number; ele?: number }
export type Run = { id: string; at: number; kind: 'run' | 'walk'; km: number; seconds: number; points: Pt[]; manual?: boolean }
export type RunStore = { runs: Run[]; units: 'km' | 'mi'; weeklyGoal: number; autoPause?: boolean }
export const RUN_KEY = 'bloom-runs-v1'
export const MI = 1.609344

/** Distance of a GPS track in km (geodesic, via turf). */
export function distanceKm(points: Pt[]) {
  if (points.length < 2) return 0
  return length(lineString(points.map((p) => [p.lng, p.lat])), { units: 'kilometers' })
}

/** Seconds per km (or per mile). */
export const pace = (km: number, seconds: number, units: 'km' | 'mi' = 'km') => (km > 0 ? seconds / (units === 'mi' ? km / MI : km) : 0)
export const fmtPace = (secPerUnit: number) => (secPerUnit > 0 && Number.isFinite(secPerUnit) ? `${Math.floor(secPerUnit / 60)}'${String(Math.round(secPerUnit % 60)).padStart(2, '0')}"` : '—')
export const fmtTime = (s: number) => {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}
export const toUnits = (km: number, units: 'km' | 'mi') => (units === 'mi' ? km / MI : km)

/** Time for each whole km (or mile): walks the track, interpolating the crossing. */
export function splits(points: Pt[], units: 'km' | 'mi' = 'km') {
  const unit = units === 'mi' ? MI : 1
  const out: number[] = []
  let dist = 0
  let lastT = points[0]?.t ?? 0
  let next = unit
  for (let i = 1; i < points.length; i++) {
    const seg = distanceKm([points[i - 1], points[i]])
    const dt = points[i].t - points[i - 1].t
    while (seg > 0 && dist + seg >= next) {
      const frac = (next - dist) / seg
      const crossT = points[i - 1].t + dt * frac
      out.push((crossT - lastT) / 1000)
      lastT = crossT
      next += unit
    }
    dist += seg
  }
  return out
}

/** Position at a fraction 0–1 of the route, for replays. */
export function pointAt(points: Pt[], frac: number) {
  if (points.length < 2) return points[0] ?? null
  const line = lineString(points.map((p) => [p.lng, p.lat]))
  const d = length(line, { units: 'kilometers' }) * Math.max(0, Math.min(1, frac))
  const [lng, lat] = along(line, d, { units: 'kilometers' }).geometry.coordinates
  return { lat, lng }
}

export function bests(runs: Run[]) {
  const real = runs.filter((r) => r.kind === 'run' && r.km > 0.5)
  const longest = [...runs].sort((a, b) => b.km - a.km)[0]
  const fastest = [...real].sort((a, b) => pace(a.km, a.seconds) - pace(b.km, b.seconds))[0]
  const fastestSplit = real.flatMap((r) => splits(r.points)).sort((a, b) => a - b)[0]
  return { longest, fastest, fastestSplit }
}

export function weekKm(runs: Run[], now = Date.now()) {
  const d = new Date(now)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return runs.filter((r) => r.at >= d.getTime()).reduce((t, r) => t + r.km, 0)
}

/** A gentle loop around a park, for trying the tracker without GPS. */
export function demoRoute(center = { lat: 51.5074, lng: -0.1657 }, km = 3, start = Date.now()) {
  const pts: Pt[] = []
  const n = 120
  const r = km / (2 * Math.PI) / 111
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const wobble = 1 + 0.12 * Math.sin(a * 5)
    pts.push({ lat: center.lat + r * wobble * Math.sin(a), lng: center.lng + (r * wobble * Math.cos(a)) / Math.cos((center.lat * Math.PI) / 180), t: start + i * ((km * 330 * 1000) / n) })
  }
  return pts
}

/** Metres between two points (equirectangular; fine for a few hundred metres). */
export function metresBetween(a: Pt, b: Pt) {
  const R = 6371000
  const x = ((b.lng - a.lng) * Math.PI) / 180 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180)
  const y = ((b.lat - a.lat) * Math.PI) / 180
  return Math.sqrt(x * x + y * y) * R
}

/** Auto-pause: true when every fix in the last `windowSec` stayed within `radius` metres of the latest one. */
export function isStationary(points: Pt[], now: number, windowSec = 20, radius = 10) {
  if (points.length < 2) return false
  const last = points[points.length - 1]
  if (now - points[0].t < windowSec * 1000) return false
  const recent = points.filter((p) => now - p.t <= windowSec * 1000)
  // No fresh fixes at all also counts as standing still (GPS only reports on movement on some phones).
  if (!recent.length) return now - last.t >= windowSec * 1000
  return recent.every((p) => metresBetween(p, last) <= radius)
}
