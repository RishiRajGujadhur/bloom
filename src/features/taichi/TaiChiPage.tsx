import { useBodyPractice } from '../body/bodyPractice'
import { useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Mic, MicOff, Pause, Play } from 'lucide-react'
import { subOn } from '../subFeatures'
import { loadSettings } from '../../settings/appSettings'
import { Silk, type SilkPalette } from './SilkShader'
import { useBreath } from './useBreath'
import { elements, type ElementId, type Pt, type Stance } from './stanceModel'
import type { WuXingEngine } from './wuXingAudio'
import './taichi.css'

const paletteFor: Record<ElementId, SilkPalette> = { wood: 'jade', fire: 'dawn', earth: 'dawn', metal: 'dusk', water: 'ocean' }
const BONES: [number, number][] = [[11, 12], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [11, 13], [13, 15], [12, 14], [14, 16]]

/** Breath label that follows the live signal. */
function BreathCue({ value }: { value: React.MutableRefObject<number> }) {
  const [label, setLabel] = useState('Breathe in')
  const last = useRef(value.current)
  useEffect(() => {
    const t = setInterval(() => {
      const v = value.current
      if (Math.abs(v - last.current) > 0.01) setLabel(v > last.current ? 'Breathe in' : 'Breathe out')
      last.current = v
    }, 300)
    return () => clearInterval(t)
  }, [value])
  return <p className="tc-cue">{label}</p>
}

