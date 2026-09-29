import { antisolar, callWindow, isDay, localTime, subsolar } from '../src/features/people/globeModel'

describe('People on the globe', () => {
  it('puts the sun over the tropic of Cancer at the June solstice, near Greenwich at noon UTC', () => {
    const s = subsolar(new Date('2026-06-21T12:00:00Z'))
    expect(s.lat).toBeCloseTo(23.44, 0)
    expect(Math.abs(s.lng)).toBeLessThan(3)
  })
  it('puts the sun over the equator at the equinox, over the Pacific at midnight UTC', () => {
    const s = subsolar(new Date('2026-03-20T00:00:00Z'))
    expect(Math.abs(s.lat)).toBeLessThan(1)
    expect(Math.abs(Math.abs(s.lng) - 180)).toBeLessThan(3)
    const a = antisolar(new Date('2026-03-20T00:00:00Z'))
    expect(Math.abs(a.lng)).toBeLessThan(3)
  })
  it('knows day from night', () => {
    const noonLondon = new Date('2026-09-30T12:00:00Z')
    expect(isDay(51.5, -0.1, noonLondon)).toBe(true)
    expect(isDay(-33.9, 151.2, noonLondon)).toBe(false) // Sydney, 10 pm
  })
  it('local time and a sensible call window across time zones', () => {
    const d = new Date('2026-09-30T08:00:00Z')
    expect(localTime('Asia/Tokyo', d).hour).toBe(17)
    expect(localTime('America/New_York', d).hour).toBe(4)
    expect(callWindow('Asia/Tokyo', 'Europe/London', d)).toMatchObject({ good: true, awake: true })
    expect(callWindow('America/New_York', 'Europe/London', d)).toMatchObject({ good: false, awake: false })
  })
})
