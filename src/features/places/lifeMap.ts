import { cellToBoundary, latLngToCell } from 'h3-js'
import { distance, point } from '@turf/turf'
import type { PlaceHabit, PlacePoint } from './placesStore'

/**
 * Life Map analysis: mood geography on H3 hexagons (never exact spots),
 * spending by place, memories near where you are now, and habit geofences.
 */
export const HEX_RES = 9 // ≈ 0.1 km² cells: coarse enough to be private, fine enough to separate places.

export type Hex = { id: string; boundary: [number, number][]; mood: number; count: number }
export function moodHexes(points: PlacePoint[], res = HEX_RES): Hex[] {
  const cells = new Map<string, number[]>()
  for (const p of points) if (p.mood != null) {
    const id = latLngToCell(p.lat, p.lng, res)
    cells.set(id, [...(cells.get(id) ?? []), p.mood])
  }
  return [...cells.entries()].map(([id, moods]) => ({ id, boundary: cellToBoundary(id) as [number, number][], mood: moods.reduce((a, b) => a + b, 0) / moods.length, count: moods.length }))
}

/** Best and worst neighbourhoods (with at least `min` check-ins each). */
export function moodExtremes(hexes: Hex[], min = 2) {
  const ok = hexes.filter((h) => h.count >= min).sort((a, b) => b.mood - a.mood)
  return ok.length >= 2 ? { best: ok[0], worst: ok[ok.length - 1] } : null
}

const km = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => distance(point([a.lng, a.lat]), point([b.lng, b.lat]), { units: 'kilometers' })

/** Where you spend most time: the densest mood/daybook/manual cluster. */
export function homeBase(points: PlacePoint[]) {
  const own = points.filter((p) => p.kind !== 'spend')
  if (!own.length) return null
  const cells = new Map<string, PlacePoint[]>()
  for (const p of own) { const id = latLngToCell(p.lat, p.lng, 8); cells.set(id, [...(cells.get(id) ?? []), p]) }
  const best = [...cells.values()].sort((a, b) => b.length - a.length)[0]
  return { lat: best.reduce((a, p) => a + p.lat, 0) / best.length, lng: best.reduce((a, p) => a + p.lng, 0) / best.length }
}

export type Shop = { key: string; label: string; lat: number; lng: number; total: number; visits: number; category?: string; refs: string[] }
export function spendByPlace(points: PlacePoint[]): Shop[] {
  const m = new Map<string, Shop>()
  for (const p of points) if (p.kind === 'spend') {
    const key = `${(p.label ?? '').toLowerCase()}|${latLngToCell(p.lat, p.lng, 10)}`
    const s = m.get(key) ?? { key, label: p.label || 'Unknown shop', lat: p.lat, lng: p.lng, total: 0, visits: 0, category: p.category, refs: [] }
    s.total += p.amount ?? 0
    s.visits++
    if (p.ref) s.refs.push(p.ref)
    m.set(key, s)
  }
  return [...m.values()].sort((a, b) => b.total - a.total)
}

/** Median distance (m) from home to where you spend in a category — "your coffee radius". */
export function spendRadius(points: PlacePoint[], category: string) {
  const home = homeBase(points)
  const d = points.filter((p) => p.kind === 'spend' && p.category === category).map((p) => (home ? km(home, p) * 1000 : 0)).sort((a, b) => a - b)
  return home && d.length ? Math.round(d[Math.floor(d.length / 2)]) : null
}

/** Memories (Daybook pages, voice memos) within `radiusM` of here, at least `minAgeDays` old, nearest first. */
export function memoriesNear(points: PlacePoint[], here: { lat: number; lng: number }, now = Date.now(), radiusM = 150, minAgeDays = 7) {
  return points
    .filter((p) => (p.kind === 'daybook' || p.kind === 'memo') && now - p.at >= minAgeDays * 864e5)
    .map((p) => ({ p, m: km(here, p) * 1000 }))
    .filter((x) => x.m <= radiusM)
    .sort((a, b) => a.m - b.m)
}

/** Habit geofences you're currently inside. */
export function insideHabits(habits: PlaceHabit[], here: { lat: number; lng: number }) {
  return habits.filter((h) => km(here, h) * 1000 <= h.radius)
}

export const ago = (at: number, now = Date.now()) => {
  const d = Math.round((now - at) / 864e5)
  return d >= 365 ? `${Math.round(d / 365)} year${d >= 730 ? 's' : ''} ago` : d >= 60 ? `${Math.round(d / 30)} months ago` : d >= 14 ? `${Math.round(d / 7)} weeks ago` : `${d} days ago`
}
