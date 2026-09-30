import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Fuse from 'fuse.js'
import { geoCentroid, geoGraticule10, geoOrthographic, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Topology, GeometryCollection } from 'topojson-specification'
import { useDrag } from '@use-gesture/react'
import world from 'world-atlas/countries-110m.json'
import { burst } from '../../components/ui/celebrate'
import { setQuiz } from '../../companion/quizContext'
import { continents, countries, question, type Mode, type Question } from './globeModel'
import './globe.css'

/**
 * Globe Quiz — an orthographic SVG globe (d3-geo + world-atlas via
 * topojson-client) you drag to spin; for each question it glides (GSAP) to the
 * country. Find it by clicking, name it (fuzzy-matched with Fuse), or pick its
 * capital. Correct answers pulse and burst.
 */
type Props = { name: string }
const land = feature(world as unknown as Topology, (world as unknown as Topology<{ countries: GeometryCollection<Props> }>).objects.countries) as unknown as FeatureCollection<Geometry, Props>
const byAtlas = new Map(land.features.map((f) => [f.properties.name, f]))
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const SIZE = 560

export function GlobePage() {
  const [rot, setRot] = useState<[number, number]>([-10, -20])
  const [mode, setModeState] = useState<Mode>(() => (localStorage.getItem('bloom-globe-mode') as Mode) || 'find')
  const [continent, setContinentState] = useState(() => localStorage.getItem('bloom-globe-continent') || 'All')
  const remember = (k: string, v: string) => { try { localStorage.setItem(k, v) } catch { /* optional */ } }
  const setMode = (m: Mode) => { setModeState(m); remember('bloom-globe-mode', m) }
  const setContinent = (c: string) => { setContinentState(c); remember('bloom-globe-continent', c) }
  const [q, setQ] = useState<Question>(() => question(mode, continent))
  const [answer, setAnswer] = useState<'right' | 'wrong' | null>(null)
  const [clicked, setClicked] = useState<string | null>(null)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState({ right: 0, total: 0 })
  // Countries you missed this session, to revisit.
  const [missed, setMissed] = useState<typeof q.country[]>([])
  const svg = useRef<SVGSVGElement>(null)
  const tween = useRef<gsap.core.Tween | null>(null)
  const projection = useMemo(() => geoOrthographic().scale(SIZE / 2 - 8).translate([SIZE / 2, SIZE / 2]).clipAngle(90).rotate(rot), [rot])
  const path = useMemo(() => geoPath(projection), [projection])
  const fuse = useMemo(() => new Fuse(countries, { keys: ['name', 'atlas'], threshold: 0.3 }), [])
  const target = byAtlas.get(q.country.atlas)

  /** Glide the globe so a country faces the viewer. */
  const spinTo = useCallback((f: Feature | undefined) => {
    if (!f) return
    const [lon, lat] = geoCentroid(f)
    const from = { x: rot[0], y: rot[1] }
    let tx = -lon
    while (tx - from.x > 180) tx -= 360
    while (tx - from.x < -180) tx += 360
    tween.current?.kill()
    if (reduced()) return setRot([tx, -lat])
    tween.current = gsap.to(from, { x: tx, y: -lat, duration: 1.4, ease: 'power3.inOut', onUpdate: () => setRot([from.x, from.y]) })
  }, [rot])

  const next = useCallback((m = mode, c = continent) => {
    const nq = question(m, c)
    setQ(nq)
    setAnswer(null)
    setClicked(null)
    setTyped('')
    if (m !== 'find') spinTo(byAtlas.get(nq.country.atlas))
  }, [mode, continent, spinTo])
  useEffect(() => {
    next(mode, continent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, continent])
  useEffect(() => {
    setQuiz({ source: 'Globe quiz', question: q.mode === 'capital' ? `Capital of ${q.country.name}?` : q.mode === 'find' ? `Find ${q.country.name}` : 'Name the highlighted country', answer: q.mode === 'capital' ? q.country.capital : q.country.name, options: q.options, explain: `${q.country.name} is in ${q.country.continent}; its capital is ${q.country.capital}.` })
    return () => setQuiz(null)
  }, [q])
  // Slow idle spin while you think (stops when you drag).
  const idle = useRef(true)
  useEffect(() => {
    if (reduced()) return
    const id = window.setInterval(() => { if (idle.current && !tween.current?.isActive() && q.mode === 'find' && !answer) setRot(([x, y]) => [x + 0.25, y]) }, 40)
    return () => window.clearInterval(id)
  }, [q.mode, answer])

  const bind = useDrag(({ delta: [dx, dy], first, last }) => {
    if (first) { idle.current = false; tween.current?.kill() }
    setRot(([x, y]) => [x + dx * 0.4, Math.max(-80, Math.min(80, y - dy * 0.4))])
    if (last) window.setTimeout(() => (idle.current = true), 3000)
  }, { filterTaps: true })

  const judge = (ok: boolean) => {
    setAnswer(ok ? 'right' : 'wrong')
    setScore((s) => ({ right: s.right + (ok ? 1 : 0), total: s.total + 1 }))
    if (!ok) setMissed((list) => [q.country, ...list.filter((c) => c.atlas !== q.country.atlas)].slice(0, 20))
    if (ok) burst(undefined, 'stars')
    spinTo(target)
    if (svg.current && !reduced()) gsap.fromTo(svg.current.querySelector('.gq-target'), { strokeWidth: 1 }, { strokeWidth: 5, duration: 0.4, yoyo: true, repeat: 3 })
  }
  const clickCountry = (name: string) => {
    if (q.mode !== 'find' || answer) return
    setClicked(name)
    judge(name === q.country.atlas)
  }
  const submitName = () => {
    const hit = fuse.search(typed.trim())[0]?.item
    judge(!!hit && hit.atlas === q.country.atlas)
  }

  const showTarget = q.mode !== 'find' || answer !== null
  return (
    <div className="gq-page">
      <section className="gq-stage">
        <svg ref={svg} className="gq-globe" viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Globe — drag to spin" {...bind()} data-matrix-native>
          <defs>
            <radialGradient id="gq-ocean" cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#6fc6ff" /><stop offset="1" stopColor="#1d4f9a" /></radialGradient>
            <radialGradient id="gq-shine" cx="35%" cy="28%" r="55%"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            <filter id="gq-glow"><feGaussianBlur stdDeviation="6" /></filter>
          </defs>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 4} fill="#6fc6ff" opacity="0.25" filter="url(#gq-glow)" />
          <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#gq-ocean)" />
          <path d={path(geoGraticule10()) ?? ''} className="gq-grat" />
          {land.features.map((f) => (
            <path
              key={f.properties.name}
              d={path(f) ?? ''}
              className={`gq-land ${showTarget && f === target ? 'gq-target' : ''} ${clicked === f.properties.name && clicked !== q.country.atlas ? 'gq-miss' : ''}`}
              onClick={() => clickCountry(f.properties.name)}
            >
              <title>{answer ? f.properties.name : ''}</title>
            </path>
          ))}
          <path d={path({ type: 'Sphere' }) ?? ''} fill="url(#gq-shine)" pointerEvents="none" />
        </svg>
      </section>
      <aside className="gq-side">
        <p className="gq-eyebrow">Globe quiz · {score.right}/{score.total}</p>
        <h2>{q.mode === 'find' ? <>Find <em>{q.country.name}</em></> : q.mode === 'name' ? 'Which country is glowing?' : <>Capital of <em>{q.country.name}</em>?</>}</h2>
        <div className="gq-row">
          {(['find', 'name', 'capital'] as Mode[]).map((m) => <button key={m} type="button" className={`gq-chip ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{{ find: '🔎 Find it', name: '🏷️ Name it', capital: '🏛️ Capitals' }[m]}</button>)}
        </div>
        <div className="gq-row">
          {continents.map((c) => <button key={c} type="button" className={`gq-chip small ${continent === c ? 'on' : ''}`} onClick={() => setContinent(c)}>{c}</button>)}
        </div>
        {q.mode === 'find' && !answer && <p className="gq-hint">Drag to spin the globe, then click the country.</p>}
        {q.mode === 'name' && !answer && (
          <form className="gq-row" onSubmit={(e) => { e.preventDefault(); submitName() }}>
            <input className="studio-input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type the country…" aria-label="Country name" autoFocus />
            <button type="submit" className="gq-cta">Check</button>
          </form>
        )}
        {q.mode === 'capital' && q.options && (
          <div className="gq-opts">
            {q.options.map((o) => <button key={o} type="button" disabled={!!answer} className={`gq-opt ${answer && o === q.country.capital ? 'right' : ''}`} onClick={() => judge(o === q.country.capital)}>{o}</button>)}
          </div>
        )}
        {answer && (
          <div className={`gq-result ${answer}`} role="status">
            <strong>{answer === 'right' ? 'Correct!' : 'Not quite.'}</strong>
            <span>{q.country.name} · {q.country.continent} · capital {q.country.capital}</span>
            <button type="button" className="gq-cta" onClick={() => next()}>Next →</button>
          </div>
        )}
        {missed.length > 0 && (
          <details className="gq-missed">
            <summary>Review {missed.length} missed</summary>
            <ul>
              {missed.map((c) => (
                <li key={c.atlas}>
                  <button type="button" onClick={() => spinTo(byAtlas.get(c.atlas))}>
                    <strong>{c.name}</strong> <span>{c.continent} · {c.capital}</span>
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </aside>
    </div>
  )
}
