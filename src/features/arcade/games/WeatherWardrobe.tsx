import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { GameShell, reducedMotion, useBest } from '../shell'

/**
 * Weather Wardrobe: Pip is heading out six days in a row. Glance at the sky
 * and the thermometer, then tap clothes on or off before the door opens.
 * Too warm, too cold, soggy or sunburnt — Pip will let you know. Umbrellas
 * and gusty days don't mix.
 */
type Item = { id: string; glyph: string; name: string; warm: number; rain?: boolean; sun?: boolean; windBad?: boolean }
const ITEMS: Item[] = [
  { id: 'tee', glyph: '👕', name: 'T-shirt', warm: 1 },
  { id: 'jumper', glyph: '🧶', name: 'Jumper', warm: 3 },
  { id: 'coat', glyph: '🧥', name: 'Coat', warm: 4, rain: true },
  { id: 'shorts', glyph: '🩲', name: 'Shorts', warm: 0 },
  { id: 'jeans', glyph: '👖', name: 'Jeans', warm: 2 },
  { id: 'scarf', glyph: '🧣', name: 'Scarf', warm: 2 },
  { id: 'boots', glyph: '👢', name: 'Boots', warm: 1, rain: true },
  { id: 'umbrella', glyph: '☂️', name: 'Umbrella', warm: 0, rain: true, windBad: true },
  { id: 'hat', glyph: '👒', name: 'Sun hat', warm: 0, sun: true, windBad: true },
  { id: 'cream', glyph: '🧴', name: 'Sun cream', warm: 0, sun: true },
]
type Day = { name: string; temp: number; rain: boolean; sun: boolean; wind: boolean; snow: boolean }
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const makeDay = (name: string): Day => {
  const temp = Math.round(-3 + Math.random() * 32)
  const rain = temp > 2 && Math.random() < 0.4
  const snow = temp <= 2 && Math.random() < 0.6
  const sun = !rain && !snow && temp > 16 && Math.random() < 0.8
  return { name, temp, rain, sun, wind: Math.random() < 0.35, snow }
}
// Warmth needed: colder days need more layers.
const need = (t: number) => (t >= 24 ? 1 : t >= 17 ? 3 : t >= 10 ? 5 : t >= 3 ? 8 : 10)
const W = 800, H = 470
const SECS = 12

