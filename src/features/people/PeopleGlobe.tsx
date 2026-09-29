import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { geoCircle, geoDistance, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { useDrag } from '@use-gesture/react'
import world from 'world-atlas/countries-110m.json'
import { antisolar, callWindow, localTime } from './globeModel'
import { nextBirthday, type Person } from './peopleModel'

/**
 * Your people on the Globe quiz's globe: a live day/night terminator (the
 * night side is a 90° circle around the antisolar point), each friend's local
 * time, and a glow for anyone it's a good time to call. Birthdays this week
 * get a ring. Drag to spin; it glides to whoever you select.
 */
const land = feature(world as unknown as Topology, (world as unknown as Topology<{ countries: GeometryCollection }>).objects.countries) as unknown as FeatureCollection<Geometry>
const SIZE = 520
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const myTz = Intl.DateTimeFormat().resolvedOptions().timeZone

export function PeopleGlobe({ people, selected, onPick }: { people: Person[]; selected: string | null; onPick: (id: string) => void }) {
  const placed = people.filter((p) => p.city)
  const [rot, setRot] = useState<[number, number]>(() => (placed[0]?.city ? [-placed[0].city.lng, -Math.max(-60, Math.min(60, placed[0].city.lat))] : [0, -20]))
  const [now, setNow] = useState(() => new Date())
  const tween = useRef<gsap.core.Tween | null>(null)
  const pins = useRef<SVGGElement>(null)
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t) }, [])
  const projection = useMemo(() => geoOrthographic().scale(SIZE / 2 - 10).translate([SIZE / 2, SIZE / 2]).clipAngle(90).rotate(rot), [rot])
  const path = useMemo(() => geoPath(projection), [projection])
  const night = useMemo(() => { const a = antisolar(now); return geoCircle().center([a.lng, a.lat]).radius(90)() }, [now])
  const dusk = useMemo(() => { const a = antisolar(now); return geoCircle().center([a.lng, a.lat]).radius(96)() }, [now])

  // Glide to the selected person.
  useEffect(() => {
    const p = people.find((x) => x.id === selected)?.city
    if (!p) return
    const from = { x: rot[0], y: rot[1] }
    let tx = -p.lng
    while (tx - from.x > 180) tx -= 360
    while (tx - from.x < -180) tx += 360
    tween.current?.kill()
    if (reduced()) { setRot([tx, -p.lat]); return }
    tween.current = gsap.to(from, { x: tx, y: -Math.max(-70, Math.min(70, p.lat)), duration: 1.3, ease: 'power3.inOut', onUpdate: () => setRot([from.x, from.y]) })
  }, [selected]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    if (!pins.current || reduced()) return
    const t = gsap.fromTo(pins.current.querySelectorAll('.pgl-glow'), { r: 10, opacity: 0.7 }, { r: 22, opacity: 0, duration: 1.8, repeat: -1, ease: 'power1.out', stagger: 0.3 })
    return () => { t.kill() }
  }, [placed.length])

  const bind = useDrag(({ delta: [dx, dy], first }) => {
    if (first) tween.current?.kill()
    setRot(([x, y]) => [x + dx * 0.4, Math.max(-80, Math.min(80, y - dy * 0.4))])
  }, { filterTaps: true })

  return (
    <div className="pgl">
      <svg className="pgl-globe" viewBox={`0 0 ${SIZE} ${SIZE}`} {...bind()} role="img" aria-label="Your people around the world, with day and night" data-matrix-native>
        <defs>
          <radialGradient id="pgl-ocean" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#5fb8ff" /><stop offset="1" stopColor="#123e82" /></radialGradient>
          <radialGradient id="pgl-shine" cx="35%" cy="28%" r="55%"><stop offset="0" stopColor="#fff" stopOpacity="0.3" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
          <filter id="pgl-blur"><feGaussianBlur stdDeviation="5" /></filter>
        </defs>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 6} fill="#5fb8ff" opacity="0.25" filter="url(#pgl-blur)" />
        <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#pgl-ocean)" />
        <path d={path(geoGraticule10()) ?? ''} className="pgl-grat" />
        {land.features.map((f, i) => <path key={i} d={path(f) ?? ''} className="pgl-land" />)}
        <path d={path(dusk) ?? ''} className="pgl-dusk" />
        <path d={path(night) ?? ''} className="pgl-night" />
        <g ref={pins}>
          {placed.map((p) => {
            const xy = projection([p.city!.lng, p.city!.lat])
            // Hidden on the far side of the globe.
            const visible = geoDistance([p.city!.lng, p.city!.lat], [-rot[0], -rot[1]]) < Math.PI / 2 - 0.02
            if (!xy || !visible) return null
            const w = callWindow(p.city!.tz, myTz, now)
            const bday = nextBirthday(p)
            const soon = bday && (bday.getTime() - now.getTime()) / 864e5 <= 7
            return (
              <g key={p.id} transform={`translate(${xy[0]} ${xy[1]})`} className={`pgl-pin ${selected === p.id ? 'sel' : ''}`} onClick={() => onPick(p.id)} role="button" tabIndex={0} aria-label={`${p.name} in ${p.city!.name}, ${localTime(p.city!.tz, now).label}${w.good ? ', good time to call' : ''}`} onKeyDown={(e) => e.key === 'Enter' && onPick(p.id)}>
                {w.good && <circle className="pgl-glow" r="10" />}
                {soon && <circle r="17" className="pgl-bday" />}
                <circle r="12" className={`pgl-dot ${w.awake ? 'awake' : 'asleep'}`} />
                <text y="5" textAnchor="middle" className="pgl-emoji">{p.emoji}</text>
                <g className="pgl-label" transform="translate(16 -8)">
                  <rect x="-2" y="-12" rx="6" width={Math.max(p.name.length, 9) * 7 + 12} height="30" />
                  <text x="4" y="0" className="pgl-name">{p.name}</text>
                  <text x="4" y="13" className="pgl-time">{w.awake ? '☀️' : '🌙'} {localTime(p.city!.tz, now).label.split(' ')[1]}</text>
                </g>
              </g>
            )
          })}
        </g>
        <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#pgl-shine)" pointerEvents="none" />
      </svg>
      {!placed.length && <p className="pgl-empty">Add a city to someone to see them here.</p>}
    </div>
  )
}
