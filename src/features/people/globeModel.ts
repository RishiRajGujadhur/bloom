/**
 * People on the globe: where the sun is right now (the subsolar point, from
 * the NOAA solar equations), each friend's local time from their IANA time
 * zone, and whether it's a good moment to call.
 */
const rad = Math.PI / 180

/** Latitude/longitude where the sun is directly overhead at `d`. */
export function subsolar(d: Date) {
  const jd = d.getTime() / 864e5 + 2440587.5
  const n = jd - 2451545.0
  const L = (280.46 + 0.9856474 * n) % 360
  const g = ((357.528 + 0.9856003 * n) % 360) * rad
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad
  const eps = (23.439 - 0.0000004 * n) * rad
  const decl = Math.asin(Math.sin(eps) * Math.sin(lambda)) / rad
  // Equation of time (minutes) from right ascension vs mean longitude.
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / rad
  let eot = 4 * (L - ((ra + 360) % 360))
  if (eot > 20) eot -= 1440
  if (eot < -20) eot += 1440
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60
  let lng = -((utcMin + eot) / 4 - 180)
  lng = ((lng + 540) % 360) - 180
  return { lat: decl, lng }
}

/** The point opposite the sun: the centre of the night-side circle. */
export const antisolar = (d: Date) => { const s = subsolar(d); return { lat: -s.lat, lng: s.lng > 0 ? s.lng - 180 : s.lng + 180 } }

export function localTime(tz: string, d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const hour = Number(get('hour')) % 24
  return { hour, minute: Number(get('minute')), label: `${get('weekday')} ${get('hour')}:${get('minute')}` }
}

/** 9 am–9 pm for both of you (and not the small hours for them). */
export function callWindow(theirTz: string, myTz: string, d = new Date()) {
  const t = localTime(theirTz, d).hour
  const m = localTime(myTz, d).hour
  const awake = t >= 7 && t < 23
  const good = t >= 9 && t < 21 && m >= 9 && m < 22
  return { awake, good, theirHour: t }
}

/** Is the location in daylight? (sun above the horizon: within 90° of the subsolar point). */
export function isDay(lat: number, lng: number, d = new Date()) {
  const s = subsolar(d)
  const c = Math.sin(lat * rad) * Math.sin(s.lat * rad) + Math.cos(lat * rad) * Math.cos(s.lat * rad) * Math.cos((lng - s.lng) * rad)
  return c > 0
}
