import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Coffee, LocateFixed, MoonStar, Sun, SunMedium, Sunrise } from 'lucide-react'
import { Slider, Stat, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { dayKey } from '../../dates'
import { DAYLIGHT_KEY, altitude, cities, dayFraction, homeCity, hm as hmIn, moonName, plan, sunTimes, yearDayLengths, type DaylightStore } from './daylightModel'
import { usePageActions } from '../../components/ui/PageMenu'
import './daylight.css'

const on = (id: string) => subOn('daylight', id)

/** A sky that follows the sun: arc from sunrise to sunset, colour by altitude. */
function SunArc({ frac, alt, sunrise, sunset }: { frac: number | null; alt: number; sunrise: string; sunset: string }) {
  const sun = useRef<SVGGElement>(null)
  const f = frac ?? 0
  const x = 60 + f * 480
  const y = 260 - Math.sin(Math.PI * f) * 200
  const trail = useRef<SVGPathElement>(null)
  const rays = useRef<SVGGElement>(null)
  const clouds = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const tl = gsap.timeline()
    // The sun rises from the horizon to where it is now, drawing the path it took.
    if (sun.current) tl.fromTo(sun.current, { x: 60, y: 260 }, { x, y, duration: reduced ? 0 : 1.6, ease: 'power2.out' })
    if (trail.current) {
      const len = trail.current.getTotalLength?.() || 700
      tl.fromTo(trail.current, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: len * (1 - f), duration: reduced ? 0 : 1.6, ease: 'power2.out' }, 0)
    }
    const spin = reduced || !rays.current ? null : gsap.to(rays.current, { rotate: 360, duration: 30, repeat: -1, ease: 'none', transformOrigin: '0 0' })
    const drift = reduced || !clouds.current ? null : gsap.to(clouds.current.children, { x: '+=60', yoyo: true, repeat: -1, duration: 12, ease: 'sine.inOut', stagger: 3 })
    return () => {
      tl.progress(1)
      spin?.kill()
      drift?.kill()
    }
  }, [x, y, f])
  const sky = alt > 20 ? ['#8fd0ff', '#dff3ff'] : alt > 0 ? ['#ffb37a', '#ffe3c2'] : alt > -6 ? ['#6a5aa8', '#f2a3a0'] : ['#141a3a', '#2c3566']
  return (
    <svg className="dl-sky" viewBox="0 0 600 320" aria-label={`Sun ${frac === null ? 'below the horizon' : `${Math.round(f * 100)}% across the sky`}`}>
      <defs>
        <linearGradient id="dl-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <radialGradient id="dl-sun">
          <stop offset="0" stopColor="#fff6c8" />
          <stop offset="0.6" stopColor="#ffd35a" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="320" rx="22" fill="url(#dl-sky)" className="dl-sky-bg" />
      {frac === null &&
        Array.from({ length: 40 }, (_, i) => <circle key={i} cx={(i * 137) % 600} cy={(i * 71) % 220} r={1 + (i % 3) * 0.5} fill="#fff" opacity={0.3 + (i % 4) * 0.15} className="dl-star" />)}
      <path d="M60 260 Q300 -140 540 260" fill="none" stroke="#ffffff88" strokeWidth="2" strokeDasharray="6 8" />
      <path ref={trail} d="M60 260 Q300 -140 540 260" fill="none" stroke="#ffd35a" strokeWidth="4" strokeLinecap="round" />
      <g ref={clouds} fill="#ffffffcc">
        <ellipse cx="140" cy="70" rx="38" ry="14" />
        <ellipse cx="420" cy="50" rx="46" ry="16" />
      </g>
      <path d="M0 260 Q150 240 300 258 T600 252 L600 320 L0 320 Z" fill="#3f6a4f" opacity="0.85" />
      <g ref={sun} style={{ opacity: frac === null ? 0 : 1 }}>
        <circle r="46" fill="url(#dl-sun)" />
        <g ref={rays} stroke="#ffd35a" strokeWidth="3" strokeLinecap="round">
          {Array.from({ length: 10 }, (_, i) => {
            const a = (i / 10) * Math.PI * 2
            return <line key={i} x1={Math.cos(a) * 24} y1={Math.sin(a) * 24} x2={Math.cos(a) * 32} y2={Math.sin(a) * 32} />
          })}
        </g>
        <circle r="18" fill="#ffd35a" />
      </g>
      <text x="60" y="296" textAnchor="middle" className="dl-lbl">
        {sunrise}
      </text>
      <text x="540" y="296" textAnchor="middle" className="dl-lbl">
        {sunset}
      </text>
    </svg>
  )
}

