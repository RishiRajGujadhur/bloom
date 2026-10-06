import { DropdownSelect } from '../../components/ui/DropdownSelect'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { Download, Pause, Play, Radio, RefreshCw, Sparkles } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { CapsBadge } from '../../platform/CapsBadge'
import { hasCap } from '../../platform/caps'
import { readStore } from '../../components/studio/Studio'
import { MONEY_KEY, emptyMoney, formatMoney, toMinor, type MoneyStore } from '../money/moneyModel'
import { daysUntil } from '../money/billsModel'
import { loadScans } from '../readiness/sources'
import { readPlaces } from '../places/placesStore'
import { readingSeconds, script, segments, splitSentences, streak, type BriefingInput, type Segment } from './briefingModel'
import { VOICES, jingle, loadVoice, render } from './voice'
import './briefing.css'

/**
 * Morning Briefing Radio: one tap for a spoken 60–90 second summary of your
 * day. A radio dial with a live circular spectrum, a transcript that follows
 * the voice, an on-device neural voice (Kokoro, WebGPU) cached in OPFS, and an
 * optional rewrite by the local LLM.
 */
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
type Weather = NonNullable<BriefingInput['weather']>

async function fetchWeather(lat: number, lng: number): Promise<Weather | null> {
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lng.toFixed(2)}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`
    const j = await (await fetch(u)).json()
    return { tempC: j.current.temperature_2m, code: j.current.weather_code, highC: j.daily.temperature_2m_max[0], lowC: j.daily.temperature_2m_min[0], rainChance: j.daily.precipitation_probability_max[0] ?? 0 }
  } catch { return null }
}

function Dial({ analyser, playing, speaking }: { analyser: AnalyserNode | null; playing: boolean; speaking: boolean }) {
  const bars = useRef<SVGGElement>(null)
  const needle = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!needle.current || reduced()) return
    const t = gsap.fromTo(needle.current, { x: -120 }, { x: 0, duration: 1.8, ease: 'elastic.out(1, 0.5)' })
    return () => { t.kill() }
  }, [])
  useEffect(() => {
    const g = bars.current
    if (!g) return
    const lines = [...g.children] as SVGLineElement[]
    const data = new Uint8Array(analyser?.frequencyBinCount ?? 64)
    let raf = 0
    let t = 0
    const tick = () => {
      t += 1
      if (analyser && playing) analyser.getByteFrequencyData(data)
      lines.forEach((l, i) => {
        // With the browser voice there's no audio stream to analyse, so the bars breathe instead.
        const v = analyser && playing ? data[Math.floor((i / lines.length) * data.length * 0.6)] / 255 : speaking ? 0.35 + 0.35 * Math.abs(Math.sin(t / 7 + i * 0.7)) * Math.random() : 0.06
        l.setAttribute('y2', String(-(96 + v * 58)))
      })
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [analyser, playing, speaking])
  return (
    <svg className="br-dial" viewBox="-180 -180 360 360" role="img" aria-label="Bloom FM radio dial" data-matrix-native>
      <defs>
        <radialGradient id="br-core"><stop offset="0" stopColor="#ffb347" stopOpacity="0.35" /><stop offset="1" stopColor="#ffb347" stopOpacity="0" /></radialGradient>
      </defs>
      <circle r="170" className="br-outer" />
      <g ref={bars}>{Array.from({ length: 72 }, (_, i) => <line key={i} x1="0" y1="-94" x2="0" y2="-100" transform={`rotate(${(i / 72) * 360})`} className="br-bar" stroke={`hsl(${20 + (i % 18) * 2.2} 100% ${58 + (i % 9) * 2}%)`} />)}</g>
      <circle r="90" fill="url(#br-core)" />
      <circle r="88" className="br-face" />
      <g className="br-scale">
        {Array.from({ length: 21 }, (_, i) => <line key={i} x1={-60 + i * 6} x2={-60 + i * 6} y1={i % 5 ? 8 : 2} y2="14" />)}
        <text x="-60" y="30">88</text><text x="0" y="30" textAnchor="middle">98</text><text x="60" y="30" textAnchor="end">108</text>
      </g>
      <g ref={needle}><rect x="-1.5" y="-4" width="3" height="22" className="br-needle" transform="translate(12 0)" /></g>
      <text y="-22" textAnchor="middle" className="br-station">BLOOM FM</text>
      <text y="-44" textAnchor="middle" className={`br-onair ${playing || speaking ? 'on' : ''}`}>● ON AIR</text>
    </svg>
  )
}

export function BriefingPage({ data, today }: FeaturePageProps) {
  const [weather, setWeather] = useState<Weather | null>(null)
  const [readiness, setReadiness] = useState<BriefingInput['readiness']>(null)
  const [voice, setVoice] = useState<string>(VOICES[0].id)
  const [hd, setHd] = useState<'off' | 'loading' | 'ready'>('off')
  const [dl, setDl] = useState(0)
  const [rendering, setRendering] = useState<{ done: number; total: number } | null>(null)
  const [playing, setPlaying] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [current, setCurrent] = useState(-1)
  const [rewritten, setRewritten] = useState<string | null>(null)
  const [aiState, setAiState] = useState<'idle' | 'loading' | 'writing' | 'error'>('idle')
  const [err, setErr] = useState('')
  const ctx = useRef<AudioContext | null>(null)
  const src = useRef<AudioBufferSourceNode | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const marks = useRef<number[]>([])
  const started = useRef(0)

  useEffect(() => {
    void loadScans().then((s) => { const t = s.find((x) => x.date === today); if (t) setReadiness({ score: t.score, label: t.score == null ? 'Baseline' : t.score >= 70 ? 'Primed' : t.score >= 45 ? 'Steady' : 'Recover', hr: t.hr }) })
    const pts = readPlaces().points
    const last = pts[pts.length - 1]
    if (last) void fetchWeather(last.lat, last.lng).then(setWeather)
  }, [today])
  const useMyLocation = () => navigator.geolocation?.getCurrentPosition((p) => void fetchWeather(p.coords.latitude, p.coords.longitude).then(setWeather), () => setErr('Location wasn’t shared, so the weather is skipped.'))

  const money = readStore<MoneyStore>(MONEY_KEY, emptyMoney)
  const segs: Segment[] = useMemo(() => segments({
    now: new Date(),
    weather,
    readiness,
    events: (data.calendarBlocks ?? []).filter((b) => b.start.slice(0, 10) === today).map((b) => ({ title: b.title, start: new Date(b.start) })),
    tasks: (data.todos ?? []).filter((t) => !t.done && t.due && t.due <= today).map((t) => ({ title: t.title, priority: t.priority, overdue: t.due < today })),
    habits: data.habits.map((h) => ({ title: h.title, streak: streak(h.dates, today), doneToday: h.dates.includes(today) })),
    bills: (money.bills ?? []).filter((b) => !b.paid && (b.due ?? b.renews)).map((b) => ({ biller: b.biller, amount: b.amount, days: daysUntil((b.due ?? b.renews)!), kind: b.kind })),
    money: (n) => formatMoney(toMinor(n), money.currency),
  }), [data, today, weather, readiness, money.bills, money.currency])
  const text = rewritten ?? script(segs)
  const sentences = useMemo(() => splitSentences(text), [text])

  const stop = () => {
    src.current?.stop()
    src.current = null
    speechSynthesis.cancel()
    setPlaying(false)
    setSpeaking(false)
    setCurrent(-1)
  }
  useEffect(() => () => { src.current?.stop(); speechSynthesis.cancel(); void ctx.current?.close() }, [])

  const getHd = async () => {
    setHd('loading')
    setErr('')
    try { await loadVoice(setDl); setHd('ready') } catch (e) { setHd('off'); setErr(`The HD voice couldn’t load: ${(e as Error).message}`) }
  }

  const play = async () => {
    stop()
    setErr('')
    await jingle().catch(() => {})
    if (hd === 'ready') {
      setRendering({ done: 0, total: sentences.length })
      try {
        const key = `${today}-${voice}-${text.length}`
        const out = await render(text, voice, key, (done, total) => setRendering({ done, total }))
        marks.current = out.marks
        ctx.current ??= new AudioContext()
        const ac = ctx.current
        const buf = await ac.decodeAudioData(await out.wav.arrayBuffer())
        const an = ac.createAnalyser()
        an.fftSize = 256
        const s = ac.createBufferSource()
        s.buffer = buf
        s.connect(an).connect(ac.destination)
        s.onended = () => { setPlaying(false); setCurrent(-1) }
        started.current = ac.currentTime
        s.start()
        src.current = s
        setAnalyser(an)
        setPlaying(true)
      } catch (e) {
        setErr(`HD voice failed, using the browser voice: ${(e as Error).message}`)
        speakFallback()
      } finally {
        setRendering(null)
      }
    } else speakFallback()
  }
  const speakFallback = () => {
    let i = 0
    const next = () => {
      if (i >= sentences.length) { setSpeaking(false); setCurrent(-1); return }
      const u = new SpeechSynthesisUtterance(sentences[i].trim())
      u.rate = 1.02
      setCurrent(i)
      u.onend = () => { i++; next() }
      speechSynthesis.speak(u)
    }
    setSpeaking(true)
    next()
  }
  // Space plays or stops the briefing.
  const toggleRef = useRef(() => {})
  toggleRef.current = () => (playing || speaking ? stop() : void play())
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select, [contenteditable="true"]')) return
      e.preventDefault()
      toggleRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  // Follow the HD voice through the transcript using each sentence's start time.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    const tick = () => {
      const t = (ctx.current?.currentTime ?? 0) - started.current
      let k = 0
      while (k + 1 < marks.current.length && marks.current[k + 1] <= t) k++
      setCurrent(k)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [playing])

  const rewrite = async () => {
    setAiState('loading')
    try {
      const { LocalCompanion } = await import('../../companion/localAI')
      const ai = new LocalCompanion()
      await ai.load(() => {})
      setAiState('writing')
      const out = await ai.generate('You are a warm morning radio host. Rewrite the briefing below as natural spoken English in under 170 words. Keep every fact, time and number exactly. No lists, no emojis, no stage directions.', script(segs))
      ai.dispose()
      if (out.length > 40) setRewritten(out)
      setAiState('idle')
    } catch (e) {
      setAiState('error')
      setErr((e as Error).message)
    }
  }

  // Map each sentence back to the segment it came from, for the icons.
  let seg = 0
  let used = 0
  const owner = sentences.map((s) => {
    while (seg < segs.length - 1 && used >= segs[seg].text.length - 2) { used = 0; seg++ }
    used += s.length
    return rewritten ? null : segs[seg]
  })

  return (
    <div className="br-page">
      <section className="br-radio">
        <header className="br-head">
          <div>
            <p className="br-eyebrow"><Radio size={14} /> Morning briefing</p>
            <h2>Your day, on air in {readingSeconds(text)} seconds.</h2>
          </div>
          <CapsBadge caps={['gpu', 'opfs']} />
        </header>
        <div className="br-stage">
          <Dial analyser={analyser} playing={playing} speaking={speaking} />
          <div className="br-controls">
            <button type="button" className="br-play" onClick={() => (playing || speaking ? stop() : void play())} aria-label={playing || speaking ? 'Stop the briefing' : 'Play the briefing'}>
              {playing || speaking ? <Pause size={30} /> : <Play size={30} />}
            </button>
            {rendering && <p className="br-note">Voicing on this device… {rendering.done}/{rendering.total}</p>}
            <div className="br-voice bloom-wrap">
              {hd === 'ready' ? (
                <label>HD voice
                  <DropdownSelect className="studio-input" value={voice} onChange={(e) => setVoice(e.target.value)}>{VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}</DropdownSelect>
                </label>
              ) : (
                <button type="button" className="br-ghost" onClick={() => void getHd()} disabled={hd === 'loading'}>
                  <Download size={15} /> {hd === 'loading' ? `Downloading voice… ${Math.round(dl * 100)}%` : `Get the HD neural voice (${hasCap('gpu') ? 'WebGPU' : 'WebAssembly'}, one-time download)`}
                </button>
              )}
              <button type="button" className="br-ghost" onClick={() => void rewrite()} disabled={aiState === 'loading' || aiState === 'writing' || !hasCap('gpu')} title={hasCap('gpu') ? 'Uses Bloom’s on-device language model' : 'Needs WebGPU'}>
                <Sparkles size={15} /> {aiState === 'loading' ? 'Loading local AI…' : aiState === 'writing' ? 'Writing…' : 'Rewrite with local AI'}
              </button>
              {rewritten && <button type="button" className="br-ghost" onClick={() => setRewritten(null)}><RefreshCw size={15} /> Back to the template</button>}
              {!weather && <button type="button" className="br-ghost" onClick={useMyLocation}>🌤️ Add local weather</button>}
              <button type="button" className="br-ghost" onClick={() => void navigator.clipboard?.writeText(text).then(() => window.dispatchEvent(new CustomEvent('bloom:toast', { detail: 'Briefing copied' })))}>📋 Copy text</button>
            </div>
            {err && <p className="voice-error">{err}</p>}
          </div>
        </div>
      </section>
      <section className="br-script" aria-label="Transcript">
        <h3>Transcript</h3>
        <ol>
          {sentences.map((s, i) => (
            <li key={i} className={i === current ? 'now' : i < current ? 'past' : ''}>
              {owner[i] && (i === 0 || owner[i] !== owner[i - 1]) && <span className="br-seg">{owner[i]!.icon} {owner[i]!.title}</span>}
              {s.trim()}
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
