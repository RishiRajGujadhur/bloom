import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { OneEuroFilter } from '1eurofilter'
import { Camera, Maximize, Play } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { useKeepAwake } from '../../platform/presence'
import { angle, BONES, RULES, RepCounter, alignment, demoPose, exerciseVisible, read, readUpper, personalRange, upperBaseline, upperVisible, UPPER_BONES, visible, type Exercise, type P, type Rep, type UpperBaseline } from './formModel'
import { emptyGesture, emptyMotion, gestureTick, motionTick, type MotionState } from './coachMetrics'
import { CoachReference } from './CoachReference'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
const GROUPS: { title: string; exercises: Exercise[] }[] = [
  { title: 'Seated Basic', exercises: ['seatedTwist', 'wheelchairDip', 'chairPushup', 'seatedPress', 'chestFly'] },
  { title: 'Martial Arts', exercises: ['taiChi', 'boxing', 'karate', 'kungFu'] },
  { title: 'Standing & Floor', exercises: ['chairSquat', 'squat', 'pushup', 'lunge', 'plank'] },
]
type Mode = 'idle' | 'loading' | 'camera' | 'demo'
type Detector = { detectForVideo: (video: HTMLVideoElement, at: number) => { landmarks: P[][]; worldLandmarks?: P[][] }; close: () => void }
const preference = () => { try { return localStorage.getItem('bloom-coach-accessible') === 'true' } catch { return false } }
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function RepRing({ count, target, timed }: { count: number; target: number; timed: boolean }) {
  const group = useRef<SVGGElement>(null)
  useLayoutEffect(() => {
    if (!count || !group.current || reduced()) return
    const tween = gsap.fromTo(group.current, { scale: 1.05, transformOrigin: '50% 50%' }, { scale: 1, duration: .3 })
    return () => { tween.kill() }
  }, [count])
  const circumference = 2 * Math.PI * 70
  return <svg className="fc-ring" viewBox="0 0 180 180" role="img" aria-label={timed ? `${count} active seconds` : `${count} reps`}><g ref={group}><circle cx="90" cy="90" r="70" className="fc-ring-track" /><circle cx="90" cy="90" r="70" className="fc-ring-fill" strokeDasharray={`${Math.min(1, count / target) * circumference} ${circumference}`} transform="rotate(-90 90 90)" /><text x="90" y="100" textAnchor="middle" className="fc-count">{count}</text><text x="90" y="124" textAnchor="middle" className="fc-count-sub">{timed ? 'active seconds' : `of ${target}`}</text></g></svg>
}

