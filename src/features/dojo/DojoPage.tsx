import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { annotate } from 'rough-notation'
import { Swords, Library, Target, Timer, Award } from 'lucide-react'
import { Rail, Studio, StudioScene, Slider, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { burst } from '../../components/ui/celebrate'
import { ExerciseFigure } from '../exercise/ExerciseFigure'
import { subOn } from '../subFeatures'
import {
  beltFor,
  belts,
  formTechniques,
  forms,
  kindNames,
  randomCombo,
  styleNames,
  techniques,
  type Form,
  type Kind,
  type Style,
  type Technique,
} from './dojoMoves'
import { useTabTitle } from '../../utils/useTabTitle'
import './dojo.css'

const on = (id: string) => subOn('dojo', id)
const KEY = 'bloom-dojo-v1'
type Store = { reps: number; seated: boolean; styles: Style[]; southpaw: boolean; voice: boolean; round: number; rest: number; forms: Record<string, number> }
const start: Store = { reps: 0, seated: false, styles: ['karate', 'kungfu', 'taekwondo', 'boxing', 'muaythai'], southpaw: false, voice: true, round: 120, rest: 30, forms: {} }

const say = (text: string) => {
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 1.15 }))
  } catch {
    /* speech is optional */
  }
}
/** A boxing-bell ding made with the Web Audio API. */
function bell(times = 1) {
  if (!on('bell')) return
  try {
    const ac = new AudioContext()
    for (let i = 0; i < times; i++) {
      const o = ac.createOscillator()
      const g = ac.createGain()
      const t = ac.currentTime + i * 0.35
      o.frequency.value = 1760
      o.type = 'triangle'
      g.gain.setValueAtTime(0.18, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      o.connect(g).connect(ac.destination)
      o.start(t)
      o.stop(t + 1.2)
    }
    setTimeout(() => void ac.close(), 2000)
  } catch {
    /* audio is optional */
  }
}

/** An SVG belt that ties itself with GSAP; the name gets a rough-notation box. */
function Belt({ reps }: { reps: number }) {
  const { belt, next, progress } = beltFor(reps)
  const knot = useRef<SVGGElement>(null)
  const label = useRef<HTMLElement>(null)
  useLayoutEffect(() => {
    const el = knot.current
    if (!el || prefersReducedMotion()) return
    const tw = gsap.from(el.querySelectorAll('path'), { scaleY: 0, transformOrigin: '50% 0%', duration: 0.7, stagger: 0.12, ease: 'back.out(2)' })
    return () => void tw.revert()
  }, [belt.id])
  useEffect(() => {
    if (!label.current || !on('beltNotation')) return
    const a = annotate(label.current, { type: 'box', color: belt.id === 'white' ? '#999' : belt.color, padding: 4, animate: !prefersReducedMotion() })
    a.show()
    return () => a.remove()
  }, [belt.id, belt.color])
  return (
    <div className="dojo-belt">
      <svg viewBox="0 0 220 70" aria-hidden="true">
        <rect x="0" y="18" width="220" height="16" rx="3" fill={belt.color} stroke="#0003" />
        <g ref={knot}>
          <rect x="96" y="14" width="28" height="24" rx="5" fill={belt.color} stroke="#0004" />
          <path d="M102 36 L88 66 L100 66 L110 40Z" fill={belt.color} stroke="#0004" />
          <path d="M118 36 L132 66 L120 66 L110 40Z" fill={belt.color} stroke="#0004" />
        </g>
      </svg>
      <p>
        <strong ref={label}>{belt.name} belt</strong>
        <small>{next ? `${next.at - reps} techniques to ${next.name}` : 'Black belt — keep the white-belt mind.'}</small>
      </p>
      <div className="dojo-belt-bar" aria-label={`${Math.round(progress * 100)}% to next belt`}>
        <i style={{ width: `${progress * 100}%`, background: next?.color ?? belt.color }} />
      </div>
    </div>
  )
}

export function DojoPage() {
  const [s, setS] = useState<Store>(() => ({ ...start, ...readStore(KEY, start) }))
  const save = (p: Partial<Store>) => setS((c) => { const n = { ...c, ...p }; writeStore(KEY, n); return n })
  const [tab, setTab] = useState('techniques')
  const [kind, setKind] = useState<Kind | 'all'>('all')
  const [pick, setPick] = useState<Technique>(techniques[0])
  const [playing, setPlaying] = useState(false)
  const [count, setCount] = useState(0)
  const target = 10
  const goBtn = useRef<HTMLButtonElement>(null)
  const addReps = (n: number) => {
    const before = beltFor(s.reps).belt.id
    const reps = s.reps + n
    save({ reps })
    if (beltFor(reps).belt.id !== before) {
      burst(goBtn.current, 'stars')
      if (s.voice && on('voice')) say(`Congratulations. ${beltFor(reps).belt.name} belt.`)
    }
  }

  const visible = techniques.filter(
    (t) =>
      (s.seated ? t.position === 'seated' : t.position === 'standing') &&
      (!on('styleFilter') || t.style.some((st) => s.styles.includes(st))) &&
      (kind === 'all' || t.kind === kind),
  )

  useEffect(() => {
    if (!playing || !pick.hold) return
    const t = setInterval(() => setCount((c) => c + 1), 1000)
    return () => clearInterval(t)
  }, [playing, pick])
  useEffect(() => {
    if (playing && count >= (pick.hold ? 30 : target)) {
      setPlaying(false)
      addReps(pick.hold ? 5 : count)
      logActivity('dojo', { id: pick.id, amount: count })
      burst(goBtn.current, 'stars')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  const choose = (t: Technique) => {
    setPick(t)
    setCount(0)
    setPlaying(false)
    setTab('coach')
  }

  const library = () => (
    <div className="dojo-lib">
      {on('belts') && <Belt reps={s.reps} />}
      <div className="studio-card dojo-filters">
        {on('seated') && (
          <label>
            <input type="checkbox" checked={s.seated} onChange={(e) => save({ seated: e.target.checked })} /> Seated / wheelchair dojo
          </label>
        )}
        {on('styleFilter') && (
          <div className="studio-chip-row" role="group" aria-label="Styles">
            {(Object.keys(styleNames) as Style[]).map((st) => (
              <button
                key={st}
                type="button"
                className="studio-chip"
                aria-pressed={s.styles.includes(st)}
                onClick={() => save({ styles: s.styles.includes(st) ? (s.styles.length > 1 ? s.styles.filter((x) => x !== st) : s.styles) : [...s.styles, st] })}
              >
                {styleNames[st]}
              </button>
            ))}
          </div>
        )}
        <div className="studio-chip-row" role="group" aria-label="Technique type">
          {(['all', ...Object.keys(kindNames)] as (Kind | 'all')[]).map((k) => (
            <button key={k} type="button" className="studio-chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
              {k === 'all' ? 'Everything' : kindNames[k]}
            </button>
          ))}
        </div>
      </div>
      {!visible.length && <p className="studio-empty">No techniques match. Pick another style or type.</p>}
      <Rail label="Techniques">
        {visible.map((t) => (
          <button key={t.id} type="button" className="studio-card dojo-card" onClick={() => choose(t)}>
            <ExerciseFigure exercise={t} playing={false} animate={false} small mirror={s.southpaw} />
            <strong>{t.emoji} {t.name}</strong>
            <small>{t.style.map((x) => styleNames[x]).join(' · ')}</small>
          </button>
        ))}
      </Rail>
    </div>
  )

  const coach = () => (
    <div className="dojo-coach studio-card">
      <ExerciseFigure exercise={pick} playing={playing} mirror={on('southpaw') && s.southpaw} onRep={() => !pick.hold && setCount((c) => { const n = c + 1; if (s.voice && on('voice')) say(n % 5 === 0 ? `${n}. ${pick.cues[0]}` : pick.call); return n })} />
      <h3>{pick.emoji} {pick.name}</h3>
      <p className="dojo-count">{count} / {pick.hold ? '30 s' : target}</p>
      <ul>
        {pick.cues.map((c) => <li key={c}>✅ {c}</li>)}
        {pick.mistakes.map((m) => <li key={m}>⚠️ Avoid: {m}</li>)}
      </ul>
      <div className="studio-chip-row">
        <button ref={goBtn} type="button" className="studio-btn primary" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Train'}</button>
        <button type="button" className="studio-btn" onClick={() => setCount(0)}>Reset</button>
        {on('southpaw') && (
          <label>
            <input type="checkbox" checked={s.southpaw} onChange={(e) => save({ southpaw: e.target.checked })} /> Southpaw / mirror
          </label>
        )}
        {on('voice') && (
          <label>
            <input type="checkbox" checked={s.voice} onChange={(e) => save({ voice: e.target.checked })} /> Voice
          </label>
        )}
      </div>
    </div>
  )

  return (
    <Studio
      name="dojo"
      accent="#c62828"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#ef9a9a', '#ffe0b2', '#212121']} line="pulse" />}
      aside={<span className="ex-aside"><Award size={16} aria-hidden="true" /> {beltFor(s.reps).belt.name} belt · {s.reps}</span>}
      tabs={[
        { id: 'techniques', label: 'Techniques', icon: <Library size={15} />, render: library },
        { id: 'coach', label: 'Coach', icon: <Target size={15} />, render: coach },
        ...(on('forms') ? [{ id: 'forms', label: 'Forms', icon: <Swords size={15} />, render: () => <Forms s={s} onDone={(f, n) => { addReps(n); save({ forms: { ...s.forms, [f.id]: (s.forms[f.id] ?? 0) + 1 } }) }} /> }] : []),
        ...(on('comboCaller') ? [{ id: 'caller', label: 'Combo caller', icon: <Timer size={15} />, render: () => <Caller s={s} save={save} onReps={addReps} /> }] : []),
      ]}
    />
  )
}

/** Kata-style forms: each technique in order, with the figure demonstrating. */
function Forms({ s, onDone }: { s: Store; onDone: (f: Form, reps: number) => void }) {
  const [active, setActive] = useState<Form | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const list = active ? formTechniques(active).filter((t) => (s.seated ? t.position === 'seated' : true)) : []
  const t = list[step]
  useEffect(() => {
    if (!playing || !t) return
    if (s.voice && on('voice')) say(t.call)
    const timer = setTimeout(() => {
      if (step + 1 >= list.length) {
        setPlaying(false)
        onDone(active!, list.length)
        if (s.voice && on('voice')) say('Form complete. Bow.')
        setActive(null)
      } else setStep(step + 1)
    }, (t.hold ? 6 : 3.2) * 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step])
  if (active && t)
    return (
      <div className="studio-card dojo-coach">
        <div className="ex-player-top">
          <strong>{active.emoji} {active.name}</strong>
          <span>{step + 1}/{list.length}</span>
        </div>
        <div className="ex-player-bar" aria-hidden="true"><i style={{ width: `${(step / list.length) * 100}%` }} /></div>
        <ExerciseFigure exercise={t} playing={playing} mirror={s.southpaw} />
        <h3>{t.emoji} {t.name}</h3>
        <p className="quick-note">{t.cues[0]}</p>
        <div className="studio-chip-row">
          <button type="button" className="studio-btn primary" onClick={() => setPlaying(!playing)}>{playing ? 'Pause' : 'Begin'}</button>
          <button type="button" className="studio-btn" onClick={() => setStep(Math.min(list.length - 1, step + 1))}>Next</button>
          <button type="button" className="studio-btn" onClick={() => { setActive(null); setPlaying(false) }}>End</button>
        </div>
      </div>
    )
  return (
    <Rail label="Forms">
      {forms
        .filter((f) => (s.seated ? f.id === 'seated-dojo' : f.id !== 'seated-dojo') && s.styles.includes(f.style))
        .map((f) => (
          <article key={f.id} className="studio-card dojo-form">
            <h3>{f.emoji} {f.name}</h3>
            <small>{styleNames[f.style]}{s.forms[f.id] ? ` · done ${s.forms[f.id]}×` : ''}</small>
            <p>{f.about}</p>
            <ol>{formTechniques(f).map((t, i) => <li key={`${t.id}-${i}`}>{t.name}</li>)}</ol>
            <button type="button" className="studio-btn primary" onClick={() => { setActive(f); setStep(0); setPlaying(false) }}>Start form</button>
          </article>
        ))}
    </Rail>
  )
}

/** Rounds with a bell; random combos are called out loud for reaction training. */
function Caller({ s, save, onReps }: { s: Store; save: (p: Partial<Store>) => void; onReps: (n: number) => void }) {
  const [running, setRunning] = useState(false)
  const [resting, setResting] = useState(false)
  const [left, setLeft] = useState(s.round)
  const [round, setRound] = useState(1)
  const [combo, setCombo] = useState<Technique[]>([])
  const [length, setLength] = useState(3)
  const callEl = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setLeft((l) => l - 1), 1000)
    return () => clearInterval(t)
  }, [running])
  useEffect(() => {
    if (!running || left > 0) return
    bell(resting ? 1 : 3)
    if (resting) { setRound((r) => r + 1); setResting(false); setLeft(s.round) }
    else { setResting(true); setLeft(s.rest) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, running])
  useEffect(() => {
    if (!running || resting) return
    const next = () => {
      const c = randomCombo(s.styles, length, s.seated)
      setCombo(c)
      onReps(c.length)
      if (s.voice) say(c.map((t) => t.call).join(', '))
      if (callEl.current) gsap.fromTo(callEl.current, { scale: 1.25, opacity: 0.2 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' })
    }
    next()
    const t = setInterval(next, 3500 + length * 700)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resting, length])
  useTabTitle(running ? `🥋 ${resting ? 'Rest' : `R${round}`} ${Math.floor(Math.max(0, left) / 60)}:${String(Math.max(0, left) % 60).padStart(2, '0')}` : '', 'Dojo', 'dojo')
  // Space starts or pauses the rounds.
  const runRef = useRef(running)
  runRef.current = running
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      e.preventDefault()
      if (!runRef.current) bell(1)
      setRunning((r) => !r)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  return (
    <div className="studio-card dojo-caller">
      <div className={`dojo-clock ${resting ? 'rest' : ''}`} role="timer">
        <span>{resting ? 'Rest' : `Round ${round}`}</span>
        <b>{Math.floor(Math.max(0, left) / 60)}:{String(Math.max(0, left) % 60).padStart(2, '0')}</b>
      </div>
      <div ref={callEl} className="dojo-call" aria-live="polite">
        {resting ? 'Breathe. Shake it out.' : combo.length ? combo.map((t) => t.call).join(' → ') : 'Press start and react to the calls.'}
      </div>
      {!running && (
        <>
          <Slider label="Round length (s)" min={30} max={300} step={30} value={s.round} onChange={(v) => { save({ round: v }); setLeft(v) }} />
          <Slider label="Rest (s)" min={10} max={90} step={10} value={s.rest} onChange={(v) => save({ rest: v })} />
          <Slider label="Combo length" min={1} max={5} value={length} onChange={setLength} />
        </>
      )}
      <div className="studio-chip-row">
        <button type="button" className="studio-btn primary" onClick={() => { if (!running) bell(1); setRunning(!running) }}>{running ? 'Pause' : 'Start'}</button>
        <button type="button" className="studio-btn" onClick={() => { setRunning(false); setResting(false); setRound(1); setLeft(s.round); setCombo([]) }}>Reset</button>
      </div>
      <small className="quick-note">
        {belts.find((b) => b.id === beltFor(s.reps).belt.id)?.name} belt.{on('safety') && ' Warm up first, give yourself space, and stop if anything hurts.'}
      </small>
    </div>
  )
}
