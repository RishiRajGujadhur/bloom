import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Brain, Headphones, Music2, Pause, Play, Timer } from 'lucide-react'
import type { FeaturePageProps } from '../shared/pageProps'
import { Segmented, Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { engine, modes, type Genre, type Mode } from './focusEngine'
import gsap from 'gsap'
import { usePageActions } from '../../components/ui/PageMenu'
import { RhythmPractice } from './RhythmPractice'
import { PitchPractice } from './PitchPractice'

const modeHints: Record<Mode, string> = {
  focus: 'Beta rhythm (~16 Hz) for alert, steady work',
  relax: 'Alpha rhythm (~10 Hz) for calm, open attention',
  meditate: 'Theta rhythm (~6 Hz) for deep, inward rest',
  sleep: 'Delta rhythm (~2 Hz) to help you drift off',
}
import './sounds.css'

const on = (id: string) => subOn('focusSounds', id)
const KEY = 'bloom-sounds-v1'
type Prefs = { mode: Mode; genre: Genre; intensity: number; binaural: boolean; minutes: number; sessions: { at: number; mode: Mode; minutes: number }[] }
const initial: Prefs = { mode: 'focus', genre: 'ambient', intensity: 0.5, binaural: false, minutes: 25, sessions: [] }

/** Radial spectrum drawn from the engine's analyser. */
function Visualiser({ color }: { color: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    let raf = 0
    const data = new Uint8Array(128)
    const smooth = new Float32Array(97)
    const peak = new Float32Array(128).fill(1)
    let phase = 0
    const draw = () => {
      const c = canvas.current
      const g = c?.getContext('2d')
      if (!c || !g) return
      const w = (c.width = c.clientWidth * devicePixelRatio)
      const h = (c.height = c.clientHeight * devicePixelRatio)
      g.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const base = Math.min(w, h) * 0.22
      engine.analyser?.getByteFrequencyData(data)
      phase += 0.004
      const n = 96
      g.beginPath()
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2 + phase
        // Mirror the lower spectrum around the circle and ease toward it.
        const k = i % n
        const bin = Math.floor(((k <= n / 2 ? k : n - k) / (n / 2)) * 40) + 2
        // Each bin is normalised to its own recent peak so bass can't dominate.
        peak[bin] = Math.max(data[bin], peak[bin] * 0.995, 1)
        const level = engine.playing ? data.slice(2, 44).reduce((t, x) => t + x, 0) / (42 * 255) : 0
        const target = engine.playing ? 0.25 * (data[bin] / peak[bin]) + level * (0.7 + 0.3 * Math.sin(a * 5 + phase * 25)) : 0.08 + 0.04 * Math.sin(a * 3 + phase * 20)
        smooth[k] += (target - smooth[k]) * 0.12
        const v = smooth[k]
        const r = base + v * base * 0.9
        const x = cx + Math.cos(a) * r
        const y = cy + Math.sin(a) * r
        if (i) g.lineTo(x, y)
        else g.moveTo(x, y)
      }
      g.closePath()
      const grad = g.createRadialGradient(cx, cy, base * 0.2, cx, cy, base * 2)
      grad.addColorStop(0, `${color}cc`)
      grad.addColorStop(1, `${color}11`)
      g.fillStyle = grad
      g.fill()
      g.strokeStyle = color
      g.lineWidth = 2 * devicePixelRatio
      g.stroke()
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [color])
  return <canvas ref={canvas} className="fm-vis" aria-hidden="true" />
}

export function SoundsPage({ setData }: FeaturePageProps) {
  const [prefs, setPrefsState] = useState<Prefs>(() => readStore(KEY, initial))
  const setPrefs = (p: Partial<Prefs>) =>
    setPrefsState((c) => {
      const n = { ...c, ...p }
      writeStore(KEY, n)
      return n
    })
  const playing = useSyncExternalStore(
    (fn) => engine.subscribe(fn),
    () => engine.playing,
  )
  const [now, setNow] = useState(Date.now())
  const mode = modes[prefs.mode]

  useEffect(() => {
    engine.set({ mode: prefs.mode, genre: on('genres') ? prefs.genre : 'ambient', intensity: prefs.intensity, binaural: on('binaural') && prefs.binaural, neural: on('neuralPhase'), fade: on('fade') })
  }, [prefs])
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [playing])
  // A finished focus session counts as focus minutes.
  useEffect(() => {
    const done = () => {
      const minutes = prefs.minutes
      setPrefs({ sessions: [...prefs.sessions, { at: Date.now(), mode: prefs.mode, minutes }].slice(-200) })
      logActivity('sounds', { mode: prefs.mode, minutes })
      if (on('pairFocus') && prefs.mode === 'focus')
        setData((d) => ({ ...d, rpg: { ...d.rpg, focusHistory: [...d.rpg.focusHistory, { id: crypto.randomUUID(), completedAt: Date.now(), minutes, taskTitle: 'Focus sounds' }] } }))
    }
    window.addEventListener('bloom:sounds-finished', done)
    return () => window.removeEventListener('bloom:sounds-finished', done)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reads latest prefs via closure refresh
  }, [prefs])

  const toggle = () => (playing ? engine.stop() : void engine.play(on('timer') ? prefs.minutes : null))
  const left = engine.endsAt ? Math.max(0, Math.round((engine.endsAt - now) / 1000)) : null

  const halo = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const el = halo.current
    if (!el || !playing || prefersReducedMotion()) return
    const beat = 60 / mode.bpm
    const tl = gsap.timeline({ repeat: -1 })
    tl.fromTo(el.querySelectorAll('circle'), { attr: { r: 46 }, opacity: 0.6 }, { attr: { r: 96 }, opacity: 0, duration: beat * 4, stagger: beat * 4 / 3, ease: 'sine.out' })
    return () => void tl.kill()
  }, [playing, mode.bpm])
  usePageActions([
    { id: 'fm-toggle', label: playing ? 'Pause' : 'Play', icon: playing ? '⏸️' : '▶️', run: toggle },
    ...(Object.keys(modes) as Mode[]).filter((m) => m !== prefs.mode).map((m) => ({ id: `fm-${m}`, label: `Switch to ${modes[m].label}`, icon: '🎧', run: () => setPrefs({ mode: m }) })),
  ])
  const player = () => (
    <div className="studio-split">
      <div className="studio-card fm-stage" style={{ ['--mode' as string]: mode.color }}>
        {on('visualiser') ? <Visualiser color={mode.color} /> : null}
        <svg ref={halo} className="fm-halo" viewBox="0 0 200 200" aria-hidden="true">
          {[0, 1, 2].map((k) => <circle key={k} cx="100" cy="100" r="46" />)}
        </svg>
        <button type="button" className="fm-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={40} /> : <Play size={40} />}
        </button>
        {left !== null && <span className="fm-left">{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</span>}
      </div>
      <div className="studio-card fm-side">
        {on('modes') && (
          <div className="fm-modes" role="radiogroup" aria-label="Mode">
            {(Object.keys(modes) as Mode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={prefs.mode === m} style={{ ['--c' as string]: modes[m].color }} onClick={() => setPrefs({ mode: m })} data-hint={modeHints[m]}>
                <strong>{modes[m].label}</strong>
                <small>
                  {modes[m].band} · {modes[m].am} Hz
                </small>
              </button>
            ))}
          </div>
        )}
        {on('genres') && (
          <Segmented
            label="Genre"
            value={prefs.genre}
            onChange={(g) => setPrefs({ genre: g })}
            options={[
              { id: 'ambient', label: 'Ambient' },
              { id: 'piano', label: 'Piano' },
              { id: 'lofi', label: 'Lo-fi' },
              { id: 'nature', label: 'Nature' },
            ]}
          />
        )}
        {on('intensity') && <Slider label="Neural effect" value={prefs.intensity} min={0} max={1} step={0.05} format={(v) => (v < 0.34 ? 'Low' : v < 0.67 ? 'Medium' : 'High')} onChange={(v) => setPrefs({ intensity: v })} />}
        {on('timer') && <Slider label="Session" value={prefs.minutes} min={10} max={120} step={5} unit="min" onChange={(v) => setPrefs({ minutes: v })} />}
        {on('binaural') && (
          <button type="button" className="studio-chip" aria-pressed={prefs.binaural} onClick={() => setPrefs({ binaural: !prefs.binaural })}>
            <Headphones size={13} /> Binaural beats · {mode.beat} Hz (headphones)
          </button>
        )}
        <p className="studio-empty">
          {on('neuralPhase') ? `Music pulses at ${mode.am} Hz, in the ${mode.band.toLowerCase()} range linked to ${prefs.mode === 'focus' ? 'alert attention' : prefs.mode === 'relax' ? 'calm wakefulness' : prefs.mode === 'meditate' ? 'deep relaxation' : 'sleep'}.` : 'Generated live, never the same twice.'}
        </p>
      </div>
    </div>
  )

  const total = prefs.sessions.reduce((t, s) => t + s.minutes, 0)
  const stats = () => (
    <div className="studio-card">
      <h3>
        <Brain size={17} /> Your listening
      </h3>
      <div className="studio-stats">
        <Stat value={prefs.sessions.length} label="sessions" />
        <Stat value={`${total} min`} label="total" />
        {(Object.keys(modes) as Mode[]).map((m) => (
          <Stat key={m} value={prefs.sessions.filter((s) => s.mode === m).reduce((t, s) => t + s.minutes, 0)} label={`${modes[m].label} min`} />
        ))}
      </div>
    </div>
  )

  return (
    <Studio
      name="sounds"
      accent={mode.color}
      scene={<StudioScene colors={[mode.color, '#c9b8ff', '#9fdcc8']} line="wave" />}
      aside={
        playing ? (
          <span className="ex-aside">
            <Music2 size={15} /> Playing {mode.label.toLowerCase()} music
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'player', label: 'Listen', icon: <Music2 size={15} />, render: player },
        { id: 'stats', label: 'Sessions', icon: <Timer size={15} />, render: stats },
        { id: 'rhythm', label: 'Rhythm lab', icon: <Music2 size={15} />, render: () => <RhythmPractice /> },
        { id: 'pitch', label: 'Pitch lab', icon: <Music2 size={15} />, render: () => <PitchPractice /> },
      ]}
    />
  )
}
