import { bodySilent } from '../body/bodyPreferences'
import { useBodyPractice } from '../body/bodyPractice'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useKeepAwake } from '../../platform/presence'
import { useLeaveGuard } from '../../utils/useLeaveGuard'
import { useTabTitle } from '../../utils/useTabTitle'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'
import { Armchair, BellRing, HeartPulse, Pause, Play, PersonStanding, SkipForward, Sparkles } from 'lucide-react'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { readNudges, setNudge } from '../../components/studio/Nudges'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { FigureSvg } from '../exercise/ExerciseFigure'
import { areaNames, forAreas, routines, steps, totalSeconds, type Area } from './stretchModel'
import '../exercise/exercise.css'
import '../yoga/yoga.css'
import { StretchBand } from '../showcase/StretchBand'
import { usePageActions } from '../../components/ui/PageMenu'
import './stretch.css'

const on = (id: string) => subOn('mobility', id)
const KEY = 'bloom-stretch-v1'
type Store = { scale: number; sessions: { at: number; routine: string; before: number; after: number | null }[] }
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
const say = (t: string) => {
  if (bodySilent()) return
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), { rate: 0.95 }))
  } catch {
    /* optional */
  }
}
function chime() {
  if (bodySilent()) return
  try {
    const ac = new AudioContext()
    ;[784, 1175].forEach((f, i) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.frequency.value = f
      const t = ac.currentTime + i * 0.15
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2)
      o.connect(g).connect(ac.destination)
      o.start(t)
      o.stop(t + 1.3)
    })
    setTimeout(() => void ac.close(), 1800)
  } catch {
    /* optional */
  }
}

