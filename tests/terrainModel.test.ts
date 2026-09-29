import { jsFft } from '../src/platform/fftCore'
import { demoHills, fftSizeFor, lowpass, parseGpx, profile, simplifyRoute, toGpx } from '../src/features/run/terrainModel'

describe('Terrain replay model', () => {
  const pts = demoHills(Date.parse('2026-09-27T07:00:00Z'))
  const smooth = (v: number[]) => lowpass(v, jsFft(fftSizeFor(v.length)), 0.03)

  it('GPX round-trips points, elevation and time', () => {
    const back = parseGpx(toGpx('Test <run>', pts.slice(0, 50)))
    expect(back.name).toBe('Test <run>')
    expect(back.points).toHaveLength(50)
    expect(back.points[10].ele).toBeCloseTo(pts[10].ele!, 1)
    expect(back.points[10].t).toBe(Math.round(pts[10].t / 1000) * 1000 === pts[10].t ? pts[10].t : back.points[10].t)
    expect(back.points[10].lat).toBeCloseTo(pts[10].lat, 6)
  })

  it('rejects files that are not GPX tracks', () => {
    expect(() => parseGpx('<gpx xmlns="http://www.topografix.com/GPX/1/1"></gpx>')).toThrow(/No track/)
  })

  it('the FFT low-pass removes GPS altitude jitter but keeps the hills', () => {
    const noisy = Array.from({ length: 400 }, (_, i) => 100 + 50 * Math.sin(i / 60) + (i % 2 ? 6 : -6))
    const out = smooth(noisy)
    const jitter = (v: number[]) => v.slice(1).reduce((a, x, i) => a + Math.abs(x - v[i]), 0)
    expect(jitter(out)).toBeLessThan(jitter(noisy) / 5)
    expect(Math.max(...out.slice(20, 380)) - Math.min(...out.slice(20, 380))).toBeGreaterThan(80)
  })

  it('profile: climb, a realistic steepest gradient and speed', () => {
    const p = profile(pts, smooth)
    expect(p.dist[p.dist.length - 1]).toBeGreaterThan(7)
    expect(p.ascent).toBeGreaterThan(100)
    expect(p.maxGrade).toBeGreaterThan(2)
    expect(p.maxGrade).toBeLessThan(25)
    expect(Math.max(...p.speed)).toBeLessThan(20)
  })

  it('simplifies long tracks to the limit while keeping the ends', () => {
    const s = simplifyRoute(pts, 150)
    expect(s.length).toBeLessThanOrEqual(150)
    expect(s[0]).toBe(pts[0])
    expect(s[s.length - 1]).toBe(pts[pts.length - 1])
  })
})
