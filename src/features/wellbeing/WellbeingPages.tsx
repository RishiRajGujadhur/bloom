import { NextStep } from '../dailyFlow/DailyFlow'
import { PenLine, Sun, Wind } from 'lucide-react'
import { subOn } from '../subFeatures'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Heart, Pause, RotateCcw, Trash2 } from 'lucide-react'
import { Carousel } from '../../components/ui/Carousel'
import {
  BREATH_KEY,
  GRATITUDE_JARS_KEY,
  GRATITUDE_KEY,
  JAR_CAPACITY,
  defaultJars,
  jarTotals,
  type GratitudeJar,
  MOOD_KEY,
  emotionWheel,
  moods,
  moodWeek,
  useStoredList,
  type BreathSession,
  type GratitudeEntry,
  type MoodEntry,
  moodByWeekday,
} from './store'
import './wellbeing.css'
import { MoodQuick } from '../quick/MoodQuick'
import { GratitudeQuick } from '../quick/GratitudeQuick'
import { LetterWall } from '../showcase/LetterWall'
import { MarbleJar } from '../showcase/MarbleJar'
import { GratitudeJarSvg, MiniJarSvg } from './GratitudeJarSvg'
import { orbToMood } from './moodOrbModel'

// The orb pulls in Three.js, so it loads only when Orb mode is opened.
const MoodOrb = lazy(() => import('./MoodOrb').then((m) => ({ default: m.MoodOrb })))
const BreathSilkCard = lazy(() => import('../taichi/TaiChiPage').then((m) => ({ default: m.BreathSilkCard })))
import { capturePlace } from '../places/placesStore'
import { loadSettings } from '../../SettingsPage'
import { LottieIcon } from '../../components/ui/LottieIcon'

/* ------------------------------------------------------------------ */
/* Breathe — Calm/Headspace-style paced breathing                      */
/* ------------------------------------------------------------------ */
type Phase = readonly [label: string, seconds: number]
const patterns: readonly {
  id: string
  name: string
  emoji: string
  benefit: string
  phases: readonly Phase[]
}[] = [
  { id: 'box', name: 'Box', emoji: '⬜', benefit: 'Steady focus under pressure', phases: [['In', 4], ['Hold', 4], ['Out', 4], ['Hold', 4]] },
  { id: '478', name: '4-7-8', emoji: '🌙', benefit: 'Wind down for sleep', phases: [['In', 4], ['Hold', 7], ['Out', 8]] },
  { id: 'sigh', name: 'Physiological sigh', emoji: '😮‍💨', benefit: 'Fastest way to calm down', phases: [['In', 2], ['In more', 1], ['Out', 6]] },
  { id: 'coherent', name: 'Coherent', emoji: '🌊', benefit: 'Balance, about 6 breaths a minute', phases: [['In', 5], ['Out', 5]] },
  { id: 'calm', name: 'Extended exhale', emoji: '🍃', benefit: 'Ease anxiety gently', phases: [['In', 4], ['Out', 6]] },
  { id: '7-11', name: '7-11', emoji: '🕊️', benefit: 'Slow, deep relaxation', phases: [['In', 7], ['Out', 11]] },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', benefit: 'Simple rhythm for beginners', phases: [['In', 4], ['Hold', 4], ['Out', 4]] },
  { id: 'resonant-hold', name: 'Resonant hold', emoji: '🪷', benefit: 'Deepen calm and patience', phases: [['In', 5], ['Hold', 2], ['Out', 7], ['Hold', 2]] },
  { id: 'energize', name: 'Energize', emoji: '⚡', benefit: 'A quick, alert lift', phases: [['In', 3], ['Out', 2]] },
  { id: 'nostril', name: 'Alternate nostril', emoji: '👃', benefit: 'Centre and settle the mind', phases: [['In · left', 4], ['Hold', 4], ['Out · right', 4], ['In · right', 4], ['Hold', 4], ['Out · left', 4]] },
]
const roundOptions = [4, 8, 12] as const