export function TaiChiPage() {
  const breath = useBreath()
  const [element, setElementState] = useState<ElementId>(() => {
    try {
      const saved = localStorage.getItem('bloom-taichi-element') as ElementId | null
      return saved && saved in elements ? saved : 'earth'
    } catch {
      return 'earth'
    }
  })
  const setElement = (id: ElementId) => {
    setElementState(id)
    try { localStorage.setItem('bloom-taichi-element', id) } catch { /* optional */ }
  }
  const [playing, setPlaying] = useState(false)
  // How long the soundscape has been playing this time.
  const [playedFor, setPlayedFor] = useState(0)
  useEffect(() => {
    if (!playing) return
    const started = Date.now()
    setPlayedFor(0)
    const t = setInterval(() => setPlayedFor(Math.floor((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(t)
  }, [playing])
  const [camera, setCamera] = useState<'off' | 'starting' | 'on' | 'error'>('off')
  const [stance, setStance] = useState<Stance | null>(null)
  const [manual, setManual] = useState(0.3)
  const engine = useRef<WuXingEngine | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const overlay = useRef<SVGSVGElement>(null)
  const stopCam = useRef<() => void>(() => {})
  const silkOn = loadSettings().features.breathSilk
  const grounding = camera === 'on' && stance ? stance.grounding : manual

  useEffect(() => {
    engine.current?.setGrounding(grounding)
  }, [grounding])
  useEffect(() => {
    engine.current?.setElement(element)
  }, [element])
  // Chimes thicken as you inhale.
  useEffect(() => {
    if (!playing || !subOn('wuXing', 'breathDensity')) return
    const t = setInterval(() => engine.current?.setDensity(breath.value.current), 250)
    return () => clearInterval(t)
  }, [playing, breath.value])
  useEffect(
    () => () => {
      engine.current?.stop()
      stopCam.current()
    },
    [],
  )

  const toggleSound = async () => {
    if (engine.current) {
      engine.current.stop()
      engine.current = null
      setPlaying(false)
      return
    }
    const { startWuXing } = await import('./wuXingAudio')
    engine.current = await startWuXing(element, { bass: subOn('wuXing', 'bass'), chimes: subOn('wuXing', 'chimes') })
    engine.current.setGrounding(grounding)
    setPlaying(true)
  }
  useBodyPractice('taichi', 'taiChi', 'Tai Chi flow', () => { stopCam.current(); setCamera('off'); setStance(null); engine.current?.stop(); engine.current = null; setPlaying(false) })
  const toggleCamera = async () => {
    if (camera === 'on') {
      stopCam.current()
      setCamera('off')
      setStance(null)
      return
    }
    if (!video.current) return
    setCamera('starting')
    try {
      const { startStance } = await import('./stanceRuntime')
      stopCam.current = await startStance(video.current, (s, points) => {
        setStance(s)
        drawSkeleton(points)
      })
      setCamera('on')
    } catch {
      setCamera('error')
    }
  }
  const drawSkeleton = (points: Pt[] | null) => {
    const svg = overlay.current
    if (!svg || !subOn('wuXing', 'skeleton')) return
    svg.innerHTML = points
      ? BONES.map(([a, b]) => `<line x1="${(1 - points[a].x) * 100}" y1="${points[a].y * 100}" x2="${(1 - points[b].x) * 100}" y2="${points[b].y * 100}" />`).join('')
      : ''
  }
  const el = elements[element]

  return (
    <div className="tc-page" style={{ ['--el' as string]: el.color }}>
      {silkOn && <Silk breath={breath.value} palette={subOn('breathSilk', 'elementColours') ? paletteFor[element] : 'dawn'} ripple={subOn('breathSilk', 'ripple')} className="tc-silk" />}
      <div className="tc-overlay">
        <header className="tc-head bloom-inline">
          <span className="tc-han" aria-hidden="true">
            {el.han}
          </span>
          <div>
            <h3>{el.name}</h3>
            <p>
              {el.season} · move slowly, breathe low into the dan tian
            </p>
          </div>
        </header>
        {silkOn && <BreathCue value={breath.value} />}

        <div className="tc-elements" role="radiogroup" aria-label="Element">
          {(Object.keys(elements) as ElementId[]).map((id) => (
            <button key={id} type="button" role="radio" aria-checked={element === id} style={{ ['--c' as string]: elements[id].color }} onClick={() => setElement(id)}>
              <span aria-hidden="true">{elements[id].han}</span>
              {elements[id].name}
            </button>
          ))}
        </div>

        <div className="tc-controls">
          <button type="button" className="tc-btn tc-play" onClick={toggleSound} aria-pressed={playing}>
            {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? `Stop soundscape · ${Math.floor(playedFor / 60)}:${String(playedFor % 60).padStart(2, '0')}` : 'Play soundscape'}
          </button>
          {silkOn && subOn('breathSilk', 'mic') && (
            <button type="button" className="tc-btn" onClick={breath.mic === 'on' ? breath.end : breath.start} aria-pressed={breath.mic === 'on'}>
              {breath.mic === 'on' ? <MicOff size={16} /> : <Mic size={16} />}{' '}
              {breath.mic === 'on' ? `Listening · ${breath.breaths} breaths` : breath.mic === 'blocked' ? 'Mic blocked' : breath.mic === 'starting' ? 'Starting…' : 'Sync to my breath'}
            </button>
          )}
          {subOn('wuXing', 'stanceCamera') && (
            <button type="button" className="tc-btn" onClick={toggleCamera} aria-pressed={camera === 'on'}>
              {camera === 'on' ? <CameraOff size={16} /> : <Camera size={16} />} {camera === 'on' ? 'Stop camera' : camera === 'starting' ? 'Loading pose model…' : camera === 'error' ? 'Camera unavailable' : 'Read my stance'}
            </button>
          )}
        </div>

        <div className="tc-ground">
          <div className="tc-meter" role="meter" aria-label="Grounding" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(grounding * 100)}>
            <span style={{ height: `${Math.max(4, grounding * 100)}%` }} />
          </div>
          <div className="tc-ground-info bloom-stack">
            <strong>{camera === 'on' ? (stance ? stance.name : 'Step back so your whole body is in view') : 'Grounding'}</strong>
            {camera === 'on' && stance ? (
              <small>
                Feet {stance.width}× shoulders · knees {stance.knee}° · {Math.round(stance.grounding * 100)}% rooted
              </small>
            ) : (
              <label>
                <small>Sink lower and the bass deepens</small>
                <input type="range" min="0" max="1" step="0.01" value={manual} aria-label="Grounding" onChange={(e) => setManual(Number(e.target.value))} />
              </label>
            )}
          </div>
          <div className="tc-cam" data-on={camera === 'on'}>
            <video ref={video} muted playsInline />
            <svg ref={overlay} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" />
          </div>
        </div>
        <p className="tc-privacy">Microphone and camera are processed on this device only. Nothing is recorded.</p>
      </div>
    </div>
  )
}

/** Compact biofeedback silk for the Breathe page. */
export function BreathSilkCard() {
  const breath = useBreath()
  return (
    <section className="tc-card">
      <Silk breath={breath.value} palette="dusk" ripple={subOn('breathSilk', 'ripple')} className="tc-card-silk" />
      <div className="tc-card-body">
        <BreathCue value={breath.value} />
        {subOn('breathSilk', 'mic') && (
          <button type="button" className="tc-btn" onClick={breath.mic === 'on' ? breath.end : breath.start}>
            {breath.mic === 'on' ? <MicOff size={16} /> : <Mic size={16} />} {breath.mic === 'on' ? `Listening · ${breath.breaths} breaths` : 'Sync the silk to my breath'}
          </button>
        )}
      </div>
    </section>
  )
}
