import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import chroma from 'chroma-js'
import { arc } from 'd3-shape'
import { PitchDetector } from 'pitchy'
import { Note } from 'tonal'
import { readPitch } from './tunerModel'
import './tuner.css'

/**
 * Tuner — listens through the microphone, detects pitch with pitchy
 * (McLeod pitch method), names the note with tonal and shows how many cents
 * sharp or flat you are on an SVG gauge whose needle springs with GSAP.
 * Presets for guitar, ukulele, bass and voice; reference tones use Tone.js.
 */
const presets: Record<string, { label: string; strings: string[] }> = {
  guitar: { label: 'Guitar', strings: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'] },
  ukulele: { label: 'Ukulele', strings: ['G4', 'C4', 'E4', 'A4'] },
  bass: { label: 'Bass', strings: ['E1', 'A1', 'D2', 'G2'] },
  voice: { label: 'Voice', strings: ['C3', 'E3', 'G3', 'C4', 'E4', 'G4'] },
}
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const colorFor = chroma.scale(['#ff4b4b', '#ffc800', '#58cc02', '#ffc800', '#ff4b4b']).domain([-50, -20, 0, 20, 50])

export function TunerPage() {
  const [preset, setPresetState] = useState(() => {
    try {
      const saved = localStorage.getItem('bloom-tuner-preset') ?? ''
      return saved in presets ? saved : 'guitar'
    } catch {
      return 'guitar'
    }
  })
  const setPreset = (id: string) => {
    setPresetState(id)
    try { localStorage.setItem('bloom-tuner-preset', id) } catch { /* optional */ }
  }
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [reading, setReading] = useState<{ note: string; cents: number; freq: number } | null>(null)
  const [clarity, setClarity] = useState(0)
  const needle = useRef<SVGGElement>(null)
  const ring = useRef<SVGCircleElement>(null)
  const stopRef = useRef<() => void>(() => {})
  const setAngle = useRef<((v: number) => void) | null>(null)
  const inTune = reading && Math.abs(reading.cents) <= 5 && clarity > 0.9

  useLayoutEffect(() => {
    if (!needle.current) return
    // Each reading retargets a springy tween around the gauge pivot (svgOrigin on every call).
    let last = 0
    setAngle.current = (v: number) => {
      if (Math.abs(v - last) < 0.4) return
      last = v
      if (reduced()) gsap.set(needle.current, { rotation: v, svgOrigin: '200 210' })
      else gsap.to(needle.current, { rotation: v, svgOrigin: '200 210', duration: 0.5, ease: 'elastic.out(1, 0.55)', overwrite: 'auto' })
    }
  }, [])
  // Idle "breathing" sweep so the gauge feels alive before the mic starts.
  useEffect(() => {
    if (listening || reduced()) return
    const o = { v: 0 }
    const tw = gsap.to(o, { v: 1, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut', onUpdate: () => setAngle.current?.(Math.sin(o.v * Math.PI * 2) * 18) })
    return () => void tw.kill()
  }, [listening])
  useEffect(() => {
    setAngle.current?.(reading ? Math.max(-60, Math.min(60, reading.cents * 1.2)) : 0)
  }, [reading])
  useEffect(() => {
    if (inTune && ring.current && !reduced()) gsap.fromTo(ring.current, { attr: { r: 40 }, opacity: 0.9 }, { attr: { r: 150 }, opacity: 0, duration: 0.9, ease: 'power2.out' })
  }, [inTune, reading?.note])
  useEffect(() => () => stopRef.current(), [])

  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false } })
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 4096
      src.connect(analyser)
      const buf = new Float32Array(analyser.fftSize)
      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      let raf = 0
      const tick = () => {
        analyser.getFloatTimeDomainData(buf)
        const [freq, clar] = detector.findPitch(buf, ctx.sampleRate)
        setClarity(clar)
        if (clar > 0.85 && freq > 30 && freq < 2000) setReading(readPitch(freq))
        raf = requestAnimationFrame(tick)
      }
      tick()
      stopRef.current = () => {
        cancelAnimationFrame(raf)
        stream.getTracks().forEach((t) => t.stop())
        void ctx.close()
      }
      setListening(true)
    } catch {
      setError('Microphone access was blocked or is unavailable. You can still use the reference tones.')
    }
  }
  const stop = () => {
    stopRef.current()
    setListening(false)
  }
  const reference = async (n: string) => {
    const Tone = await import('tone')
    await Tone.start()
    const s = new Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.02, release: 0.6 } }).toDestination()
    s.triggerAttackRelease(n, 1.6)
    window.setTimeout(() => s.dispose(), 2600)
  }

  const strings = presets[preset].strings
  // Keys: Space starts/stops listening, 1–6 play a string's reference tone.
  const keysRef = useRef({ listening, strings, start, stop, reference })
  keysRef.current = { listening, strings, start, stop, reference }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea, button')) return
      const k = keysRef.current
      if (e.key === ' ') {
        e.preventDefault()
        if (k.listening) k.stop()
        else void k.start()
      } else if (/^[1-6]$/.test(e.key) && k.strings[Number(e.key) - 1]) void k.reference(k.strings[Number(e.key) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const closest = reading ? strings.reduce((a, b) => (Math.abs((Note.midi(b) ?? 0) - (Note.midi(reading.note) ?? 0)) < Math.abs((Note.midi(a) ?? 0) - (Note.midi(reading.note) ?? 0)) ? b : a)) : null
  const ticks = useMemo(() => Array.from({ length: 21 }, (_, i) => i * 5 - 50), [])
  const band = arc()({ innerRadius: 150, outerRadius: 170, startAngle: -Math.PI / 3, endAngle: Math.PI / 3 }) ?? ''
  const sweet = arc()({ innerRadius: 146, outerRadius: 174, startAngle: (-6 * Math.PI) / 180, endAngle: (6 * Math.PI) / 180 }) ?? ''
  const col = reading ? colorFor(reading.cents).hex() : 'var(--text-muted)'

  return (
    <div className="tu-page">
      <section className="tu-gauge-wrap">
        <svg className="tu-gauge" viewBox="0 0 400 260" role="img" aria-label={reading ? `${reading.note}, ${reading.cents} cents` : 'Tuner gauge'} data-matrix-native>
          <defs>
            <linearGradient id="tu-band" x1="0" x2="1">
              <stop offset="0" stopColor="#ff4b4b" /><stop offset="0.35" stopColor="#ffc800" /><stop offset="0.5" stopColor="#58cc02" /><stop offset="0.65" stopColor="#ffc800" /><stop offset="1" stopColor="#ff4b4b" />
            </linearGradient>
          </defs>
          <circle ref={ring} cx="200" cy="210" r="0" fill="none" stroke="#58cc02" strokeWidth="4" opacity="0" />
          <g transform="translate(200 210)">
            <path d={band} fill="url(#tu-band)" opacity="0.85" />
            <path d={sweet} fill="none" stroke="#58cc02" strokeWidth="3" />
            {ticks.map((c) => {
              const a = ((c * 1.2 - 90) * Math.PI) / 180
              const long = c % 25 === 0
              return <line key={c} x1={Math.cos(a) * (long ? 128 : 136)} y1={Math.sin(a) * (long ? 128 : 136)} x2={Math.cos(a) * 146} y2={Math.sin(a) * 146} className="tu-tick" />
            })}
            <text x={-150} y={20} className="tu-lbl">♭</text>
            <text x={140} y={20} className="tu-lbl">♯</text>
          </g>
          <g ref={needle}>
            <line x1="200" y1="210" x2="200" y2="52" stroke={col} strokeWidth="5" strokeLinecap="round" />
            <circle cx="200" cy="210" r="12" fill={col} />
          </g>
        </svg>
        <div className={`tu-note ${inTune ? 'in' : ''}`} style={{ ['--c' as string]: col }}>
          <strong>{reading ? reading.note.replace(/\d/, '') : '—'}<sub>{reading?.note.match(/\d/)?.[0]}</sub></strong>
          <span>{reading ? `${reading.cents > 0 ? '+' : ''}${reading.cents}¢ · ${reading.freq.toFixed(1)} Hz` : listening ? 'Play a note…' : 'Press Start and play a string'}</span>
          {inTune && <em>In tune ✓</em>}
        </div>
      </section>
      <aside className="tu-side">
        <p className="tu-eyebrow">Tuner</p>
        <h2>{inTune ? 'Perfect.' : reading ? (reading.cents < 0 ? 'Tune up a little' : 'Tune down a little') : 'Tune by ear, perfectly'}</h2>
        <div className="tu-row">
          {Object.entries(presets).map(([id, p]) => <button key={id} type="button" className={`tu-chip ${preset === id ? 'on' : ''}`} onClick={() => setPreset(id)}>{p.label}</button>)}
        </div>
        <div className="tu-strings">
          {strings.map((s) => (
            <button key={s} type="button" className={`tu-string ${closest === s ? 'near' : ''} ${closest === s && inTune ? 'good' : ''}`} onClick={() => void reference(s)} title={`Play ${s}`}>
              <strong>{s.replace(/\d/, '')}</strong><small>{s}</small>
            </button>
          ))}
        </div>
        <p className="tu-hint">Tap a string (or press 1–{strings.length}) to hear its reference note. Space starts the tuner.</p>
        <button type="button" className="tu-cta" onClick={listening ? stop : () => void start()}>{listening ? '■ Stop listening' : '🎙 Start tuner'}</button>
        {error && <p className="tu-error">{error}</p>}
        <p className="tu-hint">Clarity {Math.round(clarity * 100)}% · sound stays on this device.</p>
      </aside>
    </div>
  )
}
