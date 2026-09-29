import { gpx } from '@tmcw/togeojson'
import simplify from 'simplify-js'
import type { RealFft } from '../../platform/fftCore'
import { distanceKm, type Pt } from './runModel'

/**
 * Terrain Replay model: GPX in and out, the elevation profile (smoothed with
 * an FFT low-pass, because GPS altitude is noisy), speed, gradient and climb,
 * and the route projected into metres for the 3D ribbon.
 */

/** Reads the first track in a GPX file into points (with elevation where present). */
export function parseGpx(xml: string): { name: string; points: Pt[] } {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.getElementsByTagName('parsererror').length) throw new Error('This file is not valid GPX.')
  const fc = gpx(doc)
  for (const f of fc.features) {
    const g = f.geometry
    if (!g) continue
    const lines = g.type === 'LineString' ? [g.coordinates] : g.type === 'MultiLineString' ? g.coordinates : []
    const coords = lines.flat()
    if (coords.length < 2) continue
    const cp = (f.properties as { coordinateProperties?: { times?: string[] | string[][] } } | null)?.coordinateProperties
    const times = (cp?.times ?? []).flat() as string[]
    const start = Date.parse(times[0] ?? '') || Date.now()
    const points: Pt[] = coords.map((c, i) => ({
      lng: c[0],
      lat: c[1],
      ele: c.length > 2 ? c[2] : undefined,
      // No timestamps: assume an easy 6:00/km so replays still flow.
      t: times[i] ? Date.parse(times[i]) : start + i * 1000,
    }))
    if (!times.length) {
      let d = 0
      for (let i = 1; i < points.length; i++) {
        d += distanceKm([points[i - 1], points[i]])
        points[i].t = start + d * 360_000
      }
    }
    return { name: String((f.properties as { name?: string } | null)?.name ?? 'Imported route'), points }
  }
  throw new Error('No track found in this GPX file.')
}

const esc = (s: string) => s.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' })[c]!)

