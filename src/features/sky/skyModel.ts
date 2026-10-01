import * as A from 'astronomy-engine'

/** Bright stars (J2000 RA in hours, Dec in degrees, magnitude) for the sky dome. */
export const stars: { name: string; ra: number; dec: number; mag: number }[] = [
  { name: 'Sirius', ra: 6.752, dec: -16.716, mag: -1.46 }, { name: 'Canopus', ra: 6.399, dec: -52.696, mag: -0.74 },
  { name: 'Arcturus', ra: 14.261, dec: 19.182, mag: -0.05 }, { name: 'Vega', ra: 18.616, dec: 38.784, mag: 0.03 },
  { name: 'Capella', ra: 5.278, dec: 45.998, mag: 0.08 }, { name: 'Rigel', ra: 5.242, dec: -8.202, mag: 0.13 },
  { name: 'Procyon', ra: 7.655, dec: 5.225, mag: 0.34 }, { name: 'Betelgeuse', ra: 5.919, dec: 7.407, mag: 0.5 },
  { name: 'Achernar', ra: 1.629, dec: -57.237, mag: 0.46 }, { name: 'Altair', ra: 19.846, dec: 8.868, mag: 0.77 },
  { name: 'Aldebaran', ra: 4.599, dec: 16.509, mag: 0.85 }, { name: 'Antares', ra: 16.49, dec: -26.432, mag: 1.06 },
  { name: 'Spica', ra: 13.42, dec: -11.161, mag: 0.97 }, { name: 'Pollux', ra: 7.755, dec: 28.026, mag: 1.14 },
  { name: 'Fomalhaut', ra: 22.961, dec: -29.622, mag: 1.16 }, { name: 'Deneb', ra: 20.69, dec: 45.28, mag: 1.25 },
  { name: 'Regulus', ra: 10.14, dec: 11.967, mag: 1.35 }, { name: 'Castor', ra: 7.577, dec: 31.888, mag: 1.58 },
  { name: 'Bellatrix', ra: 5.419, dec: 6.35, mag: 1.64 }, { name: 'Alnilam', ra: 5.604, dec: -1.202, mag: 1.69 },
  { name: 'Alnitak', ra: 5.679, dec: -1.943, mag: 1.77 }, { name: 'Mintaka', ra: 5.533, dec: -0.299, mag: 2.23 },
  { name: 'Saiph', ra: 5.796, dec: -9.67, mag: 2.06 }, { name: 'Polaris', ra: 2.53, dec: 89.264, mag: 1.98 },
  { name: 'Dubhe', ra: 11.062, dec: 61.751, mag: 1.79 }, { name: 'Merak', ra: 11.031, dec: 56.382, mag: 2.37 },
  { name: 'Phecda', ra: 11.897, dec: 53.695, mag: 2.44 }, { name: 'Megrez', ra: 12.257, dec: 57.033, mag: 3.31 },
  { name: 'Alioth', ra: 12.9, dec: 55.96, mag: 1.77 }, { name: 'Mizar', ra: 13.399, dec: 54.925, mag: 2.27 },
  { name: 'Alkaid', ra: 13.792, dec: 49.313, mag: 1.86 }, { name: 'Schedar', ra: 0.675, dec: 56.537, mag: 2.24 },
  { name: 'Caph', ra: 0.153, dec: 59.15, mag: 2.28 }, { name: 'Navi', ra: 0.945, dec: 60.717, mag: 2.47 },
  { name: 'Ruchbah', ra: 1.43, dec: 60.235, mag: 2.68 }, { name: 'Segin', ra: 1.907, dec: 63.67, mag: 3.37 },
  { name: 'Acrux', ra: 12.443, dec: -63.099, mag: 0.77 }, { name: 'Mimosa', ra: 12.795, dec: -59.689, mag: 1.25 },
  { name: 'Gacrux', ra: 12.519, dec: -57.113, mag: 1.59 }, { name: 'Imai', ra: 12.252, dec: -58.749, mag: 2.79 },
]
export const constellations: { name: string; lines: [string, string][]; tip: string }[] = [
  { name: 'Orion', tip: 'Find the three stars of Orion’s Belt in a neat row — follow them down-left to Sirius, the brightest star.', lines: [['Betelgeuse', 'Bellatrix'], ['Bellatrix', 'Mintaka'], ['Mintaka', 'Alnilam'], ['Alnilam', 'Alnitak'], ['Alnitak', 'Saiph'], ['Saiph', 'Rigel'], ['Rigel', 'Mintaka'], ['Betelgeuse', 'Alnitak']] },
  { name: 'Big Dipper', tip: 'Follow the two “pointer” stars at the end of the Dipper’s bowl (Merak → Dubhe) about five times their gap to reach Polaris, the North Star.', lines: [['Dubhe', 'Merak'], ['Merak', 'Phecda'], ['Phecda', 'Megrez'], ['Megrez', 'Dubhe'], ['Megrez', 'Alioth'], ['Alioth', 'Mizar'], ['Mizar', 'Alkaid']] },
  { name: 'Cassiopeia', tip: 'A bright “W” on the other side of Polaris from the Big Dipper.', lines: [['Caph', 'Schedar'], ['Schedar', 'Navi'], ['Navi', 'Ruchbah'], ['Ruchbah', 'Segin']] },
  { name: 'Southern Cross', tip: 'Extend the long axis of the Cross about four and a half times to find the south celestial pole.', lines: [['Acrux', 'Gacrux'], ['Mimosa', 'Imai']] },
  { name: 'Summer Triangle', tip: 'Vega, Deneb and Altair make a huge triangle overhead on summer evenings.', lines: [['Vega', 'Deneb'], ['Deneb', 'Altair'], ['Altair', 'Vega']] },
]
export const bodies: { id: A.Body; name: string; color: string; size: number }[] = [
  { id: A.Body.Sun, name: 'Sun', color: '#ffd24d', size: 11 },
  { id: A.Body.Moon, name: 'Moon', color: '#f4f1de', size: 9 },
  { id: A.Body.Mercury, name: 'Mercury', color: '#c9b8a6', size: 3.2 },
  { id: A.Body.Venus, name: 'Venus', color: '#fff3c4', size: 5 },
  { id: A.Body.Mars, name: 'Mars', color: '#ff7a5a', size: 4 },
  { id: A.Body.Jupiter, name: 'Jupiter', color: '#ffe0b0', size: 5.2 },
  { id: A.Body.Saturn, name: 'Saturn', color: '#f2d38c', size: 4.4 },
]

