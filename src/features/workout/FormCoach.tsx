import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { OneEuroFilter } from '1eurofilter'
import { Camera, Play, Square } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { useKeepAwake } from '../../platform/presence'
import { burst } from '../../components/ui/celebrate'
import { BONES, RULES, RepCounter, read, squatPose, type Exercise, type P, type Rep } from './formModel'

/**
 * Form Coach: put the laptop on the floor and train. MediaPipe's pose model
 * runs on the GPU and tracks 33 body points; the coach counts reps with a
 * hysteresis state machine, checks depth and alignment, flashes a correction
 * the moment form slips, and logs the set to Workout when you finish.
 */
const VERSION = '1.0.1'
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
type Detector = { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: P[][] }; close: () => void }
let detP: Promise<Detector> | null = null
const getDetector = () => (detP ??= (async () => {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  const files = await FilesetResolver.forVisionTasks(WASM)
  return (await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1 })) as unknown as Detector
})().catch((e) => { detP = null; throw e }))

async function beep(good: boolean) {
  try {
    const Tone = await import('tone')
    await Tone.start()
    const s = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.1 } }).toDestination()
    s.volume.value = -12
    s.triggerAttackRelease(good ? 'E6' : 'A4', '16n')
    setTimeout(() => s.dispose(), 400)
  } catch { /* sound is optional */ }
}

function RepRing({ count, score, target }: { count: number; score: number | null; target: number }) {
  const ring = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!count || !ring.current || reduced()) return
    gsap.fromTo(ring.current, { scale: 1.18, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.6, ease: 'elastic.out(1.1, 0.4)' })
  }, [count])
  const C = 2 * Math.PI * 70
  return (
    <svg className="fc-ring" viewBox="0 0 180 180" data-matrix-native role="img" aria-label={`${count} reps`}>
      <g ref={ring}>
        <circle cx="90" cy="90" r="70" className="fc-ring-track" />
        <circle cx="90" cy="90" r="70" className="fc-ring-fill" strokeDasharray={`${Math.min(1, count / target) * C} ${C}`} transform="rotate(-90 90 90)" />
        <text x="90" y="100" textAnchor="middle" className="fc-count">{count}</text>
        <text x="90" y="124" textAnchor="middle" className="fc-count-sub">{score == null ? `of ${target}` : `form ${score}`}</text>
      </g>
    </svg>
  )
}

