import { insideHabits, memoriesNear, moodExtremes, moodHexes, spendByPlace, spendRadius } from '../src/features/places/lifeMap'
import type { PlacePoint } from '../src/features/places/placesStore'

const now = Date.parse('2026-09-30T12:00:00Z')
let n = 0
const pt = (lat: number, lng: number, extra: Partial<PlacePoint> = {}): PlacePoint => ({ id: String(n++), lat, lng, at: now - 30 * 864e5, kind: 'mood', mood: null, ...extra })

describe('Life Map', () => {
  // Home in central Bristol, a park ~1.5 km away.
  const home = { lat: 51.4545, lng: -2.5879 }
  const park = { lat: 51.4620, lng: -2.6050 }
  const points = [
    ...Array.from({ length: 6 }, () => pt(home.lat, home.lng, { mood: 2 })),
    ...Array.from({ length: 4 }, () => pt(park.lat, park.lng, { mood: 5 })),
    pt(home.lat + 0.004, home.lng, { kind: 'spend', label: 'Bean There', amount: 350, category: 'dining', ref: 't1' }),
    pt(home.lat + 0.004, home.lng, { kind: 'spend', label: 'Bean There', amount: 420, category: 'dining', ref: 't2' }),
    pt(park.lat, park.lng, { kind: 'daybook', label: 'Sunday by the lake', ref: 'd1' }),
  ]

  it('bins moods into H3 hexagons and finds the best and worst areas', () => {
    const hexes = moodHexes(points)
    expect(hexes.length).toBe(2)
    expect(hexes[0].boundary.length).toBe(6)
    const ex = moodExtremes(hexes)!
    expect(ex.best.mood).toBe(5)
    expect(ex.worst.mood).toBe(2)
  })

  it('groups spending by shop and measures the eating-out radius from home', () => {
    const shops = spendByPlace(points)
    expect(shops[0]).toMatchObject({ label: 'Bean There', total: 770, visits: 2, refs: ['t1', 't2'] })
    const r = spendRadius(points, 'dining')!
    expect(r).toBeGreaterThan(400)
    expect(r).toBeLessThan(500)
  })

  it('surfaces a memory written on this spot, but not brand-new ones', () => {
    expect(memoriesNear(points, park, now)[0].p.label).toBe('Sunday by the lake')
    expect(memoriesNear(points, home, now)).toHaveLength(0)
    expect(memoriesNear([{ ...points[points.length - 1], at: now - 864e5 }], park, now)).toHaveLength(0)
  })

  it('detects when you are inside a habit geofence', () => {
    const gym = { id: 'g', habitId: 'h1', lat: park.lat, lng: park.lng, radius: 120, label: 'Gym' }
    expect(insideHabits([gym], { lat: park.lat + 0.0005, lng: park.lng })).toHaveLength(1)
    expect(insideHabits([gym], home)).toHaveLength(0)
  })
})