export type SkyPoint = { name: string; alt: number; az: number; mag?: number; color?: string; size?: number; kind: 'star' | 'body' }
export function skyAt(date: Date, lat: number, lon: number) {
  const obs = new A.Observer(lat, lon, 0)
  const pts: SkyPoint[] = []
  for (const s of stars) {
    const h = A.Horizon(date, obs, s.ra, s.dec, 'normal')
    pts.push({ name: s.name, alt: h.altitude, az: h.azimuth, mag: s.mag, kind: 'star' })
  }
  for (const b of bodies) {
    const eq = A.Equator(b.id, date, obs, true, true)
    const h = A.Horizon(date, obs, eq.ra, eq.dec, 'normal')
    pts.push({ name: b.name, alt: h.altitude, az: h.azimuth, color: b.color, size: b.size, kind: 'body' })
  }
  const moonPhase = A.MoonPhase(date) // 0 new, 90 first quarter, 180 full, 270 last quarter
  const moonLit = A.Illumination(A.Body.Moon, date).phase_fraction
  return { pts, moonPhase, moonLit }
}

const compass = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']
export const direction = (az: number) => compass[Math.round(az / 45) % 8]
export const height = (alt: number) => (alt > 60 ? 'high overhead' : alt > 30 ? 'halfway up' : alt > 10 ? 'low' : 'just above the horizon')
export const phaseName = (deg: number) =>
  deg < 22.5 || deg >= 337.5 ? 'New moon' : deg < 67.5 ? 'Waxing crescent' : deg < 112.5 ? 'First quarter' : deg < 157.5 ? 'Waxing gibbous' : deg < 202.5 ? 'Full moon' : deg < 247.5 ? 'Waning gibbous' : deg < 292.5 ? 'Last quarter' : 'Waning crescent'

/** Date of the next full moon (within ~30 days), or null. */
export function nextFullMoon(from: Date) {
  const t = A.SearchMoonPhase(180, from, 32)
  return t ? t.date : null
}
