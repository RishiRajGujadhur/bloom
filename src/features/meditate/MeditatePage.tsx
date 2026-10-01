import { useLeaveGuard } from '../../utils/useLeaveGuard'
import { useTabTitle } from '../../utils/useTabTitle'
import { prefersReducedMotion } from '../../utils/motion'
import { useKeepAwake } from '../../platform/presence'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { ISourceOptions } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'
import { Bell, BookOpen, Flame, Heart, LifeBuoy, Pause, Play, Square, Timer } from 'lucide-react'
import { Rail, Slider, Stat, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { MED_KEY, bells, courses, currentLine, sessionById, sessions, streakDays, timed, type MedLog, type SceneId, type Session } from './meditateModel'
import { MeditateQuick } from '../quick/MeditateQuick'
import './meditate.css'

const on = (id: string) => subOn('meditation', id)
type Store = { logs: MedLog[]; minutes: Record<string, number>; bellEvery: number; unguided: number; voice: boolean; bellVolume?: number; favs?: string[] }

const sceneOptions: Record<SceneId, ISourceOptions> = {
  stars: { background: { color: { value: 'transparent' } }, fpsLimit: 40, particles: { number: { value: 90 }, color: { value: ['#ffffff', '#cfd8ff', '#ffe9b0'] }, size: { value: { min: 0.5, max: 2.2 } }, opacity: { value: { min: 0.2, max: 0.9 }, animation: { enable: true, speed: 0.6 } }, move: { enable: true, speed: 0.12 } } },
  fireflies: { background: { color: { value: 'transparent' } }, fpsLimit: 40, particles: { number: { value: 40 }, color: { value: ['#ffe27a', '#c8ff9a'] }, size: { value: { min: 1.5, max: 4 } }, opacity: { value: { min: 0.1, max: 0.9 }, animation: { enable: true, speed: 1.2 } }, move: { enable: true, speed: 0.6, random: true } } },
  snow: { background: { color: { value: 'transparent' } }, fpsLimit: 40, particles: { number: { value: 80 }, color: { value: '#ffffff' }, size: { value: { min: 1, max: 3.5 } }, opacity: { value: 0.7 }, move: { enable: true, speed: 0.8, direction: 'bottom', straight: false } } },
  bubbles: { background: { color: { value: 'transparent' } }, fpsLimit: 40, particles: { number: { value: 26 }, color: { value: ['#f4a7b9', '#c9b8ff', '#9fdcc8'] }, size: { value: { min: 6, max: 22 } }, opacity: { value: { min: 0.15, max: 0.45 } }, move: { enable: true, speed: 0.5, direction: 'top' } } },
}
const sceneColors: Record<SceneId, string> = { stars: '#1d2144', fireflies: '#16302a', snow: '#2c3a55', bubbles: '#3a2a4f' }

function speak(text: string) {
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 0.85, pitch: 0.95 }))
  } catch {
    /* optional */
  }
}
function bell(volume = 60) {
  if (volume <= 0) return
  try {
    const ac = new AudioContext()
    ;[392, 588, 784].forEach((f, i) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, ac.currentTime)
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (0.17 * (volume / 100)) / (i + 1)), ac.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 6)
      o.connect(g).connect(ac.destination)
      o.start()
      o.stop(ac.currentTime + 6)
    })
    setTimeout(() => void ac.close(), 6500)
  } catch {
    /* optional */
  }
}

/** Breathing halo behind the caption. */
function Halo({ running }: { running: boolean }) {
  const el = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (!el.current || !running || prefersReducedMotion()) return
    const t = gsap.to(el.current, { scale: 1.25, opacity: 0.9, duration: 5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    return () => void t.kill()
  }, [running])
  return <div ref={el} className="md-halo" aria-hidden="true" />
}

function Scene({ id }: { id: SceneId }) {
  const options = useMemo(() => sceneOptions[id], [id])
  return (
    <div className="md-scene" style={{ background: `radial-gradient(circle at 50% 30%, ${sceneColors[id]}cc, ${sceneColors[id]})` }}>
      <ParticlesProvider init={loadSlim}>
        <Particles id={`md-${id}`} options={{ ...options, fullScreen: { enable: false } }} className="md-particles" />
      </ParticlesProvider>
    </div>
  )
}