export function toGpx(name: string, points: Pt[]) {
  const pts = points
    .map((p) => `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}">${p.ele != null ? `<ele>${p.ele.toFixed(1)}</ele>` : ''}<time>${new Date(p.t).toISOString()}</time></trkpt>`)
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Bloom" xmlns="http://www.topografix.com/GPX/1/1">
  <trk><name>${esc(name)}</name><trkseg>
${pts}
  </trkseg></trk>
</gpx>
`
}

/** Keeps the route's shape with far fewer points (Ramer–Douglas–Peucker, ~1 m tolerance). */
export function simplifyRoute(points: Pt[], max = 1500): Pt[] {
  if (points.length <= max) return points
  const lat0 = points[0].lat
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  const idx = new Map<object, Pt>()
  const xy = points.map((p) => {
    const o = { x: p.lng * kx, y: p.lat * 110_540 }
    idx.set(o, p)
    return o
  })
  let tol = 1
  let out = simplify(xy, tol, true)
  while (out.length > max) out = simplify(xy, (tol *= 1.6), true)
  return out.map((o) => idx.get(o)!)
}

/** Next size PFFFT accepts (a power of two ≥ 32). */
const fftSize = (n: number) => Math.max(32, 2 ** Math.ceil(Math.log2(n)))

/**
 * Low-pass filter by FFT: pad smoothly back to the start (so the ends don't ring), transform,
 * zero everything above `keep` of the spectrum with a soft roll-off, invert.
 */
export function lowpass(values: number[], fft: RealFft, keep = 0.04): number[] {
  const n = values.length
  if (n < 4) return values.slice()
  const N = fft.n
  const buf = new Float32Array(N)
  // The FFT treats the signal as periodic: after the data, ease smoothly from
  // the last value back to the first so the wrap-around has no jump to ring on.
  for (let i = 0; i < n; i++) buf[i] = values[i]
  const tail = N - n
  for (let i = 0; i < tail; i++) {
    const f = 0.5 - 0.5 * Math.cos((Math.PI * (i + 1)) / (tail + 1))
    buf[n + i] = values[n - 1] + (values[0] - values[n - 1]) * f
  }
  const spec = new Float32Array(N)
  fft.forward(buf, spec)
  const bins = N / 2
  const cut = Math.max(2, Math.round(bins * keep))
  const roll = (k: number) => (k <= cut ? 1 : k >= cut * 2 ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * (k - cut)) / cut))
  spec[1] *= roll(bins)
  for (let k = 1; k < bins; k++) {
    spec[2 * k] *= roll(k)
    spec[2 * k + 1] *= roll(k)
  }
  const back = new Float32Array(N)
  fft.inverse(spec, back)
  return Array.from({ length: n }, (_, i) => back[i] / N)
}
export const fftSizeFor = (n: number) => fftSize(2 * n)

export type Profile = { dist: number[]; ele: number[]; speed: number[]; grade: number[]; ascent: number; descent: number; maxGrade: number; minEle: number; maxEle: number }

/** Distance (km), smoothed elevation (m), speed (km/h) and gradient (%) along the route. */
export function profile(points: Pt[], smooth: (v: number[]) => number[]): Profile {
  const dist = [0]
  for (let i = 1; i < points.length; i++) dist.push(dist[i - 1] + distanceKm([points[i - 1], points[i]]))
  const rawEle = points.map((p) => p.ele ?? 0)
  const ele = points.some((p) => p.ele != null) ? smooth(rawEle) : rawEle
  const rawSpeed = points.map((_, i) => {
    const j = Math.min(points.length - 1, i + 3)
    const k = Math.max(0, i - 3)
    const dt = (points[j].t - points[k].t) / 3_600_000
    return dt > 0 ? (dist[j] - dist[k]) / dt : 0
  })
  const speed = rawSpeed.map((v) => Math.min(40, v))
  // Gradient over at least ~60 m either side, so GPS jitter on tight turns can't fake a wall.
  const grade = ele.map((_, i) => {
    let j = i
    let k = i
    while (j < ele.length - 1 && dist[j] - dist[i] < 0.06) j++
    while (k > 0 && dist[i] - dist[k] < 0.06) k--
    const run = (dist[j] - dist[k]) * 1000
    return run > 20 ? ((ele[j] - ele[k]) / run) * 100 : 0
  })
  let ascent = 0
  let descent = 0
  for (let i = 1; i < ele.length; i++) {
    const d = ele[i] - ele[i - 1]
    if (d > 0) ascent += d
    else descent -= d
  }
  return {
    dist,
    ele,
    speed,
    grade,
    ascent,
    descent,
    maxGrade: Math.max(0, ...grade),
    minEle: Math.min(...ele),
    maxEle: Math.max(...ele),
  }
}

/** Route in local metres around its centre (x east, z south) for the 3D scene. */
export function toLocal(points: Pt[]) {
  const lat0 = points.reduce((a, p) => a + p.lat, 0) / points.length
  const lng0 = points.reduce((a, p) => a + p.lng, 0) / points.length
  const kx = 111_320 * Math.cos((lat0 * Math.PI) / 180)
  return points.map((p) => ({ x: (p.lng - lng0) * kx, z: -(p.lat - lat0) * 110_540 }))
}

/** A hilly demo loop (Surrey-hills-like) with realistic, slightly noisy GPS altitude. */
export function demoHills(start = Date.now()): Pt[] {
  const c = { lat: 51.2556, lng: -0.3197 }
  const pts: Pt[] = []
  const n = 600
  const km = 8.2
  const r = km / (2 * Math.PI) / 111
  let seed = 11
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1
  let t = start
  let prev: Pt | null = null
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const wob = 1 + 0.18 * Math.sin(a * 3) + 0.06 * Math.sin(a * 11)
    const ele = 120 + 75 * Math.sin(a - 0.6) ** 2 + 28 * Math.sin(a * 4) + 9 * Math.sin(a * 9) + rnd() * 4
    const p: Pt = { lat: c.lat + r * wob * Math.sin(a), lng: c.lng + (r * wob * Math.cos(a)) / Math.cos((c.lat * Math.PI) / 180), ele, t }
    if (prev) {
      const d = distanceKm([prev, p])
      const grade = ((p.ele! - prev.ele!) / Math.max(1, d * 1000)) * 100
      // Slower uphill, faster downhill (seconds per km).
      const secPerKm = 330 + Math.max(-60, Math.min(160, grade * 14)) + rnd() * 12
      t += d * secPerKm * 1000
      p.t = t
    }
    pts.push(p)
    prev = p
  }
  return pts
}
