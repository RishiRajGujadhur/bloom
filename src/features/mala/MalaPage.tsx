import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useState } from 'react'
import Zdog from 'zdog'
import { History, Palette, Play, Plus, Pause, Sparkles } from 'lucide-react'
import { Rail, Segmented, Slider, Stat, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { BEADS, MALA_KEY, beadOf, isQuarter, mantras, roundsOf, themes, type MalaStore, type ThemeId } from './malaModel'
import { ripple } from '../showcase/ripple'
import '../showcase/showcase.css'
import { usePageActions } from '../../components/ui/PageMenu'
import './mala.css'

const on = (id: string) => subOn('mala', id)

function bell(big: boolean) {
  try {
    const ac = new AudioContext()
    ;(big ? [220, 330, 440] : [880]).forEach((f, i) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, ac.currentTime)
      g.gain.exponentialRampToValueAtTime((big ? 0.12 : 0.04) / (i + 1), ac.currentTime + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + (big ? 5 : 0.4))
      o.connect(g).connect(ac.destination)
      o.start()
      o.stop(ac.currentTime + 5)
    })
    setTimeout(() => void ac.close(), 5500)
  } catch {
    /* optional */
  }
}

/** A tilted ring of 108 beads plus the guru bead; the current bead glows. */
function MalaRing({ count, theme }: { count: number; theme: ThemeId }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const state = useRef<{ illo: Zdog.Illustration; beads: Zdog.Shape[]; spin: number; target: number } | null>(null)
  useEffect(() => {
    const el = canvas.current
    if (!el) return
    const t = themes[theme]
    const illo = new Zdog.Illustration({ element: el, zoom: 1, rotate: { x: -Zdog.TAU / 7 }, resize: true, dragRotate: true })
    const ring = new Zdog.Anchor({ addTo: illo })
    const R = 150
    new Zdog.Ellipse({ addTo: ring, diameter: R * 2, stroke: 2, color: t.thread, rotate: { x: Zdog.TAU / 4 } })
    const beads: Zdog.Shape[] = []
    for (let i = 0; i < BEADS; i++) {
      const a = (i / BEADS) * Zdog.TAU + Zdog.TAU / 4
      beads.push(new Zdog.Shape({ addTo: ring, translate: { x: Math.cos(a) * R, z: Math.sin(a) * R }, stroke: 17, color: t.bead }))
    }
    new Zdog.Shape({ addTo: ring, translate: { x: 0, z: R + 16 }, stroke: 32, color: t.guru })
    new Zdog.Cone({ addTo: ring, translate: { x: 0, z: R + 30, y: 0 }, diameter: 14, length: 24, stroke: 2, color: t.thread, fill: true, rotate: { x: -Zdog.TAU / 4 } })
    state.current = { illo, beads, spin: 0, target: 0 }
    let raf = 0
    const reduced = prefersReducedMotion()
    const tick = () => {
      const s = state.current!
      s.spin += (s.target - s.spin) * (reduced ? 1 : 0.12)
      ring.rotate.y = s.spin
      illo.updateRenderGraph()
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [theme])
  useEffect(() => {
    const s = state.current
    if (!s) return
    const t = themes[theme]
    const cur = beadOf(count)
    s.beads.forEach((b, i) => {
      b.color = i === cur ? '#fff6c8' : i < cur ? t.guru : t.bead
      b.stroke = i === cur ? 26 : 17
    })
    // Rotate so the counted bead comes to the front.
    s.target = -(count / BEADS) * Zdog.TAU
  }, [count, theme])
  return <canvas ref={canvas} className="ml-canvas" width="440" height="440" aria-label={`Bead ${beadOf(count) + 1} of ${BEADS}`} />
}

export function MalaPage() {
  const [store, setStoreState] = useState<MalaStore>(() => readStore(MALA_KEY, { mantra: 'om', custom: [], theme: 'sandalwood', target: BEADS, pace: 3, log: [] }))
  const setStore = (fn: (s: MalaStore) => MalaStore) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(MALA_KEY, n)
      return n
    })
  const [tab, setTab] = useState('count')
  const [count, setCount] = useState(0)
  const [auto, setAuto] = useState(false)
  const [custom, setCustom] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const all = [...mantras, ...store.custom.map((t, i) => ({ id: `c${i}`, text: t, meaning: 'Your own' }))]
  const mantra = all.find((m) => m.id === store.mantra) ?? mantras[0]
  const theme = on('themes') ? store.theme : 'sandalwood'

  const lastTap = useRef<{ clientX: number; clientY: number } | null>(null)
  const tap = () => {
    const next = count + 1
    if (on('ripples')) ripple(stage.current, lastTap.current, isQuarter(next) ? `${next % BEADS || BEADS}` : '+1', next % BEADS === 0 ? '#ffd54f' : '#ffffffcc', next % BEADS === 0)
    lastTap.current = null
    setCount((c) => {
      const n = c + 1
      if (on('haptics')) navigator.vibrate?.(isQuarter(n) ? [30, 50, 30] : 12)
      if (on('bells') && isQuarter(n)) bell(n % BEADS === 0)
      if (on('rounds') && n % BEADS === 0) {
        burst(stage.current, 'stars')
        setStore((s) => ({ ...s, log: [...s.log, { at: Date.now(), count: BEADS, mantra: mantra.text }].slice(-300) }))
        logActivity('mala', { mantra: mantra.text })
      }
      if (n >= store.target && n % store.target === 0) setAuto(false)
      return n
    })
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (tab !== 'count') return
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      if (!typing && (e.code === 'Space' || e.key === 'Enter')) {
        e.preventDefault()
        tap()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }) // re-bind with latest tap
  useEffect(() => {
    if (!auto) return
    const i = setInterval(() => {
      tap()
      if (on('chant')) {
        try {
          speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(mantra.text), { rate: 0.8, pitch: 0.8 }))
        } catch {
          /* optional */
        }
      }
    }, store.pace * 1000)
    return () => clearInterval(i)
  })  

  usePageActions([
    { id: 'ml-bead', label: 'Count a bead', icon: '📿', run: tap },
    { id: 'ml-reset', label: 'Start a new round', icon: '↺', run: () => setCount(0) },
  ])
  const count_ = () => (
    <div className="studio-split ml-split">
      <div ref={stage} className="studio-card ml-stage" style={{ background: `radial-gradient(circle at 50% 45%, ${themes[theme].bg[0]}, ${themes[theme].bg[1]})` }} onClick={(e) => { lastTap.current = e; tap() }} role="button" aria-label="Count a bead" data-cursor-text="Tap" data-hint="Tap (or press space) for each bead">
        {on('mala3d') ? <MalaRing count={count} theme={theme} /> : <span className="ml-big">{beadOf(count)}</span>}
        <p className="ml-mantra" key={count}>
          {mantra.text}
        </p>
      </div>
      <div className="studio-card ml-side">
        <div className="studio-stats">
          <Stat value={beadOf(count)} label={`of ${BEADS}`} />
          {on('rounds') && <Stat value={roundsOf(count)} label="rounds" />}
        </div>
        {on('library') && (
          <select className="studio-input" aria-label="Mantra" value={store.mantra} onChange={(e) => setStore((s) => ({ ...s, mantra: e.target.value }))}>
            {all.map((m) => (
              <option key={m.id} value={m.id}>
                {m.text}
              </option>
            ))}
          </select>
        )}
        <p className="studio-empty">{mantra.meaning} · tap the mala or press space</p>
        {on('autoChant') && (
          <>
            <Slider label="Pace" value={store.pace} min={1} max={8} step={0.5} unit="s" compact onChange={(v) => setStore((s) => ({ ...s, pace: v }))} />
            <button type="button" className="studio-go" data-variant={auto ? undefined : 'quiet'} onClick={() => setAuto(!auto)}>
              {auto ? <Pause size={16} /> : <Play size={16} />} {auto ? 'Pause' : 'Auto-count'}
            </button>
          </>
        )}
        <button type="button" className="studio-chip" onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
    </div>
  )

  const mantrasTab = () => (
    <div className="iv-programs">
      <Rail label="Mantras">
        {all.map((m) => (
          <div key={m.id} role="listitem">
            <button type="button" className="iv-card" data-on={store.mantra === m.id} onClick={() => (setStore((s) => ({ ...s, mantra: m.id })), setTab('count'))}>
              <strong>{m.text}</strong>
              <small>{m.meaning}</small>
            </button>
          </div>
        ))}
      </Rail>
      {on('custom') && (
        <form
          className="sc-manual"
          onSubmit={(e) => {
            e.preventDefault()
            if (!custom.trim()) return
            setStore((s) => ({ ...s, custom: [...s.custom, custom.trim()] }))
            setCustom('')
          }}
        >
          <input className="studio-input" aria-label="Your mantra" placeholder="Write your own mantra" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button type="submit" className="studio-go" data-variant="quiet" aria-label="Add mantra">
            <Plus size={16} />
          </button>
        </form>
      )}
      {on('themes') && <Segmented label="Beads" value={store.theme} onChange={(t) => setStore((s) => ({ ...s, theme: t }))} options={(Object.keys(themes) as ThemeId[]).map((t) => ({ id: t, label: t[0].toUpperCase() + t.slice(1) }))} />}
    </div>
  )

  const history = () => (
    <div className="studio-card">
      <div className="studio-stats">
        <Stat value={store.log.length} label="rounds completed" />
        <Stat value={(store.log.length * BEADS).toLocaleString()} label="repetitions" />
        <Stat value={new Set(store.log.map((l) => new Date(l.at).toDateString())).size} label="days practised" />
      </div>
      <ul className="wo-sets" style={{ maxHeight: 'none', marginTop: 14 }}>
        {[...store.log].reverse().slice(0, 14).map((l) => (
          <li key={l.at}>
            <span>{l.mantra}</span>
            <strong>{BEADS}</strong>
            <small>{new Date(l.at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</small>
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <Studio
      name="mala"
      accent="#b0643b"
      tab={tab}
      onTab={(t) => {
        setAuto(false)
        setTab(t)
      }}
      tabs={[
        { id: 'count', label: 'Count', icon: <Sparkles size={15} />, render: count_ },
        ...(on('library') || on('custom') || on('themes') ? [{ id: 'mantras', label: 'Mantras', icon: <Palette size={15} />, render: mantrasTab }] : []),
        ...(on('log') ? [{ id: 'log', label: 'Log', icon: <History size={15} />, render: history }] : []),
      ]}
    />
  )
}
