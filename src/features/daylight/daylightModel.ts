import * as SunCalc from 'suncalc'

export type Place = { name: string; lat: number; lng: number; tz?: string }
export const cities: Place[] = [
  { name: 'London', lat: 51.5074, lng: -0.1278, tz: 'Europe/London' },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, tz: 'Europe/Paris' },
  { name: 'Port Louis', lat: -20.1609, lng: 57.5012, tz: 'Indian/Mauritius' },
  { name: 'New York', lat: 40.7128, lng: -74.006, tz: 'America/New_York' },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194, tz: 'America/Los_Angeles' },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, tz: 'Asia/Tokyo' },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, tz: 'Australia/Sydney' },
  { name: 'Mumbai', lat: 19.076, lng: 72.8777, tz: 'Asia/Kolkata' },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241, tz: 'Africa/Johannesburg' },
]

export type DaylightStore = { place: Place; wake: string; caffeineGap: number; windDownGap: number; lightGoal: number; log: { date: string; minutes: number }[] }
export const DAYLIGHT_KEY = 'bloom-daylight-v1'

export function sunTimes(date: Date, p: Place) {
  const t = SunCalc.getTimes(date, p.lat, p.lng)
  const moon = SunCalc.getMoonIllumination(date)
  // Polar day/night: suncalc returns invalid dates; fall back to noon ± 6 h.
  const noon = t.solarNoon && !isNaN(+t.solarNoon) ? t.solarNoon : new Date(new Date(date).setHours(12, 0, 0, 0))
  const ok = (d: Date | null | undefined, fb: number) => (d && !isNaN(+d) ? d : new Date(noon.getTime() + fb * 3600000))
  const sunrise = ok(t.sunrise, -6)
  const sunset = ok(t.sunset, 6)
  return {
    sunrise,
    sunset,
    noon,
    goldenMorningEnd: ok(t.goldenHourEnd, -5),
    goldenEvening: ok(t.goldenHour, 5),
    dawn: ok(t.dawn, -6.5),
    dusk: ok(t.dusk, 6.5),
    dayLength: (sunset.getTime() - sunrise.getTime()) / 3600000,
    moonPhase: moon.phase,
    moonFraction: moon.fraction,
  }
}

/** Sun altitude in degrees at a moment. */
export const altitude = (date: Date, p: Place) => (SunCalc.getPosition(date, p.lat, p.lng).altitude * 180) / Math.PI

/** Fraction 0–1 of the way from sunrise to sunset (null at night). */
export function dayFraction(now: Date, sunrise: Date, sunset: Date) {
  const f = (now.getTime() - sunrise.getTime()) / (sunset.getTime() - sunrise.getTime())
  return f >= 0 && f <= 1 ? f : null
}

const at = (time: string, base: Date) => {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Circadian plan from wake time and sunset:
 *  - morning light within an hour of waking (or sunrise if later)
 *  - caffeine curfew N hours before intended sleep
 *  - wind-down window before sleep; sleep ≈ wake + 16 h
 */
export function plan(s: Pick<DaylightStore, 'wake' | 'caffeineGap' | 'windDownGap'>, sunrise: Date, sunset: Date, base = new Date()) {
  const wake = at(s.wake, base)
  const sleep = new Date(wake.getTime() + 16 * 3600000)
  const lightStart = new Date(Math.max(wake.getTime(), sunrise.getTime()))
  return {
    wake,
    light: [lightStart, new Date(lightStart.getTime() + 3600000)] as const,
    caffeineCurfew: new Date(sleep.getTime() - s.caffeineGap * 3600000),
    windDown: new Date(sleep.getTime() - s.windDownGap * 60000),
    sleep,
    walk: new Date(sunset.getTime() - 90 * 60000),
  }
}

export const moonName = (phase: number) =>
  phase < 0.03 || phase > 0.97 ? 'New moon' : phase < 0.22 ? 'Waxing crescent' : phase < 0.28 ? 'First quarter' : phase < 0.47 ? 'Waxing gibbous' : phase < 0.53 ? 'Full moon' : phase < 0.72 ? 'Waning gibbous' : phase < 0.78 ? 'Last quarter' : 'Waning crescent'

/** Day length for each month (15th) — the year's rhythm. */
export function yearDayLengths(p: Place, year = new Date().getFullYear()) {
  return Array.from({ length: 12 }, (_, m) => sunTimes(new Date(year, m, 15, 12), p).dayLength)
}

/** Clock time in the place's own timezone (the viewer's if unknown). */
export const hm = (d: Date, tz?: string) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: tz })

/** The city in the viewer's own timezone, if we know it. */
export function homeCity() {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return cities.find((c) => c.tz === zone) ?? cities[0]
}
