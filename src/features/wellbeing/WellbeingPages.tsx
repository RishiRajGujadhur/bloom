import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Heart, Pause, RotateCcw, Trash2 } from 'lucide-react'
import { Carousel } from '../../components/ui/Carousel'
import {
  BREATH_KEY,
  GRATITUDE_KEY,
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
const patterns = [
  { id: 'box', name: 'Box', phases: [['In', 4], ['Hold', 4], ['Out', 4], ['Hold', 4]] },
  { id: '478', name: '4-7-8', phases: [['In', 4], ['Hold', 7], ['Out', 8]] },
  { id: 'calm', name: 'Calm', phases: [['In', 4], ['Out', 6]] },
] as const

export function BreathePage() {
  const reduced = useReducedMotion()
  const [patternId, setPatternId] = useState<(typeof patterns)[number]['id']>('box')
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
  const [label, seconds] = pattern.phases[phase]
  const scale = label === 'In' ? 1 : label === 'Out' ? 0.62 : undefined

  return (
    <section className="wb-page wb-breathe" aria-labelledby="breathe-title">
      <h2 id="breathe-title" className="sr-only">Breathe</h2>
      <div className="wb-chips" role="radiogroup" aria-label="Breathing pattern">
        {patterns.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={p.id === patternId}
            disabled={running}
            onClick={() => {
              setPatternId(p.id)
              setTick({ phase: 0, left: p.phases[0][1], cycles: 0 })
            }}
          >
            {p.name}
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
          <span>{running ? left : `${pattern.phases.map((p) => p[1]).join('·')}`}</span>
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
      <p className="wb-muted">{cycles} {cycles === 1 ? 'cycle' : 'cycles'}</p>
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
  const [text, setText] = useState('')
  const add = () => {
    const value = text.trim()
    if (!value) return
    setEntries((list) => [{ id: crypto.randomUUID(), at: Date.now(), text: value }, ...list])
    setText('')
  }
  return (
    <section className="wb-page" aria-labelledby="gratitude-title">
      <div className="wb-card wb-jar-card">
        <div className="wb-jar" aria-hidden="true">
          {entries.slice(0, 18).map((entry, i) => (
            <motion.i
              key={entry.id}
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{ ['--i' as string]: i }}
            />
          ))}
        </div>
        <div>
          <h2 id="gratitude-title">One good thing today</h2>
          <form
            className="wb-inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              add()
            }}
          >
            <input
              aria-label="Something you're grateful for"
              placeholder="A kind word, warm tea, sunlight…"
              value={text}
              maxLength={200}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="ov-primary" type="submit">
              <LottieIcon name="heart" size={17} /> Add
            </button>
          </form>
          <p className="wb-muted">
            <Heart size={14} aria-hidden="true" /> {entries.length} in your jar
          </p>
        </div>
      </div>
      {entries.length > 0 && (
        <Carousel label="Your gratitude notes" title="In the jar" perView={4}>
          {entries.map((entry) => (
            <article key={entry.id} className="wb-note">
              <p>{entry.text}</p>
              <small>{new Date(entry.at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</small>
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
