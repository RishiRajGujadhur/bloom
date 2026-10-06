import { bodySilent } from '../body/bodyPreferences'
import { useBodyPractice } from '../body/bodyPractice'
import { useLeaveGuard } from '../../utils/useLeaveGuard'
import { useTabTitle } from '../../utils/useTabTitle'
import { prefersReducedMotion } from '../../utils/motion'
import { useKeepAwake } from '../../platform/presence'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Timer } from 'easytimer.js'
import gsap from 'gsap'
import { Flame, Footprints, Pause, Play, RotateCcw, SkipForward, SlidersHorizontal, Timer as TimerIcon } from 'lucide-react'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { WORKOUT_KEY, type WorkoutStore } from '../workout/workoutModel'
import { c25k, c25kProgram, calories, fmt, normalizeProgram, position, presets, segments, total, type Program } from './intervalModel'
import { usePageActions } from '../../components/ui/PageMenu'
import './interval.css'
import { FallingCountdown } from './FallingCountdown'

const on = (id: string) => subOn('intervalCoach', id)
const KEY = 'bloom-intervals-v1'
type Store = { custom: Program; saved?: Program[]; selectedId?: string; countdown?: boolean; c25kDone: number; weight: number; history: { at: number; name: string; seconds: number; kcal: number; skipped?: boolean }[] }
const initial: Store = {
  custom: { id: 'custom', name: 'My intervals', emoji: '🎛️', work: 30, rest: 15, rounds: 8, warmup: 60, cooldown: 60 },
  c25kDone: 0,
  weight: 70,
  history: [],
}
const colors = { warmup: '#f2c14e', work: '#e2553f', rest: '#5aa9e6', cooldown: '#6bbf7a' }

function beep(freq: number, len = 0.15) {
  if (bodySilent()) return
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = freq
    o.type = 'triangle'
    g.gain.setValueAtTime(0.12, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + len)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + len)
    setTimeout(() => void ac.close(), 400)
  } catch {
    /* optional */
  }
}
const say = (t: string) => {
  if (bodySilent()) return
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(new SpeechSynthesisUtterance(t))
  } catch {
    /* optional */
  }
}

