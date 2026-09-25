import { useEffect, useState } from 'react'
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
  moods,
  moodWeek,
  useStoredList,
  type BreathSession,
  type GratitudeEntry,
  type MoodEntry,
} from './store'
import './wellbeing.css'
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

export function BreathePage() {
  const reduced = useReducedMotion()
  const [patternId, setPatternId] = useState<string>('box')
  const [rounds, setRounds] = useState<number>(8)
  const pattern = patterns.find((p) => p.id === patternId)!
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
  const [label, seconds] = pattern.phases[phase]
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
      </Carousel>
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
            running && scale !== undefined && !reduced
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
export function MoodPage() {
  const [entries, setEntries] = useStoredList<MoodEntry>(MOOD_KEY)
  const [note, setNote] = useState('')
  const [picked, setPicked] = useState<number | null>(null)
  const week = moodWeek(entries)
  const save = () => {
    if (picked === null) return
    setEntries((list) => [
      { id: crypto.randomUUID(), at: Date.now(), mood: picked, note: note.trim() },
      ...list,
    ])
    setPicked(null)
    setNote('')
  }
  return (
    <section className="wb-page" aria-labelledby="mood-title">
      <div className="wb-card">
        <h2 id="mood-title">How are you right now?</h2>
        <div className="wb-moods" role="radiogroup" aria-label="Mood">
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
        <AnimatePresence>
          {picked !== null && (
            <motion.div
              className="wb-inline-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
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
      {entries.length > 0 && (
        <Carousel label="Recent check-ins" title="Recent" perView={4}>
          {entries.slice(0, 20).map((entry) => (
            <article key={entry.id} className="wb-note">
              <span aria-hidden="true">{moods[entry.mood - 1]?.emoji}</span>
              <strong>{moods[entry.mood - 1]?.label}</strong>
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
  const [newJar, setNewJar] = useState({ name: '', emoji: '🫙' })
  const jar = jars.find((j) => j.id === jarId) ?? jars[0]
  const inJar = entries.filter((e) => (e.jarId ?? 'moments') === jar.id)
  const totals = jarTotals(jars, entries)
  const top = totals[0]
  const fill = (count: number) => Math.min(100, (count / JAR_CAPACITY) * 100)
  const add = () => {
    const value = text.trim()
    if (!value) return
    setEntries((list) => [
      { id: crypto.randomUUID(), at: Date.now(), text: value, jarId: jar.id },
      ...list,
    ])
    setText('')
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
              <span className="wb-mini-glass" aria-hidden="true">
                <i />
                <b>{j.emoji}</b>
              </span>
              <strong>{j.name}</strong>
              <small>{count}</small>
            </button>
          )
        })}
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
        <div className="wb-jar" aria-hidden="true">
          {inJar.slice(0, 24).map((entry, i) => (
            <motion.i
              key={entry.id}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ ['--i' as string]: i }}
            />
          ))}
        </div>
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
          <p className="wb-muted">
            <Heart size={14} aria-hidden="true" /> {inJar.length} / {JAR_CAPACITY}
          </p>
        </div>
      </div>
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