/** A soft sine tone: higher for inhale, lower for exhale, mid for holds. */
let audio: AudioContext | null = null
function playCue(label: string) {
  try {
    audio ??= new AudioContext()
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = label.startsWith('In') ? 528 : label.startsWith('Out') ? 396 : 440
    gain.gain.setValueAtTime(0.0001, audio.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.6)
    osc.connect(gain).connect(audio.destination)
    osc.start()
    osc.stop(audio.currentTime + 0.65)
  } catch {
    /* Audio unavailable: the visual cue still guides the breath. */
  }
}

export function BreathePage() {
  const reduced = useReducedMotion()
  const [patternId, setPatternId] = useState<string>('box')
  const [rounds, setRounds] = useState<number>(8)
  // Advanced mode: build your own pattern, with optional sound and vibration cues.
  const [custom, setCustom] = useState({ in: 4, hold: 2, out: 6, rest: 0 })
  const [cues, setCues] = useState({ sound: false, vibrate: false })
  const customPattern = useMemo(
    () => ({
      id: 'custom',
      name: 'Custom',
      emoji: '🎛️',
      benefit: 'Your own rhythm',
      phases: (
        [
          ['In', custom.in],
          ['Hold', custom.hold],
          ['Out', custom.out],
          ['Hold', custom.rest],
        ] as const
      ).filter(([, seconds]) => seconds > 0) as readonly Phase[],
    }),
    [custom],
  )
  const pattern =
    patternId === 'custom' ? customPattern : patterns.find((p) => p.id === patternId)!
  const [running, setRunning] = useState(false)
  // One pure state transition per second: count down, then move to the next
  // phase. Cycles are counted each time the pattern wraps back to "In".
  const [tick, setTick] = useState({ phase: 0, left: pattern.phases[0][1] as number, cycles: 0 })
  const { phase, left, cycles } = tick
  const [, setSessions] = useStoredList<BreathSession>(BREATH_KEY)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => {
      setTick((t) => {
        if (t.left > 1) return { ...t, left: t.left - 1 }
        const next = (t.phase + 1) % pattern.phases.length
        return {
          phase: next,
          left: pattern.phases[next][1],
          cycles: next === 0 ? t.cycles + 1 : t.cycles,
        }
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [running, pattern])

  const stop = () => {
    setRunning(false)
    if (cycles > 0)
      setSessions((list) => [
        { id: crypto.randomUUID(), at: Date.now(), pattern: pattern.name, cycles },
        ...list,
      ])
  }
  const reset = () => {
    stop()
    setTick({ phase: 0, left: pattern.phases[0][1], cycles: 0 })
  }
  // Finish automatically once the chosen number of rounds is done.
  useEffect(() => {
    if (running && cycles >= rounds) stop()
    // stop() is recreated each render; run only when the count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycles, rounds, running])
  // Cue each new phase with a soft tone and/or a short vibration.
  useEffect(() => {
    if (!running) return
    if (cues.vibrate) navigator.vibrate?.(60)
    if (cues.sound) playCue(pattern.phases[phase][0])
    // Only when the phase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, running])
  const [label, seconds] = pattern.phases[phase] ?? pattern.phases[0]
  const scale = label.startsWith('In more')
    ? 1.08
    : label.startsWith('In')
      ? 1
      : label.startsWith('Out')
        ? 0.62
        : undefined

  return (
    <section className="wb-page wb-breathe" aria-labelledby="breathe-title">
      <h2 id="breathe-title" className="sr-only">Breathe</h2>
      {loadSettings().features.breathSilk && subOn('breathSilk', 'breathePage') && (
        <Suspense fallback={null}>
          <BreathSilkCard />
        </Suspense>
      )}
      <Carousel label="Breathing techniques" perView={4}>
        {patterns.map((p) => (
          <button
            key={p.id}
            type="button"
            className="wb-technique"
            aria-pressed={p.id === patternId}
            disabled={running}
            onClick={() => {
              setPatternId(p.id)
              setTick({ phase: 0, left: p.phases[0][1], cycles: 0 })
            }}
          >
            <span aria-hidden="true">{p.emoji}</span>
            <strong>{p.name}</strong>
            <small>{p.benefit}</small>
            <em>{p.phases.map((ph) => ph[1]).join(' · ')}</em>
          </button>
        ))}
        {subOn('breathe', 'customPattern') && (
        <button
          type="button"
          className="wb-technique"
          aria-pressed={patternId === 'custom'}
          disabled={running}
          onClick={() => {
            setPatternId('custom')
            setTick({ phase: 0, left: customPattern.phases[0][1], cycles: 0 })
          }}
        >
          <span aria-hidden="true">🎛️</span>
          <strong>Custom</strong>
          <small>Build your own rhythm</small>
          <em>{customPattern.phases.map((ph) => ph[1]).join(' · ')}</em>
        </button>
        )}
      </Carousel>
      {patternId === 'custom' && (
        <div className="wb-custom" aria-label="Custom pattern">
          {(
            [
              ['in', 'Inhale', 2, 10],
              ['hold', 'Hold', 0, 10],
              ['out', 'Exhale', 2, 12],
              ['rest', 'Rest', 0, 10],
            ] as const
          ).map(([key, label, min, max]) => (
            <label key={key}>
              <span>
                {label} <strong>{custom[key]}s</strong>
              </span>
              <input
                type="range"
                min={min}
                max={max}
                value={custom[key]}
                disabled={running}
                onChange={(e) => {
                  const next = { ...custom, [key]: Number(e.target.value) }
                  setCustom(next)
                  setTick({ phase: 0, left: next.in, cycles: 0 })
                }}
              />
            </label>
          ))}
        </div>
      )}
      <div className="wb-chips" role="group" aria-label="Cues">
        {subOn('breathe', 'soundCue') && (
          <button type="button" aria-pressed={cues.sound} onClick={() => setCues((c) => ({ ...c, sound: !c.sound }))}>
            🔔 Sound cue
          </button>
        )}
        {subOn('breathe', 'vibrate') && (
          <button type="button" aria-pressed={cues.vibrate} onClick={() => setCues((c) => ({ ...c, vibrate: !c.vibrate }))}>
            📳 Vibrate
          </button>
        )}
      </div>
      <div className="wb-chips" role="radiogroup" aria-label="Rounds">
        {roundOptions.map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={rounds === n}
            disabled={running}
            onClick={() => setRounds(n)}
          >
            {n} rounds
          </button>
        ))}
      </div>
      <div className="wb-orb-stage">
        <motion.div
          className="wb-orb"
          animate={
            running && scale !== undefined && !reduced && subOn('breathe', 'orbPulse')
              ? { scale }
              : undefined
          }
          initial={{ scale: 0.62 }}
          transition={{ duration: seconds, ease: 'easeInOut' }}
          aria-hidden="true"
        />
        <div className="wb-orb-copy" aria-live="polite">
          <strong>{running ? label : 'Ready'}</strong>
          <span>{running ? left : pattern.name}</span>
        </div>
      </div>
      <div className="wb-actions">
        <button className="ov-primary" onClick={() => (running ? stop() : setRunning(true))}>
          {running ? <Pause size={18} /> : <LottieIcon name="play" size={18} />}
          {running ? 'Pause' : 'Begin'}
        </button>
        <button className="ov-secondary" onClick={reset} aria-label="Reset">
          <RotateCcw size={18} />
        </button>
      </div>
      <p className="wb-muted">
        {cycles} / {rounds} rounds
      </p>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Mood check-in — two taps, weekly strip                              */
/* ------------------------------------------------------------------ */
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export function MoodPage() {
  const [entries, setEntries] = useStoredList<MoodEntry>(MOOD_KEY)
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  // Advanced mode: name the feeling precisely and rate energy.
  const [detailed, setDetailed] = useState(false)
  // Orb mode: log mood by shaping a liquid orb from anxious to calm.
  const orbEnabled = loadSettings().features.moodOrb
  const [orb, setOrb] = useState(false)
  const [calm, setCalm] = useState(0.5)
  const [core, setCore] = useState<string | null>(null)
  const [emotions, setEmotions] = useState<string[]>([])
  const [energy, setEnergy] = useState(3)
  const week = moodWeek(entries)
  const [lastMood, setLastMood] = useState<number | null>(null)
  const save = () => {
    if (picked === null) return
    setLastMood(picked)
    setEntries((list) => [
      {
        id: crypto.randomUUID(),
        at: Date.now(),
        mood: picked,
        note: note.trim(),
        ...(detailed ? { emotions, energy } : emotions.length ? { emotions } : {}),
      },
      ...list,
    ])
    if (loadSettings().features.placesMap && subOn('placesMap', 'moodCapture')) capturePlace('mood', picked)
    setPicked(null)
    setNote('')
    setEmotions([])
    setCore(null)
  }
  const topEmotions = Object.entries(
    entries
      .flatMap((e) => e.emotions ?? [])
      .reduce<Record<string, number>>((acc, word) => ({ ...acc, [word]: (acc[word] ?? 0) + 1 }), {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  return (
    <section className="wb-page" aria-labelledby="mood-title">
      <MoodQuick setEntries={setEntries} />
      <MarbleJar entries={entries} />
      <div className="wb-card">
        <div className="wb-card-head">
          <h2 id="mood-title">How are you right now?</h2>
          <div className="wb-chips" role="group" aria-label="Check-in mode">
            <button
              type="button"
              aria-pressed={!detailed && !orb}
              onClick={() => {
                setDetailed(false)
                setOrb(false)
              }}
            >
              Quick
            </button>
            {subOn('moodCheckin', 'detailed') && (
            <button
              type="button"
              aria-pressed={detailed && !orb}
              onClick={() => {
                setDetailed(true)
                setOrb(false)
              }}
            >
              Detailed
            </button>
            )}
            {orbEnabled && (
              <button
                type="button"
                aria-pressed={orb}
                onClick={() => {
                  setOrb(true)
                  setDetailed(false)
                  setPicked(orbToMood(calm))
                }}
              >
                Orb
              </button>
            )}
          </div>
        </div>
        {orb && orbEnabled && (
          <Suspense fallback={<p role="status">Loading orb…</p>}>
            <MoodOrb
              value={calm}
              onChange={(value) => {
                setCalm(value)
                if (subOn('moodOrb', 'autoMood')) setPicked(orbToMood(value))
              }}
            />
          </Suspense>
        )}
        <div className="wb-moods" role="radiogroup" aria-label="Mood" hidden={orb && orbEnabled && subOn('moodOrb', 'autoMood')}>
          {moods.map((m) => (
            <button
              key={m.value}
              role="radio"
              aria-checked={picked === m.value}
              onClick={() => setPicked(m.value)}
            >
              <span aria-hidden="true">{m.emoji}</span>
              <small>{m.label}</small>
            </button>
          ))}
        </div>
        {detailed && (
          <div className="wb-wheel">
            <div className="wb-wheel-core" role="radiogroup" aria-label="Core feeling">
              {emotionWheel.map((e) => (
                <button
                  key={e.core}
                  type="button"
                  role="radio"
                  aria-checked={core === e.core}
                  style={{ ['--tint' as string]: e.color }}
                  onClick={() => setCore(e.core)}
                >
                  {e.core}
                </button>
              ))}
            </div>
            {core && (
              <div className="filter-chips" aria-label={`${core} feelings`}>
                {emotionWheel
                  .find((e) => e.core === core)!
                  .words.map((word) => (
                    <button
                      key={word}
                      type="button"
                      aria-pressed={emotions.includes(word)}
                      onClick={() =>
                        setEmotions((list) =>
                          list.includes(word) ? list.filter((w) => w !== word) : [...list, word],
                        )
                      }
                    >
                      {word}
                    </button>
                  ))}
              </div>
            )}
            <label className="wb-energy">
              <span>
                Energy <strong>{['Drained', 'Low', 'Steady', 'Good', 'Buzzing'][energy - 1]}</strong>
              </span>
              <input
                type="range"
                min={1}
                max={5}
                value={energy}
                onChange={(e) => setEnergy(Number(e.target.value))}
              />
            </label>
          </div>
        )}
        {lastMood !== null && picked === null && (
          lastMood <= 2 ? (
            <NextStep icon={<Wind size={18} />} text="That sounds heavy. A physiological sigh can soften it in about a minute." action="Breathe" page="breathe" />
          ) : lastMood >= 4 ? (
            <NextStep icon={<Heart size={18} />} text="Bottle this feeling — what made today good?" action="Gratitude jar" page="gratitude" />
          ) : (
            <NextStep icon={<Sun size={18} />} text="A steady day. Set one intention to give it shape." action="Set an intention" page="planning" />
          )
        )}
        <AnimatePresence>
          {picked !== null && (
            <motion.div
              className="wb-inline-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {!detailed && (
                <div className="filter-chips wb-quick-tags" role="group" aria-label="Quick feelings">
                  {(picked <= 2 ? ['tired', 'anxious', 'lonely', 'overwhelmed', 'frustrated', 'sad'] : picked >= 4 ? ['grateful', 'calm', 'proud', 'excited', 'loved', 'hopeful'] : ['fine', 'bored', 'restless', 'distracted', 'content', 'unsure']).map((word) => (
                    <button key={word} type="button" aria-pressed={emotions.includes(word)} onClick={() => setEmotions((list) => (list.includes(word) ? list.filter((w) => w !== word) : [...list, word]))}>
                      {word}
                    </button>
                  ))}
                </div>
              )}
              <input
                aria-label="Add a note (optional)"
                placeholder="A word about why (optional)"
                value={note}
                maxLength={140}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && save()}
              />
              <button className="ov-primary" onClick={save}>
                <LottieIcon name="check" size={17} /> Save
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="wb-card">
        <h2>Your week</h2>
        <ol className="wb-week">
          {week.map((day) => {
            const mood = day.mood === null ? null : moods[Math.round(day.mood) - 1]
            return (
              <li key={day.date.toISOString()} data-empty={mood === null}>
                <span className="wb-week-bar" style={{ height: `${mood ? mood.value * 18 : 8}%` }} aria-hidden="true" />
                <span aria-hidden="true">{mood?.emoji ?? '·'}</span>
                <small>
                  {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                  <span className="sr-only">: {mood?.label ?? 'no check-in'}</span>
                </small>
              </li>
            )
          })}
        </ol>
      </div>
      {entries.length >= 5 && (() => {
        const pattern = moodByWeekday(entries)
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const filled = pattern.map((p, i) => ({ p, i })).filter((x) => x.p)
        const best = filled.reduce((a, b) => (b.p!.avg > a.p!.avg ? b : a), filled[0])
        const worst = filled.reduce((a, b) => (b.p!.avg < a.p!.avg ? b : a), filled[0])
        return (
          <div className="wb-card">
            <h2>Your weekday pattern</h2>
            <ol className="wb-week">
              {pattern.map((p, i) => (
                <li key={days[i]} data-empty={!p} title={p ? `${p.avg.toFixed(1)} / 5 from ${p.count} check-ins` : 'No check-ins yet'}>
                  <span className="wb-week-bar" style={{ height: `${p ? p.avg * 18 : 8}%` }} aria-hidden="true" />
                  <span aria-hidden="true">{p ? moods[Math.round(p.avg) - 1]?.emoji : '·'}</span>
                  <small>{days[i]}<span className="sr-only">: {p ? `${p.avg.toFixed(1)} out of 5` : 'no check-ins'}</span></small>
                </li>
              ))}
            </ol>
            {best && worst && best.i !== worst.i && (
              <p className="wb-muted">{FULL_DAYS[best.i]}s tend to feel best; {FULL_DAYS[worst.i]}s are usually hardest.</p>
            )}
          </div>
        )
      })()}
      {topEmotions.length > 0 && subOn('moodCheckin', 'wordCloud') && (
        <div className="wb-card">
          <h2>Words you use most</h2>
          <div className="wb-word-cloud">
            {topEmotions.map(([word, count]) => (
              <span key={word} style={{ fontSize: `${14 + count * 3}px` }}>
                {word}
              </span>
            ))}
          </div>
        </div>
      )}
      {entries.length > 0 && subOn('moodCheckin', 'recent') && (
        <Carousel label="Recent check-ins" title="Recent" perView={4}>
          {entries.slice(0, 20).map((entry) => (
            <article key={entry.id} className="wb-note">
              <span aria-hidden="true">{moods[entry.mood - 1]?.emoji}</span>
              <strong>{moods[entry.mood - 1]?.label}</strong>
              {entry.emotions?.length ? <p className="wb-note-tags">{entry.emotions.join(' · ')}</p> : null}
              {entry.note && <p>{entry.note}</p>}
              <small>
                {new Date(entry.at).toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
              </small>
            </article>
          ))}
        </Carousel>
      )}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Gratitude jar — one good thing a day                                */
/* ------------------------------------------------------------------ */
export function GratitudePage() {
  const [entries, setEntries] = useStoredList<GratitudeEntry>(GRATITUDE_KEY)
  const [custom, setCustom] = useStoredList<GratitudeJar>(GRATITUDE_JARS_KEY)
  const jars = [...defaultJars, ...custom]
  const [jarId, setJarId] = useState(jars[0].id)
  const [text, setText] = useState('')
  const [creating, setCreating] = useState(false)
  const [added, setAdded] = useState(0)
  const [newJar, setNewJar] = useState({ name: '', emoji: '🫙' })
  const jar = jars.find((j) => j.id === jarId) ?? jars[0]
  const inJar = entries.filter((e) => (e.jarId ?? 'moments') === jar.id)
  const totals = jarTotals(jars, entries)
  const top = totals[0]
  const fill = (count: number) => Math.min(100, (count / JAR_CAPACITY) * 100)
  // Advanced mode: shake the jar to resurface a random memory.
  const [memory, setMemory] = useState<GratitudeEntry | null>(null)
  const [shaking, setShaking] = useState(false)
  const shake = () => {
    if (!inJar.length) return
    setShaking(true)
    setMemory(null)
    setTimeout(() => {
      setShaking(false)
      setMemory(inJar[Math.floor(Math.random() * inJar.length)])
    }, 650)
  }
  // Three good things: fill three lines and add them together.
  const [three, setThree] = useState<string[] | null>(null)
  const addThree = () => {
    const values = (three ?? []).map((v) => v.trim()).filter(Boolean)
    if (!values.length) return
    const now = Date.now()
    setEntries((list) => [...values.map((v, i) => ({ id: crypto.randomUUID(), at: now - i, text: v, jarId: jar.id })), ...list])
    setThree(null)
    setAdded((n) => n + values.length)
  }
  const add = () => {
    const value = text.trim()
    if (!value) return
    setEntries((list) => [
      { id: crypto.randomUUID(), at: Date.now(), text: value, jarId: jar.id },
      ...list,
    ])
    setText('')
    setAdded((n) => n + 1)
  }
  const createJar = () => {
    const name = newJar.name.trim()
    if (!name) return
    const created = {
      id: `custom-${crypto.randomUUID()}`,
      name,
      emoji: newJar.emoji || '🫙',
      color: `hsl(${Math.round(Math.random() * 360)} 65% 65%)`,
    }
    setCustom((list) => [...list, created])
    setJarId(created.id)
    setNewJar({ name: '', emoji: '🫙' })
    setCreating(false)
  }
  return (
    <section className="wb-page" aria-labelledby="gratitude-title">
      <GratitudeQuick setEntries={setEntries} jarIds={jars.map((j) => j.id)} />
      <LetterWall entries={entries} jars={jars} />
      <h2 id="gratitude-title" className="sr-only">
        Gratitude jars
      </h2>
      <div className="wb-jar-shelf" role="tablist" aria-label="Your jars">
        {jars.map((j) => {
          const count = entries.filter((e) => (e.jarId ?? 'moments') === j.id).length
          return (
            <button
              key={j.id}
              role="tab"
              aria-selected={j.id === jar.id}
              className="wb-mini-jar"
              style={{ ['--jar' as string]: j.color, ['--fill' as string]: `${fill(count)}%` }}
              onClick={() => setJarId(j.id)}
            >
              <MiniJarSvg fill={fill(count) / 100} color={j.color} emoji={j.emoji} />
              <strong>{j.name}</strong>
              <small>{count}</small>
            </button>
          )
        })}
        {subOn('gratitude', 'customJars') && (
        <button
          className="wb-mini-jar wb-new-jar"
          aria-expanded={creating}
          onClick={() => setCreating((v) => !v)}
        >
          <span className="wb-mini-glass" aria-hidden="true">
            <b>+</b>
          </span>
          <strong>New jar</strong>
        </button>
        )}
      </div>
      {creating && (
        <form
          className="wb-card wb-inline-form"
          onSubmit={(e) => {
            e.preventDefault()
            createJar()
          }}
        >
          <input
            aria-label="Jar emoji"
            className="wb-emoji-input"
            value={newJar.emoji}
            maxLength={4}
            onChange={(e) => setNewJar((j) => ({ ...j, emoji: e.target.value }))}
          />
          <input
            aria-label="Jar name"
            placeholder="Name your jar (e.g. Music)"
            value={newJar.name}
            maxLength={30}
            onChange={(e) => setNewJar((j) => ({ ...j, name: e.target.value }))}
          />
          <button className="ov-primary" type="submit">
            Create
          </button>
        </form>
      )}
      <div className="wb-card wb-jar-card" style={{ ['--jar' as string]: jar.color }}>
        <GratitudeJarSvg
          count={inJar.length}
          color={jar.color}
          shaking={shaking}
          label={`${jar.name} jar with ${inJar.length} notes`}
          capacity={JAR_CAPACITY}
        />
        <div>
          <h3 className="wb-jar-title">
            {jar.emoji} {jar.name}
          </h3>
          <form
            className="wb-inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              add()
            }}
          >
            <input
              aria-label={`Add to ${jar.name}`}
              placeholder="One good thing…"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="ov-primary" type="submit">
              <LottieIcon name="heart" size={17} /> Add
            </button>
          </form>
          {three ? (
            <form
              className="wb-three"
              onSubmit={(e) => {
                e.preventDefault()
                addThree()
              }}
            >
              {three.map((v, i) => (
                <input
                  key={i}
                  autoFocus={i === 0}
                  aria-label={`Good thing ${i + 1}`}
                  placeholder={['Something that went well…', 'Someone you appreciate…', 'A small pleasure…'][i]}
                  value={v}
                  maxLength={200}
                  onChange={(e) => setThree((t) => t!.map((x, j) => (j === i ? e.target.value : x)))}
                />
              ))}
              <div>
                <button className="ov-primary" type="submit">Add all</button>
                <button className="ov-secondary" type="button" onClick={() => setThree(null)}>Cancel</button>
              </div>
            </form>
          ) : (
            <button type="button" className="quiet-button" onClick={() => setThree(['', '', ''])}>
              ✍️ Three good things
            </button>
          )}
          <p className="wb-muted">
            <Heart size={14} aria-hidden="true" /> {inJar.length} / {JAR_CAPACITY}
          </p>
          {added > 0 && (
            <NextStep
              icon={<PenLine size={18} />}
              text="Want to stay with this feeling a little longer? Write a few lines about it."
              action="Reflect"
              page="daybook"
            />
          )}
          {inJar.length > 0 && subOn('gratitude', 'shake') && (
            <button type="button" className="ov-secondary wb-shake" onClick={shake}>
              ✨ Shake for a memory
            </button>
          )}
          <AnimatePresence>
            {memory && (
              <motion.blockquote
                className="wb-memory"
                initial={{ opacity: 0, y: 10, rotate: -2 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                exit={{ opacity: 0 }}
              >
                “{memory.text}”
                <small>
                  {new Date(memory.at).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
                </small>
              </motion.blockquote>
            )}
          </AnimatePresence>
        </div>
      </div>
      {subOn('gratitude', 'compare') && (
      <div className="wb-card">
        <h3 className="wb-jar-title">
          Compare jars
          {top && top.count > 0 && (
            <small>
              {top.jar.emoji} {top.jar.name} is fullest
            </small>
          )}
        </h3>
        <ol className="wb-compare">
          {totals.map(({ jar: j, count }) => (
            <li key={j.id} style={{ ['--jar' as string]: j.color }}>
              <span>
                {j.emoji} {j.name}
              </span>
              <span className="wb-compare-track" aria-hidden="true">
                <motion.i
                  initial={false}
                  animate={{ width: `${Math.max(fill(count), count ? 4 : 0)}%` }}
                />
              </span>
              <strong>{count}</strong>
            </li>
          ))}
        </ol>
      </div>
      )}
      {inJar.length > 0 && (
        <Carousel label={`Notes in ${jar.name}`} title="In this jar" perView={4}>
          {inJar.map((entry) => (
            <article key={entry.id} className="wb-note">
              <p>{entry.text}</p>
              <small>
                {new Date(entry.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </small>
              <button
                className="icon-button"
                aria-label={`Remove “${entry.text}”`}
                onClick={() => setEntries((list) => list.filter((e) => e.id !== entry.id))}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
        </Carousel>
      )}
    </section>
  )
}