export function MeditatePage() {
  const [store, setStoreState] = useState<Store>(() => readStore(MED_KEY, { logs: [], minutes: {}, bellEvery: 5, unguided: 10, voice: true }))
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(MED_KEY, n)
      return n
    })
  const [tab, setTab] = useState('today')
  const [pick, setPick] = useState<Session>(sessions[0])
  const [running, setRunning] = useState(false)
  // Keep the screen on while the session runs (Screen Wake Lock).
  useKeepAwake(running)
  useLeaveGuard(running)
  const [t, setT] = useState(0)
  const [before, setBefore] = useState(3)
  const [after, setAfter] = useState(3)
  const [finished, setFinished] = useState(false)
  const unguided = pick.id === 'unguided'
  const minutes = unguided ? store.unguided : on('duration') ? (store.minutes[pick.id] ?? pick.minutes) : pick.minutes
  const lines = useMemo(() => (unguided ? [] : timed(pick, minutes)), [pick, minutes, unguided])
  const line = currentLine(lines, t)
  const total = minutes * 60
  const card = useRef<HTMLDivElement>(null)
  const bellPreview = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!running) return
    const i = setInterval(() => setT((x) => x + 1), 1000)
    return () => clearInterval(i)
  }, [running])
  // Remember where an interrupted sit got to, so it can be resumed later.
  const RESUME_KEY = 'bloom-meditate-resume'
  const [resume, setResume] = useState(() => {
    const r = readStore<{ id: string; t: number; total: number; at: number } | null>(RESUME_KEY, null)
    return r && Date.now() - r.at < 12 * 3600e3 && r.t >= 20 && r.t < r.total - 10 && sessions.some((x) => x.id === r.id) ? r : null
  })
  useEffect(() => {
    if (running && t > 0 && t % 5 === 0 && !unguided) writeStore(RESUME_KEY, { id: pick.id, t, total, at: Date.now() })
  }, [t, running, unguided, pick.id, total])
  const spoken = useRef(-1)
  useEffect(() => {
    if (!running) return
    const idx = line ? lines.indexOf(line) : -1
    if (idx !== spoken.current && line) {
      spoken.current = idx
      if (on('voice') && store.voice) speak(line.text)
    }
    if (on('bells') && bells(minutes, store.bellEvery).includes(t)) bell(store.bellVolume)
    if (t >= total) {
      setRunning(false)
      setFinished(true)
      writeStore(RESUME_KEY, null)
      setResume(null)
      bell(store.bellVolume)
      logActivity('meditation', { id: pick.id, minutes })
      setStore((s) => ({ ...s, logs: [...s.logs, { at: Date.now(), id: pick.id, minutes, before: on('moodCheck') ? before : undefined }].slice(-500) }))
      burst(card.current, 'stars')
    }
  }, [t, running, line, lines, minutes, store.bellEvery, store.bellVolume, store.voice, total, pick.id, before])

  const start = (x: Session) => {
    setPick(x)
    setT(0)
    spoken.current = -1
    setFinished(false)
    setRunning(false)
    setTab('sit')
  }
  useTabTitle(running ? `🧘 ${Math.floor((total - t) / 60)}:${String((total - t) % 60).padStart(2, '0')}` : '', 'Meditate', 'meditate')
  // Space starts or pauses the sit.
  const spaceRef = useRef({ tab, finished })
  spaceRef.current = { tab, finished }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      if (spaceRef.current.tab !== 'sit' || spaceRef.current.finished) return
      e.preventDefault()
      setRunning((r) => !r)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  const [sitNote, setSitNote] = useState('')
  const saveAfter = () => {
    setStore((s) => ({ ...s, logs: s.logs.map((l, i) => (i === s.logs.length - 1 ? { ...l, after, ...(sitNote.trim() ? { note: sitNote.trim() } : {}) } : l)) }))
    setSitNote('')
  }

  const sit = () => (
    <div className="md-stage" ref={card} data-running={running}>
      {on('particles') ? <Scene id={unguided ? 'stars' : pick.scene} /> : <div className="md-scene" style={{ background: sceneColors[pick.scene] }} />}
      <Halo running={running} />
      <div className="md-center">
        <span className="md-kicker">{unguided ? 'Unguided' : pick.title}</span>
        {finished ? (
          <div className="md-done">
            <h3>Well done.</h3>
            {on('moodCheck') && (
              <>
                <Slider label="How calm do you feel now?" value={after} min={1} max={5} format={(v) => ['', '😣', '😕', '😐', '🙂', '😌'][v]} onChange={setAfter} />
                <textarea className="studio-input md-note" rows={2} maxLength={300} placeholder="Anything you noticed? (optional)" aria-label="Session note" value={sitNote} onChange={(e) => setSitNote(e.target.value)} />
                <button type="button" className="studio-go" onClick={saveAfter}>
                  Save
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            {on('captions') && <p className="md-caption" key={line?.at ?? 'x'}>{line?.text ?? (running ? '…' : 'Press play when you’re ready.')}</p>}
            <div className="md-ring" aria-label={`${Math.floor((total - t) / 60)} minutes left`}>
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" className="md-track" />
                <circle cx="60" cy="60" r="54" className="md-arc" strokeDasharray={2 * Math.PI * 54} strokeDashoffset={2 * Math.PI * 54 * (1 - t / total)} transform="rotate(-90 60 60)" />
              </svg>
              <span>{`${Math.floor((total - t) / 60)}:${String((total - t) % 60).padStart(2, '0')}`}</span>
            </div>
            {running && <small className="md-ends">ends at {new Date(Date.now() + (total - t) * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</small>}
            <div className="iv-buttons">
              <button type="button" className="md-btn" onClick={() => setRunning(!running)} aria-label={running ? 'Pause' : 'Play'}>
                {running ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button type="button" className="md-btn" onClick={() => (setRunning(false), setT(0))} aria-label="Stop">
                <Square size={18} />
              </button>
            </div>
            {!running && t === 0 && (
              <div className="md-pre">
                {on('duration') && !unguided && <Slider label="Length" value={minutes} min={3} max={30} unit="min" compact onChange={(v) => setStore((s) => ({ ...s, minutes: { ...s.minutes, [pick.id]: v } }))} />}
                {on('moodCheck') && <Slider label="Calm right now" value={before} min={1} max={5} compact format={(v) => ['', '😣', '😕', '😐', '🙂', '😌'][v]} onChange={setBefore} />}
                {on('voice') && (
                  <button type="button" className="studio-chip" aria-pressed={store.voice} onClick={() => setStore((s) => ({ ...s, voice: !s.voice }))}>
                    Spoken guidance
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  const today = () => (
    <div className="iv-programs">
      {resume && (
        <div className="md-resume">
          <span>
            Pick up <strong>{sessionById(resume.id).title}</strong> where you left off ({Math.floor((resume.total - resume.t) / 60)}:{String((resume.total - resume.t) % 60).padStart(2, '0')} left)
          </span>
          <button
            type="button"
            className="studio-chip"
            onClick={() => {
              start(sessionById(resume.id))
              setT(resume.t)
              setResume(null)
            }}
          >
            <Play size={14} /> Resume
          </button>
          <button type="button" className="studio-chip" aria-label="Dismiss" onClick={() => { writeStore(RESUME_KEY, null); setResume(null) }}>✕</button>
        </div>
      )}
      <MeditateQuick onStart={start} />
      {on('sos') && (
        <button type="button" className="md-sos" onClick={() => start(sessionById('sos'))}>
          <LifeBuoy size={20} /> Feeling anxious? 3-minute SOS
        </button>
      )}
      <h3>Sessions</h3>
      <Rail label="Sessions">
        {sessions
          .filter((x) => x.id !== 'sos' && (x.kind !== 'body' || on('bodyScan')) && (x.kind !== 'kindness' || on('kindness')))
          .sort((a, b) => Number((store.favs ?? []).includes(b.id)) - Number((store.favs ?? []).includes(a.id)))
          .map((x) => (
            <div key={x.id} role="listitem" className="md-card-wrap">
              <button
                type="button"
                className="md-fav"
                aria-pressed={(store.favs ?? []).includes(x.id)}
                aria-label={(store.favs ?? []).includes(x.id) ? `Unfavourite ${x.title}` : `Favourite ${x.title}`}
                onClick={() => setStore((s) => ({ ...s, favs: (s.favs ?? []).includes(x.id) ? (s.favs ?? []).filter((f) => f !== x.id) : [...(s.favs ?? []), x.id] }))}
              >
                {(store.favs ?? []).includes(x.id) ? '★' : '☆'}
              </button>
              <button type="button" className="iv-card md-card" style={{ ['--scene' as string]: sceneColors[x.scene] }} onClick={() => start(x)}>
                <strong>{x.title}</strong>
                <small>
                  {store.minutes[x.id] ?? x.minutes} min · {x.kind}
                </small>
              </button>
            </div>
          ))}
      </Rail>
    </div>
  )

  const coursesTab = () => (
    <div className="iv-programs">
      <Rail label="Courses">
        {courses.map((c) => {
          const done = c.sessions.filter((id) => store.logs.some((l) => l.id === id)).length
          return (
            <div key={c.id} role="listitem" className="md-course">
              <span aria-hidden="true">{c.emoji}</span>
              <strong>{c.title}</strong>
              <small>{c.blurb}</small>
              <div className="md-steps">
                {c.sessions.map((id, i) => (
                  <button key={id} type="button" className="studio-chip" aria-pressed={store.logs.some((l) => l.id === id)} onClick={() => start(sessionById(id))}>
                    {i + 1}. {sessionById(id).title}
                  </button>
                ))}
              </div>
              <small>
                {done}/{c.sessions.length} complete
              </small>
            </div>
          )
        })}
      </Rail>
    </div>
  )

  const timerTab = () => (
    <div className="studio-center">
      <h3>Sit in silence</h3>
      <div className="st-scale">
        <Slider label="Length" value={store.unguided} min={1} max={60} unit="min" onChange={(v) => setStore((s) => ({ ...s, unguided: v }))} />
        {on('bells') && <Slider label="Interval bell every" value={store.bellEvery} min={0} max={15} unit="min" format={(v) => (v ? String(v) : 'off')} onChange={(v) => setStore((s) => ({ ...s, bellEvery: v }))} />}
        {on('bells') && <Slider label="Bell volume" value={store.bellVolume ?? 60} min={0} max={100} unit="%" format={(v) => (v ? String(v) : 'muted')} onChange={(v) => { setStore((s) => ({ ...s, bellVolume: v })); clearTimeout(bellPreview.current); bellPreview.current = window.setTimeout(() => bell(v), 350) }} />}
      </div>
      <button type="button" className="studio-go" onClick={() => start({ id: 'unguided', title: 'Unguided', kind: 'breath', minutes: store.unguided, scene: 'stars', script: [] })}>
        <Bell size={16} /> Begin
      </button>
    </div>
  )

  const total_min = store.logs.reduce((a, l) => a + l.minutes, 0)
  const withMood = store.logs.filter((l) => l.before != null && l.after != null)
  const stats = () => (
    <div className="studio-card">
      <div className="studio-stats">
        <Stat value={streakDays(store.logs)} label="day streak" />
        <Stat value={store.logs.length} label="sessions" />
        <Stat value={store.logs.filter((l) => Date.now() - l.at < 7 * 864e5).length} label="this week" />
        <Stat value={`${total_min} min`} label="total" />
        <Stat value={store.logs.length ? `${Math.max(...store.logs.map((l) => l.minutes))} min` : '—'} label="longest sit" />
        <Stat value={`${store.logs.filter((l) => new Date(l.at).getMonth() === new Date().getMonth() && new Date(l.at).getFullYear() === new Date().getFullYear()).reduce((a, l) => a + l.minutes, 0)} min`} label="this month" />
        <Stat value={withMood.length ? `+${(withMood.reduce((a, l) => a + (l.after! - l.before!), 0) / withMood.length).toFixed(1)}` : '—'} label="avg. calm gained" />
      </div>
      {store.logs.some((l) => l.note) && (
        <ul className="md-notes">
          {store.logs
            .filter((l) => l.note)
            .slice(-5)
            .reverse()
            .map((l) => (
              <li key={l.at}>
                <small>{new Date(l.at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</small> {l.note}
              </li>
            ))}
        </ul>
      )}
    </div>
  )

  return (
    <Studio
      name="meditate"
      accent="#6b5bd6"
      tab={tab}
      onTab={(x) => {
        if (x !== 'sit') setRunning(false)
        setTab(x)
      }}
      aside={
        <span className="ex-aside">
          <Flame size={15} /> {streakDays(store.logs)} day streak
        </span>
      }
      tabs={[
        { id: 'today', label: 'Today', icon: <Heart size={15} />, render: today },
        { id: 'sit', label: 'Sit', icon: <Play size={15} />, render: sit },
        ...(on('courses') ? [{ id: 'courses', label: 'Courses', icon: <BookOpen size={15} />, render: coursesTab }] : []),
        ...(on('unguided') ? [{ id: 'timer', label: 'Timer', icon: <Timer size={15} />, render: timerTab }] : []),
        { id: 'stats', label: 'Journey', icon: <Flame size={15} />, render: stats },
      ]}
    />
  )
}
