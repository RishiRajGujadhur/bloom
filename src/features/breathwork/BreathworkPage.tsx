import { useEffect, useRef, useState } from 'react'
import NoSleep from 'nosleep.js'
import { History, Play, ShieldAlert, Square, Wind } from 'lucide-react'
import { Slider, Stat, Studio, StudioScene, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { BREATHWORK_KEY, best, defaultSettings, initial, lung, step, type Session, type Settings, type State } from './breathworkModel'
import { BreathQuick } from '../quick/BreathQuick'
import { useLeaveGuard } from '../../utils/useLeaveGuard'
import './breathwork.css'

const on = (id: string) => subOn('breathwork', id)
type Store = { cfg: Settings; history: Session[]; safetyOk: boolean }

function tone(f: number, len = 0.4) {
  try {
    const ac = new AudioContext()
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.frequency.value = f
    g.gain.setValueAtTime(0.0001, ac.currentTime)
    g.gain.exponentialRampToValueAtTime(0.08, ac.currentTime + 0.05)
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + len)
    o.connect(g).connect(ac.destination)
    o.start()
    o.stop(ac.currentTime + len)
    setTimeout(() => void ac.close(), len * 1000 + 200)
  } catch {
    /* optional */
  }
}
const say = (t: string) => {
  try {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(t), { rate: 0.95 }))
  } catch {
    /* optional */
  }
}

/** Two stylised lungs that fill from the bottom as you breathe in. */
function Lungs({ fill, phase }: { fill: number; phase: State['phase'] }) {
  const y = 190 - fill * 150
  return (
    <svg className="bw-lungs" viewBox="0 0 240 220" data-phase={phase} aria-hidden="true" style={{ transform: `scale(${0.9 + fill * 0.15})` }}>
      <defs>
        <clipPath id="bw-clip">
          <path d="M110 40 C60 30 20 90 30 170 C35 200 80 205 105 185 Z M130 40 C180 30 220 90 210 170 C205 200 160 205 135 185 Z" />
        </clipPath>
        <linearGradient id="bw-air" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9fd3ff" />
          <stop offset="1" stopColor="#5aa9e6" />
        </linearGradient>
      </defs>
      <path d="M120 10 L120 60 M120 60 Q108 70 100 90 M120 60 Q132 70 140 90" className="bw-trachea" />
      <g clipPath="url(#bw-clip)">
        <rect x="0" y="0" width="240" height="220" className="bw-empty" />
        <rect x="0" y={y} width="240" height="220" fill="url(#bw-air)" className="bw-air" />
      </g>
      <path d="M110 40 C60 30 20 90 30 170 C35 200 80 205 105 185 Z M130 40 C180 30 220 90 210 170 C205 200 160 205 135 185 Z" className="bw-outline" />
    </svg>
  )
}