export function IntervalPage() {
  const [store, setStoreState] = useState<Store>(() => { const saved = readStore<Store>(KEY, initial); return { ...initial, ...saved, custom: normalizeProgram(saved.custom, initial.custom), saved: Array.isArray(saved.saved) ? saved.saved.slice(-50).map(p => normalizeProgram(p, initial.custom)) : [], c25kDone: Number.isFinite(saved.c25kDone) ? Math.max(0, Math.min(27, saved.c25kDone)) : 0 } })
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(KEY, n)
      return n
    })
  const [program, setProgram] = useState<Program>(() => [...presets, store.custom, ...(store.saved ?? [])].find(value => value.id === store.selectedId) ?? (typeof store.selectedId === 'string' && store.selectedId.startsWith('c25k-') ? c25kProgram(store.c25kDone) : presets[0]))
  const [tab, setTab] = useState('run')
  const [saveName, setSaveName] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [skippedSeconds, setSkippedSeconds] = useState(0)
  const [prepareSeconds, setPrepareSeconds] = useState(0)
  const preparation = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelPreparation = () => { if (preparation.current) clearInterval(preparation.current); preparation.current = null; setPrepareSeconds(0) }
  useEffect(() => () => { if (preparation.current) clearInterval(preparation.current) }, [])
  // Keep the screen on while the session runs (Screen Wake Lock).
  useKeepAwake(running)
  useLeaveGuard(running)
  const timer = useRef<Timer | null>(null)
  const ring = useRef<SVGCircleElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const segs = useMemo(() => segments(program, on('warmCool')), [program])
  const length = total(segs)
  const pos = position(segs, elapsed)
  const done = elapsed >= length && length > 0

  useEffect(() => {
    const t = new Timer()
    t.addEventListener('secondsUpdated', () => setElapsed(t.getTotalTimeValues().seconds))
    timer.current = t
    return () => t.stop()
  }, [])

  // Cues at segment changes and the last three seconds.
  const lastIndex = useRef(-1)
  useEffect(() => {
    if (!running || !pos) return
    if (pos.index !== lastIndex.current) {
      lastIndex.current = pos.index
      if (on('beeps')) beep(pos.segment.kind === 'work' ? 1046 : 660, 0.35)
      if (on('voice')) say(`${pos.segment.label}${pos.segment.round && on('rounds') ? `, round ${pos.segment.round}` : ''}`)
      if (stage.current && !prefersReducedMotion())
        gsap.fromTo(stage.current, { scale: 0.96 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    } else if (pos.left <= 3 && pos.left >= 1) {
      // Spoken "3, 2, 1" into the next segment (with voice on), plus the beeps.
      if (on('voice') && store.countdown !== false) say(String(Math.ceil(pos.left)))
      if (on('beeps')) beep(880)
    }
    if (pos.segment.kind === 'work' && Math.round(pos.into) === Math.round(pos.segment.seconds / 2) && pos.segment.seconds >= 60 && on('voice')) say('Halfway')
  }, [elapsed, running, pos, store.countdown])

  useEffect(() => {
    if (!done || !running) return
    timer.current?.stop()
    setRunning(false)
    const trainedSeconds = Math.max(0, length - skippedSeconds)
    const kcal = calories(segs, length, store.weight) * trainedSeconds / Math.max(1, length)
    setStore((s) => ({
      ...s,
      c25kDone: !skippedSeconds && program.id.startsWith('c25k') ? s.c25kDone + 1 : s.c25kDone,
      history: [...s.history, { at: Date.now(), name: program.name, seconds: trainedSeconds, kcal, skipped: skippedSeconds > 0 }].slice(-200),
    }))
    if (trainedSeconds > 0) logActivity('intervals', { name: program.name, seconds: trainedSeconds, skipped: skippedSeconds > 0 })
    if (on('logWorkouts') && !skippedSeconds) {
      const w = readStore<WorkoutStore>(WORKOUT_KEY, { workouts: [], rest: 90, bodyweight: 70 })
      writeStore(WORKOUT_KEY, { ...w, workouts: [...w.workouts, { id: crypto.randomUUID(), name: program.name, templateId: 'intervals', startedAt: Date.now() - length * 1000, finishedAt: Date.now(), sets: [] }] })
    }
    if (on('voice')) say('Done. Brilliant work.')
    burst(stage.current, 'stars')
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once on completion
  }, [done])

  // The ring drains through each segment.
  const frac = pos ? pos.into / pos.segment.seconds : 1
  useLayoutEffect(() => {
    if (ring.current) gsap.to(ring.current, { strokeDashoffset: 2 * Math.PI * 120 * frac, duration: 0.9, ease: 'none' })
  }, [frac])

  const toggle = () => {
    cancelPreparation()
    const t = timer.current
    if (!t) return
    if (running) {
      t.pause()
      setRunning(false)
    } else {
      if (done) reset()
      t.start({ precision: 'seconds' })
      setRunning(true)
    }
  }
  const reset = () => {
    cancelPreparation()
    timer.current?.reset()
    timer.current?.stop()
    setElapsed(0)
    setSkippedSeconds(0)
    setRunning(false)
    lastIndex.current = -1
  }
  const skip = () => {
    cancelPreparation()
    if (!pos) return
    setSkippedSeconds(value => value + pos.left)
    const target = elapsed + pos.left
    timer.current?.stop()
    timer.current?.start({ precision: 'seconds', startValues: { seconds: target } })
    setElapsed(target)
    if (!running) timer.current?.pause()
  }
  const previous = () => {
    cancelPreparation()
    if (!pos || pos.index <= 0) return
    const target = segs.slice(0, pos.index - 1).reduce((sum, segment) => sum + segment.seconds, 0)
    timer.current?.stop(); timer.current?.start({ precision: 'seconds', startValues: { seconds: target } })
    setElapsed(target); lastIndex.current = -1
    if (!running) timer.current?.pause()
  }
  const choose = (p: Program) => {
    cancelPreparation()
    reset()
    setProgram(p.id.startsWith('c25k-') || presets.some(row => row === p) ? p : normalizeProgram(p, initial.custom))
    setStore(s => ({ ...s, selectedId: p.id }))
    setTab('run')
  }
  const prepare = () => {
    if (running || prepareSeconds) return
    let left = 5; setPrepareSeconds(left)
    preparation.current = setInterval(() => { left--; setPrepareSeconds(left); if (left === 0) { cancelPreparation(); toggle() } }, 1000)
  }
  useBodyPractice('intervals', '', program.name, () => { cancelPreparation(); timer.current?.pause(); setRunning(false) })
  const kind = done ? 'cooldown' : (pos?.segment.kind ?? 'warmup')
  useTabTitle(running && pos ? `${pos.segment.label} ${Math.floor(pos.left / 60)}:${String(Math.ceil(pos.left) % 60).padStart(2, '0')}` : '', 'Intervals', 'intervals')
  // Space starts or pauses; N skips to the next segment.
  const keysRef = useRef({ toggle, skip })
  keysRef.current = { toggle, skip }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      if (e.code === 'Space') {
        e.preventDefault()
        keysRef.current.toggle()
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        keysRef.current.skip()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  // Flash the stage when a new segment starts, so the change is felt, not just read.
  const segIndex = pos?.index ?? -1
  useEffect(() => {
    if (segIndex < 1 || !stage.current || prefersReducedMotion()) return
    const tw = gsap.fromTo(stage.current, { scale: 0.97, boxShadow: '0 0 0 10px var(--seg)' }, { scale: 1, boxShadow: '0 0 0 0px var(--seg)', duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    return () => void tw.progress(1)
  }, [segIndex])
  usePageActions([{ id: 'iv-toggle', label: running ? 'Pause timer' : done ? 'Start again' : 'Start timer', icon: running ? '⏸️' : '▶️', run: toggle }])
  const run = () => (
    <div className="studio-split">
      <div ref={stage} className="studio-card iv-stage" data-kind={kind} style={{ ['--seg' as string]: colors[kind] }}>
        {on('ring') ? (
          <svg className="iv-ring" viewBox="0 0 280 280" aria-hidden="true">
            <circle cx="140" cy="140" r="120" className="iv-track" />
            <circle ref={ring} cx="140" cy="140" r="120" className="iv-arc" strokeDasharray={2 * Math.PI * 120} strokeDashoffset="0" transform="rotate(-90 140 140)" />
          </svg>
        ) : null}
        <div className="iv-readout" aria-live="polite">
          <span className="iv-label">{done ? 'Finished' : (pos?.segment.label ?? 'Ready')}</span>
          <FallingCountdown value={done ? fmt(length) : pos ? fmt(pos.left) : fmt(length)} />
          {on('rounds') && pos?.segment.round && (
            <span className="iv-round">
              Round {pos.segment.round} / {program.rounds}
            </span>
          )}
        </div>
        {done && (
          <a className="studio-chip iv-log" href="#workouts" data-hint="Add this session to your workout log">
            Log it in Workouts →
          </a>
        )}
        <div className="iv-timeline" aria-hidden="true">
          {segs.map((s, i) => (
            <i key={i} style={{ flex: s.seconds, background: colors[s.kind] }} data-past={pos ? i < pos.index : done} data-now={pos?.index === i} data-hint={`${s.label} · ${fmt(s.seconds)}`} />
          ))}
        </div>
      </div>
      <div className="studio-card iv-side bloom-start-stack">
        <h3>
          <span aria-hidden="true">{program.emoji}</span> {program.name}
        </h3>
        <div className="iv-buttons">
          {prepareSeconds > 0 ? <p role="status">Get ready · {prepareSeconds}s <button type="button" className="studio-chip" onClick={cancelPreparation}>Cancel preparation</button></p> : !running && <button type="button" className="studio-chip" onClick={prepare}>Start after 5 seconds</button>}
          <button type="button" className="studio-go" onClick={toggle}>
            {running ? <Pause size={18} /> : <Play size={18} />} {running ? 'Pause' : elapsed && !done ? 'Resume' : 'Start'}
          </button>
          <button type="button" className="studio-go" data-variant="quiet" onClick={skip} aria-label="Skip segment">
            <SkipForward size={16} />
          </button>
          <button type="button" className="studio-chip" disabled={!pos || pos.index <= 0} onClick={previous}>Previous segment</button>
          <button type="button" className="studio-go" data-variant="quiet" onClick={reset} aria-label="Reset">
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="studio-stats">
          <Stat value={fmt(elapsed)} label="elapsed" />
          <Stat value={fmt(Math.max(0, length - elapsed))} label="left" />
          {running && <Stat value={new Date(Date.now() + Math.max(0, length - elapsed) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} label="finishes at" />}
          {on('calories') && <Stat value={Math.round(calories(segs, elapsed, store.weight) * Math.max(0, elapsed - skippedSeconds) / Math.max(1, elapsed))} label="kcal (estimate)" />}
        </div>
        {on('calories') && <Slider label="Your weight" value={store.weight} min={40} max={150} unit="kg" compact onChange={(v) => setStore((s) => ({ ...s, weight: v }))} />}
        {skippedSeconds > 0 && <p role="status" className="studio-empty">{Math.round(skippedSeconds)}s skipped · modified practice does not complete a Couch to 5K day or create a full workout record.</p>}
      </div>
    </div>
  )

  const programs = () => (
    <div className="iv-programs bloom-stack">
      {on('presets') && (
        <>
          <h3>Programs</h3>
          <Rail label="Programs">
            {presets.map((p) => (
              <div key={p.id} role="listitem">
                <button type="button" className="iv-card" data-on={program.id === p.id} onClick={() => choose(p)}>
                  <span aria-hidden="true">{p.emoji}</span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.rounds} × {p.work}s / {p.rest}s · {fmt(total(segments(p, on('warmCool'))))}
                  </small>
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
      {(store.saved ?? []).length > 0 && (
        <>
          <h3>Your timers</h3>
          <Rail label="Your timers">
            {(store.saved ?? []).map((p) => (
              <div key={p.id} role="listitem" className="yg-saved">
                <button type="button" className="iv-card" data-on={program.id === p.id} onClick={() => choose(p)}>
                  <span aria-hidden="true">{p.emoji}</span>
                  <strong>{p.name}</strong>
                  <small>
                    {p.rounds} × {p.work}s / {p.rest}s · {fmt(total(segments(p, on('warmCool'))))}
                  </small>
                </button>
                <button type="button" className="yg-remove" aria-label={`Delete ${p.name}`} onClick={() => setStore((s) => ({ ...s, saved: (s.saved ?? []).filter((x) => x.id !== p.id) }))}>
                  ✕
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
      {on('c25k') && (
        <div className="iv-c25k">
          <h3>
            <Footprints size={17} /> Couch to 5K
          </h3>
          <div className="iv-weeks" aria-label={`Week ${Math.min(9, Math.floor(store.c25kDone / 3) + 1)} of 9`}>
            {c25k.map((w, i) => (
              <span key={w.week} data-state={store.c25kDone >= (i + 1) * 3 ? 'done' : Math.floor(store.c25kDone / 3) === i ? 'now' : 'next'}>
                W{w.week}
              </span>
            ))}
          </div>
          <button type="button" className="studio-go" onClick={() => choose(c25kProgram(store.c25kDone))}>
            Start {c25kProgram(store.c25kDone).name}
          </button>
        </div>
      )}
    </div>
  )

  const builder = () => {
    const c = store.custom
    const set = (p: Partial<Program>) => setStore((s) => ({ ...s, custom: { ...s.custom, ...p } }))
    return (
      <div className="studio-split">
        <div className="studio-card iv-builder bloom-start-stack">
          <Slider label="Work" value={c.work} min={5} max={300} step={5} unit="s" onChange={(v) => set({ work: v })} />
          <Slider label="Rest" value={c.rest} min={0} max={180} step={5} unit="s" onChange={(v) => set({ rest: v })} />
          <Slider label="Rounds" value={c.rounds} min={1} max={30} onChange={(v) => set({ rounds: v })} />
          {on('warmCool') && <Slider label="Warm up" value={c.warmup} min={0} max={600} step={30} unit="s" onChange={(v) => set({ warmup: v })} />}
          {on('voice') && (
            <label className="iv-check">
              <input type="checkbox" checked={store.countdown !== false} onChange={(e) => setStore((st) => ({ ...st, countdown: e.target.checked }))} /> Say “3, 2, 1” before each change
            </label>
          )}
          {on('warmCool') && <Slider label="Cool down" value={c.cooldown} min={0} max={600} step={30} unit="s" onChange={(v) => set({ cooldown: v })} />}
        </div>
        <div className="studio-card studio-center">
          <div className="iv-timeline iv-preview" aria-hidden="true">
            {segments(c, on('warmCool')).map((s, i) => (
              <i key={i} style={{ flex: s.seconds, background: colors[s.kind] }} />
            ))}
          </div>
          <p className="iv-total">{fmt(total(segments(c, on('warmCool'))))} total</p>
          <button type="button" className="studio-go" onClick={() => choose(c)}>
            <Play size={16} /> Use these intervals
          </button>
          <form
            className="sc-manual"
            onSubmit={(e) => {
              e.preventDefault()
              const name = saveName.trim()
              if (!name) return
              setStore((s) => ({ ...s, saved: [...(s.saved ?? []), { ...s.custom, id: `saved-${crypto.randomUUID()}`, name, emoji: '⭐' }] }))
              setSaveName('')
            }}
          >
            <input className="studio-input" aria-label="Timer name" placeholder="Save as… (e.g. Tabata bike)" value={saveName} maxLength={40} onChange={(e) => setSaveName(e.target.value)} />
            <button type="submit" className="studio-go" data-variant="quiet">Save</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <Studio
      name="intervals"
      accent={colors.work}
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#e2553f', '#f2c14e', '#5aa9e6']} line="pulse" />}
      aside={
        store.history.length ? (
          <span className="ex-aside">
            <Flame size={15} /> {store.history.length} sessions
            {store.history.some((h) => Date.now() - h.at < 7 * 864e5) && ` · ${store.history.filter((h) => Date.now() - h.at < 7 * 864e5).length} this week`}
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'run', label: 'Timer', icon: <TimerIcon size={15} />, render: run },
        { id: 'programs', label: 'Programs', icon: <Flame size={15} />, render: programs },
        ...(on('builder') ? [{ id: 'build', label: 'Build', icon: <SlidersHorizontal size={15} />, render: builder }] : []),
      ]}
    />
  )
}