function Moon({ phase }: { phase: number }) {
  // Terminator: shift a dark circle across a light one.
  // New moon: shadow on top (dx 0). Full: shadow slid right off (|dx| 85).
  const lit = 1 - Math.abs(1 - 2 * phase)
  const dx = (phase <= 0.5 ? -1 : 1) * 85 * lit
  return (
    <svg viewBox="0 0 100 100" className="dl-moon" aria-label={moonName(phase)}>
      <defs>
        <mask id="dl-moon-mask">
          <circle cx="50" cy="50" r="40" fill="#fff" />
          <circle cx={50 + dx} cy="50" r="40" fill="#000" />
        </mask>
      </defs>
      <circle cx="50" cy="50" r="40" fill="#2c3566" />
      <circle cx="50" cy="50" r="40" fill="#fff3c4" mask="url(#dl-moon-mask)" />
    </svg>
  )
}

export function DaylightPage() {
  const [store, setStoreState] = useState<DaylightStore>(() => readStore(DAYLIGHT_KEY, { place: homeCity(), wake: '07:00', caffeineGap: 8, windDownGap: 60, lightGoal: 20, log: [] }))
  const setStore = (fn: (s: DaylightStore) => DaylightStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(DAYLIGHT_KEY, n)
      return n
    })
  const [now, setNow] = useState(new Date())
  const [locating, setLocating] = useState(false)
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])
  const p = store.place
  const hm = (d: Date) => hmIn(d, p.tz)
  const t = useMemo(() => sunTimes(now, p), [now, p])
  const frac = dayFraction(now, t.sunrise, t.sunset)
  const pl = plan(store, t.sunrise, t.sunset, now)
  const today = dayKey()
  const lightToday = store.log.find((l) => l.date === today)?.minutes ?? 0
  const year = useMemo(() => yearDayLengths(p), [p])

  const locate = () => {
    if (!('geolocation' in navigator)) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setStore((s) => ({ ...s, place: { name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude } }))
        setLocating(false)
      },
      () => setLocating(false),
      { maximumAge: 3600_000 },
    )
  }
  const logLight = (m: number) => {
    setStore((s) => ({ ...s, log: [...s.log.filter((l) => l.date !== today), { date: today, minutes: lightToday + m }].slice(-120) }))
    if (lightToday < store.lightGoal && lightToday + m >= store.lightGoal) {
      burst(btn.current, 'stars')
      logActivity('daylight')
    }
  }

  usePageActions([
    { id: 'dl-10', label: 'Log 10 min outside', icon: '☀️', run: () => logLight(10) },
    ...(on('gps') ? [{ id: 'dl-gps', label: 'Use my location', icon: '📍', run: locate }] : []),
  ])
  const todayTab = () => (
    <div className="studio-split">
      <div className="studio-card dl-stage">
        {on('sunArc') && <SunArc frac={frac} alt={altitude(now, p)} sunrise={hm(t.sunrise)} sunset={hm(t.sunset)} />}
        <div className="studio-stats">
          <span data-hint="Get outside within an hour of sunrise"><Stat value={hm(t.sunrise)} label="sunrise" /></span>
          <Stat value={hm(t.sunset)} label="sunset" />
          {on('golden') && <Stat value={hm(t.goldenEvening)} label="golden hour" />}
          <Stat value={`${t.dayLength.toFixed(1)} h`} label="daylight" />
        </div>
      </div>
      <div className="studio-card rm-side">
        <div className="dl-place">
          <select className="studio-input" aria-label="City" value={cities.some((c) => c.name === p.name) ? p.name : ''} onChange={(e) => setStore((s) => ({ ...s, place: cities.find((c) => c.name === e.target.value) ?? s.place }))}>
            {!cities.some((c) => c.name === p.name) && <option value="">{p.name}</option>}
            {cities.map((c) => (
              <option key={c.name}>{c.name}</option>
            ))}
          </select>
          {on('gps') && (
            <button type="button" className="studio-chip" onClick={locate} disabled={locating}>
              <LocateFixed size={13} /> {locating ? 'Locating…' : 'Use my location'}
            </button>
          )}
        </div>
        {on('lightGoal') && (
          <div className="dl-light">
            <div className="dl-light-head">
              <Sunrise size={18} />
              <strong>
                Morning light {lightToday}/{store.lightGoal} min
              </strong>
            </div>
            <div className="ey-progress">
              <span style={{ width: `${Math.min(100, (lightToday / store.lightGoal) * 100)}%`, background: '#f2a65a' }} />
            </div>
            <p className="studio-empty">
              Best between {hm(pl.light[0])} and {hm(pl.light[1])}. Daylight anchors your body clock.
            </p>
            <div className="yg-pose-chips">
              {[5, 10, 20].map((m) => (
                <button key={m} ref={m === 10 ? btn : undefined} type="button" className="studio-chip" onClick={() => logLight(m)}>
                  +{m} min outside
                </button>
              ))}
            </div>
          </div>
        )}
        {on('walk') && (
          <p className="dl-tip">
            <SunMedium size={16} /> Best time for a walk: around {hm(pl.walk)} (before the light fades).
          </p>
        )}
      </div>
    </div>
  )

  const rhythm = () => (
    <div className="studio-split">
      <div className="studio-card rm-side">
        <Slider label="I wake at" value={Number(store.wake.slice(0, 2)) * 60 + Number(store.wake.slice(3))} min={240} max={720} step={15} format={(v) => `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`} onChange={(v) => setStore((s) => ({ ...s, wake: `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}` }))} />
        {on('caffeine') && <Slider label="Caffeine curfew before sleep" value={store.caffeineGap} min={4} max={12} unit="h" onChange={(v) => setStore((s) => ({ ...s, caffeineGap: v }))} />}
        {on('windDown') && <Slider label="Wind-down before sleep" value={store.windDownGap} min={15} max={120} step={15} unit="min" onChange={(v) => setStore((s) => ({ ...s, windDownGap: v }))} />}
        {on('lightGoal') && <Slider label="Morning light goal" value={store.lightGoal} min={5} max={60} step={5} unit="min" onChange={(v) => setStore((s) => ({ ...s, lightGoal: v }))} />}
      </div>
      <div className="studio-card">
        <ul className="dl-timeline">
          <li>
            <Sun size={16} /> <span>Wake</span> <strong>{hm(pl.wake)}</strong>
          </li>
          {on('lightGoal') && (
            <li>
              <Sunrise size={16} /> <span>Get outside</span> <strong>{hm(pl.light[0])}</strong>
            </li>
          )}
          {on('caffeine') && (
            <li data-now={now > pl.caffeineCurfew}>
              <Coffee size={16} /> <span>Last coffee</span> <strong>{hm(pl.caffeineCurfew)}</strong>
            </li>
          )}
          {on('windDown') && (
            <li data-now={now > pl.windDown}>
              <MoonStar size={16} /> <span>Wind down</span> <strong>{hm(pl.windDown)}</strong>
            </li>
          )}
          <li>
            <MoonStar size={16} /> <span>Sleep</span> <strong>{hm(pl.sleep)}</strong>
          </li>
        </ul>
      </div>
    </div>
  )

  const max = Math.max(...year)
  const sky = () => (
    <div className="studio-split">
      {on('moon') && (
        <div className="studio-card studio-center dl-moon-card">
          <Moon phase={t.moonPhase} />
          <strong>{moonName(t.moonPhase)}</strong>
          <small className="studio-empty">{Math.round(t.moonFraction * 100)}% lit</small>
        </div>
      )}
      {on('yearChart') && (
        <div className="studio-card">
          <h3>Daylight through the year · {p.name}</h3>
          <div className="dl-year">
            {year.map((h, m) => (
              <div key={m} className="mr-day">
                <span className="mr-bar" style={{ height: `${(h / max) * 100}%`, background: m === now.getMonth() ? '#f2a65a' : '#ffd89b' }} title={`${h.toFixed(1)} h`} />
                <small>{new Date(2026, m, 1).toLocaleDateString([], { month: 'narrow' })}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Studio
      name="daylight"
      accent="#e2703f"
      tabs={[
        { id: 'today', label: 'Today', icon: <Sun size={15} />, render: todayTab },
        ...(on('caffeine') || on('windDown') ? [{ id: 'rhythm', label: 'Rhythm', icon: <Coffee size={15} />, render: rhythm }] : []),
        ...(on('moon') || on('yearChart') ? [{ id: 'sky', label: 'Sky', icon: <MoonStar size={15} />, render: sky }] : []),
      ]}
    />
  )
}
