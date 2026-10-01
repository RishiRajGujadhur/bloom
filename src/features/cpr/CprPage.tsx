import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import NoSleep from 'nosleep.js'
import { z } from 'zod'
import { readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import './cpr.css'

/**
 * CPR & First-Aid Coach — a training aid. The CPR trainer beats at 110
 * compressions a minute (Tone.js click) with an SVG chest, pressing hands and a
 * pulsing heart (GSAP); tap along to practise and a gauge shows your rhythm.
 * DRSABCD steps and first-aid cards flip for quick recall. Not medical advice.
 */
const KEY = 'bloom-cpr-v1'
const storeSchema = z.object({ practiceBest: z.number().default(0), sessions: z.number().default(0), mode: z.enum(['hands', 'breaths']).default('hands') })
type Store = z.infer<typeof storeSchema>
const load = (): Store => storeSchema.safeParse(readStore(KEY, {})).data ?? storeSchema.parse({})
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const BPM = 110

const steps = [
  { k: 'D', title: 'Danger', text: 'Make sure the area is safe for you, bystanders and the person.' },
  { k: 'R', title: 'Response', text: 'Tap their shoulders and shout. Do they respond?' },
  { k: 'S', title: 'Send for help', text: 'Call your emergency number (112, 911, 999…) and put the phone on speaker.' },
  { k: 'A', title: 'Airway', text: 'Tilt the head back and lift the chin to open the airway.' },
  { k: 'B', title: 'Breathing', text: 'Look, listen and feel for normal breathing for up to 10 seconds.' },
  { k: 'C', title: 'CPR', text: 'Not breathing normally? Push hard and fast in the centre of the chest: 100–120 a minute, 5–6 cm deep.' },
  { k: 'D', title: 'Defibrillator', text: 'Send someone for an AED. Switch it on and follow its voice prompts.' },
]
const cards = [
  { emoji: '🆘', title: 'Choking (adult)', front: 'Can they cough or speak?', back: 'Encourage coughing. If they can’t: up to 5 firm back blows between the shoulder blades, then up to 5 abdominal thrusts. Repeat and call for help.' },
  { emoji: '🩸', title: 'Heavy bleeding', front: 'Blood is flowing fast', back: 'Press firmly on the wound with a clean pad or cloth and keep pressing. Raise the limb if you can. Call for help.' },
  { emoji: '🔥', title: 'Burns', front: 'Skin has been burnt', back: 'Cool under cool running water for 20 minutes. Remove jewellery nearby. Cover loosely with cling film. No ice, creams or butter.' },
  { emoji: '🧠', title: 'Stroke — FAST', front: 'Face, Arms, Speech, Time', back: 'Face drooping? Arm weakness? Speech slurred? Time to call emergency services — note when symptoms started.' },
  { emoji: '🛌', title: 'Recovery position', front: 'Breathing but unresponsive', back: 'Roll them onto their side, top knee bent, head tilted back so the airway stays open. Keep checking their breathing.' },
  { emoji: '⚡', title: 'Using an AED', front: 'Defibrillator arrives', back: 'Switch it on, expose the chest, stick the pads where pictured, stand clear when told. It only shocks if needed.' },
]

export function CprPage() {
  const [store, setStore] = useState<Store>(load)
  const save = (f: (s: Store) => Store) => setStore((s) => { const n = storeSchema.parse(f(s)); writeStore(KEY, n); return n })
  const [running, setRunning] = useState(false)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState<'push' | 'breathe'>('push')
  const [taps, setTaps] = useState<number[]>([])
  const [flipped, setFlipped] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  // Elapsed time while the beat runs; rescuers should swap about every 2 minutes.
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (!running) return
    const t0 = Date.now()
    setElapsed(0)
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000)
    return () => clearInterval(t)
  }, [running])
  const hands = useRef<SVGGElement>(null)
  const heart = useRef<SVGPathElement>(null)
  const chest = useRef<SVGPathElement>(null)
  const stopRef = useRef<() => void>(() => {})
  const noSleep = useRef<NoSleep | null>(null)

  const beat = () => {
    if (reduced()) return
    const dur = 60 / BPM
    gsap.timeline()
      .to(hands.current, { y: 16, duration: dur * 0.35, ease: 'power2.in' })
      .to(chest.current, { attr: { d: 'M60 150 Q150 128 240 150 L240 260 L60 260 Z' }, duration: dur * 0.35, ease: 'power2.in' }, 0)
      .to(hands.current, { y: 0, duration: dur * 0.55, ease: 'power2.out' })
      .to(chest.current, { attr: { d: 'M60 140 Q150 110 240 140 L240 260 L60 260 Z' }, duration: dur * 0.55, ease: 'power2.out' }, '<')
    gsap.fromTo(heart.current, { scale: 1.25, transformOrigin: '50% 50%' }, { scale: 1, duration: dur * 0.8, ease: 'power2.out' })
  }
  const start = async () => {
    const Tone = await import('tone')
    await Tone.start()
    noSleep.current ??= new NoSleep()
    void noSleep.current.enable().catch(() => {})
    const click = new Tone.MembraneSynth({ pitchDecay: 0.01, octaves: 2, envelope: { attack: 0.001, decay: 0.12, sustain: 0 }, volume: -6 }).toDestination()
    let n = 0
    let ph: 'push' | 'breathe' = 'push'
    let rest = 0
    Tone.getTransport().bpm.value = BPM
    const id = Tone.getTransport().scheduleRepeat((time) => {
      if (ph === 'breathe') {
        rest++
        if (rest >= 4) { ph = 'push'; rest = 0; n = 0; Tone.getDraw().schedule(() => setPhase('push'), time) }
        return
      }
      n++
      click.triggerAttackRelease(n === 1 ? 'C3' : 'G2', '32n', time)
      Tone.getDraw().schedule(() => { setCount(n); beat() }, time)
      if (n >= 30 && store.mode === 'breaths') { ph = 'breathe'; Tone.getDraw().schedule(() => setPhase('breathe'), time) }
      if (n >= 30 && store.mode === 'hands') n = 0
    }, '4n')
    Tone.getTransport().start()
    setRunning(true)
    stopRef.current = () => {
      Tone.getTransport().clear(id)
      Tone.getTransport().stop()
      click.dispose()
      noSleep.current?.disable()
    }
  }
  const stop = () => {
    stopRef.current()
    setRunning(false)
    setCount(0)
    setPhase('push')
    save((s) => ({ ...s, sessions: s.sessions + 1 }))
  }
  useEffect(() => () => stopRef.current(), [])

  // Tap along: your rate from the last few taps.
  const tap = () => {
    const now = performance.now()
    setTaps((t) => [...t.filter((x) => now - x < 4000), now].slice(-8))
    if (!reduced()) gsap.fromTo(hands.current, { y: 12 }, { y: 0, duration: 0.25, ease: 'power2.out' })
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target as HTMLElement).closest('input, textarea, button')) { e.preventDefault(); tap() } }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  const rate = taps.length >= 3 ? Math.round(60000 / ((taps[taps.length - 1] - taps[0]) / (taps.length - 1))) : null
  const good = rate !== null && rate >= 100 && rate <= 120
  useEffect(() => {
    if (good && taps.length === 8) {
      burst(undefined, 'stars')
      save((s) => ({ ...s, practiceBest: Math.max(s.practiceBest, 8) }))
    }
  }, [good, taps.length])
  const needle = rate === null ? 0 : Math.max(-70, Math.min(70, (rate - 110) * 2))
  const gauge = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (gauge.current) gsap.to(gauge.current, { rotation: needle, svgOrigin: '80 80', duration: 0.5, ease: 'elastic.out(1, 0.5)' })
  }, [needle])

  return (
    <div className="cp-page">
      <section className="cp-stage">
        <svg className="cp-body" viewBox="0 0 300 280" role="img" aria-label={running ? `Compression ${count}` : 'CPR trainer'} data-matrix-native>
          <defs>
            <radialGradient id="cp-heart"><stop offset="0" stopColor="#ff8a9a" /><stop offset="1" stopColor="#e0303f" /></radialGradient>
          </defs>
          <path ref={chest} d="M60 140 Q150 110 240 140 L240 260 L60 260 Z" fill="#f4c7a8" stroke="#c98b68" strokeWidth="3" />
          <path d="M150 125 L150 255" stroke="#c98b68" strokeWidth="2" strokeDasharray="4 6" opacity="0.5" />
          <path ref={heart} d="M150 212 C 128 196, 122 176, 136 168 C 144 163, 150 170, 150 176 C 150 170, 156 163, 164 168 C 178 176, 172 196, 150 212 Z" fill="url(#cp-heart)" opacity="0.85" />
          <g ref={hands}>
            <rect x="118" y="86" width="64" height="40" rx="18" fill="#ffd9bf" stroke="#c98b68" strokeWidth="3" />
            <rect x="126" y="70" width="48" height="30" rx="14" fill="#ffe4d0" stroke="#c98b68" strokeWidth="3" />
            <path d="M136 40 L136 72 M164 40 L164 72" stroke="#c98b68" strokeWidth="14" strokeLinecap="round" opacity="0.35" />
          </g>
        </svg>
        <div className="cp-count" aria-live="polite">
          {running ? (phase === 'push' ? <strong>{count}</strong> : <strong className="breathe">2 breaths</strong>) : <strong>110</strong>}
          <span>{running ? (phase === 'push' ? 'push hard & fast — let the chest rise' : 'tilt head, lift chin, two rescue breaths') : 'compressions per minute'}</span>
          {running && (
            <small className="cp-elapsed">
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              {elapsed > 0 && elapsed % 120 >= 110 ? ' · swap rescuers soon' : ''}
            </small>
          )}
        </div>
      </section>
      <aside className="cp-side">
        <p className="cp-eyebrow">CPR & first-aid coach · training aid, not medical advice</p>
        <h2>Hands that can save a life</h2>
        <details className="cp-emergency">
          <summary>🚨 Someone collapsed? Quick card</summary>
          <ol>
            <li><strong>Safe?</strong> Check the area is safe for you.</li>
            <li><strong>Responsive?</strong> Shout and tap their shoulders.</li>
            <li><strong>Call</strong> 112 / 911 / 999 on speaker; send someone for an AED.</li>
            <li><strong>Not breathing normally?</strong> Start compressions: centre of chest, 5–6 cm deep, 100–120 a minute.</li>
            <li><strong>Don’t stop</strong> until help or an AED takes over — follow the AED’s voice.</li>
          </ol>
          <button type="button" className="cp-cta" onClick={() => void start()} disabled={running}>▶ Start the 110 bpm beat</button>
        </details>
        <div className="cp-row">
          <button type="button" className={`cp-chip ${store.mode === 'hands' ? 'on' : ''}`} onClick={() => save((s) => ({ ...s, mode: 'hands' }))}>Hands-only</button>
          <button type="button" className={`cp-chip ${store.mode === 'breaths' ? 'on' : ''}`} onClick={() => save((s) => ({ ...s, mode: 'breaths' }))}>30 : 2 (trained)</button>
          <button type="button" className="cp-cta" onClick={running ? stop : () => void start()}>{running ? '■ Stop' : '▶ Start 110 bpm'}</button>
        </div>
        <div className="cp-practice">
          <svg viewBox="0 0 160 96" className="cp-gauge" aria-hidden="true">
            <path d="M12 80 A68 68 0 0 1 148 80" fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
            <path d="M58 16 A68 68 0 0 1 102 16" fill="none" stroke="#58cc02" strokeWidth="10" strokeLinecap="round" />
            <g ref={gauge}><line x1="80" y1="80" x2="80" y2="22" stroke={good ? '#58cc02' : rate ? '#ff9600' : 'var(--text-muted)'} strokeWidth="4" strokeLinecap="round" /><circle cx="80" cy="80" r="6" fill="currentColor" /></g>
          </svg>
          <div>
            <button type="button" className="cp-tap" onPointerDown={tap}>Tap along<small>or press Space</small></button>
            <p className="cp-rate">{rate ? `${rate} / min — ${good ? 'perfect rhythm!' : rate < 100 ? 'a little faster' : 'a little slower'}` : 'Tap at least three times'}</p>
          </div>
        </div>
        <ol className="cp-steps">
          {steps.map((s, i) => (
            <li key={i} className={step === i ? 'on' : ''}>
              <button type="button" onClick={() => setStep(i)}><b>{s.k}</b> {s.title}</button>
              {step === i && <p>{s.text}</p>}
            </li>
          ))}
        </ol>
        <div className="cp-cards">
          {cards.map((c, i) => (
            <button key={c.title} type="button" className={`cp-card ${flipped === i ? 'flip' : ''}`} onClick={() => setFlipped(flipped === i ? null : i)} aria-expanded={flipped === i}>
              <span className="face front"><em>{c.emoji}</em><strong>{c.title}</strong><small>{c.front}</small></span>
              <span className="face back">{c.back}</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