/** Tap the areas that feel tight. */
const regions: [Area, number, number, number, number][] = [
  ['neck', 60, 40, 7, 6],
  ['shoulders', 38, 54, 10, 7],
  ['shoulders', 82, 54, 10, 7],
  ['upperBack', 60, 70, 16, 10],
  ['wrists', 24, 124, 6, 6],
  ['wrists', 96, 124, 6, 6],
  ['lowerBack', 60, 100, 14, 9],
  ['hips', 60, 122, 20, 9],
  ['quads', 50, 150, 8, 18],
  ['quads', 70, 150, 8, 18],
  ['hamstrings', 50, 178, 7, 10],
  ['hamstrings', 70, 178, 7, 10],
  ['calves', 50, 205, 6, 12],
  ['calves', 70, 205, 6, 12],
]
function BodyMap({ selected, onToggle, glow }: { selected: Area[]; onToggle?: (a: Area) => void; glow?: Area }) {
  return (
    <svg className="st-map" viewBox="0 0 120 230" role="group" aria-label="Body map">
      <g className="mm-silhouette">
        <circle cx="60" cy="22" r="14" />
        <rect x="36" y="44" width="48" height="84" rx="18" />
        <rect x="20" y="50" width="16" height="78" rx="8" />
        <rect x="84" y="50" width="16" height="78" rx="8" />
        <rect x="40" y="118" width="18" height="104" rx="9" />
        <rect x="62" y="118" width="18" height="104" rx="9" />
      </g>
      {regions.map(([a, cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} className="st-region" data-on={selected.includes(a) || glow === a} onClick={() => onToggle?.(a)} tabIndex={onToggle ? 0 : undefined} onKeyDown={event => { if (onToggle && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onToggle(a) } }} role={onToggle ? 'button' : undefined} aria-label={onToggle ? areaNames[a] : undefined} aria-pressed={onToggle ? selected.includes(a) : undefined}>
          <title>{areaNames[a]}</title>
        </ellipse>
      ))}
    </svg>
  )
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return <p className="studio-empty">Two sessions and a trend appears.</p>
  const w = 280
  const h = 70
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / 10) * h}`)
  return (
    <svg className="st-spark" viewBox={`0 0 ${w} ${h}`} aria-label="Stiffness trend">
      <polyline points={pts.join(' ')} />
    </svg>
  )
}

export function StretchPage() {
  const [store, setStoreState] = useState<Store>(() => readStore(KEY, { scale: 1, sessions: [] }))
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(KEY, n)
      return n
    })
  const [tab, setTab] = useState('session')
  const [routine, setRoutineState] = useState(() => {
    try {
      return routines.find((r) => r.id === localStorage.getItem('bloom-stretch-last')) ?? routines[0]
    } catch {
      return routines[0]
    }
  })
  const setRoutine = (r: (typeof routines)[number]) => {
    setRoutineState(r)
    try {
      if (r.id !== 'custom') localStorage.setItem('bloom-stretch-last', r.id)
    } catch {
      /* optional */
    }
  }
  const [areas, setAreas] = useState<Area[]>([])
  const [i, setI] = useState(0)
  const [playing, setPlaying] = useState(false)
  // Keep the screen on while the session runs (Screen Wake Lock).
  useKeepAwake(playing)
  const [waitingSwitch, setWaitingSwitch] = useState(false)
  const [before, setBefore] = useState(5)
  const [after, setAfter] = useState<number | null>(null)
  const [afterDraft, setAfterDraft] = useState(3)
  const [finished, setFinished] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const [desk, setDesk] = useState(() => readNudges()['desk-stretch'] ?? { every: 50, enabled: false })
  const list = useMemo(() => steps(routine.ids, on('switchSides')), [routine])
  const step = list[Math.min(i, list.length - 1)]
  const secs = Math.round(step.stretch.seconds * store.scale)

  const next = () => {
    if (on('chime')) chime()
    if (i + 1 >= list.length) {
      setPlaying(false)
      setFinished(true)
      logActivity('stretch', { routine: routine.name })
      burst(card.current, 'stars')
      if (on('voice')) say('All done. How do you feel now?')
      return
    }
    const upcoming = list[i + 1]
    setI(i + 1)
    if (on('switchSides') && upcoming.stretch.id === step.stretch.id) {
      setWaitingSwitch(true)
      if (on('voice')) say('Switch sides')
      setTimeout(() => setWaitingSwitch(false), 2500)
    } else if (on('voice')) say(`${upcoming.stretch.name}. ${upcoming.stretch.cue}`)
    if (!on('autoAdvance')) setPlaying(false)
  }
  useEffect(() => {
    if (playing && i === 0 && on('voice')) say(`${step.stretch.name}. ${step.stretch.cue}`)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when starting
  }, [playing])

  const start = (r: (typeof routines)[number]) => {
    setRoutine(r)
    setI(0)
    setFinished(false)
    setAfter(null)
    setPlaying(false)
    setTab('session')
  }
  useBodyPractice('stretch', step.stretch.id, step.stretch.name, () => setPlaying(false))
  useLeaveGuard(playing && !finished)
  useTabTitle(playing && !finished ? `🤸 ${step.stretch.name} · ${i + 1}/${list.length}` : '', 'Stretch', 'stretch')
  // Space plays or pauses; N moves to the next stretch.
  const keysRef = useRef({ playing, finished, next, setPlaying })
  keysRef.current = { playing, finished, next, setPlaying }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      const k = keysRef.current
      if (k.finished) return
      if (e.code === 'Space') {
        e.preventDefault()
        k.setPlaying(!k.playing)
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        k.next()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  const saveCheckIn = (a: number) => {
    setAfter(a)
    setStore((s) => ({ ...s, sessions: [...s.sessions, { at: Date.now(), routine: routine.name, before, after: a }].slice(-100) }))
  }

  usePageActions(finished ? [{ id: 'st-again', label: 'Stretch again', icon: '🤸', run: () => start(routine) }] : [{ id: 'st-play', label: playing ? 'Pause' : 'Play', icon: '⏯️', run: () => setPlaying(!playing) }, { id: 'st-next', label: 'Next stretch', icon: '⏭️', run: next }])
  const session = () => (
    <div className="studio-split">
      <div ref={card} className="studio-card st-stage">
        <div className="st-figure">
          <FigureSvg pose={step.stretch.pose} floor={step.stretch.floor} label={step.stretch.name} className="yg-morph" />
          {on('bodyMap') && (
            <div className="st-mini">
              <BodyMap selected={[]} glow={step.stretch.area} />
            </div>
          )}
        </div>
        {on('band') && <StretchBand playing={playing && !finished && !waitingSwitch} />}
        <div className="st-timeline" aria-hidden="true">
          {list.map((x, k) => (
            <i key={k} data-past={k < i || finished} data-now={k === i && !finished} data-hint={x.stretch.name} />
          ))}
        </div>
      </div>
      <div className="studio-card st-side">
        {finished ? (
          <div className="st-done">
            <h3>
              <Sparkles size={18} /> {routine.name} done
            </h3>
            {on('stiffness') && after === null ? (
              <>
                <p>How stiff do you feel now?</p>
                <Slider label="Stiffness after" value={afterDraft} min={0} max={10} onChange={setAfterDraft} />
                <button type="button" className="studio-go" onClick={() => saveCheckIn(afterDraft)}>
                  Save
                </button>
              </>
            ) : (
              <p>{after !== null ? `Stiffness ${store.sessions.at(-1)?.before} → ${after}. Nicely loosened.` : 'Your body thanks you.'}</p>
            )}
            <button type="button" className="studio-go" data-variant="quiet" onClick={() => start(routine)}>
              Again
            </button>
          </div>
        ) : (
          <>
            <span className="now-kicker">
              {routine.emoji} {routine.name} · {i + 1}/{list.length}
            </span>
            <h3 className="yg-pose-name">{step.stretch.name}</h3>
            {step.side && <p className="st-side-label">{waitingSwitch ? '↔ Switch sides' : `${step.side} side`}</p>}
            <p className="yg-cue">{step.stretch.cue}</p>
            <div className="st-timer">
              {on('circleTimer') ? (
                <CountdownCircleTimer
                  key={`${routine.id}-${i}`}
                  isPlaying={playing && !waitingSwitch}
                  duration={secs}
                  size={170}
                  strokeWidth={12}
                  colors={['#3f8a76', '#6bbf7a', '#f2c14e', '#e27396']}
                  colorsTime={[secs, secs * 0.6, secs * 0.25, 0]}
                  trailColor={'rgba(120,120,120,0.15)' as `#${string}`}
                  onComplete={() => {
                    next()
                    return { shouldRepeat: false }
                  }}
                >
                  {({ remainingTime }) => <span className="st-remaining">{remainingTime}s</span>}
                </CountdownCircleTimer>
              ) : (
                <SimpleTimer key={`${routine.id}-${i}`} seconds={secs} playing={playing && !waitingSwitch} onDone={next} />
              )}
            </div>
            <div className="iv-buttons">
              <button type="button" className="studio-go" onClick={() => setPlaying(!playing)}>
                {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? 'Pause' : 'Start'}
              </button>
              <button type="button" className="studio-go" data-variant="quiet" aria-label="Next stretch" onClick={next}>
                <SkipForward size={16} />
              </button>
            </div>
            {on('stiffness') && i === 0 && !playing && <Slider label="Stiffness now" value={before} min={0} max={10} compact onChange={setBefore} />}
          </>
        )}
      </div>
    </div>
  )

  const routinesTab = () => (
    <div className="iv-programs">
      <h3>Routines</h3>
      <Rail label="Routines">
        {routines.map((r) => (
          <div key={r.id} role="listitem">
            <button type="button" className="iv-card" onClick={() => start(r)}>
              <span aria-hidden="true">{r.emoji}</span>
              <strong>{r.name}</strong>
              <small>
                {r.ids.length} stretches · {fmt(totalSeconds(steps(r.ids, on('switchSides')), store.scale))}
              </small>
            </button>
          </div>
        ))}
      </Rail>
      <div className="st-scale">
        <Slider label="Hold length" value={store.scale} min={0.5} max={2} step={0.1} unit="×" format={(v) => v.toFixed(1)} onChange={(v) => setStore((s) => ({ ...s, scale: v }))} />
      </div>
    </div>
  )

  const map = () => (
    <div className="studio-split">
      <div className="studio-card studio-center">
        <BodyMap selected={areas} onToggle={(a) => setAreas((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))} />
      </div>
      <div className="studio-card st-side">
        <h3>Where does it feel tight?</h3>
        <div className="yg-pose-chips">
          {(Object.keys(areaNames) as Area[]).map((a) => (
            <button key={a} type="button" className="studio-chip" aria-pressed={areas.includes(a)} onClick={() => setAreas((x) => (x.includes(a) ? x.filter((y) => y !== a) : [...x, a]))}>
              {areaNames[a]}
            </button>
          ))}
        </div>
        <p className="studio-empty">{forAreas(areas).length} stretches match</p>
        <button type="button" className="studio-go" disabled={!areas.length} onClick={() => start({ id: 'custom', name: 'For you', emoji: '🎯', ids: forAreas(areas) })}>
          <Play size={16} /> Stretch these
        </button>
      </div>
    </div>
  )

  const deskTab = () => {
    const update = (p: Partial<typeof desk>) => {
      const n = { ...desk, ...p }
      setDesk(n)
      setNudge({ id: 'desk-stretch', title: 'Desk break', body: 'Two minutes: neck, shoulders and wrists.', page: 'stretch', every: n.every, enabled: n.enabled, quietStart: 21, quietEnd: 7 })
    }
    return (
      <div className="studio-center st-desk">
        <Armchair size={42} aria-hidden="true" />
        <h3>Desk-break reminders</h3>
        <p className="studio-empty">A gentle nudge while you work, never at night.</p>
        <button type="button" className="studio-go" data-variant={desk.enabled ? undefined : 'quiet'} onClick={() => update({ enabled: !desk.enabled })} aria-pressed={desk.enabled}>
          <BellRing size={16} /> {desk.enabled ? 'On' : 'Off'}
        </button>
        <div className="st-scale">
          <Slider label="Every" value={desk.every} min={20} max={120} step={5} unit="min" onChange={(v) => update({ every: v })} />
        </div>
        {'Notification' in window && Notification.permission === 'default' && (
          <button type="button" className="studio-chip" onClick={() => void Notification.requestPermission()}>
            Also notify me when Bloom is in the background
          </button>
        )}
      </div>
    )
  }

  const history = () => (
    <div className="studio-split">
      <div className="studio-card">
        <h3>
          <HeartPulse size={17} /> Stiffness after sessions
        </h3>
        <Sparkline values={store.sessions.filter((s) => s.after !== null).map((s) => s.after as number)} />
        <div className="studio-stats">
          <Stat value={store.sessions.length} label="sessions" />
          <Stat value={store.sessions.length ? (store.sessions.reduce((t, s) => t + (s.before - (s.after ?? s.before)), 0) / store.sessions.length).toFixed(1) : '—'} label="avg. relief" />
        </div>
      </div>
      <div className="studio-card">
        <h3>Recent</h3>
        <ul className="wo-sets">
          {[...store.sessions].reverse().slice(0, 12).map((s) => (
            <li key={s.at}>
              <span>{s.routine}</span>
              <strong>
                {s.before} → {s.after ?? '—'}
              </strong>
              <small>{new Date(s.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )

  return (
    <Studio
      name="stretch"
      accent="#3f8a76"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#9fdcc8', '#c8e6a0', '#ffd8b0']} line="wave" />}
      tabs={[
        { id: 'session', label: 'Session', icon: <PersonStanding size={15} />, render: session },
        ...(on('routines') ? [{ id: 'routines', label: 'Routines', icon: <Sparkles size={15} />, render: routinesTab }] : []),
        ...(on('bodyMap') ? [{ id: 'map', label: 'Body map', icon: <PersonStanding size={15} />, render: map }] : []),
        ...(on('deskMode') ? [{ id: 'desk', label: 'Desk breaks', icon: <Armchair size={15} />, render: deskTab }] : []),
        ...(on('history') ? [{ id: 'history', label: 'History', icon: <HeartPulse size={15} />, render: history }] : []),
      ]}
    />
  )
}

/** Plain countdown when the circle timer is switched off. */
function SimpleTimer({ seconds, playing, onDone }: { seconds: number; playing: boolean; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    if (!playing) return
    if (left <= 0) {
      onDone()
      return
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [playing, left, onDone])
  return <span className="st-remaining">{left}s</span>
}
