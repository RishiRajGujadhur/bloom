import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { geoAzimuthalEquidistant, geoGraticule10, geoPath } from 'd3-geo'
import * as SunCalc from 'suncalc'
import { addMinutes, format } from 'date-fns'
import { readStore, writeStore } from '../../components/studio/Studio'
import { constellations, direction, height, nextFullMoon, phaseName, skyAt } from './skyModel'
import './sky.css'

/**
 * Night Sky — what is above you right now. Planets, the Moon (with its phase)
 * and the brightest stars are computed with astronomy-engine and projected on
 * an SVG sky dome (d3-geo azimuthal projection, zenith in the centre). Drag the
 * time slider (or press ▶) and the whole sky glides with GSAP; stars twinkle;
 * pick a constellation for a star-hopping tip.
 */
const KEY = 'bloom-sky-v1'
type Loc = { lat: number; lon: number; named?: string }
const guess = (): Loc => ({ lat: 20, lon: Math.round(-new Date().getTimezoneOffset() / 4) })
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const R = 290

export function SkyPage() {
  const [loc, setLoc] = useState<Loc>(() => readStore(KEY, guess()))
  const [offset, setOffset] = useState(0) // minutes from now
  const [playing, setPlaying] = useState(false)
  const [pick, setPick] = useState<string>('Big Dipper')
  const [hover, setHover] = useState<string | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const date = useMemo(() => addMinutes(new Date(), offset), [offset])
  const sky = useMemo(() => skyAt(date, loc.lat, loc.lon), [date, loc])
  const sunTimes = useMemo(() => SunCalc.getTimes(date, loc.lat, loc.lon), [date, loc])
  const sun = sky.pts.find((p) => p.name === 'Sun')!
  const night = sun.alt < -6
  const twilight = sun.alt < 0 && !night

  // Zenith in the middle; east on the left as when you look up facing south.
  const projection = useMemo(() => geoAzimuthalEquidistant().rotate([0, -90]).reflectX(true).reflectY(true).scale(R / (Math.PI / 2)).translate([R + 10, R + 10]).clipAngle(90), [])
  const path = useMemo(() => geoPath(projection), [projection])
  const xy = (alt: number, az: number) => projection([az, alt]) ?? [-99, -99]
  const byName = useMemo(() => new Map(sky.pts.map((p) => [p.name, p])), [sky])

  // Play: sweep 6 hours ahead in a few seconds.
  useEffect(() => {
    if (!playing) return
    const o = { v: offset }
    const tw = gsap.to(o, { v: offset + 360, duration: 6, ease: 'sine.inOut', onUpdate: () => setOffset(Math.round(o.v)), onComplete: () => setPlaying(false) })
    return () => void tw.kill()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing])
  // Twinkle and a slow constellation-line draw.
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.to('.sk-star', { opacity: () => gsap.utils.random(0.45, 1), duration: () => gsap.utils.random(0.6, 1.8), yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: { each: 0.05, from: 'random' } })
      gsap.to('.sk-body-glow', { attr: { r: '+=4' }, opacity: 0.25, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    }, svg)
    return () => ctx.revert()
  }, [])
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const lines = svg.current.querySelectorAll('.sk-line.picked')
    gsap.fromTo(lines, { strokeDasharray: 400, strokeDashoffset: 400 }, { strokeDashoffset: 0, duration: 1.2, stagger: 0.12, ease: 'power2.inOut' })
  }, [pick])

  const visible = sky.pts.filter((p) => p.alt > 0)
  const upNow = visible.filter((p) => p.kind === 'body' || (p.mag ?? 9) < 0.6).sort((a, b) => b.alt - a.alt)
  const con = constellations.find((c) => c.name === pick)!
  const conUp = con.lines.some(([a, b]) => (byName.get(a)?.alt ?? -1) > 0 || (byName.get(b)?.alt ?? -1) > 0)
  const bg = night ? ['#050818', '#0b1433'] : twilight ? ['#1c2b5a', '#ff9a6b'] : ['#5aa9ff', '#cfe8ff']

  return (
    <div className="sk-page">
      <section className="sk-dome-wrap">
        <svg ref={svg} className="sk-dome" viewBox={`0 0 ${2 * R + 20} ${2 * R + 20}`} role="img" aria-label={`Sky map for ${format(date, 'HH:mm')}`} data-matrix-native>
          <defs>
            <radialGradient id="sk-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor={bg[0]} />
              <stop offset="1" stopColor={bg[1]} />
            </radialGradient>
            <radialGradient id="sk-glow"><stop offset="0" stopColor="#fff" stopOpacity="0.9" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <clipPath id="sk-clip"><circle cx={R + 10} cy={R + 10} r={R} /></clipPath>
          </defs>
          <circle cx={R + 10} cy={R + 10} r={R} fill="url(#sk-bg)" style={{ transition: 'fill 1s' }} />
          <g clipPath="url(#sk-clip)">
            <path d={path(geoGraticule10()) ?? ''} className="sk-grat" />
            {constellations.map((c) =>
              c.lines.map(([a, b]) => {
                const pa = byName.get(a)
                const pb = byName.get(b)
                if (!pa || !pb || (pa.alt < -5 && pb.alt < -5)) return null
                const [x1, y1] = xy(pa.alt, pa.az)
                const [x2, y2] = xy(pb.alt, pb.az)
                return <line key={`${c.name}${a}${b}`} className={`sk-line ${c.name === pick ? 'picked' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
              }),
            )}
            {sky.pts.filter((p) => p.kind === 'star' && p.alt > -2).map((p) => {
              const [x, y] = xy(p.alt, p.az)
              const r = Math.max(1.1, 4.2 - (p.mag ?? 2) * 1.1)
              return (
                <g key={p.name} onMouseEnter={() => setHover(p.name)} onMouseLeave={() => setHover(null)}>
                  <circle className="sk-star" cx={x} cy={y} r={r} opacity={night ? 1 : 0.25} />
                  {(hover === p.name || (p.mag ?? 9) < 0.2) && night && <text className="sk-label" x={x + 6} y={y - 5}>{p.name}</text>}
                </g>
              )
            })}
            {sky.pts.filter((p) => p.kind === 'body' && p.alt > -3).map((p) => {
              const [x, y] = xy(p.alt, p.az)
              return (
                <g key={p.name} onMouseEnter={() => setHover(p.name)} onMouseLeave={() => setHover(null)}>
                  <circle className="sk-body-glow" cx={x} cy={y} r={(p.size ?? 4) * 2.4} fill="url(#sk-glow)" opacity={0.5} />
                  {p.name === 'Moon' ? (
                    <g transform={`translate(${x} ${y})`}>
                      <circle r={p.size} fill="#2a2d44" />
                      <path d={moonShape(p.size ?? 9, sky.moonPhase)} fill={p.color} />
                    </g>
                  ) : (
                    <circle cx={x} cy={y} r={p.size} fill={p.color} />
                  )}
                  <text className="sk-label body" x={x + (p.size ?? 4) + 5} y={y + 4}>{p.name}</text>
                </g>
              )
            })}
          </g>
          <circle cx={R + 10} cy={R + 10} r={R} className="sk-horizon" />
          {(['N', 'E', 'S', 'W'] as const).map((d, i) => {
            const [x, y] = xy(0, i * 90)
            return <text key={d} className="sk-compass" x={x} y={y} dy={d === 'N' ? 22 : d === 'S' ? -10 : 6} dx={d === 'E' ? 16 : d === 'W' ? -16 : 0} textAnchor="middle">{d}</text>
          })}
        </svg>
      </section>
      <aside className="sk-side">
        <p className="sk-eyebrow">Night sky · {night ? 'dark sky' : twilight ? 'twilight' : 'daytime'}</p>
        <h2 className="sk-time">{format(date, 'HH:mm')}<small>{offset === 0 ? ' now' : ` ${offset > 0 ? '+' : ''}${Math.round(offset / 60)}h`}</small></h2>
        <div className="sk-scrub">
          <input type="range" min={-720} max={720} step={10} value={Math.max(-720, Math.min(720, offset))} aria-label="Time offset" onChange={(e) => { setPlaying(false); setOffset(Number(e.target.value)) }} />
          <button type="button" className="sk-btn" onClick={() => setPlaying((v) => !v)}>{playing ? '❚❚' : '▶'} 6 h</button>
          <button type="button" className="sk-btn ghost" onClick={() => { setPlaying(false); setOffset(0) }}>Now</button>
        </div>
        <h3>Up now</h3>
        <ul className="sk-list">
          {upNow.length ? upNow.slice(0, 7).map((p) => (
            <li key={p.name} onMouseEnter={() => setHover(p.name)} onMouseLeave={() => setHover(null)}>
              <i style={{ background: p.color ?? '#fff' }} />
              <strong>{p.name}</strong>
              <span>{height(p.alt)} in the {direction(p.az)}</span>
            </li>
          )) : <li>Nothing bright above the horizon — try later tonight.</li>}
        </ul>
        <p className="sk-moon">🌙 {phaseName(sky.moonPhase)} · {Math.round(sky.moonLit * 100)}% lit{(() => { const f = nextFullMoon(new Date()); return f && sky.moonLit < 0.98 ? ` · full moon ${f.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}` : '' })()} · sunset {sunTimes.sunset && !isNaN(+sunTimes.sunset) ? format(sunTimes.sunset, 'HH:mm') : '—'}</p>
        <h3>Star-hop</h3>
        <div className="sk-chips">
          {constellations.map((c) => <button key={c.name} type="button" className={`sk-chip ${pick === c.name ? 'on' : ''}`} onClick={() => setPick(c.name)}>{c.name}</button>)}
        </div>
        <p className="sk-tip">{con.tip}{!conUp && ' (It is below your horizon at this time.)'}</p>
        <button type="button" className="sk-btn ghost" onClick={() => navigator.geolocation?.getCurrentPosition((p) => { const l = { lat: +p.coords.latitude.toFixed(2), lon: +p.coords.longitude.toFixed(2) }; setLoc(l); writeStore(KEY, l) })}>📍 Use my location ({loc.lat.toFixed(1)}°, {loc.lon.toFixed(1)}°)</button>
      </aside>
    </div>
  )
}

/** Lit part of the Moon for a phase angle (0 new → 180 full). */
function moonShape(r: number, deg: number) {
  const k = Math.cos((deg * Math.PI) / 180)
  const waxing = deg < 180
  const rx = Math.abs(k) * r
  const outer = waxing ? 1 : 0
  const inner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0
  return `M 0 ${-r} A ${r} ${r} 0 0 ${outer} 0 ${r} A ${rx} ${r} 0 0 ${inner} 0 ${-r} Z`
}
