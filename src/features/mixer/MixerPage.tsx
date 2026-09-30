import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import gsap from 'gsap'
import { Moon, Pause, Play, Save, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react'
import { Rail, Slider, Studio, logActivity, readStore, writeStore } from '../../components/studio/Studio'
import { subOn } from '../subFeatures'
import { layers, mixer, presets, type Mix } from './mixerEngine'
import '../sounds/sounds.css'
import { MixOrbit } from '../showcase/MixOrbit'
import { usePageActions } from '../../components/ui/PageMenu'
import { Aurora } from './Aurora'
import './mixer.css'

const on = (id: string) => subOn('soundMixer', id)
const KEY = 'bloom-mixer-v1'
type Store = { mix: Mix; saved: { id: string; name: string; mix: Mix }[]; sleep: number }

/** The scene answers the mix: rain falls, waves roll, fire glows, birds fly. */
function Scene({ mix }: { mix: Mix }) {
  const root = useRef<SVGSVGElement>(null)
  useLayoutEffect(() => {
    if (!root.current || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<SVGLineElement>('.mx-drop').forEach((d) => gsap.fromTo(d, { y: -80 }, { y: 640, duration: gsap.utils.random(0.6, 1.1), repeat: -1, delay: gsap.utils.random(0, 1), ease: 'none' }))
      gsap.to('.mx-wave', { x: -200, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 1.2 })
      gsap.to('.mx-flame', { scaleY: 1.25, scaleX: 0.9, transformOrigin: '50% 100%', duration: 0.35, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: 0.1 })
      gsap.utils.toArray<SVGPathElement>('.mx-bird').forEach((b, i) => gsap.fromTo(b, { x: -100 }, { x: 1100, y: `+=${gsap.utils.random(-40, 40)}`, duration: gsap.utils.random(12, 20), repeat: -1, delay: i * 3, ease: 'none' }))
      gsap.to('.mx-cloud', { x: 120, duration: 20, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.mx-ripple', { attr: { rx: 70, ry: 10 }, opacity: 0, duration: 2.4, repeat: -1, stagger: 0.8, ease: 'sine.out' })
    }, root)
    return () => ctx.revert()
  }, [])
  const o = (id: keyof Mix) => Math.min(1, (mix[id] ?? 0) * 1.4)
  return (
    <svg ref={root} viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="mx-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#2a3a5c" />
          <stop offset="1" stopColor="#6a7fa8" />
        </linearGradient>
        <radialGradient id="mx-glow">
          <stop offset="0" stopColor="#ffb347" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffb347" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="600" fill="url(#mx-sky)" />
      <g className="mx-cloud" opacity={0.3 + o('rain') * 0.6}>
        <ellipse cx="300" cy="90" rx="180" ry="45" fill="#cfd8ea" />
        <ellipse cx="420" cy="70" rx="120" ry="40" fill="#dbe2f0" />
        <ellipse cx="760" cy="110" rx="160" ry="40" fill="#cfd8ea" />
      </g>
      <g opacity={o('rain')}>
        {Array.from({ length: 60 }, (_, i) => (
          <line key={i} className="mx-drop" x1={(i * 173) % 1000} x2={((i * 173) % 1000) - 8} y1="0" y2="24" stroke="#bcd3ff" strokeWidth="2" strokeLinecap="round" />
        ))}
      </g>
      <g opacity={o('birds')}>
        {[0, 1, 2].map((i) => (
          <path key={i} className="mx-bird" d={`M0 ${140 + i * 40} q12 -12 24 0 q12 -12 24 0`} stroke="#1c2336" strokeWidth="3" fill="none" />
        ))}
      </g>
      <path d="M0 420 Q250 360 500 410 T1000 400 L1000 600 L0 600 Z" fill="#2f4a3a" opacity={0.35 + o('wind') * 0.3} />
      <g opacity={0.25 + o('ocean') * 0.75}>
        {[0, 1, 2].map((i) => (
          <path key={i} className="mx-wave" d={`M-200 ${480 + i * 30} q100 -24 200 0 t200 0 t200 0 t200 0 t200 0 t200 0 t200 0 L1400 600 L-200 600 Z`} fill={['#3f7fb5', '#5aa9e6', '#8cc8f0'][i]} opacity="0.7" />
        ))}
      </g>
      <g opacity={o('stream')}>
        {[0, 1, 2].map((i) => (
          <ellipse key={i} className="mx-ripple" cx={200 + i * 40} cy="540" rx="10" ry="3" fill="none" stroke="#dff4ff" strokeWidth="2" />
        ))}
      </g>
      <g transform="translate(760 560)" opacity={o('fire')}>
        <circle r="120" fill="url(#mx-glow)" />
        {[-18, 0, 18].map((x, i) => (
          <path key={i} className="mx-flame" d={`M${x} 0 C${x - 22} -40 ${x - 6} -70 ${x} -${80 + i * 15} C${x + 6} -70 ${x + 22} -40 ${x} 0 Z`} fill={['#ff7a3d', '#ffb347', '#ffe08a'][i]} />
        ))}
      </g>
    </svg>
  )
}

export function MixerPage() {
  const [store, setStoreState] = useState<Store>(() => readStore(KEY, { mix: presets[0].mix, saved: [], sleep: 30 }))
  const setStore = (fn: (s: Store) => Store) =>
    setStoreState((c) => {
      const n = fn(c)
      writeStore(KEY, n)
      return n
    })
  const playing = useSyncExternalStore((fn) => mixer.subscribe(fn), () => mixer.playing)
  const [name, setName] = useState('')

  useEffect(() => {
    mixer.organic = on('organic')
    mixer.spatial = on('spatial')
    mixer.fade = on('fade')
    mixer.setMix(store.mix)
  }, [store.mix])
  const setLayer = (id: keyof Mix, v: number) => setStore((s) => ({ ...s, mix: { ...s.mix, [id]: v } }))
  const toggle = () => {
    if (playing) mixer.stop()
    else {
      void mixer.play(on('sleepTimer') ? store.sleep : null)
      logActivity('soundscape')
    }
  }
  const visible = layers.filter((l) => (l.noise ? on('noiseColours') : on('natureLayers')))

  // Surprise me: 2–4 random layers at gentle levels.
  const randomise = () => {
    const pick = [...visible].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3))
    setStore((s) => ({ ...s, mix: Object.fromEntries(visible.map((l) => [l.id, pick.includes(l) ? Math.round((0.25 + Math.random() * 0.5) * 20) / 20 : 0])) as Mix }))
  }
  usePageActions([{ id: 'mx-random', label: 'Surprise me with a mix', icon: '🎲', run: randomise }, { id: 'mx-toggle', label: playing ? 'Pause the mix' : 'Play the mix', icon: '🎚️', run: toggle }, { id: 'mx-mute', label: 'Mute every layer', icon: '🔇', run: () => visible.forEach((l) => setLayer(l.id, 0)) }])
  const mixTab = () => (
    <div className="studio-split mx-split">
      <div className="studio-card mx-layers">
        {visible.map((l) => (
          <div key={l.id} className="mx-layer" data-on={(store.mix[l.id] ?? 0) > 0} data-hint={`${l.label}: ${(store.mix[l.id] ?? 0) ? `${Math.round((store.mix[l.id] ?? 0) * 100)}%` : 'off'}`}>
            <span className="mx-emoji" aria-hidden="true">
              {l.emoji}
            </span>
            <Slider label={l.label} value={store.mix[l.id] ?? 0} min={0} max={1} step={0.05} format={(v) => (v ? `${Math.round(v * 100)}%` : 'off')} compact onChange={(v) => setLayer(l.id, v)} />
          </div>
        ))}
      </div>
      <div className="studio-card mx-side">
        {on('aurora') && <Aurora playing={playing} />}
        {(store.mix.binaural ?? 0) > 0 && (
          <div className="mx-beats" role="radiogroup" aria-label="Binaural beat">
            {[[2, 'Delta · sleep'], [6, 'Theta · drift'], [10, 'Alpha · calm focus'], [16, 'Beta · alert']].map(([hz, label]) => (
              <button key={hz} type="button" role="radio" aria-checked={mixer.binauralBeat === hz} className={mixer.binauralBeat === hz ? 'on' : ''} onClick={() => mixer.setBeat(hz as number)}>{hz} Hz<small>{label}</small></button>
            ))}
          </div>
        )}
        {on('orbit') && <MixOrbit playing={playing} layers={visible.map((l) => ({ id: l.id, emoji: l.emoji, label: l.label, volume: store.mix[l.id] ?? 0 }))} />}
        {on('savedMixes') && store.saved.length > 0 && (
          <div className="mx-favs" role="group" aria-label="Your mixes">
            {store.saved.map((m) => (
              <button
                key={m.id}
                type="button"
                className="studio-chip"
                aria-pressed={JSON.stringify(m.mix) === JSON.stringify(store.mix)}
                title="Load and play"
                onClick={() => {
                  setStore((s) => ({ ...s, mix: m.mix }))
                  if (!playing) {
                    void mixer.play(on('sleepTimer') ? store.sleep : null)
                    logActivity('soundscape')
                  }
                }}
              >
                ▶ {m.name}
              </button>
            ))}
          </div>
        )}
        <button type="button" className="studio-chip" onClick={randomise} title="Pick a random mix">
          🎲 Surprise me
        </button>
        <button type="button" className="fm-play mx-play" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause size={36} /> : <Play size={36} />}
        </button>
        {on('sleepTimer') && (
          <>
            <Slider label="Sleep timer" value={store.sleep} min={5} max={120} step={5} unit="min" onChange={(v) => setStore((s) => ({ ...s, sleep: v }))} />
            <div className="mx-favs" role="radiogroup" aria-label="Sleep timer presets">
              {[15, 30, 45, 60, 90].map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  className="studio-chip"
                  aria-checked={store.sleep === m}
                  onClick={() => {
                    setStore((s) => ({ ...s, sleep: m }))
                    // Restart the countdown if already playing.
                    if (playing) void mixer.play(m)
                  }}
                >
                  {m < 60 ? `${m}m` : `${m / 60}h`}
                </button>
              ))}
            </div>
          </>
        )}
        {on('savedMixes') && (
          <form
            className="sc-manual"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              setStore((s) => ({ ...s, saved: [...s.saved, { id: crypto.randomUUID(), name: name.trim(), mix: s.mix }] }))
              setName('')
            }}
          >
            <input className="studio-input" aria-label="Mix name" placeholder="Name this mix" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="submit" className="studio-go" data-variant="quiet" aria-label="Save mix">
              <Save size={16} />
            </button>
          </form>
        )}
        <p className="studio-empty">{on('organic') ? 'Every layer drifts on its own, so it never loops.' : 'Steady levels.'}</p>
      </div>
    </div>
  )

  const library = () => (
    <div className="iv-programs">
      {on('presets') && (
        <>
          <h3>Scenes</h3>
          <Rail label="Preset scenes">
            {presets.map((p) => (
              <div key={p.id} role="listitem">
                <button type="button" className="iv-card" onClick={() => setStore((s) => ({ ...s, mix: p.mix }))}>
                  <span aria-hidden="true">{p.emoji}</span>
                  <strong>{p.name}</strong>
                  <small>{Object.keys(p.mix).join(' · ')}</small>
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
      {on('savedMixes') && store.saved.length > 0 && (
        <>
          <h3>Your mixes</h3>
          <Rail label="Saved mixes">
            {store.saved.map((m) => (
              <div key={m.id} role="listitem" className="yg-saved">
                <button type="button" className="iv-card" onClick={() => setStore((s) => ({ ...s, mix: m.mix }))}>
                  <span aria-hidden="true">🎚️</span>
                  <strong>{m.name}</strong>
                  <small>{Object.entries(m.mix).filter(([, v]) => v).map(([k]) => k).join(' · ')}</small>
                </button>
                <button type="button" className="yg-remove" aria-label={`Delete ${m.name}`} onClick={() => setStore((s) => ({ ...s, saved: s.saved.filter((x) => x.id !== m.id) }))}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </Rail>
        </>
      )}
    </div>
  )

  return (
    <Studio
      name="mixer"
      accent="#3f6fb5"
      scene={on('scene') ? <Scene mix={store.mix} /> : undefined}
      aside={
        playing ? (
          <span className="ex-aside mx-aside">
            <Moon size={15} /> {mixer.endsAt ? `Fades at ${new Date(mixer.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Playing'}
          </span>
        ) : undefined
      }
      tabs={[
        { id: 'mix', label: 'Mix', icon: <SlidersHorizontal size={15} />, render: mixTab },
        ...(on('presets') || on('savedMixes') ? [{ id: 'scenes', label: 'Scenes', icon: <Sparkles size={15} />, render: library }] : []),
      ]}
    />
  )
}