export function FormCoach({ onLog, onFinish, bodyweight = 70 }: { onLog: (liftId: string, reps: number, seconds?: number) => void; onFinish?: () => void; bodyweight?: number }) {
  const [accessible, setAccessible] = useState(preference)
  const [ex, setEx] = useState<Exercise>(() => preference() ? 'seatedTwist' : 'squat')
  const [mode, setMode] = useState<Mode>('idle')
  const [reps, setReps] = useState<Rep[]>([])
  const [held, setHeld] = useState(0)
  const [fault, setFault] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [err, setErr] = useState('')
  const [message, setMessage] = useState('')
  const [calibration, setCalibration] = useState(0)
  const [balance, setBalance] = useState<ReturnType<typeof alignment>>(null)
  const [metrics, setMetrics] = useState<MotionState>(emptyMotion)
  const [gesture, setGesture] = useState({ id: null as string | null, progress: 0, latched: false })
  const [gestures, setGestures] = useState(true)
  const [overlay, setOverlay] = useState(true)
  const [focus, setFocus] = useState(false)
  const [target, setTarget] = useState(10)
  const [bpm, setBpm] = useState(45)
  const [span, setSpan] = useState(40)
  const [jointAngles, setJointAngles] = useState({ left: 0, right: 0 })
  const [romStatus, setRomStatus] = useState('Optional: calibrate your comfortable movement range')
  const rom = useRef({ active: false, seconds: 0, low: Infinity, high: -Infinity })
  const ranges = useRef<Partial<Record<Exercise, ReturnType<typeof personalRange>>>>({})
  useKeepAwake(mode === 'camera' || mode === 'demo')
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), panel = useRef<HTMLDivElement>(null)
  const detector = useRef<Detector | null>(null), stream = useRef<MediaStream | null>(null)
  const generation = useRef(0), raf = useRef(0), modeRef = useRef<Mode>('idle'), exercise = useRef(ex)
  const counter = useRef(new RepCounter(ex)), filters = useRef<OneEuroFilter[]>([])
  const hold = useRef({ seconds: 0, last: 0 }), lastFrame = useRef(0), motion = useRef(emptyMotion())
  const baseline = useRef<UpperBaseline | null>(null), samples = useRef<UpperBaseline[]>([]), calibrationTime = useRef(0)
  const gestureState = useRef(emptyGesture()), actionRef = useRef<Record<string, () => void>>({}), nativeFocus = useRef(false)
  const ready = mode === 'camera' || mode === 'demo'

  const recalibrate = () => { baseline.current = null; samples.current = []; calibrationTime.current = 0; setCalibration(0); setBalance(null); motion.current = { ...motion.current, points: null }; counter.current.phase = 'up'; hold.current.last = 0 }
  const resetSet = (next = exercise.current) => {
    counter.current = new RepCounter(next); counter.current.range = ranges.current[next] ?? null; setReps([]); hold.current = { seconds: 0, last: 0 }; setHeld(0); setFault(null)
    motion.current = { ...motion.current, points: null }; setLabel('')
  }
  const release = useCallback(() => {
    generation.current++; cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null
    detector.current?.close(); detector.current = null
    if (video.current) { video.current.pause(); video.current.srcObject = null }
    modeRef.current = 'idle'; lastFrame.current = 0; hold.current.last = 0
  }, [])
  const exitFocus = useCallback(() => {
    setFocus(false)
    if (document.fullscreenElement === panel.current) void document.exitFullscreen().catch(() => {})
  }, [])
  useEffect(() => {
    const currentPanel = panel.current
    const changed = () => {
      if (document.fullscreenElement === currentPanel) { nativeFocus.current = true; setFocus(true) }
      else if (nativeFocus.current) { nativeFocus.current = false; setFocus(false) }
    }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') exitFocus() }
    document.addEventListener('fullscreenchange', changed); window.addEventListener('keydown', key)
    return () => {
      release(); document.removeEventListener('fullscreenchange', changed); window.removeEventListener('keydown', key)
      if (document.fullscreenElement === currentPanel) void document.exitFullscreen().catch(() => {})
    }
  }, [release, exitFocus])

  const logSet = () => {
    const rule = RULES[exercise.current], count = rule.timed ? Math.floor(hold.current.seconds) : counter.current.reps.length
    if (!count) { setMessage('No completed movement to log yet.'); return }
    if (modeRef.current === 'demo') setMessage('Demo set complete. Demo movements are not saved to workout history.')
    else { onLog(rule.liftId, count, rule.timed ? count : undefined); setMessage(`${rule.name}: ${count}${rule.timed ? ' seconds' : ' reps'} logged.`) }
    resetSet()
  }
  const finish = () => {
    const wasDemo = modeRef.current === 'demo'
    logSet(); release(); setMode('idle'); exitFocus()
    motion.current = { ...motion.current, watts: 0, left: 0, right: 0, arm: 0, points: null }; setMetrics(motion.current)
    if (!wasDemo) onFinish?.()
  }
  const change = (next: Exercise) => {
    if (next === exercise.current) return
    if (counter.current.reps.length || Math.floor(hold.current.seconds)) logSet()
    rom.current.active = false; setRomStatus('Optional: calibrate your comfortable movement range'); exercise.current = next; setEx(next); setBpm(RULES[next].bpm ?? 45); resetSet(next)
    if (RULES[next].upper && !accessible) {
      setAccessible(true); try { localStorage.setItem('bloom-coach-accessible', 'true') } catch { /* optional */ }
      recalibrate()
    }
  }
  const nextExercise = (step: number) => {
    const list = GROUPS.flatMap((g) => g.exercises).filter((id) => !accessible || RULES[id].upper)
    change(list[(list.indexOf(exercise.current) + step + list.length) % list.length])
  }
  const toggleAccessible = () => {
    const next = !accessible
    change(next ? 'seatedTwist' : 'squat'); setAccessible(next)
    try { localStorage.setItem('bloom-coach-accessible', String(next)) } catch { /* optional */ }
    recalibrate()
  }
  const enterFocus = () => {
    setFocus(true)
    // Gesture-driven entry may lack browser activation; the camera focus view still works.
    if (document.fullscreenEnabled && panel.current?.requestFullscreen) void panel.current.requestFullscreen().catch(() => {})
  }
  actionRef.current = { previous: () => nextExercise(-1), next: () => nextExercise(1), log: logSet, finish, exit: exitFocus }

  const draw = (lm: P[], mirror: boolean) => {
    const c = canvas.current, g = c?.getContext('2d'); if (!c || !g) return
    g.clearRect(0, 0, c.width, c.height)
    const X = (p: P) => (mirror ? 1 - p.x : p.x) * c.width, Y = (p: P) => p.y * c.height
    if (overlay) {
      const bones = accessible || RULES[exercise.current].upper ? UPPER_BONES : BONES
      g.lineCap = 'round'; g.lineWidth = 4
      for (const [a, b] of bones) {
        if (!visible(lm[a]) || !visible(lm[b])) continue
        g.strokeStyle = a % 2 ? '#5dffc0' : '#7df9ff'; g.beginPath(); g.moveTo(X(lm[a]), Y(lm[a])); g.lineTo(X(lm[b]), Y(lm[b])); g.stroke()
      }
      if (visible(lm[11]) && visible(lm[12]) && visible(lm[0])) {
        const middle = { x: (lm[11].x + lm[12].x) / 2, y: (lm[11].y + lm[12].y) / 2 }
        g.strokeStyle = '#5dffc0'; g.beginPath(); g.moveTo(X(lm[0]), Y(lm[0])); g.lineTo(X(middle), Y(middle)); g.lineTo(X(middle), Math.min(c.height, Y(middle) + c.height * .23)); g.stroke()
      }
      for (const i of [...new Set([0, ...bones.flat()])]) {
        if (!visible(lm[i])) continue
        g.fillStyle = i % 2 ? '#5dffc0' : '#7df9ff'; g.beginPath(); g.arc(X(lm[i]), Y(lm[i]), i === 0 ? 7 : 5, 0, Math.PI * 2); g.fill()
      }
    }
    if (gestures && mirror) for (const i of [15, 16]) if (visible(lm[i])) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(lm[i]), Y(lm[i]), 13, 0, Math.PI * 2); g.stroke() }
  }
  const frame = (raw: P[], world: P[] | undefined, at: number, mirror: boolean) => {
    const dt = lastFrame.current ? Math.min(.15, (at - lastFrame.current) / 1000) : 0; lastFrame.current = at
    if (raw.length < 33) return
    if (!filters.current.length) filters.current = raw.flatMap(() => [new OneEuroFilter(30, 1.2, .02, 1), new OneEuroFilter(30, 1.2, .02, 1), new OneEuroFilter(30, 1.2, .02, 1)])
    const upperOnly = accessible || RULES[exercise.current].upper
    const lm = raw.map((p, i) => (!upperOnly || i === 0 || (i >= 11 && i <= 22)) && Number.isFinite(p.x) && Number.isFinite(p.y) ? { ...p, x: filters.current[i * 3].filter(p.x, at / 1000), y: filters.current[i * 3 + 1].filter(p.y, at / 1000), z: filters.current[i * 3 + 2].filter(p.z ?? 0, at / 1000) } : p)
    draw(lm, mirror)
    if (upperVisible(lm)) setJointAngles({ left: Math.round(angle(lm[11], lm[13], lm[15])), right: Math.round(angle(lm[12], lm[14], lm[16])) })
    let hovered: string | null = null
    if (gestures && mirror && canvas.current && panel.current) {
      const feed = canvas.current.getBoundingClientRect()
      const hands = [15, 16, 19, 20, 21, 22].filter((i) => visible(lm[i])).map((i) => ({ x: feed.left + (1 - lm[i].x) * feed.width, y: feed.top + lm[i].y * feed.height }))
      for (const button of panel.current.querySelectorAll<HTMLButtonElement>('[data-gesture]')) {
        if (button.disabled) continue
        const box = button.getBoundingClientRect()
        if (hands.some((p) => p.x >= box.left - 4 && p.x <= box.right + 4 && p.y >= box.top - 4 && p.y <= box.bottom + 4)) { hovered = button.dataset.gesture!; break }
      }
    }
    const dwell = gestureTick(gestureState.current, hovered, dt)
    gestureState.current = dwell.state; setGesture({ id: hovered, progress: dwell.progress, latched: dwell.state.latched })
    if (dwell.action) { actionRef.current[dwell.action]?.(); return }
    const candidate = upperBaseline(lm)
    if (!baseline.current && candidate && !hovered) {
      const initial = samples.current[0]
      if (initial && (Math.abs(candidate.slope - initial.slope) > .08 || Math.abs(candidate.headOffset - initial.headOffset) > .1 || Math.abs(candidate.twist - initial.twist) > .15)) { samples.current = []; calibrationTime.current = 0 }
      samples.current.push(candidate); calibrationTime.current += dt
      setCalibration(Math.min(1, calibrationTime.current / 1.8))
      if (calibrationTime.current >= 1.8) {
        const sum = samples.current.reduce((a, b) => ({ width: a.width + b.width, slope: a.slope + b.slope, headOffset: a.headOffset + b.headOffset, twist: a.twist + b.twist }), { width: 0, slope: 0, headOffset: 0, twist: 0 })
        const n = samples.current.length
        baseline.current = { width: sum.width / n, slope: sum.slope / n, headOffset: sum.headOffset / n, twist: sum.twist / n }; setCalibration(1)
      }
    }
    setBalance(alignment(lm, baseline.current))
    const trackingValid = accessible ? upperVisible(lm) : exerciseVisible(exercise.current, lm)
    if (hovered || (accessible && !baseline.current) || !trackingValid) {
      setFault(null)
      counter.current.phase = 'up'; hold.current.last = 0
      motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current)
      setLabel(hovered ? 'Gesture control Â· counting held' : !trackingValid ? accessible ? 'Show head, shoulders and both arms' : 'Keep exercise joints visible' : 'Stay comfortably still to calibrate')
      return
    }
    const rule = RULES[exercise.current]
    const reading = rule.upper ? readUpper(exercise.current, lm, baseline.current) : read(exercise.current, lm)
    if (rom.current.active) {
      const r = rom.current; r.seconds += dt; r.low = Math.min(r.low, reading.metric); r.high = Math.max(r.high, reading.metric)
      setRomStatus(`Move gently through your comfortable range · ${Math.max(0, Math.ceil(8 - r.seconds))}s`)
      if (r.seconds >= 8) {
        r.active = false; const range = personalRange(r.low, r.high)
        ranges.current[exercise.current] = range; counter.current.range = range; counter.current.phase = 'up'
        setRomStatus(range ? `Personal range saved: ${Math.round(r.low)}–${Math.round(r.high)}° · scoring uses your range` : 'Range too small to distinguish reps. Retry or use default thresholds.')
      }
      return
    }
    setLabel(reading.label); setFault(reading.faults[0] ?? null)
    motion.current = motionTick(motion.current, lm, world, at, bodyweight, span / 100); setMetrics(motion.current)
    if (rule.timed) {
      const moving = !rule.upper || (motion.current.left + motion.current.right + motion.current.arm) > .04
      if (!reading.faults.length && moving && hold.current.last) hold.current.seconds += Math.min(.15, (at - hold.current.last) / 1000)
      hold.current.last = reading.faults.length || !moving ? 0 : at; setHeld(Math.floor(hold.current.seconds))
    } else if (counter.current.push(reading, at)) setReps([...counter.current.reps])
  }
  const frameRef = useRef(frame)
  useLayoutEffect(() => { frameRef.current = frame })

  const startCamera = async () => {
    release(); const run = generation.current
    resetSet(); recalibrate(); filters.current = []; motion.current = emptyMotion(); setMetrics(motion.current); setErr(''); setMessage(''); setMode('loading'); modeRef.current = 'loading'
    gestureState.current = emptyGesture(); setGesture({ id: null, progress: 0, latched: false })
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost.')
      const acquired = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
      if (generation.current !== run) { acquired.getTracks().forEach((track) => track.stop()); return }
      stream.current = acquired; video.current!.srcObject = acquired; await video.current!.play()
      if (generation.current !== run) return
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
      const files = await FilesetResolver.forVisionTasks(WASM)
      if (generation.current !== run) return
      let model
      try { model = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1 }) }
      catch { if (generation.current !== run) return; model = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1 }) }
      if (generation.current !== run) { model.close(); return }
      detector.current = model as unknown as Detector; setMode('camera'); modeRef.current = 'camera'
      let sampledAt = 0, videoTime = -1
      const loop = (at: number) => {
        if (generation.current !== run) return
        const v = video.current
        if (document.hidden) { hold.current.last = 0; lastFrame.current = 0; motion.current.points = null; gestureState.current = emptyGesture() }
        else if (v && v.readyState >= 2 && v.currentTime !== videoTime && at - sampledAt > 45) {
          videoTime = v.currentTime; sampledAt = at
          try {
            const result = detector.current!.detectForVideo(v, at)
            if (result.landmarks[0]) frameRef.current(result.landmarks[0], result.worldLandmarks?.[0], at, true)
            else {
              hold.current.last = 0; counter.current.phase = 'up'; gestureState.current = emptyGesture(); setGesture({ id: null, progress: 0, latched: false })
              motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current); setBalance(null); setLabel('No upper body detected Â· counting held')
              canvas.current?.getContext('2d')?.clearRect(0, 0, 640, 480)
            }
          } catch (error) { release(); setMode('idle'); setErr(`Tracking stopped: ${error instanceof Error ? error.message : 'camera unavailable'}`); return }
        } else if (at - sampledAt > 300) {
          hold.current.last = 0; counter.current.phase = 'up'; gestureState.current = emptyGesture(); setGesture({ id: null, progress: 0, latched: false })
          motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current); setBalance(null); setLabel('Camera frames paused Â· counting held')
        }
        if (generation.current === run) raf.current = requestAnimationFrame(loop)
      }
      raf.current = requestAnimationFrame(loop)
    } catch (error) {
      if (generation.current !== run) return
      release(); setMode('idle'); setErr(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Camera permission was declined. Allow access and retry, or use the demo.' : `Camera or model unavailable: ${error instanceof Error ? error.message : 'Please retry'}.`)
    }
  }
  const startDemo = () => {
    release(); const run = generation.current
    resetSet(); recalibrate(); filters.current = []; motion.current = emptyMotion(); setMetrics(motion.current); setErr(''); setMessage(''); setMode('demo'); modeRef.current = 'demo'
    const start = performance.now()
    let flowStart: number | null = null
    const loop = (at: number) => {
      if (generation.current !== run) return
      if (!document.hidden) {
        if (!baseline.current) flowStart = null
        else if (flowStart === null) flowStart = at
        const phase = RULES[exercise.current].upper ? flowStart === null ? 0 : (at - flowStart) / 4000 % 1 : at - start < 2100 ? 0 : (at - start - 2100) / 4000 % 1
        frameRef.current(demoPose(exercise.current, phase), undefined, at, false)
      } else { hold.current.last = 0; lastFrame.current = 0; motion.current.points = null }
      if (generation.current === run) raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  const control = (id: string, text: string, click: () => void) => <button type="button" data-gesture={id} onClick={() => { gestureState.current = { id, elapsed: 0, latched: true, away: 0 }; click() }} className={gesture.id === id ? 'fc-hovering' : ''} style={{ '--fc-dwell': `${gesture.id === id ? gesture.progress * 100 : 0}%` } as CSSProperties}>{text}{gesture.id === id && <small>{gesture.latched ? 'Move hand away' : `${Math.ceil(2.8 * (1 - gesture.progress))}s`}</small>}</button>
  const silentStatus = balance ? balance.alert ? 'Alignment changed from your baseline' : 'Near your calibrated baseline' : calibration < 1 ? 'Awaiting calibration' : 'Tracking unavailable'
  return <section className="fc" aria-label="Form coach">
    <header className="fc-head"><div><p className="fc-eyebrow">Form coach</p><h3>Hands-free reps, real-time form.</h3></div><CapsBadge caps={['gpu', 'mt', 'opfs']} /></header>
    <div className="fc-access-row"><button type="button" role="switch" aria-checked={accessible} aria-label="Accessible Mode" className="fc-access" onClick={toggleAccessible}><span>{accessible ? 'ON' : 'OFF'}</span> Accessible Mode</button><span>{accessible ? 'Head, torso & arms Â· lower-body landmarks ignored' : 'Full-body exercise tracking'}</span></div>
    <div className="fc-stage">
      <aside className="fc-library" aria-label="Exercise library">{GROUPS.filter((g) => !accessible || g.title !== 'Standing & Floor').map((g) => <div key={g.title}><h4>{g.title}</h4><div className="fc-ex" role="radiogroup" aria-label={g.title}>{g.exercises.map((id) => <button key={id} type="button" role="radio" aria-checked={ex === id} disabled={mode === 'loading'} className={ex === id ? 'on' : ''} onClick={() => change(id)}>{RULES[id].name}</button>)}</div></div>)}<p className="fc-small">{RULES[ex].tip}</p></aside>
      <div className="fc-center">
        <div className="fc-split"><div ref={panel} className={`fc-camera-panel ${focus ? 'fc-focused' : ''}`} aria-label="Camera training view">
          <div className="fc-view" data-matrix-native><video ref={video} className="fc-video" playsInline muted hidden={mode !== 'camera' && mode !== 'loading'} aria-label="Mirrored workout camera" /><canvas ref={canvas} className="fc-canvas" width={640} height={480} aria-label="Live skeletal joint overlay" />
            {mode === 'idle' && <p className="fc-tip">{accessible ? 'Show your head, torso and arms. No need to show your legs.' : RULES[ex].tip}</p>}
            {mode === 'loading' && <p className="fc-tip">Preparing your camera and tracking modelâ€¦</p>}
            {ready && <><span className="fc-angle">{RULES[ex].name} Â· {label}</span>{fault && <span className="fc-fault">{fault}</span>}<div className="fc-camera-controls" aria-label="Hand-hover controls">{control('previous', 'Previous', () => nextExercise(-1))}{control('next', 'Next workout', () => nextExercise(1))}{control('log', 'Log set', logSet)}{control('finish', 'Finish', finish)}{focus && control('exit', 'Exit fullscreen', exitFocus)}</div></>}
          </div>
        </div>
        <CoachReference exercise={ex} /></div>
        <div className="fc-live-angles">Your projected elbow angles: L {jointAngles.left}° · R {jointAngles.right}°</div>
        <div className="fc-asymmetry"><strong>Asymmetry Alert <small>silent Â· relative to your neutral position</small></strong><div className="fc-balance-track" role="meter" aria-label="Upper-body asymmetry" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={Math.round((balance?.value ?? 0) * 100)} aria-valuetext={silentStatus}><i style={{ left: `${50 + (balance?.value ?? 0) * 45}%`, background: balance?.alert ? '#ffd43b' : '#5dffc0' }} /></div><span>{silentStatus}</span></div>
        <p className="fc-instructions">{accessible ? 'Face camera. Calibrated for upper-body forms.' : 'Face camera. Keep the exercise joints visible.'}</p>
        <div className="fc-calibration"><span>{calibration < 1 && ready ? `Stay in your comfortable neutral position Â· ${Math.round(calibration * 100)}%` : calibration >= 1 ? 'Neutral position calibrated' : 'Calibration begins when you start'}</span><button type="button" className="fc-ghost" onClick={recalibrate} disabled={!ready}>Recalibrate</button></div>
        {!RULES[ex].timed && <div className="fc-calibration"><span role="status">{romStatus}</span><button type="button" disabled={!ready || calibration < 1} onClick={() => { rom.current = { active: true, seconds: 0, low: Infinity, high: -Infinity }; resetSet(); setRomStatus('Move through your comfortable range for 8 seconds') }}>Calibrate movement range</button></div>}
      </div>
      <div className="fc-side"><div className="fc-pacing"><RepRing count={RULES[ex].timed ? held : reps.length} target={target} timed={!!RULES[ex].timed} /><div className="fc-metronome"><strong>Rhythm Metronome</strong><div className={ready ? 'fc-beat running' : 'fc-beat'} style={{ '--fc-beat': `${60000 / bpm}ms` } as CSSProperties} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ height: `${12 + (4 - Math.abs(i - 4)) * 7}px` }} />)}</div><label>Pace <input type="number" aria-label="Metronome BPM" min="20" max="140" value={bpm} onChange={(e) => setBpm(Math.max(20, Math.min(140, Number(e.target.value) || 40)))} /> BPM</label></div></div>
        {!RULES[ex].timed && <label className="fc-target">Target reps <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>{[5, 8, 10, 12, 15, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label>}
        <div className="fc-energy" aria-label="Energy metrics"><h4>Energy Metrics {mode === 'demo' && <small>DEMO</small>}</h4><dl><div><dt>Est. Kcal</dt><dd>{metrics.kcal.toFixed(2)}</dd></div><div><dt>Active Power (W) Â· est.</dt><dd>{Math.round(metrics.watts)}</dd></div><div><dt>Motion Intensity</dt><dd>{metrics.watts > bodyweight * 1.5 ? 'High' : metrics.watts > bodyweight * .4 ? 'Moderate' : 'Low'}</dd></div><div><dt>Left / right hand Â· est. m/s</dt><dd>{metrics.left.toFixed(2)} / {metrics.right.toFixed(2)}</dd></div><div><dt>Arm velocity Â· est. m/s</dt><dd>{metrics.arm.toFixed(2)}</dd></div></dl><small>Motion-based estimates, not measured calorie burn or punch power. {metrics.source === 'world' ? 'Using model-estimated 3D coordinates.' : 'Scale estimated from shoulder span.'}</small><label>Shoulder span (cm) <input type="number" min="20" max="70" value={span} onChange={(e) => { setSpan(Math.max(20, Math.min(70, Number(e.target.value) || 40))); motion.current.points = null }} /></label></div>
        <div className="fc-settings"><label><input type="checkbox" checked={gestures} onChange={(e) => { setGestures(e.target.checked); gestureState.current = emptyGesture() }} /> Hand-hover controls</label><label><input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} /> Skeletal overlay</label><small>Hold either hand on a button for ~3 seconds. Move away to rearm. Next workout changes the exercise and logs completed reps first.</small></div>
        {mode === 'idle' ? <div className="fc-actions"><button type="button" className="fc-cta" onClick={() => void startCamera()}><Camera size={16} /> Start camera</button><button type="button" className="fc-ghost" onClick={startDemo}><Play size={16} /> Watch the demo athlete</button></div> : mode === 'loading' ? <button type="button" className="fc-ghost" onClick={() => { release(); setMode('idle') }}>Cancel camera setup</button> : <button type="button" className="fc-ghost" onClick={enterFocus}><Maximize size={16} /> Camera-only fullscreen</button>}
        {err && <p role="alert" className="fc-error">{err}</p>}<p role="status" className="fc-message">{message}</p><p className="fc-small">Video stays on your device. Tracking files download on first use.</p>
      </div>
    </div>
  </section>
}
