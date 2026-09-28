import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import * as SunCalc from 'suncalc'
import { Moon } from 'lunarphase-js'
import tinycolor from 'tinycolor2'
import QRCode from 'qrcode'
import seedrandom from 'seedrandom'
import { CupSoda, Heart, MoonStar, Palette, Mail } from 'lucide-react'
import { Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import type { AppData } from '../../model'
import { subOn } from '../subFeatures'
import './joys.css'

/**
 * Little Joys — five small features, each an animated SVG made with GSAP:
 *   Hydration (a glass that fills with waves), Sky (moon phase + the sun's
 *   arc, suncalc + lunarphase-js), Kindness deck (a daily card that flips,
 *   seedrandom), Mood colours (breathing blobs from a tinycolor2 palette) and
 *   Postcard (a shareable SVG card with a QR code from qrcode).
 */
const on = (id: string) => subOn('littleJoys', id)
const reduced = () => prefersReducedMotion()
const JOYS_KEY = 'bloom-joys-v1'
type JoysStore = { water: Record<string, number>; goal: number; kind: Record<string, boolean>; lat: number; lon: number; moodHex: string }
// Until the user shares a location, guess one from the time zone so sunrise/sunset land near local time.
const guessLon = () => -new Date().getTimezoneOffset() / 4
const empty: JoysStore = { water: {}, goal: 8, kind: {}, lat: 20, lon: guessLon(), moodHex: '#58cc02' }

/* ---------------- 1. Hydration ---------------- */
function Hydration({ store, save, today }: { store: JoysStore; save: (f: (s: JoysStore) => JoysStore) => void; today: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const glasses = store.water[today] ?? 0
  const pct = Math.min(1, glasses / store.goal)
  useLayoutEffect(() => {
    if (!svg.current) return
    const level = 190 - pct * 160
    const ctx = gsap.context(() => {
      gsap.to('.hy-water', { y: level - 190, duration: reduced() ? 0 : 1.2, ease: 'elastic.out(1, 0.6)' })
      if (!reduced()) {
        gsap.to('.hy-wave', { x: -120, duration: 2.4, repeat: -1, ease: 'none' })
        gsap.fromTo('.hy-bubble', { y: 0, opacity: 0.8 }, { y: -120, opacity: 0, duration: () => gsap.utils.random(1.5, 3), repeat: -1, delay: () => gsap.utils.random(0, 2), ease: 'power1.in' })
      }
    }, svg)
    return () => ctx.revert()
  }, [pct])
  const add = (d: number, el?: HTMLElement) => {
    save((s) => ({ ...s, water: { ...s.water, [today]: Math.max(0, (s.water[today] ?? 0) + d) } }))
    if (d > 0 && glasses + 1 === store.goal) burst(el, 'stars')
    if (d > 0) logActivity('water', { glasses: glasses + 1 })
  }
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(`${today}T12:00:00`)
    d.setDate(d.getDate() - 6 + i)
    const k = d.toISOString().slice(0, 10)
    return { k, v: store.water[k] ?? 0, label: d.toLocaleDateString([], { weekday: 'narrow' }) }
  })
  return (
    <div className="jy-grid">
      <section className="studio-card jy-center">
        <svg ref={svg} className="hy-glass" viewBox="0 0 160 220" role="img" aria-label={`${glasses} of ${store.goal} glasses`}>
          <defs>
            <clipPath id="hy-clip"><path d="M24 20 L136 20 L122 200 Q120 210 110 210 L50 210 Q40 210 38 200 Z" /></clipPath>
            <linearGradient id="hy-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6fd3ff" /><stop offset="1" stopColor="#1c7fd6" /></linearGradient>
          </defs>
          <g clipPath="url(#hy-clip)">
            <g className="hy-water" transform="translate(0 0)">
              <path className="hy-wave" d="M0 190 q 30 -12 60 0 t 60 0 t 60 0 t 60 0 t 60 0 V 400 H 0 Z" fill="url(#hy-g)" />
              {[40, 70, 95, 118].map((x, i) => <circle key={i} className="hy-bubble" cx={x} cy={205} r={2 + (i % 2)} fill="#fff" opacity="0.8" />)}
            </g>
          </g>
          <path d="M24 20 L136 20 L122 200 Q120 210 110 210 L50 210 Q40 210 38 200 Z" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" opacity="0.6" />
          <path d="M36 34 L44 180" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.35" />
        </svg>
        <strong className="jy-big">{glasses} / {store.goal}</strong>
        <div className="jy-row">
          <button type="button" className="studio-btn" onClick={() => add(-1)} disabled={!glasses}>−</button>
          <button type="button" className="jy-cta" onClick={(e) => add(1, e.currentTarget)}>+ Glass</button>
        </div>
        <label className="jy-small">Daily goal <input type="number" min={1} max={20} className="studio-input" value={store.goal} onChange={(e) => save((s) => ({ ...s, goal: Math.max(1, Number(e.target.value) || 8) }))} /></label>
      </section>
      <section className="studio-card">
        <h3>This week</h3>
        <div className="hy-week">
          {week.map((d) => (
            <div key={d.k} className="hy-day">
              <i style={{ height: `${Math.min(100, (d.v / store.goal) * 100)}%` }} />
              <small>{d.label}</small>
            </div>
          ))}
        </div>
        <p className="quick-note">Tip: drink a glass after each Focus session and with every meal.</p>
      </section>
    </div>
  )
}

