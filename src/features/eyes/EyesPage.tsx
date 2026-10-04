import { bodySilent } from '../body/bodyPreferences'
import { useBodyPractice } from '../body/bodyPractice'
import { useEffect, useRef, useState } from 'react'
import rough from 'roughjs'
import { BellRing, Eye, History, Play, Square } from 'lucide-react'
import { Rail, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { setNudge } from '../../components/studio/Nudges'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { EYES_KEY, blinkClosed, exerciseById, exercises, nearFar, routine, streakDays, type EyesStore, type Exercise } from './eyesModel'
import { WatchEye } from '../showcase/WatchEye'
import { usePageActions } from '../../components/ui/PageMenu'
import { useTabTitle } from '../../utils/useTabTitle'
import './eyes.css'
import { pathLength } from '../../utils/svgLength'

const on = (id: string) => subOn('eyeCare', id)

function chime(sound: boolean) {
  if (bodySilent()) return
  if (!sound || !on('sounds')) return
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = 660
    g.gain.setValueAtTime(0.0001, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.07, ac.currentTime + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 1.2)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + 1.3)
    setTimeout(() => void ac.close(), 1500)
  } catch {
    /* optional */
  }
}

/** Hand-drawn guide (rough.js) with a glowing dot that travels along it. */
function Guide({ ex, t, speed, color }: { ex: Exercise; t: number; speed: number; color: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const track = useRef<SVGPathElement>(null)
  const [dot, setDot] = useState({ x: 300, y: 180 })
  useEffect(() => {
    const el = svg.current
    if (!el) return
    el.querySelectorAll('.ey-rough').forEach((n) => n.remove())
    const rc = rough.svg(el)
    const opts = { stroke: '#7a9a8c', strokeWidth: 2.2, roughness: on('handDrawn') ? 1.6 : 0, bowing: 1.5, seed: 3 }
    let node: SVGGElement | null = null
    if (ex.path) node = rc.path(ex.path, opts)
    else if (ex.id === 'rule20') node = rc.polygon([[150, 280], [300, 70], [450, 280]], { ...opts, fill: '#c8e6a0', fillStyle: 'hachure', hachureGap: 8 })
    else if (ex.id === 'palming') node = rc.ellipse(300, 180, 360, 220, { ...opts, fill: '#2a3a36', fillStyle: 'solid' })
    if (node) {
      node.classList.add('ey-rough')
      el.insertBefore(node, el.firstChild)
    }
  }, [ex])
  useEffect(() => {
    const p = track.current
    if (!p || !ex.path) return
    const len = pathLength(p, 300)
    const pt = p.getPointAtLength(((t * speed * 80) % len + len) % len)
    setDot({ x: pt.x, y: pt.y })
  }, [t, ex, speed])
  const closed = ex.id === 'blink' && blinkClosed(t)
  return (
    <svg ref={svg} className="ey-guide" viewBox="0 0 600 360" aria-label={ex.name}>
      {ex.path && <path ref={track} d={ex.path} fill="none" stroke="none" />}
      {ex.path && <circle cx={dot.x} cy={dot.y} r="16" className="ey-dot" style={{ fill: color }} />}
      {ex.id === 'nearfar' && <circle cx="300" cy="180" r={20 + nearFar(t) * 120} className="ey-dot ey-nearfar" style={{ fill: color }} />}
      {ex.id === 'blink' && (
        <g className="ey-eye" transform="translate(300 180)">
          <path d={closed ? 'M-110 0 Q0 30 110 0' : 'M-110 0 Q0 -90 110 0 Q0 90 -110 0 Z'} className="ey-lid" />
          {!closed && <circle r="34" className="ey-iris" style={{ fill: color }} />}
        </g>
      )}
      {ex.id === 'rule20' && <text x="300" y="330" textAnchor="middle" className="ey-hint">Look out of a window, far away</text>}
      {ex.id === 'palming' && <text x="300" y="186" textAnchor="middle" className="ey-hint ey-dark">Warm darkness</text>}
    </svg>
  )
}

export function EyesPage() {
  const [store, setStoreState] = useState<EyesStore>(() => readStore(EYES_KEY, { every: 20, enabled: false, speed: 1, sound: true, log: [] }))
  const setStore = (fn: (s: EyesStore) => EyesStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(EYES_KEY, n)
      return n
    })
  const [targetColor, setTargetColor] = useState(() => { const v = readStore('bloom-eye-target-color', '#a8ff60'); return /^#[0-9a-f]{6}$/i.test(v) ? v : '#a8ff60' })
  const [tab, setTab] = useState('practice')
  const [queue, setQueue] = useState<string[]>([])
  const [i, setI] = useState(0)
  const [t, setT] = useState(0)
  const completed = useRef(false)
  const [finished, setFinished] = useState(false)
  const [running, setRunning] = useState(false)
  const current = exerciseById(queue[i] ?? 'eight')
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      setT((x) => x + (now - last) / 1000)
      last = now
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])
  useEffect(() => {
    if (!running || t < current.seconds) return
    chime(store.sound)
    if (i + 1 < queue.length) {
      setI(i + 1)
      setT(0)
    } else {
      if (completed.current) return
      completed.current = true; setFinished(true)
      setRunning(false)
      setStore((s) => ({ ...s, log: [...s.log, { at: Date.now(), id: queue.join('+') }].slice(-300) }))
      logActivity('eyes')
      burst(stage.current, 'stars')
    }
  }, [t, running, current.seconds, i, queue, store.sound])  

  const start = (ids: string[]) => {
    completed.current = false; setFinished(false)
    setQueue(ids)
    setI(0)
    setT(0)
    setRunning(true)
    setTab('practice')
  }
  useTabTitle(running ? `👁️ ${current.name} ${Math.max(0, Math.ceil(current.seconds - t))}s` : '', 'Eye care', 'eyes')
  // Space starts, pauses and resumes.
  const spaceRef = useRef(() => {})
  spaceRef.current = () => (finished ? start(queue) : queue.length ? setRunning(!running) : start(routine))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.code !== 'Space' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select, dialog')) return
      e.preventDefault()
      spaceRef.current()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])
  useBodyPractice('eyes', '', current.name, () => setRunning(false))
  const visible = exercises.filter((e) => (e.id === 'rule20' ? on('rule20') : e.id === 'nearfar' ? on('nearFar') : e.id === 'blink' ? on('blink') : e.id === 'palming' ? on('palming') : on('followDot')))

  usePageActions([
    { id: 'ey-routine', label: running ? 'Pause' : 'Start the 2-minute routine', icon: '👁️', run: () => (finished ? start(queue) : queue.length ? setRunning(!running) : start(routine)) },
    { id: 'ey-2020', label: '20-20-20 break now', icon: '🌳', run: () => start(['rule20']) },
  ])
  const practice = () => (
    <div className="studio-split">
      <div ref={stage} className="studio-card ey-stage" data-dark={current.id === 'palming'}>
        <Guide ex={current} t={t} speed={store.speed} color={targetColor} />
      </div>
      <div className="studio-card rm-side">
        {queue.length > 1 && (
          <div className="rt-steps">
            {queue.map((id, k) => (
              <span key={id + k} data-state={k < i ? 'done' : k === i ? 'now' : 'next'}>
                {exerciseById(id).emoji}
              </span>
            ))}
          </div>
        )}
        {!running && on('watchEye') && (
          <div className="ey-watch">
            <WatchEye every={store.every} minutesLeft={Math.max(0, store.every - (Date.now() - (store.log.at(-1)?.at ?? Date.now() - store.every * 60000)) / 60000)} />
          </div>
        )}
        <h3 className="yg-pose-name">
          {current.emoji} {current.name}
        </h3>
        <p className="yg-cue">{current.cue}</p>
        <div className="ey-progress">
          <span style={{ width: `${Math.min(100, (t / current.seconds) * 100)}%` }} />
        </div>
        {finished && <p role="status">Routine completed and saved. Restart for a fresh practice.</p>}
        <div className="iv-buttons">
          <button type="button" className="studio-go" onClick={() => (finished ? start(queue) : queue.length ? setRunning(!running) : start(routine))}>
            {running ? <Square size={16} /> : <Play size={16} />} {running ? 'Pause' : finished ? 'Restart completed routine' : queue.length ? 'Resume' : 'Start 2-minute routine'}
          </button>
          {running && i + 1 < queue.length && (
            <button type="button" className="studio-go" data-variant="quiet" onClick={() => { setI(i + 1); setT(0) }}>
              Skip →
            </button>
          )}
        </div>
        <label className="body-exact-field">High-contrast target colour<input type="color" aria-label="Eye guide target colour" value={targetColor} onChange={e => { setTargetColor(e.target.value); writeStore('bloom-eye-target-color', e.target.value) }} /></label>
        {on('followDot') && current.path && <Slider label="Dot speed" value={store.speed} min={0.4} max={2} step={0.1} unit="×" format={(v) => v.toFixed(1)} compact onChange={(v) => setStore((s) => ({ ...s, speed: v }))} />}
      </div>
    </div>
  )

  const library = () => (
    <div className="iv-programs">
      <Rail label="Eye exercises">
        {visible.map((e) => (
          <div key={e.id} role="listitem">
            <button type="button" className="iv-card" onClick={() => start([e.id])}>
              <span aria-hidden="true">{e.emoji}</span>
              <strong>{e.name}</strong>
              <small>
                {e.seconds}s · {e.cue.split('.')[0]}
              </small>
            </button>
          </div>
        ))}
      </Rail>
      {on('reminders') && (
        <div className="studio-card rm-side">
          <h3>
            <BellRing size={16} /> 20-20-20 reminders
          </h3>
          <button
            type="button"
            className="studio-chip"
            aria-pressed={store.enabled}
            onClick={() => {
              const enabled = !store.enabled
              setStore((s) => ({ ...s, enabled }))
              setNudge({ id: 'eyes-202020', title: 'Rest your eyes', body: 'Look 20 feet away for 20 seconds.', page: 'eyes', every: store.every, enabled, quietStart: 22, quietEnd: 7 })
            }}
          >
            {store.enabled ? 'On' : 'Off'}
          </button>
          <Slider
            label="Every"
            value={store.every}
            min={10}
            max={60}
            step={5}
            unit="min"
            onChange={(v) => {
              setStore((s) => ({ ...s, every: v }))
              setNudge({ id: 'eyes-202020', title: 'Rest your eyes', body: 'Look 20 feet away for 20 seconds.', page: 'eyes', every: v, enabled: store.enabled, quietStart: 22, quietEnd: 7 })
            }}
          />
          {on('sounds') && (
            <button type="button" className="studio-chip" aria-pressed={store.sound} onClick={() => setStore((s) => ({ ...s, sound: !s.sound }))}>
              Chime between exercises
            </button>
          )}
        </div>
      )}
    </div>
  )

  const history = () => (
    <div className="studio-card">
      <div className="studio-stats">
        <Stat value={store.log.length} label="eye breaks" />
        <Stat value={streakDays(store.log)} label="day streak" />
        <Stat value={store.log.filter((l) => l.at > Date.now() - 86400000).length} label="last 24 h" />
      </div>
    </div>
  )

  return (
    <Studio
      name="eyes"
      accent="#3f8a76"
      tab={tab}
      onTab={(x) => (setRunning(false), setTab(x))}
      scene={<StudioScene colors={['#c8e6a0', '#9fdcc8', '#fff0c7']} line="wave" />}
      tabs={[
        { id: 'practice', label: 'Practice', icon: <Eye size={15} />, render: practice },
        { id: 'library', label: 'Exercises', icon: <BellRing size={15} />, render: library },
        ...(on('history') ? [{ id: 'history', label: 'History', icon: <History size={15} />, render: history }] : []),
      ]}
    />
  )
}