export default function WeatherWardrobe() {
  const [best, submit] = useBest('wardrobe')
  const [days, setDays] = useState<Day[]>(() => DAYS.map(makeDay))
  const [di, setDi] = useState(0)
  const [worn, setWorn] = useState<Set<string>>(new Set(['tee', 'jeans']))
  const [time, setTime] = useState(SECS)
  const [verdict, setVerdict] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState<{ headline: string; lines: string[]; record: boolean } | null>(null)
  const [round, setRound] = useState(0)
  const st = useRef({ di: 0, t: SECS, score: 0, running: true, perfect: 0, notes: [] as string[] })
  const wornRef = useRef(worn)
  useEffect(() => { wornRef.current = worn }, [worn])
  const daysRef = useRef(days)
  useEffect(() => { daysRef.current = days }, [days])
  const pip = useRef<SVGGElement>(null)
  const weather = useRef<SVGGElement>(null)
  const submitRef = useRef(submit)
  useEffect(() => { submitRef.current = submit }, [submit])

  const judge = useCallback(() => {
    const s = st.current
    const d = daysRef.current[s.di]
    const on = ITEMS.filter((i) => wornRef.current.has(i.id))
    const warmth = on.reduce((n, i) => n + i.warm, 0)
    const target = need(d.temp)
    const issues: string[] = []
    if (warmth < target - 1) issues.push('brr, too cold')
    if (warmth > target + 2) issues.push('phew, too hot')
    if ((d.rain || d.snow) && !on.some((i) => i.rain && !(d.wind && i.windBad))) issues.push('soggy')
    if (d.sun && !on.some((i) => i.sun && !(d.wind && i.windBad))) issues.push('sunburnt nose')
    if (d.wind && on.some((i) => i.windBad)) issues.push(on.some((i) => i.id === 'umbrella') ? 'umbrella flipped inside out' : 'hat blew away')
    if (!on.some((i) => ['tee', 'jumper', 'coat'].includes(i.id))) issues.push('forgot a top!')
    const pts = Math.max(0, 30 - issues.length * 10 + (issues.length ? 0 : Math.ceil(s.t)))
    s.score += pts
    if (!issues.length) s.perfect++
    s.notes.push(`${d.name}: ${issues.length ? issues.join(', ') : 'just right'}`)
    setScore(s.score)
    setVerdict(issues.length ? `${d.name}: ${issues.join(', ')}` : `${d.name}: just right! 😊`)
    if (pip.current && !reducedMotion()) {
      if (issues.length) gsap.fromTo(pip.current, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' })
      else gsap.fromTo(pip.current, { y: 0 }, { y: -26, duration: 0.25, yoyo: true, repeat: 1, ease: 'power2.out' })
    }
    if (s.di >= DAYS.length - 1) {
      s.running = false
      const record = submitRef.current(s.score)
      setTimeout(() => setResult({ headline: 'Week done!', lines: [`${s.perfect} of ${DAYS.length} days dressed just right`, ...s.notes.filter((n) => !n.endsWith('just right')).slice(0, 3), `Score ${s.score}`], record }), 900)
    } else {
      s.di++; s.t = SECS
      setDi(s.di)
    }
  }, [])

  useEffect(() => {
    const d = DAYS.map(makeDay)
    daysRef.current = d
    st.current = { di: 0, t: SECS, score: 0, running: true, perfect: 0, notes: [] }
    setDays(d); setDi(0); setScore(0); setVerdict(null); setWorn(new Set(['tee', 'jeans']))
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = st.current
      if (s.running) {
        s.t -= dt
        setTime(Math.max(0, Math.ceil(s.t)))
        if (s.t <= 0) judge()
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [round, judge])

  // Weather particles animate per day.
  useEffect(() => {
    const g = weather.current
    if (!g || reducedMotion()) return
    const t = gsap.to(g.querySelectorAll('.ww-p'), { y: '+=120', x: days[di]?.wind ? '+=60' : '+=4', duration: 1.2, repeat: -1, ease: 'none', stagger: { each: 0.05, repeat: -1 } })
    return () => { t.kill() }
  }, [di, days])

  const toggle = (id: string) => setWorn((w) => { const n = new Set(w); if (n.has(id)) n.delete(id); else n.add(id); return n })
  const restart = useCallback(() => { setResult(null); setRound((r) => r + 1) }, [])
  const d = days[di]
  const on = ITEMS.filter((i) => worn.has(i.id))
  return (
    <GameShell title="Weather Wardrobe" score={score} best={best} result={result} onRestart={restart}
      hint={`${d.name}: ${d.temp}°C${d.rain ? ' · rain' : ''}${d.snow ? ' · snow' : ''}${d.sun ? ' · strong sun' : ''}${d.wind ? ' · gusty' : ''} · tap clothes on/off · door opens in ${time}s`}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Pip and the weather">
        <rect width={W} height={H} fill={d.sun ? '#bfe6ff' : d.rain ? '#9fb3c8' : d.snow ? '#dfe8f2' : '#cfe3f3'} />
        {d.sun && <circle cx={680} cy={70} r={42} fill="#ffd84d"><animate attributeName="r" values="40;46;40" dur="2s" repeatCount="indefinite" /></circle>}
        {(d.rain || d.snow || !d.sun) && <g fill="#fff" opacity={0.9}><ellipse cx={180} cy={70} rx={70} ry={26} /><ellipse cx={230} cy={58} rx={50} ry={26} /><ellipse cx={560} cy={80} rx={80} ry={28} /></g>}
        <g ref={weather} key={`${round}-${di}`}>
          {(d.rain || d.snow) && Array.from({ length: 40 }, (_, i) => (
            d.rain
              ? <line key={i} className="ww-p" x1={(i * 37) % W} y1={(i * 23) % 200 - 60} x2={(i * 37) % W - 4} y2={(i * 23) % 200 - 46} stroke="#4a78a8" strokeWidth={2} />
              : <circle key={i} className="ww-p" cx={(i * 37) % W} cy={(i * 23) % 200 - 60} r={3} fill="#fff" />
          ))}
          {d.wind && Array.from({ length: 6 }, (_, i) => <path key={i} className="ww-p" d={`M${i * 130} ${120 + i * 30} q30 -12 60 0 t60 0`} stroke="#ffffffaa" strokeWidth={3} fill="none" />)}
        </g>
        <rect y={390} width={W} height={80} fill="#9ccc65" />
        {/* Thermometer. */}
        <g transform="translate(60 150)">
          <rect x={-8} y={0} width={16} height={180} rx={8} fill="#fff" stroke="#999" />
          <rect x={-5} y={180 - ((d.temp + 5) / 40) * 170} width={10} height={((d.temp + 5) / 40) * 170} rx={5} fill={d.temp > 22 ? '#ef4444' : d.temp > 10 ? '#f59e0b' : '#3b82f6'} />
          <circle cy={188} r={14} fill={d.temp > 22 ? '#ef4444' : d.temp > 10 ? '#f59e0b' : '#3b82f6'} />
          <text x={22} y={20} fontSize={22} fontWeight={800} fill="#1f2937">{d.temp}°</text>
        </g>
        {/* Pip. */}
        <g ref={pip} transform="translate(400 250)">
          <ellipse cy={140} rx={60} ry={10} fill="#0002" />
          <circle cy={-70} r={40} fill="#ffd9b3" />
          <circle cx={-14} cy={-76} r={5} fill="#333" /><circle cx={14} cy={-76} r={5} fill="#333" />
          <path d="M-14 -54 q14 10 28 0" stroke="#333" strokeWidth={3} fill="none" />
          <rect x={-40} y={-30} width={80} height={100} rx={20} fill={worn.has('coat') ? '#8d6e63' : worn.has('jumper') ? '#9575cd' : worn.has('tee') ? '#4fc3f7' : '#ffd9b3'} />
          <rect x={-36} y={68} width={30} height={64} rx={10} fill={worn.has('jeans') ? '#3f5fa3' : worn.has('shorts') ? '#ffb74d' : '#ffd9b3'} />
          <rect x={6} y={68} width={30} height={64} rx={10} fill={worn.has('jeans') ? '#3f5fa3' : worn.has('shorts') ? '#ffb74d' : '#ffd9b3'} />
          {worn.has('shorts') && !worn.has('jeans') && <><rect x={-36} y={100} width={30} height={32} rx={8} fill="#ffd9b3" /><rect x={6} y={100} width={30} height={32} rx={8} fill="#ffd9b3" /></>}
          {worn.has('boots') && <><rect x={-40} y={118} width={36} height={22} rx={6} fill="#5d4037" /><rect x={4} y={118} width={36} height={22} rx={6} fill="#5d4037" /></>}
          {worn.has('scarf') && <rect x={-36} y={-36} width={72} height={16} rx={8} fill="#e53935" />}
          {worn.has('hat') && <><ellipse cy={-104} rx={62} ry={12} fill="#f4d35e" /><ellipse cy={-114} rx={32} ry={20} fill="#f4d35e" /></>}
          {worn.has('umbrella') && <g transform={`translate(60 -40) rotate(${d.wind ? 160 : 0})`}><path d="M-60 -60 Q0 -130 60 -60 Z" fill="#e91e63" /><line x1={0} y1={-60} x2={0} y2={20} stroke="#333" strokeWidth={4} /></g>}
          {worn.has('cream') && <circle cx={0} cy={-62} r={4} fill="#fff" opacity={0.9} />}
        </g>
        {verdict && <text x={400} y={40} textAnchor="middle" fontSize={20} fontWeight={800} fill="#1f2937">{verdict}</text>}
        <g transform="translate(560 160)">
          <text fontSize={13} fill="#1f2937" fontWeight={700}>warmth {on.reduce((n, i) => n + i.warm, 0)}</text>
          <text y={20} fontSize={12} fill="#374151">Pip needs about {need(d.temp)}</text>
          {days.map((x, i) => <text key={i} x={i * 36} y={60} fontSize={12} fill={i === di ? '#111' : '#6b7280'} fontWeight={i === di ? 800 : 400}>{x.name}</text>)}
          {days.map((x, i) => <text key={`w${i}`} x={i * 36} y={80} fontSize={14}>{x.snow ? '❄️' : x.rain ? '🌧️' : x.sun ? '☀️' : '⛅'}</text>)}
        </g>
      </svg>
      <div className="cf-tray">
        {ITEMS.map((i) => <button key={i.id} type="button" className={worn.has(i.id) ? 'on' : ''} onClick={() => toggle(i.id)}>{i.glyph} {i.name}</button>)}
        <button type="button" className="cf-match" onClick={() => { if (st.current.running) judge() }}>🚪 Out the door</button>
      </div>
    </GameShell>
  )
}