export function BreathworkPage() {
  const [store, setStoreState] = useState<Store>(() => readStore(BREATHWORK_KEY, { cfg: defaultSettings, history: [], safetyOk: false }))
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(BREATHWORK_KEY, n)
      return n
    })
  const cfg = store.cfg
  const [tab, setTab] = useState('breathe')
  const [s, setS] = useState<State | null>(null)
  const [now, setNow] = useState(Date.now())
  const noSleep = useRef<NoSleep | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const lastBreath = useRef(-1)
  const lastPhase = useRef<State['phase'] | null>(null)

  useEffect(() => {
    if (!s || s.phase === 'done') return
    let raf = 0
    const loop = () => {
      const t = Date.now()
      setNow(t)
      setS((cur) => (cur ? step(cur, cfg, t) : cur))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [s?.phase, cfg]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cues on changes.
  useEffect(() => {
    if (!s) return
    if (s.phase !== lastPhase.current) {
      lastPhase.current = s.phase
      if (s.phase === 'retention') {
        if (on('tones')) tone(330, 1)
        if (on('voice')) say('Let it all go, and hold. Tap when you need to breathe.')
      } else if (s.phase === 'recovery') {
        if (on('tones')) tone(660, 0.6)
        if (on('voice')) say(`Deep breath in, and hold for ${cfg.recovery} seconds.`)
      } else if (s.phase === 'rest' && on('voice')) say(`Let go. Round ${s.round + 1}.`)
      else if (s.phase === 'done') {
        setStore((st) => ({ ...st, history: [...st.history, { at: Date.now(), retentions: s.retentions }].slice(-200) }))
        logActivity('breathwork', { retentions: s.retentions })
        burst(stage.current, 'stars')
        noSleep.current?.disable()
        if (on('voice')) say('Beautiful. Rest and notice how you feel.')
      }
    }
    if (s.phase === 'breathe' && s.breath !== lastBreath.current) {
      lastBreath.current = s.breath
      if (on('tones') && s.breath > 0 && s.breath % 10 === 0) tone(520, 0.2)
    }
  }, [s, cfg.recovery])  

  const begin = () => {
    if (on('keepAwake')) {
      noSleep.current ??= new NoSleep()
      void noSleep.current.enable().catch(() => undefined)
    }
    lastPhase.current = null
    lastBreath.current = -1
    setS(initial(Date.now()))
    if (on('voice')) say('Breathe in fully, let go. Keep a steady rhythm.')
  }
  const stop = () => {
    noSleep.current?.disable()
    setS(null)
  }
  useEffect(() => () => noSleep.current?.disable(), [])
  useLeaveGuard(!!s && s.phase !== 'done')
  // Space begins a session, or ends the breath hold.
  const keyRef = useRef({ s, begin, cfg, safe: !on('safety') || store.safetyOk })
  keyRef.current = { s, begin, cfg, safe: !on('safety') || store.safetyOk }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || (e.target as HTMLElement | null)?.closest?.('input, textarea, button, select')) return
      const k = keyRef.current
      if (!k.safe) return
      e.preventDefault()
      if (!k.s || k.s.phase === 'done') k.begin()
      else if (k.s.phase === 'retention') setS(step(k.s, k.cfg, Date.now(), true))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const el = s ? Math.floor((now - s.phaseStart) / 1000) : 0
  const fill = s ? lung(s, cfg, now) : 0.4
  const label = !s ? 'Ready' : s.phase === 'breathe' ? (fill > 0.5 && ((now - s.phaseStart) / 1000) % (cfg.pace * 2) < cfg.pace ? 'In' : 'Out') : s.phase === 'retention' ? 'Hold (empty)' : s.phase === 'recovery' ? 'Hold (full)' : s.phase === 'rest' ? 'Let go' : 'Done'

  const breathe = () =>
    on('safety') && !store.safetyOk ? (
      <div className="studio-center bw-safety">
        <ShieldAlert size={40} />
        <h3>Before you start</h3>
        <p>Practise sitting or lying down, never in water or while driving. Light-headedness and tingling are normal; stop if you feel unwell. Avoid if pregnant, epileptic or with heart conditions.</p>
        <button type="button" className="studio-go" onClick={() => setStore((x) => ({ ...x, safetyOk: true }))}>
          I understand
        </button>
      </div>
    ) : (
      <>
      {!s && <BreathQuick onPreset={(p) => setStore((x) => ({ ...x, cfg: { ...x.cfg, ...p } }))} />}
      <div className="studio-split">
        <div ref={stage} className="studio-card bw-stage" data-phase={s?.phase ?? 'idle'} onClick={() => s?.phase === 'retention' && setS(step(s, cfg, Date.now(), true))}>
          {on('lungs') && <Lungs fill={fill} phase={s?.phase ?? 'breathe'} />}
          <div className="bw-readout">
            <span className="bw-label">{label}</span>
            <strong>{!s ? '—' : s.phase === 'breathe' ? s.breath : s.phase === 'recovery' ? Math.max(0, cfg.recovery - el) : s.phase === 'done' ? '✓' : `${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')}`}</strong>
            {s && s.phase !== 'done' && on('rounds') && (
              <small>
                Round {s.round} of {cfg.rounds}
                {s.phase === 'breathe' ? ` · ${cfg.breaths - s.breath} breaths left` : ''}
              </small>
            )}
            {s?.phase === 'retention' && <button className="studio-go bw-tap">Tap to breathe</button>}
          </div>
        </div>
        <div className="studio-card bw-side">
          {!s || s.phase === 'done' ? (
            <>
              {on('pace') && (
                <>
                  <Slider label="Rounds" value={cfg.rounds} min={1} max={6} onChange={(v) => setStore((x) => ({ ...x, cfg: { ...x.cfg, rounds: v } }))} />
                  <Slider label="Breaths per round" value={cfg.breaths} min={15} max={50} step={5} onChange={(v) => setStore((x) => ({ ...x, cfg: { ...x.cfg, breaths: v } }))} />
                  <Slider label="Pace" value={cfg.pace} min={1} max={3} step={0.1} unit="s" format={(v) => v.toFixed(1)} onChange={(v) => setStore((x) => ({ ...x, cfg: { ...x.cfg, pace: v } }))} />
                </>
              )}
              {on('recovery') && <Slider label="Recovery hold" value={cfg.recovery} min={10} max={30} unit="s" onChange={(v) => setStore((x) => ({ ...x, cfg: { ...x.cfg, recovery: v } }))} />}
              <button type="button" className="studio-go" onClick={begin}>
                <Play size={18} /> Begin
              </button>
              <small className="studio-empty">or press Space</small>
            </>
          ) : (
            <>
              <div className="bw-rounds" aria-label="Rounds">
                {Array.from({ length: cfg.rounds }, (_, i) => (
                  <span key={i} data-state={i + 1 < s.round || (i + 1 === s.round && s.phase !== 'breathe') ? 'done' : i + 1 === s.round ? 'now' : 'next'} />
                ))}
              </div>
              <p className="yg-cue">
                {s.phase === 'breathe' ? 'Full breath in through the belly and chest, relaxed breath out. Don’t force it.' : s.phase === 'retention' ? 'Exhale and hold with empty lungs. Relax. Tap when you need to breathe.' : s.phase === 'recovery' ? 'Breathe all the way in and hold.' : 'Let go and prepare for the next round.'}
              </p>
              <button type="button" className="studio-go" data-variant="quiet" onClick={stop}>
                <Square size={16} /> Stop
              </button>
            </>
          )}
          {on('retention') && s && s.retentions.length > 0 && (
            <div className="studio-stats">
              {s.retentions.map((r, i) => (
                <Stat key={i} value={`${r}s`} label={`round ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      </div>
      </>
    )

  const hist = store.history
  const max = Math.max(60, best(hist))
  const history = () => (
    <div className="studio-card bw-history">
      <div className="studio-stats">
        <Stat value={`${best(hist)}s`} label="best retention" />
        <Stat value={hist.length} label="sessions" />
      </div>
      {on('chart') && (
        <div className="bw-bars" aria-label="Retention per session">
          {hist.slice(-20).map((h, i) => (
            <div key={i} className="bw-bar-group" title={new Date(h.at).toLocaleDateString()}>
              {h.retentions.map((r, j) => (
                <span key={j} style={{ height: `${(r / max) * 100}%` }} data-best={r === best(hist)} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <Studio
      name="breathwork"
      accent="#3f7fd0"
      tab={tab}
      onTab={setTab}
      scene={<StudioScene colors={['#9fd3ff', '#c9b8ff', '#9fdcc8']} line="wave" />}
      tabs={[
        { id: 'breathe', label: 'Breathe', icon: <Wind size={15} />, render: breathe },
        ...(on('history') ? [{ id: 'history', label: 'Records', icon: <History size={15} />, render: history }] : []),
      ]}
    />
  )
}