/* ---------------- 2. Sky: moon phase + sun arc ---------------- */
function moonPath(age: number) {
  // age 0..1 through the lunar month; draw the lit part with a terminator ellipse.
  const r = 60
  const phase = age * 2 * Math.PI
  const k = Math.cos(phase) // 1 new, -1 full
  const waxing = age < 0.5
  const rx = Math.abs(k) * r
  const sweepOuter = waxing ? 1 : 0
  const sweepInner = k > 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0
  return `M 0 ${-r} A ${r} ${r} 0 0 ${sweepOuter} 0 ${r} A ${rx} ${r} 0 0 ${sweepInner} 0 ${-r} Z`
}
function Sky({ store, save }: { store: JoysStore; save: (f: (s: JoysStore) => JoysStore) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const moonSvg = useRef<SVGSVGElement>(null)
  const now = new Date()
  const raw = SunCalc.getTimes(now, store.lat, store.lon)
  // Polar days/nights have no sunrise or sunset: fall back to 6:00 / 18:00.
  const at = (h: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h)
  const times = { sunrise: raw.sunrise ?? at(6), sunset: raw.sunset ?? at(18), goldenHour: raw.goldenHour ?? at(17) }
  const age = Moon.lunarAgePercent(now)
  const phaseName = Moon.lunarPhase(now)
  const dayT = Math.min(1, Math.max(0, (now.getTime() - times.sunrise.getTime()) / (times.sunset.getTime() - times.sunrise.getTime())))
  const isDay = now > times.sunrise && now < times.sunset
  useLayoutEffect(() => {
    if (!svg.current) return
    const moon = moonSvg.current?.querySelector('.sk-lit')
    const sun = svg.current.querySelector('.sk-sun')
    const o = { a: 0, t: 0 }
    const draw = () => {
      moon?.setAttribute('d', moonPath(o.a))
      const ang = Math.PI * (1 - o.t)
      sun?.setAttribute('transform', `translate(${200 + Math.cos(ang) * 150} ${170 - Math.sin(ang) * 120})`)
    }
    const tw = gsap.to(o, { a: age, t: dayT, duration: reduced() ? 0 : 2.2, ease: 'power2.inOut', onUpdate: draw })
    draw()
    const stars = reduced() ? null : gsap.to(svg.current.querySelectorAll('.sk-star'), { opacity: 0.2, duration: () => gsap.utils.random(0.8, 2), yoyo: true, repeat: -1, stagger: 0.1 })
    return () => {
      tw.kill()
      stars?.kill()
    }
  }, [age, dayT])
  const fmt = (d: Date) => (isNaN(d.getTime()) ? '—' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  return (
    <div className="jy-grid">
      <section className="studio-card jy-center">
        <svg ref={svg} className="sk-svg" viewBox="0 0 400 200" role="img" aria-label={`Sun ${Math.round(dayT * 100)}% across the sky`}>
          <defs>
            <linearGradient id="sk-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={isDay ? '#7fc8ff' : '#0b1030'} /><stop offset="1" stopColor={isDay ? '#ffe7b8' : '#3a2a6b'} /></linearGradient>
            <radialGradient id="sk-sun-g"><stop offset="0" stopColor="#fff6c8" /><stop offset="0.5" stopColor="#ffc800" /><stop offset="1" stopColor="#ff9600" stopOpacity="0" /></radialGradient>
          </defs>
          <rect width="400" height="200" rx="16" fill="url(#sk-bg)" />
          {!isDay && Array.from({ length: 18 }, (_, i) => <circle key={i} className="sk-star" cx={(i * 83) % 400} cy={(i * 47) % 120} r={1.3} fill="#fff" />)}
          <path d="M50 170 A150 120 0 0 1 350 170" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="5 6" opacity="0.6" />
          <line x1="20" y1="170" x2="380" y2="170" stroke="#0003" strokeWidth="2" />
          <g className="sk-sun"><circle r="26" fill="url(#sk-sun-g)" /><circle r="11" fill="#ffd54f" /></g>
          <text x="50" y="190" fontSize="11" textAnchor="middle" fill="#fff">↑ {fmt(times.sunrise)}</text>
          <text x="350" y="190" fontSize="11" textAnchor="middle" fill="#fff">↓ {fmt(times.sunset)}</text>
        </svg>
        <p className="quick-note">Golden hour from {fmt(times.goldenHour)} — a lovely time for a walk.</p>
      </section>
      <section className="studio-card jy-center">
        <svg ref={moonSvg} className="sk-moon" viewBox="-80 -80 160 160" role="img" aria-label={phaseName}>
          <circle r="62" fill="#20233a" />
          <path className="sk-lit" d={moonPath(0)} fill="#f4f1de" />
          <circle cx="-18" cy="-14" r="8" fill="#0000000d" /><circle cx="20" cy="18" r="11" fill="#0000000d" /><circle cx="10" cy="-30" r="5" fill="#0000000d" />
        </svg>
        <strong className="jy-big">{Moon.lunarPhaseEmoji(now)} {phaseName}</strong>
        <small>Day {Math.round(Moon.lunarAge(now))} of the lunar month</small>
        <button type="button" className="studio-btn" onClick={() => navigator.geolocation?.getCurrentPosition((p) => save((s) => ({ ...s, lat: p.coords.latitude, lon: p.coords.longitude })))}>Use my location</button>
      </section>
    </div>
  )
}

/* ---------------- 3. Kindness deck ---------------- */
const acts = [
  'Send a thank-you message to someone who helped you', 'Compliment a stranger (kindly!)', 'Leave a nice review for a small business',
  'Call a grandparent or an old friend', 'Make someone a cup of tea', 'Let someone go ahead of you in a queue', 'Pick up three bits of litter',
  'Write a kind note to your future self', 'Share something useful you learned today', 'Tell a colleague what they do well',
  'Donate something you no longer use', 'Water a plant (or a neighbour’s)', 'Listen fully without checking your phone', 'Cook a little extra and share it',
  'Hold the door and smile', 'Say sorry for something small', 'Forgive yourself for one mistake', 'Leave a positive comment for a creator you enjoy',
  'Teach someone a word in English', 'Send a meme that will make a friend laugh', 'Tidy a shared space', 'Thank a delivery driver',
]
function Kindness({ store, save, today }: { store: JoysStore; save: (f: (s: JoysStore) => JoysStore) => void; today: string }) {
  const card = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  const [extra, setExtra] = useState(0)
  const act = useMemo(() => acts[Math.floor(seedrandom(`kind-${today}-${extra}`)() * acts.length)], [today, extra])
  const done = store.kind[today]
  const streak = useMemo(() => {
    let n = 0
    const d = new Date(`${today}T12:00:00`)
    if (!store.kind[today]) d.setDate(d.getDate() - 1)
    while (store.kind[d.toISOString().slice(0, 10)]) {
      n++
      d.setDate(d.getDate() - 1)
    }
    return n
  }, [store.kind, today])
  const flip = () => {
    setFlipped((f) => !f)
    if (card.current) gsap.to(card.current, { rotateY: flipped ? 0 : 180, duration: reduced() ? 0 : 0.8, ease: 'back.out(1.4)' })
  }
  return (
    <div className="jy-grid">
      <section className="studio-card jy-center">
        <div className="kd-scene" onClick={flip} role="button" tabIndex={0} aria-label={flipped ? 'Hide card' : 'Reveal today’s kindness'} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && flip()}>
          <div ref={card} className="kd-card">
            <div className="kd-face kd-front">
              <svg viewBox="0 0 100 100" width="90" aria-hidden="true"><path d="M50 82 C 20 60, 10 40, 28 26 C 40 18, 50 28, 50 34 C 50 28, 60 18, 72 26 C 90 40, 80 60, 50 82 Z" fill="#ff6f91" /></svg>
              <strong>Tap to reveal today’s kindness</strong>
            </div>
            <div className="kd-face kd-back">
              <p>{act}</p>
            </div>
          </div>
        </div>
        <div className="jy-row">
          <button type="button" className="jy-cta" disabled={done} onClick={(e) => { save((s) => ({ ...s, kind: { ...s.kind, [today]: true } })); burst(e.currentTarget, 'stars'); logActivity('kindness', {}) }}>{done ? 'Done today ✓' : 'I did it!'}</button>
          <button type="button" className="studio-btn" onClick={() => { setExtra((n) => n + 1); if (!flipped) flip() }}>Another idea</button>
        </div>
        <small>{streak}-day kindness streak</small>
      </section>
    </div>
  )
}

/* ---------------- 4. Mood colours ---------------- */
const moodBases = [
  { label: 'Calm', hex: '#4fb3d9' }, { label: 'Happy', hex: '#ffc800' }, { label: 'Energised', hex: '#ff6a3d' },
  { label: 'Tender', hex: '#f06ba8' }, { label: 'Focused', hex: '#6d5cf5' }, { label: 'Grounded', hex: '#58a55c' },
]
function blobPath(radii: number[]) {
  const n = radii.length
  const pts = radii.map((r, i) => [Math.cos((i / n) * Math.PI * 2) * r, Math.sin((i / n) * Math.PI * 2) * r])
  let d = `M ${(pts[0][0] + pts[n - 1][0]) / 2} ${(pts[0][1] + pts[n - 1][1]) / 2}`
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i]
    const [nx, ny] = pts[(i + 1) % n]
    d += ` Q ${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`
  }
  return d + ' Z'
}
function MoodColours({ store, save }: { store: JoysStore; save: (f: (s: JoysStore) => JoysStore) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const [copied, setCopied] = useState('')
  const palette = useMemo(() => {
    const base = tinycolor(store.moodHex)
    return [base, ...base.analogous(4).slice(1), base.complement(), base.clone().lighten(25)].map((c) => c.toHexString())
  }, [store.moodHex])
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const blobs = [...svg.current.querySelectorAll<SVGPathElement>('.mc-blob')]
    const tweens = blobs.map((b, i) => {
      const r = { v: Array.from({ length: 8 }, () => 60 - i * 12) }
      const next = () => gsap.to(r.v, { endArray: Array.from({ length: 8 }, () => gsap.utils.random(40, 72) - i * 12), duration: 3 + i, ease: 'sine.inOut', onUpdate: () => b.setAttribute('d', blobPath(r.v)), onComplete: next })
      return next()
    })
    const breathe = gsap.to(svg.current.querySelector('.mc-all'), { scale: 1.08, transformOrigin: '50% 50%', duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    return () => {
      tweens.forEach((t) => t.kill())
      breathe.kill()
    }
  }, [])
  return (
    <div className="jy-grid">
      <section className="studio-card jy-center">
        <svg ref={svg} className="mc-svg" viewBox="-100 -100 200 200" role="img" aria-label="Your mood colours breathing">
          <defs><filter id="mc-blur"><feGaussianBlur stdDeviation="4" /></filter></defs>
          <g className="mc-all" filter="url(#mc-blur)">
            {palette.slice(0, 4).map((c, i) => <path key={i} className="mc-blob" d={blobPath(Array(8).fill(60 - i * 12))} fill={c} opacity={0.85 - i * 0.1} style={{ transition: 'fill 800ms' }} />)}
          </g>
        </svg>
        <p className="quick-note">Breathe in as the colours grow, out as they shrink.</p>
      </section>
      <section className="studio-card">
        <h3>How do you feel?</h3>
        <div className="jy-row wrap">
          {moodBases.map((m) => (
            <button key={m.label} type="button" className="studio-chip" aria-pressed={store.moodHex === m.hex} style={{ ['--c' as string]: m.hex }} onClick={() => save((s) => ({ ...s, moodHex: m.hex }))}>
              <i className="mc-dot" style={{ background: m.hex }} /> {m.label}
            </button>
          ))}
        </div>
        <h3>Your palette</h3>
        <div className="mc-swatches">
          {palette.map((c) => (
            <button key={c} type="button" style={{ background: c, color: tinycolor(c).isLight() ? '#111' : '#fff' }} onClick={() => { void navigator.clipboard?.writeText(c); setCopied(c) }}>{copied === c ? 'Copied!' : c}</button>
          ))}
        </div>
      </section>
    </div>
  )
}

/* ---------------- 5. Postcard with QR ---------------- */
function Postcard({ data, today }: { data: AppData; today: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const [msg, setMsg] = useState('A little better, every day 🌱')
  const [qr, setQr] = useState('')
  const habitsToday = data?.habits?.filter((h) => h.dates.includes(today)).length ?? 0
  const todosDone = data?.todos?.filter((t) => t.done).length ?? 0
  useEffect(() => {
    void QRCode.toDataURL(`Bloom postcard ${today}: ${msg}`, { margin: 1, width: 160, color: { dark: '#1f1d2b', light: '#ffffff' } }).then(setQr)
  }, [msg, today])
  useLayoutEffect(() => {
    if (!svg.current || reduced()) return
    const ctx = gsap.context(() => {
      gsap.timeline()
        .from('.pc-card', { rotate: -8, y: 30, opacity: 0, duration: 0.6, ease: 'back.out(1.6)' })
        .from('.pc-stamp', { scale: 3, rotate: 40, opacity: 0, duration: 0.45, ease: 'power4.in' }, 0.4)
        .to('.pc-card', { x: 4, duration: 0.05, yoyo: true, repeat: 3 }, 0.85)
        .from('.pc-line', { attr: { 'stroke-dashoffset': 300 }, duration: 0.8, stagger: 0.12 }, 0.6)
    }, svg)
    return () => ctx.revert()
  }, [])
  const download = () => {
    if (!svg.current) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg.current)], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bloom-postcard-${today}.svg`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div className="jy-grid">
      <section className="studio-card jy-center">
        <svg ref={svg} className="pc-svg" data-matrix-native viewBox="0 0 420 270" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Your Bloom postcard">
          <g className="pc-card">
            <rect x="10" y="10" width="400" height="250" rx="14" fill="#fffaf2" stroke="#e6d8c3" strokeWidth="2" />
            <rect x="10" y="10" width="400" height="10" rx="5" fill="#ff8a5a" />
            <text x="30" y="56" fontSize="22" fontWeight="800" fill="#d0643f">Greetings from Bloom!</text>
            <foreignObject x="30" y="68" width="200" height="90"><p className="pc-msg">{msg}</p></foreignObject>
            <text x="30" y="190" fontSize="13" fill="#5b3a2e">🌱 {habitsToday} habits today · ✅ {todosDone} to-dos done</text>
            <text x="30" y="212" fontSize="12" fill="#9a8a7a">{new Date(`${today}T12:00:00`).toLocaleDateString([], { dateStyle: 'long' })}</text>
            {[120, 146, 172].map((y) => <line key={y} className="pc-line" x1="250" y1={y} x2="390" y2={y} stroke="#e6d8c3" strokeWidth="2" strokeDasharray="300" strokeDashoffset="0" />)}
            {qr && <image href={qr} x="300" y="180" width="70" height="70" />}
            <g className="pc-stamp" transform="translate(360 60)">
              <rect x="-30" y="-32" width="60" height="64" rx="4" fill="#fff" stroke="#ff8a5a" strokeWidth="3" strokeDasharray="4 3" />
              <path d="M0 -18 C 8 -18, 14 -8, 0 12 C -14 -8, -8 -18, 0 -18 Z" fill="#6cc04a" />
              <circle r="6" cy="-4" fill="#ff8a5a" />
            </g>
          </g>
        </svg>
        <div className="jy-row wrap">
          <input className="studio-input" value={msg} maxLength={90} aria-label="Postcard message" onChange={(e) => setMsg(e.target.value)} />
          <button type="button" className="jy-cta" onClick={download}>Download</button>
        </div>
      </section>
    </div>
  )
}

export function JoysPage({ data, today }: { data: AppData; setData?: unknown; today: string; onNavigate?: unknown }) {
  const [store, setStore] = useState<JoysStore>(() => ({ ...empty, ...readStore(JOYS_KEY, empty) }))
  const save = (f: (s: JoysStore) => JoysStore) =>
    setStore((s) => {
      const n = f(s)
      writeStore(JOYS_KEY, n)
      return n
    })
  const [tab, setTab] = useState('water')
  return (
    <Studio
      name="joys"
      accent="#1cb0f6"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#1cb0f6', '#ffc800', '#ff6f91']} line="pulse" />}
      tabs={[
        ...(on('hydration') ? [{ id: 'water', label: 'Hydration', icon: <CupSoda size={15} />, render: () => <Hydration store={store} save={save} today={today} /> }] : []),
        ...(on('sky') ? [{ id: 'sky', label: 'Sky', icon: <MoonStar size={15} />, render: () => <Sky store={store} save={save} /> }] : []),
        ...(on('kindness') ? [{ id: 'kind', label: 'Kindness', icon: <Heart size={15} />, render: () => <Kindness store={store} save={save} today={today} /> }] : []),
        ...(on('moodColours') ? [{ id: 'colours', label: 'Mood colours', icon: <Palette size={15} />, render: () => <MoodColours store={store} save={save} /> }] : []),
        ...(on('postcard') ? [{ id: 'postcard', label: 'Postcard', icon: <Mail size={15} />, render: () => <Postcard data={data} today={today} /> }] : []),
      ]}
    />
  )
}