export function FormCoach({ onLog }: { onLog: (liftId: string, reps: number, seconds?: number) => void }) {
  const [ex, setEx] = useState<Exercise>('squat')
  const [mode, setMode] = useState<'idle' | 'loading' | 'camera' | 'demo'>('idle')
  useKeepAwake(mode === 'camera' || mode === 'demo')
  const [reps, setReps] = useState<Rep[]>([])
  const [fault, setFault] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [held, setHeld] = useState(0)
  const [err, setErr] = useState('')
  const [target, setTargetState] = useState(() => Number(localStorage.getItem('bloom-formcoach-target')) || 10)
  const setTarget = (n: number) => {
    setTargetState(n)
    try {
      localStorage.setItem('bloom-formcoach-target', String(n))
    } catch {
      /* optional */
    }
  }
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const banner = useRef<HTMLDivElement>(null)
  const counter = useRef(new RepCounter(ex))
  const stream = useRef<MediaStream | null>(null)
  const raf = useRef(0)
  const filters = useRef<OneEuroFilter[]>([])
  const heldRef = useRef({ ms: 0, last: 0 })

  const reset = (e = ex) => { counter.current = new RepCounter(e); setReps([]); setFault(null); setHeld(0); heldRef.current = { ms: 0, last: 0 }; filters.current = [] }
  const stop = () => {
    cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    setMode('idle')
  }
  useEffect(() => () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()) }, [])

  useLayoutEffect(() => {
    if (!fault || !banner.current || reduced()) return
    gsap.fromTo(banner.current, { y: -20, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(2)' })
  }, [fault])

  /** One frame: smooth, measure, count, draw. */
  const frame = (raw: P[], t: number, mirror: boolean) => {
    // One-euro filtering per coordinate: steady when still, responsive when moving.
    if (!filters.current.length) filters.current = raw.flatMap(() => [new OneEuroFilter(30, 1.2, 0.02, 1), new OneEuroFilter(30, 1.2, 0.02, 1)])
    const lm = raw.map((p, i) => ({ ...p, x: filters.current[i * 2].filter(p.x, t / 1000), y: filters.current[i * 2 + 1].filter(p.y, t / 1000) }))
    const r = read(ex, lm)
    setLabel(r.label)
    const rule = RULES[ex]
    if (rule.timed) {
      const good = r.faults.length === 0
      const h = heldRef.current
      if (good && h.last) h.ms += t - h.last
      h.last = t
      setHeld(Math.floor(h.ms / 1000))
    } else {
      const rep = counter.current.push(r, t)
      if (rep) {
        setReps([...counter.current.reps])
        void beep(rep.faults.length === 0)
        if (rep.score >= 90 && counter.current.reps.length % 5 === 0) burst(undefined, 'stars')
      }
    }
    setFault(r.faults[0] ?? null)
    draw(lm, r.faults.length > 0, mirror)
  }
  const draw = (lm: P[], bad: boolean, mirror: boolean) => {
    const c = canvas.current
    const g = c?.getContext('2d')
    if (!c || !g) return
    const W = c.width, H = c.height
    g.clearRect(0, 0, W, H)
    const X = (p: P) => (mirror ? 1 - p.x : p.x) * W
    const col = bad ? '#ff5d5d' : '#5dffc0'
    g.lineCap = 'round'
    g.shadowColor = col
    g.shadowBlur = 18
    g.strokeStyle = col
    g.lineWidth = 7
    for (const [a, b] of BONES) { g.beginPath(); g.moveTo(X(lm[a]), lm[a].y * H); g.lineTo(X(lm[b]), lm[b].y * H); g.stroke() }
    // Head.
    g.lineWidth = 5
    g.beginPath()
    g.arc(X(lm[0]), lm[0].y * H, 20, 0, Math.PI * 2)
    g.stroke()
    g.shadowBlur = 10
    g.fillStyle = '#fff'
    for (const i of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) { g.beginPath(); g.arc(X(lm[i]), lm[i].y * H, 6, 0, Math.PI * 2); g.fill() }
    g.shadowBlur = 0
  }

  const startCamera = async () => {
    setErr('')
    reset()
    setMode('loading')
    try {
      const det = await getDetector()
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      stream.current = s
      video.current!.srcObject = s
      await video.current!.play()
      setMode('camera')
      const loop = () => {
        const v = video.current
        if (v && v.readyState >= 2) {
          const res = det.detectForVideo(v, performance.now())
          if (res.landmarks[0]) frame(res.landmarks[0], performance.now(), true)
        }
        raf.current = requestAnimationFrame(loop)
      }
      loop()
    } catch (e) {
      setErr(`Camera or pose model unavailable: ${(e as Error).message}. Try the demo athlete.`)
      setMode('idle')
    }
  }
  const startDemo = () => {
    reset()
    setMode('demo')
    const t0 = performance.now()
    const loop = () => {
      const t = performance.now()
      const cyc = ((t - t0) / 2200) % 1
      const depth = (1 - Math.cos(cyc * Math.PI * 2)) / 2
      // Every fourth rep the demo athlete lets their chest drop, so the coach has something to say.
      const lean = Math.floor((t - t0) / 2200) % 4 === 3 ? depth : 0
      frame(squatPose(depth, lean), t, false)
      raf.current = requestAnimationFrame(loop)
    }
    loop()
  }
  const finish = () => {
    const rule = RULES[ex]
    if (rule.timed ? held > 0 : reps.length > 0) {
      onLog(rule.liftId, rule.timed ? held : reps.length, rule.timed ? held : undefined)
      burst(undefined, 'coins')
    }
    stop()
    reset()
  }
  const avg = reps.length ? Math.round(reps.reduce((a, r) => a + r.score, 0) / reps.length) : null

  return (
    <section className="fc" aria-label="Form coach">
      <header className="fc-head">
        <div><p className="fc-eyebrow">Form coach</p><h3>Hands-free reps, real-time form.</h3></div>
        <CapsBadge caps={['gpu', 'mt', 'opfs']} />
      </header>
      <div className="fc-ex" role="radiogroup" aria-label="Exercise">
        {(Object.keys(RULES) as Exercise[]).map((k) => (
          <button key={k} type="button" role="radio" aria-checked={ex === k} className={ex === k ? 'on' : ''} disabled={mode !== 'idle'} onClick={() => { setEx(k); reset(k) }}>{RULES[k].name}</button>
        ))}
      </div>
      <div className="fc-stage">
        <div className="fc-view" data-matrix-native>
          <video ref={video} className="fc-video" playsInline muted hidden={mode !== 'camera'} />
          <canvas ref={canvas} className="fc-canvas" width={640} height={480} />
          {mode === 'idle' && <p className="fc-tip">{RULES[ex].tip}</p>}
          {mode === 'loading' && <p className="fc-tip">Loading the pose model…</p>}
          {fault && mode !== 'idle' && <div ref={banner} className="fc-fault">⚠ {fault}</div>}
          {label && mode !== 'idle' && <span className="fc-angle">{label}</span>}
        </div>
        <div className="fc-side">
          {RULES[ex].timed ? (
            <div className="fc-held"><b>{held}s</b><small>held with good form</small></div>
          ) : (
            <>
            <RepRing count={reps.length} score={avg} target={target} />
          <label className="fc-target">
            Target reps{' '}
            <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
              {[5, 8, 10, 12, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
            </>
          )}
          <div className="fc-dots" aria-label="Rep quality">
            {reps.map((r, i) => <span key={i} className={`fc-dot ${r.score >= 85 ? 'good' : r.score >= 60 ? 'ok' : 'bad'}`} title={`Rep ${i + 1}: ${r.score}${r.faults.length ? ` · ${r.faults.join(', ')}` : ''}`} />)}
          </div>
          {mode === 'idle' ? (
            <div className="fc-actions">
              <button type="button" className="fc-cta" onClick={() => void startCamera()}><Camera size={16} /> Start camera</button>
              <button type="button" className="fc-ghost" onClick={startDemo}><Play size={16} /> Watch the demo athlete</button>
            </div>
          ) : (
            <button type="button" className="fc-cta" onClick={finish}><Square size={16} /> Finish &amp; log set</button>
          )}
          {err && <p className="voice-error">{err}</p>}
          <p className="fc-small">Video never leaves your device. Pose tracking runs on your GPU.</p>
        </div>
      </div>
    </section>
  )
}
