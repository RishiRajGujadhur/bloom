import { CoachBattle } from './CoachBattle'
import type { CoachReward } from './coachRewards'
import { setBodySeated } from '../body/bodyPreferences'
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import gsap from 'gsap'
import { OneEuroFilter } from '1eurofilter'
import { Camera, Maximize, Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { CapsBadge } from '../../platform/CapsBadge'
import { useKeepAwake } from '../../platform/presence'
import { jointCallouts, BONES, RULES, RepCounter, alignment, referencePose, exerciseVisible, read, readUpper, personalRange, loadPersonalRanges, upperBaseline, upperVisible, UPPER_BONES, visible, type Exercise, type P, type Rep, type UpperBaseline, type Lineage } from './formModel'
import { emptyGesture, emptyMotion, gestureTarget, gestureTick, motionTick, type MotionState } from './coachMetrics'
import { COACH_OPTIONS, loadCoachOptions } from './coachSettings'
import { analysisTick, emptyAnalysis, rhythmGrade, emptyFlow, flowTick, emptyBoxing, boxingTick, handForm, blockCue, emptyReaction, reactionTick, formXP, consistencyGrade, outputDrop } from './coachAnalysis'
import { readCoachHistory, saveCoachSession, recoverySuggestion, coachMarkdown, type CoachSession } from './coachHistory'
import { CoachHistoryPanel } from './CoachHistoryPanel'
import { readGhost, saveGhost, ghostFrame } from './coachReplay'
import { CoachGhost } from './CoachGhost'
import { download } from '../lab/exportSuite'
import { Sprite } from '../../rpg/Sprite'
import { CoachSecondary, calibrateDepth, fuseDepth, type DepthCalibration } from './CoachSecondary'
import { COACH_WASM, COACH_MODEL, COACH_HAND_MODEL, prepareCoachOffline } from './coachOffline'
import { CoachReplayPanel, type RepReplay } from './CoachReplayPanel'
import { CoachWearables, type SilentAlert } from './CoachWearables'
import { CoachMuscles } from './CoachMuscles'
import { frameBounds } from './coachFraming'
import { CoachTrails, type PoseFrame } from './CoachTrails'
import { COMBAT_MODES } from './cameraCombatModel'
import { CoachReference } from './CoachReference'

const WASM = COACH_WASM
const HAND_MODEL = COACH_HAND_MODEL
const MODEL = COACH_MODEL
const GROUPS: { title: string; exercises: Exercise[] }[] = [
  { title: 'Pose check', exercises: ['observe'] },
  { title: 'Seated Basic', exercises: ['seatedTwist', 'wheelchairDip', 'chairPushup', 'seatedPress', 'chestFly'] },
  { title: 'Martial Arts', exercises: ['taiChi', 'boxing', 'karate', 'kungFu'] },
  { title: 'Standing & Floor', exercises: ['chairSquat', 'squat', 'pushup', 'lunge', 'plank'] },
]
type Mode = 'idle' | 'loading' | 'camera' | 'demo'
type Mask = { width: number; height: number; getAsFloat32Array: () => Float32Array; close: () => void }
type Detector = { setOptions?: (options: { outputSegmentationMasks: boolean }) => Promise<void>; detectForVideo: (video: HTMLVideoElement, at: number) => { landmarks: P[][]; worldLandmarks?: P[][]; segmentationMasks?: Mask[]; close?: () => void }; close: () => void }
const preference = () => { try { return localStorage.getItem('bloom-coach-accessible') === 'true' } catch { return false } }
const controlPreference = (key: string) => { try { return JSON.parse(localStorage.getItem('bloom-coach-controls') ?? '{}')[key] !== false } catch { return true } }
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

export function FormCoach({ onLog, onFinish, onReward, bodyweight = 70, initialExercise, sourceActivity }: { onLog: (liftId: string, reps: number, seconds?: number) => void; onFinish?: () => void; onReward?: (reward: CoachReward) => void; bodyweight?: number; initialExercise?: Exercise; sourceActivity?: { page: string; label: string } }) {
  const [viewMode, setViewMode] = useState<'basic' | 'advanced' | 'game'>(() => { try { const value = localStorage.getItem('bloom-coach-view'); return value === 'advanced' || value === 'game' ? value : 'basic' } catch { return 'basic' } })
  const coachRoot = useRef<HTMLElement>(null)
  const [gameActivity, setGameActivity] = useState<import('./cameraCombatModel').CombatMode | ''>('')
  const [corrections, setCorrections] = useState(true)
  const [background, setBackground] = useState<'dim' | 'black'>(() => { try { return localStorage.getItem('bloom-coach-background') === 'black' ? 'black' : 'dim' } catch { return 'dim' } })
  const latestBackground = useRef(background); latestBackground.current = background
  const [backgroundReady, setBackgroundReady] = useState(false)
  useEffect(() => { try { localStorage.setItem('bloom-coach-background', background) } catch { /* optional */ } }, [background])
  const [countdown, setCountdown] = useState(3)
  const countdownElapsed = useRef(0)
  const [useCountdown, setUseCountdown] = useState(true)
  const [encouragement, setEncouragement] = useState(true)
  const [workoutPaused, setWorkoutPaused] = useState(false)
  const [controlPage, setControlPage] = useState(0)
  const [compactControls, setCompactControls] = useState(false)
  const controlsPerPage = compactControls ? 1 : 3
  const controlPages = 6 / controlsPerPage
  const [finishPending, setFinishPending] = useState(false)
  const [holdSeconds, setHoldSeconds] = useState(() => { try { const value = Number(localStorage.getItem('bloom-coach-hold')); return [2, 2.8, 4, 5].includes(value) ? value : 2.8 } catch { return 2.8 } })
  const [controlSide, setControlSide] = useState<'left' | 'right'>(() => { try { return localStorage.getItem('bloom-coach-reach') === 'right' ? 'right' : 'left' } catch { return 'left' } })
  useEffect(() => { try { localStorage.setItem('bloom-coach-hold', String(holdSeconds)); localStorage.setItem('bloom-coach-reach', controlSide) } catch { /* optional */ } }, [holdSeconds, controlSide])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [settingsSearch, setSettingsSearch] = useState('')
  const [showReference, setShowReference] = useState(true)
  const [showAlignment, setShowAlignment] = useState(false)
  useEffect(() => { try { localStorage.setItem('bloom-coach-view', viewMode) } catch { /* optional */ } }, [viewMode])
  const [options, setOptions] = useState(loadCoachOptions)
  useEffect(() => { try { localStorage.setItem('bloom-coach-settings-v1', JSON.stringify(options)) } catch { /* optional */ } }, [options])
  const [accessible, setAccessible] = useState(() => initialExercise && initialExercise !== 'observe' && RULES[initialExercise].upper ? true : preference())
  const [ex, setEx] = useState<Exercise>(() => initialExercise ?? (preference() ? 'seatedTwist' : 'squat'))
  const [mode, setMode] = useState<Mode>('idle')
  const [reps, setReps] = useState<Rep[]>([])
  const [held, setHeld] = useState(0)
  const [fault, setFault] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [err, setErr] = useState('')
  const [message, setMessage] = useState('')
  const [framing, setFraming] = useState({ scale: 1, x: 0, y: 0 })
  const [trackingPaused, setTrackingPaused] = useState(false)
  const [calibration, setCalibration] = useState(0)
  const [balance, setBalance] = useState<ReturnType<typeof alignment>>(null)
  const [metrics, setMetrics] = useState<MotionState>(emptyMotion)
  const [gesture, setGesture] = useState({ id: null as string | null, progress: 0, latched: false })
  const [gestures, setGestures] = useState(() => controlPreference('gestures'))
  const [overlay, setOverlay] = useState(() => controlPreference('overlay'))
  useEffect(() => { try { localStorage.setItem('bloom-coach-controls', JSON.stringify({ gestures, overlay })) } catch { /* optional */ } }, [gestures, overlay])
  const [focus, setFocus] = useState(false)
  const [target, setTarget] = useState(10)
  const [bpm, setBpm] = useState(45)
  const [colors, setColors] = useState(() => { try { const value = JSON.parse(localStorage.getItem('bloom-coach-colors') ?? '{}'); return { left: /^#[0-9a-f]{6}$/i.test(value.left) ? value.left : '#5dffc0', right: /^#[0-9a-f]{6}$/i.test(value.right) ? value.right : '#7df9ff' } } catch { return { left: '#5dffc0', right: '#7df9ff' } } })
  useEffect(() => { try { localStorage.setItem('bloom-coach-colors', JSON.stringify(colors)) } catch { /* optional */ } }, [colors])
  const [span, setSpan] = useState(40)
  const [offlineStatus, setOfflineStatus] = useState('Prepare once while online to cache camera tracking files')
  const [preparingOffline, setPreparingOffline] = useState(false)
  const sidePose = useRef<{ at: number; pose: P[] } | null>(null), depth = useRef<DepthCalibration | null>(null), frontPose = useRef<P[]>([])
  const [depthStatus, setDepthStatus] = useState('Single-camera depth estimates')
  const [depthDirection, setDepthDirection] = useState(1)
  const [ghostKind, setGhostKind] = useState<'form' | 'power'>('form')
  const [ghost, setGhost] = useState(() => readGhost(ex, 'form'))
  useEffect(() => { setGhost(readGhost(ex, ghostKind)) }, [ex, ghostKind, mode])
  const [history, setHistory] = useState(readCoachHistory)
  const [worstRep, setWorstRep] = useState<RepReplay | null>(null)
  const worst = useRef<RepReplay | null>(null), repStarted = useRef(0)
  const timedXP = useRef({ good: 0, total: 0, streak: 0 })
  const [flowXP, setFlowXP] = useState(0)
  const activity = useRef({ active: 0, rest: 0, powers: [] as number[], early: [] as number[], recent: [] as number[] })
  const compensation = useRef({ frames: 0, changed: 0 })
  const reaction = useRef(emptyReaction())
  const [drill, setDrill] = useState(emptyReaction)
  const handDetector = useRef<{ detectForVideo: (video: HTMLVideoElement, at: number) => { landmarks: P[][] }; close: () => void } | null>(null)
  const [handTarget, setHandTarget] = useState<'open' | 'fist' | 'claw'>('open')
  const [handScores, setHandScores] = useState<ReturnType<typeof handForm>[]>([])
  const [handStatus, setHandStatus] = useState('Detailed hand tracking is optional')
  const [block, setBlock] = useState('')
  const boxing = useRef(emptyBoxing())
  const [strikes, setStrikes] = useState(emptyBoxing)
  const [lead, setLead] = useState<'left' | 'right'>('left')
  const [lineage, setLineage] = useState<Lineage>('Yang')
  const flow = useRef(emptyFlow())
  const [flowScore, setFlowScore] = useState<number | null>(null)
  const analysis = useRef(emptyAnalysis())
  const [combat, setCombat] = useState(emptyAnalysis)
  const frames = useRef<PoseFrame[]>([])
  const [trailFrames, setTrailFrames] = useState<PoseFrame[]>([])
  const [jointAngles, setJointAngles] = useState(() => jointCallouts([]))
  const [romStatus, setRomStatus] = useState('Optional: calibrate your comfortable movement range')
  const rom = useRef({ active: false, seconds: 0, low: Infinity, high: -Infinity })
  const ranges = useRef(loadPersonalRanges())
  useKeepAwake(!options.battery && (mode === 'camera' || mode === 'demo'))
  const [routine, setRoutine] = useState<{ exercise: Exercise; amount: number }[]>([{ exercise: 'boxing', amount: 10 }, { exercise: 'taiChi', amount: 60 }, { exercise: 'seatedTwist', amount: 10 }])
  const [routineIndex, setRoutineIndex] = useState(-1)
  const routineRef = useRef({ steps: routine, index: routineIndex }); routineRef.current = { steps: routine, index: routineIndex }
  const wearableAlert = useRef<(kind: SilentAlert) => void>(() => {})
  const receiveWearable = useCallback((notify: (kind: SilentAlert) => void) => { wearableAlert.current = notify }, [])
  const goalAlerted = useRef(false)
  const maskCanvas = useRef<HTMLCanvasElement>(null)
  const latestOptions = useRef(options); latestOptions.current = options
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), panel = useRef<HTMLDivElement>(null)
  const detector = useRef<Detector | null>(null), stream = useRef<MediaStream | null>(null)
  const generation = useRef(0), raf = useRef(0), modeRef = useRef<Mode>('idle'), exercise = useRef(ex)
  const counter = useRef(new RepCounter(ex)), filters = useRef<OneEuroFilter[]>([])
  const hold = useRef({ seconds: 0, last: 0 }), lastFrame = useRef(0), motion = useRef(emptyMotion())
  const baseline = useRef<UpperBaseline | null>(null), samples = useRef<UpperBaseline[]>([]), calibrationTime = useRef(0)
  const gestureState = useRef(emptyGesture()), actionRef = useRef<Record<string, () => void>>({}), nativeFocus = useRef(false)
  const ready = mode === 'camera' || mode === 'demo'
  useEffect(() => { if (mode === 'camera') void detector.current?.setOptions?.({ outputSegmentationMasks: options.dimming && !options.battery }).catch(() => setErr('Background focus could not start on this device.')) }, [mode, options.dimming, options.battery])

  useEffect(() => { counter.current.range = ranges.current[exercise.current] ?? null }, [])
  useEffect(() => {
    const pause = () => { if (modeRef.current !== 'idle') actionRef.current.confirmFinish?.() }
    window.addEventListener('bloom-body-coach-open', pause)
    return () => window.removeEventListener('bloom-body-coach-open', pause)
  }, [])
  const recalibrate = () => { baseline.current = null; samples.current = []; calibrationTime.current = 0; setCalibration(0); setBalance(null); motion.current = { ...motion.current, points: null }; counter.current.phase = 'up'; hold.current.last = 0 }
  const resetSet = (next = exercise.current) => {
    setFinishPending(false); setControlPage(0)
    countdownElapsed.current = 0; setCountdown(3); setWorkoutPaused(false)
    boxing.current = emptyBoxing(); setStrikes(boxing.current); flow.current = emptyFlow(); setFlowScore(null); analysis.current = emptyAnalysis(); setCombat(analysis.current); reaction.current = emptyReaction(); setDrill(reaction.current); worst.current = null; repStarted.current = 0; frames.current = []; setTrailFrames([]); goalAlerted.current = false; counter.current = new RepCounter(next); counter.current.range = ranges.current[next] ?? null; setReps([]); hold.current = { seconds: 0, last: 0 }; setHeld(0); setFault(null)
    motion.current = emptyMotion(); setMetrics(motion.current); activity.current = { active: 0, rest: 0, powers: [], early: [], recent: [] }; compensation.current = { frames: 0, changed: 0 }; timedXP.current = { good: 0, total: 0, streak: 0 }; setFlowXP(0); setLabel('')
  }
  const release = useCallback(() => {
    generation.current++; cancelAnimationFrame(raf.current)
    stream.current?.getTracks().forEach((track) => track.stop()); stream.current = null
    handDetector.current?.close(); handDetector.current = null; setHandScores([])
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

  useEffect(() => { if (mode === 'camera') void stream.current?.getVideoTracks()[0]?.applyConstraints({ width: options.battery ? 480 : 640, height: options.battery ? 360 : 480, frameRate: options.battery ? 15 : 30 }).catch(() => {}) }, [mode, options.battery])
  const logSet = () => {
    const rule = RULES[exercise.current], count = rule.timed ? Math.floor(hold.current.seconds) : counter.current.reps.length
    if (!count) { setMessage('No completed movement to log yet.'); return }
    if (modeRef.current === 'demo') setMessage('Demo set complete. Demo movements are not saved to workout history.')
    else {
      const m = motion.current, stats = counter.current.reps
      const session: CoachSession = { id: crypto.randomUUID(), exercise: exercise.current, at: Date.now(), seconds: m.seconds, reps: rule.timed ? 0 : count, score: exercise.current === 'observe' ? 0 : rule.timed ? flow.current.score ?? 0 : stats.reduce((sum, rep) => sum + rep.score, 0) / Math.max(1, stats.length), joules: m.joules, kcal: m.kcal, power: m.seconds ? m.joules / m.seconds : 0, peak: m.peak, leftWork: m.leftWork, rightWork: m.rightWork, leftAngle: jointAngles.left ?? 0, rightAngle: jointAngles.right ?? 0, range: ranges.current[exercise.current] ?? null, compensation: compensation.current.changed / Math.max(1, compensation.current.frames) }
      if (sourceActivity) { session.sourcePage = sourceActivity.page.slice(0, 40); session.activity = sourceActivity.label.slice(0, 120) }
      if (options.ghost && exercise.current !== 'observe') { try { saveGhost(exercise.current, frames.current, session.score, session.power); setGhost(readGhost(exercise.current, ghostKind)) } catch { setErr('Ghost storage is full; set metrics are still logged.') } }
      if (options.haptics) wearableAlert.current('set')
      session.damage = options.rpg && exercise.current !== 'observe' ? Math.floor(m.joules / 10) : 0
      session.xp = options.xp && exercise.current !== 'observe' ? rule.timed ? timedXP.current.total : formXP(stats).xp : 0
      onReward?.({ id: session.id, damage: session.damage, xp: session.xp })
      try { setHistory(saveCoachSession(session)) } catch { setErr('History storage is full. Export and clear old sets to make room.') }
      onLog(rule.liftId, count, rule.timed ? count : undefined); setMessage(`${rule.name}: ${count}${rule.timed ? ' seconds' : ' reps'} logged.`) }
    resetSet()
  }
  const finish = () => {
    setRoutineIndex(-1)
    const wasDemo = modeRef.current === 'demo'
    logSet(); release(); setMode('idle'); exitFocus()
    motion.current = { ...motion.current, watts: 0, left: 0, right: 0, arm: 0, points: null }; setMetrics(motion.current)
    if (!wasDemo) onFinish?.()
  }
  const change = (next: Exercise, chained = false) => {
    if (!chained) setRoutineIndex(-1)
    if (next === exercise.current) return
    if (counter.current.reps.length || Math.floor(hold.current.seconds)) logSet()
    rom.current.active = false; setRomStatus('Optional: calibrate your comfortable movement range'); exercise.current = next; setEx(next); setBpm(RULES[next].bpm ?? 45); resetSet(next)
    if (RULES[next].upper && !accessible) {
      setAccessible(true); setBodySeated(true)
      recalibrate()
    }
  }
  const advanceRoutine = () => {
    const state = routineRef.current
    if (state.index < 0) return
    const next = state.index + 1
    if (next >= state.steps.length) { setRoutineIndex(-1); finish(); setMessage('Routine complete. Real camera sets are saved; demo sets are never saved.'); return }
    logSet(); change(state.steps[next].exercise, true); setRoutineIndex(next); setMessage(`Routine step ${next + 1}: ${RULES[state.steps[next].exercise].name}`)
  }
  const setThreshold = (key: 'down' | 'up', value: number) => {
    const rule = RULES[ex], saved = ranges.current[ex], range = { low: saved?.low ?? Math.max(0, rule.down - 25), high: saved?.high ?? 180, down: saved?.down ?? rule.down, up: saved?.up ?? rule.up, [key]: value }
    if (!Number.isFinite(value) || range.low > range.down || range.down + 5 >= range.up || range.up > range.high) { setRomStatus('Triggers need at least a 5° gap inside your comfortable range.'); return }
    ranges.current[ex] = range; counter.current.range = range; counter.current.phase = 'up'; try { localStorage.setItem('bloom-coach-ranges-v1', JSON.stringify(ranges.current)) } catch { /* optional */ }; setRomStatus('Personal rep triggers saved')
  }
  const nextExercise = (step: number) => {
    const list = GROUPS.flatMap((g) => g.exercises).filter((id) => !accessible || RULES[id].upper)
    change(list[(list.indexOf(exercise.current) + step + list.length) % list.length])
  }
  const toggleAccessible = () => {
    const next = !accessible
    change(next ? 'seatedTwist' : 'squat'); setAccessible(next)
    setBodySeated(next)
    recalibrate()
  }
  const enterFocus = () => {
    setFocus(true)
    // Gesture-driven entry may lack browser activation; the camera focus view still works.
    if (document.fullscreenEnabled && panel.current?.requestFullscreen) void panel.current.requestFullscreen().catch(() => {})
  }
  const requestFinish = () => { setFinishPending(true); setWorkoutPaused(true); setControlPage(0) }
  const continueWorkout = () => { setFinishPending(false); setWorkoutPaused(false) }
  actionRef.current = { confirmFinish: finish, continueWorkout, previous: () => nextExercise(-1), next: () => nextExercise(1), log: logSet, finish: requestFinish, exit: exitFocus, fullscreen: enterFocus, routineNext: advanceRoutine, menuBack: () => setControlPage(value => Math.max(0, value - 1)), menuNext: () => setControlPage(value => Math.min(controlPages - 1, value + 1)) }

  const draw = (lm: P[], mirror: boolean) => {
    const c = canvas.current, g = c?.getContext('2d'); if (!c || !g) return
    g.clearRect(0, 0, c.width, c.height)
    const X = (p: P) => (mirror ? 1 - p.x : p.x) * c.width, Y = (p: P) => p.y * c.height
    if (overlay) {
      const bones = accessible || RULES[exercise.current].upper ? UPPER_BONES : BONES
      g.lineCap = 'round'; g.lineWidth = options.contrast ? 7 : 4
      for (const [a, b] of bones) {
        if (!visible(lm[a]) || !visible(lm[b])) continue
        g.strokeStyle = corrections && fault ? '#ff5656' : a % 2 ? colors.left : colors.right; g.beginPath(); g.moveTo(X(lm[a]), Y(lm[a])); g.lineTo(X(lm[b]), Y(lm[b])); g.stroke()
      }
      if (visible(lm[11]) && visible(lm[12]) && visible(lm[0])) {
        const middle = { x: (lm[11].x + lm[12].x) / 2, y: (lm[11].y + lm[12].y) / 2 }
        g.strokeStyle = corrections && fault ? '#ff5656' : '#5dffc0'; g.beginPath(); g.moveTo(X(lm[0]), Y(lm[0])); g.lineTo(X(middle), Y(middle)); g.lineTo(X(middle), Math.min(c.height, Y(middle) + c.height * .23)); g.stroke()
      }
      for (const i of [...new Set([0, ...bones.flat()])]) {
        if (!visible(lm[i])) continue
        g.fillStyle = corrections && fault ? '#ff5656' : i % 2 ? colors.left : colors.right; g.beginPath(); g.arc(X(lm[i]), Y(lm[i]), options.contrast ? 8 : i === 0 ? 7 : 5, 0, Math.PI * 2); g.fill()
      }
    }
    if (gestures && mirror && viewMode !== 'basic') for (const i of [15, 16]) if (visible(lm[i])) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(X(lm[i]), Y(lm[i]), 13, 0, Math.PI * 2); g.stroke() }
  }
  const frame = (raw: P[], world: P[] | undefined, at: number, mirror: boolean) => {
    const dt = lastFrame.current ? Math.min(.15, (at - lastFrame.current) / 1000) : 0; lastFrame.current = at
    if (raw.length < 33) return
    frontPose.current = raw; raw = fuseDepth(raw, sidePose.current, depth.current, at)
    if (!filters.current.length) filters.current = raw.flatMap(() => [new OneEuroFilter(30, 1.2, .02, 1), new OneEuroFilter(30, 1.2, .02, 1), new OneEuroFilter(30, 1.2, .02, 1)])
    const upperOnly = accessible || RULES[exercise.current].upper
    const lm = raw.map((p, i) => (!upperOnly || i === 0 || (i >= 11 && i <= 22)) && Number.isFinite(p.x) && Number.isFinite(p.y) ? { ...p, x: filters.current[i * 3].filter(p.x, at / 1000), y: filters.current[i * 3 + 1].filter(p.y, at / 1000), z: filters.current[i * 3 + 2].filter(p.z ?? 0, at / 1000) } : p)
    if (options.autoFrame) { const bounds = frameBounds(lm, mirror); if (bounds) setFraming(bounds) }
    draw(lm, mirror)
    setJointAngles(jointCallouts(lm))
    let hovered: string | null = null, ambiguous = false
    if (gestures && mirror && canvas.current && panel.current) {
      const feed = canvas.current.getBoundingClientRect()
      const hands = [15, 16].filter((i) => visible(lm[i]) && (lm[i].visibility ?? 1) >= .7).map((i) => ({ x: feed.left + (1 - lm[i].x) * feed.width, y: feed.top + lm[i].y * feed.height }))
      const targets = [...panel.current.querySelectorAll<HTMLButtonElement>('[data-gesture]')].filter(button => !button.disabled).map(button => { const box = button.getBoundingClientRect(); return { id: button.dataset.gesture!, left: box.left, right: box.right, top: box.top, bottom: box.bottom } })
      const selection = gestureTarget(hands, targets)
      hovered = selection.id; ambiguous = selection.ambiguous
    }
    actionRef.current.pauseWorkout = () => setWorkoutPaused(value => !value)
    const dwell = ambiguous ? { state: { ...gestureState.current, id: null, elapsed: 0, away: 0 }, action: null, progress: 0 } : gestureTick(gestureState.current, hovered, dt, holdSeconds)
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
    const aligned = alignment(lm, baseline.current); setBalance(aligned)
    const trackingValid = accessible ? upperVisible(lm) : exerciseVisible(exercise.current, lm)
    setTrackingPaused(!trackingValid)
    if (workoutPaused || hovered || ambiguous || (accessible && !baseline.current) || !trackingValid) {
      setFault(null)
      counter.current.phase = 'up'; hold.current.last = 0
      motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current)
      setLabel(workoutPaused ? 'Workout paused' : hovered ? 'Gesture control · counting held' : !trackingValid ? accessible ? 'Show head, shoulders and both arms' : 'Keep exercise joints visible' : 'Stay comfortably still to calibrate')
      return
    }
    countdownElapsed.current = Math.min(3, countdownElapsed.current + dt)
    const remaining = Math.max(0, 3 - Math.floor(countdownElapsed.current)); setCountdown(useCountdown ? remaining : 0)
    if (useCountdown && remaining > 0) { counter.current.phase = "up"; hold.current.last = 0; return }
    compensation.current.frames++; if (aligned?.alert) compensation.current.changed++
    const rule = RULES[exercise.current]
    const reading = rule.upper ? readUpper(exercise.current, lm, baseline.current) : read(exercise.current, lm)
    if (rule.upper && aligned?.alert) reading.faults.push('Alignment changed from your neutral baseline')
    if (rom.current.active) {
      const r = rom.current; r.seconds += dt; r.low = Math.min(r.low, reading.metric); r.high = Math.max(r.high, reading.metric)
      setRomStatus(`Move gently through your comfortable range · ${Math.max(0, Math.ceil(8 - r.seconds))}s`)
      if (r.seconds >= 8) {
        r.active = false; const range = personalRange(r.low, r.high)
        ranges.current[exercise.current] = range; try { localStorage.setItem('bloom-coach-ranges-v1', JSON.stringify(ranges.current)) } catch { setErr('Personal range could not be saved to this browser.') }; counter.current.range = range; counter.current.phase = 'up'
        setRomStatus(range ? `Personal range saved: ${Math.round(r.low)}–${Math.round(r.high)}° · scoring uses your range` : 'Range too small to distinguish reps. Retry or use default thresholds.')
      }
      return
    }
    if (options.reaction) { reaction.current = reactionTick(reaction.current, lm, frames.current.at(-1)?.pose, at); setDrill(reaction.current) }
    frames.current.push({ at, pose: lm.map(p => ({ ...p })), score: Math.max(0, 100 - reading.faults.length * 25) }); frames.current = frames.current.filter(frame => at - frame.at <= 15000).slice(-300)
    setTrailFrames(frames.current.slice(-24))
    if (exercise.current === 'karate') setBlock(blockCue(lm))
    if (options.haptics && aligned?.alert) wearableAlert.current('form')
    setLabel(reading.label)
    motion.current = motionTick(motion.current, lm, depth.current && sidePose.current && at - sidePose.current.at < 150 ? undefined : world, at, bodyweight, span / 100, accessible || !!RULES[exercise.current].upper); setMetrics(motion.current)
    const previousStrikeAt = boxing.current.lastStrike
    if (exercise.current === 'boxing') { boxing.current = boxingTick(boxing.current, lm, at, lead, counter.current.range?.up ?? 150); setStrikes(boxing.current); if (options.guard && !boxing.current.guard && motion.current.left + motion.current.right > .3) reading.faults.push('Return the other hand to your comfortable guard') }
    setFault(reading.faults[0] ?? null)
    const speed = Math.max(motion.current.left, motion.current.right)
    if (speed > .04) { activity.current.active += dt; activity.current.powers = [...activity.current.powers, motion.current.watts].slice(-120); if (activity.current.early.length < 60) activity.current.early.push(speed); activity.current.recent = [...activity.current.recent, speed].slice(-60) } else activity.current.rest += dt
    flow.current = flowTick(flow.current, motion.current); setFlowScore(flow.current.score)
    analysis.current = analysisTick(analysis.current, lm, motion.current, at); setCombat(analysis.current)
    if (rule.timed) {
      if (exercise.current !== 'observe' && options.xp && (flow.current.score ?? 0) >= 90 && !aligned?.alert) { timedXP.current.good += dt; if (timedXP.current.good >= 5) { timedXP.current.good -= 5; timedXP.current.streak++; timedXP.current.total = Math.min(500, timedXP.current.total + Math.round(5 * Math.min(4, 1.25 ** (timedXP.current.streak - 1)))); setFlowXP(timedXP.current.total) } } else { timedXP.current.good = 0; timedXP.current.streak = 0 }
      const moving = !rule.upper || (motion.current.left + motion.current.right + motion.current.arm) > .04
      if (!reading.faults.length && moving && hold.current.last) hold.current.seconds += Math.min(.15, (at - hold.current.last) / 1000)
      hold.current.last = reading.faults.length || !moving ? 0 : at; setHeld(Math.floor(hold.current.seconds))
    } else {
      const phase = counter.current.phase
      const rep = exercise.current === 'boxing' ? boxing.current.lastStrike > previousStrikeAt ? { at, depth: Math.round(reading.metric), faults: [...reading.faults], score: Math.max(0, 100 - reading.faults.length * 25) } : null : counter.current.push(reading, at)
      if (exercise.current === 'boxing' && rep) { counter.current.reps.push(rep); counter.current.phase = 'up' }
      if (phase === 'up' && counter.current.phase === 'down') repStarted.current = at - 300
      if (rep) {
        setReps([...counter.current.reps])
        if (options.haptics && !goalAlerted.current && counter.current.reps.length >= target) { goalAlerted.current = true; wearableAlert.current('goal') }
        if (options.replay && (!worst.current || rep.score < worst.current.score)) {
          worst.current = { exercise: exercise.current, score: rep.score, frames: frames.current.filter(frame => frame.at >= repStarted.current).slice(-120), compensation: compensation.current.changed / Math.max(1, compensation.current.frames) }; setWorstRep(worst.current)
        }
      }
    }
    const routineState = routineRef.current, amount = rule.timed ? Math.floor(hold.current.seconds) : counter.current.reps.length
    if (options.routine && routineState.index >= 0 && amount >= (routineState.steps[routineState.index]?.amount ?? Infinity)) actionRef.current.routineNext?.()
  }
  const frameRef = useRef(frame)
  useLayoutEffect(() => { frameRef.current = frame })

  const handSample = useRef(0), handTargetRef = useRef(handTarget)
  handTargetRef.current = handTarget
  const enableHands = async () => {
    const run = generation.current; setHandStatus('Preparing detailed hand tracking…')
    try {
      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      const files = await FilesetResolver.forVisionTasks(WASM)
      const model = await HandLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: HAND_MODEL, delegate: 'CPU' }, runningMode: 'VIDEO', numHands: 2 })
      if (run !== generation.current) { model.close(); return }
      handDetector.current?.close(); handDetector.current = model; setHandStatus('Detailed finger tracking ready')
    } catch { if (run === generation.current) setHandStatus('Hand model unavailable. Body tracking continues.') }
  }
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
      try { model = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: options.dimming && !options.battery }) }
      catch { if (generation.current !== run) return; model = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1, outputSegmentationMasks: options.dimming && !options.battery }) }
      if (generation.current !== run) { model.close(); return }
      detector.current = model as unknown as Detector; setTrackingPaused(false); setMode('camera'); modeRef.current = 'camera'
      let sampledAt = 0, videoTime = -1
      const loop = (at: number) => {
        if (generation.current !== run) return
        const v = video.current
        if (document.hidden) { hold.current.last = 0; lastFrame.current = 0; motion.current.points = null; gestureState.current = emptyGesture() }
        else if (v && v.readyState >= 2 && v.currentTime !== videoTime && at - sampledAt > (latestOptions.current.battery ? 100 : ['taiChi', 'kungFu'].includes(exercise.current) ? 30 : 45)) {
          videoTime = v.currentTime; sampledAt = at
          try {
            const result = detector.current!.detectForVideo(v, at)
            try {
              const mask = result.segmentationMasks?.[0], canvas = maskCanvas.current
              setBackgroundReady(!!mask); if (!mask && canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
              if (mask && canvas && latestOptions.current.dimming) {
                canvas.width = mask.width; canvas.height = mask.height
                const context = canvas.getContext('2d'), data = mask.getAsFloat32Array()
                if (context) { const image = context.createImageData(mask.width, mask.height); for (let i = 0; i < data.length; i++) image.data[i * 4 + 3] = Math.round((1 - Math.max(0, Math.min(1, data[i]))) * (latestBackground.current === 'black' ? 255 : 190)); context.putImageData(image, 0, 0) }
              } else canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
            } finally { if (result.close) result.close(); else result.segmentationMasks?.forEach(mask => mask.close()) }
            if (handDetector.current && !latestOptions.current.battery && exercise.current === 'kungFu' && at - handSample.current > 100) { try { handSample.current = at; setHandScores(handDetector.current.detectForVideo(v, at).landmarks.map(hand => handForm(hand, handTargetRef.current))) } catch { handDetector.current.close(); handDetector.current = null; setHandScores([]); setHandStatus('Finger tracking stopped. Body tracking continues; retry when ready.') } }
            if (result.landmarks[0]?.length >= 33) frameRef.current(result.landmarks[0], result.worldLandmarks?.[0], at, true)
            else {
              hold.current.last = 0; counter.current.phase = 'up'; gestureState.current = emptyGesture(); setGesture({ id: null, progress: 0, latched: false })
              motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current); setBalance(null); setTrackingPaused(true); lastFrame.current = 0; setLabel('No upper body detected · counting held')
              canvas.current?.getContext('2d')?.clearRect(0, 0, 640, 480)
            }
          } catch (error) { release(); setMode('idle'); setErr(`Tracking stopped: ${error instanceof Error ? error.message : 'camera unavailable'}`); return }
        } else if (at - sampledAt > 300) {
          hold.current.last = 0; counter.current.phase = 'up'; gestureState.current = emptyGesture(); setGesture({ id: null, progress: 0, latched: false })
          motion.current = { ...motion.current, points: null, left: 0, right: 0, arm: 0, watts: 0 }; setMetrics(motion.current); setBalance(null); setTrackingPaused(true); lastFrame.current = 0; setLabel('Camera frames paused · counting held')
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
    resetSet(); recalibrate(); filters.current = []; motion.current = emptyMotion(); setMetrics(motion.current); setErr(''); setMessage(''); setTrackingPaused(false); setMode('demo'); modeRef.current = 'demo'
    const start = performance.now()
    let flowStart: number | null = null
    const loop = (at: number) => {
      if (generation.current !== run) return
      if (!document.hidden) {
        if (!baseline.current) flowStart = null
        else if (flowStart === null) flowStart = at
        const phase = RULES[exercise.current].upper ? flowStart === null ? 0 : (at - flowStart) / 4000 % 1 : at - start < 2100 ? 0 : (at - start - 2100) / 4000 % 1
        frameRef.current(referencePose(exercise.current, phase, lineage), undefined, at, false)
      } else { hold.current.last = 0; lastFrame.current = 0; motion.current.points = null }
      if (generation.current === run) raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  const referenceVisible = viewMode === "game" || showReference && (viewMode !== "advanced" || options.reference) && ex !== "observe"
  useEffect(() => {
    if (!canvas.current) return
    let wasCompact = false
    const update = () => { const compact = canvas.current!.getBoundingClientRect().width < 330; if (compact !== wasCompact) { wasCompact = compact; setCompactControls(compact); setControlPage(0) } }
    const observer = new ResizeObserver(update); observer.observe(canvas.current); update()
    return () => observer.disconnect()
  }, [])
  const control = (id: string, text: string, click: () => void) => <button type="button" data-gesture={id} onClick={() => { gestureState.current = { id, elapsed: 0, latched: true, away: 0 }; click() }} className={gesture.id === id ? 'fc-hovering' : ''} style={{ '--fc-dwell': `${gesture.id === id ? gesture.progress * 100 : 0}%` } as CSSProperties}>{text}{gesture.id === id && <svg className="fc-dwell-ring" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="11" fill="none" stroke="#ffffff30" strokeWidth="3" /><circle cx="14" cy="14" r="11" fill="none" stroke="#5dffc0" strokeWidth="3" strokeDasharray={`${gesture.progress * 69.12} 69.12`} transform="rotate(-90 14 14)" /></svg>}{gesture.id === id && <small>{gesture.latched ? 'Move hand away' : `${Math.ceil(holdSeconds * (1 - gesture.progress))}s`}</small>}</button>
  const silentStatus = balance ? balance.alert ? 'Alignment changed from your baseline' : 'Near your calibrated baseline' : calibration < 1 ? 'Awaiting calibration' : 'Tracking unavailable'
  return <section ref={coachRoot} className={`fc fc-mode-${viewMode} ${options.dimming && background === 'black' ? 'fc-background-black' : ''}`} aria-label="Form coach">
    <header className="fc-head"><div><p className="fc-eyebrow">Form coach</p><h3>Hands-free reps, real-time form.</h3></div><CapsBadge caps={['gpu', 'mt', 'opfs']} /></header>
    <div className="fc-view-modes" role="group" aria-label="Coach experience">{(['basic', 'advanced', 'game'] as const).map(value => <button type="button" key={value} aria-pressed={viewMode === value} onClick={() => setViewMode(value)}>{value === 'basic' ? 'Basic' : value === 'advanced' ? 'Advanced' : 'Game'}</button>)}</div>
    {viewMode === 'advanced' && <div className="fc-section-actions"><button type="button" onClick={() => coachRoot.current?.querySelectorAll('details').forEach(section => { section.open = false })}>Collapse sections</button><button type="button" onClick={() => coachRoot.current?.querySelectorAll('details').forEach(section => { if (section.querySelector('summary')?.textContent !== 'Pose check') section.open = true })}>Expand sections</button></div>}
    <label className="fc-workout-selection">Selected workout <select value={ex} disabled={mode === 'loading' || viewMode === "game" && !!gameActivity} onChange={event => change(event.target.value as Exercise)}>{Object.entries(RULES).filter(([id, rule]) => id !== 'observe' && (!accessible || rule.upper)).map(([id, rule]) => <option key={id} value={id}>{rule.name}</option>)}{ex === 'observe' && <option value="observe">Pose observation</option>}</select></label><details className="fc-quick-options"><summary>Workout options</summary><div className="fc-essentials"><label>Camera background <select aria-label="Camera background" value={options.dimming ? background : "original"} onChange={event => { const value = event.target.value; if (value !== "original") setBackground(value as "dim" | "black"); setOptions(previous => ({ ...previous, dimming: value !== "original", battery: value !== "original" ? false : previous.battery })) }}><option value="original">Original</option><option value="dim">Dim room</option><option value="black">Black background</option></select></label><button type="button" disabled={mode === "loading"} onClick={() => { change("boxing"); setViewMode("basic") }}>Air boxing</button><label><input type="checkbox" checked={viewMode === "game" || showReference} disabled={viewMode === "game"} onChange={event => setShowReference(event.target.checked)} /> Show reference</label><button type="button" aria-expanded={libraryOpen} onClick={() => setLibraryOpen(value => !value)}>Exercise library</button><label><input type="checkbox" checked={showAlignment} onChange={event => setShowAlignment(event.target.checked)} /> Alignment feedback</label></div></details>
    <div className="fc-access-row"><button type="button" role="switch" aria-checked={accessible} aria-label="Accessible Mode" className="fc-access" onClick={toggleAccessible}><span>{accessible ? 'ON' : 'OFF'}</span> Accessible Mode</button><span>{accessible ? 'Head, torso & arms · lower-body landmarks ignored' : 'Full-body exercise tracking'}</span></div>
    <div className="fc-toolbar"><button type="button" className="fc-ghost" onClick={() => panel.current?.scrollIntoView({ block: "center", behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? "auto" : "smooth" })}>Jump to camera</button>{mode === 'idle' ? <div className="fc-actions"><button type="button" className="fc-cta" onClick={() => void startCamera()}><Camera size={16} /> Start camera</button><button type="button" className="fc-ghost" onClick={startDemo}><Play size={16} /> Watch the demo athlete</button></div> : mode === 'loading' ? <button type="button" className="fc-ghost" onClick={() => { release(); setMode('idle') }}>Cancel camera setup</button> : <button type="button" className="fc-ghost" onClick={enterFocus}><Maximize size={16} /> Fullscreen workout</button>}</div>
    {options.dimming && <p className="fc-small" role="status">{mode !== "camera" ? "Background effects apply to your live camera." : backgroundReady ? `${background === "black" ? "Black" : "Dim"} background active · person-mask estimate` : "Waiting for a person mask. Original background remains visible."}</p>}
    {ex === 'observe' && <p className="fc-small" role="note">Observation only: joint overlay and neutral alignment. No exercise accuracy score, rep classification, XP or damage. This camera view does not assess eye health, HRV, body measurements or daylight.</p>}
    <div className={`fc-stage ${libraryOpen ? "fc-library-open" : ""}`}>
      <aside hidden={!libraryOpen} className="fc-library" aria-label="Exercise library">{GROUPS.filter((g) => !accessible || g.title !== 'Standing & Floor').map((g) => <details key={g.title} open={g.title !== "Pose check" || undefined}><summary>{g.title}</summary><div className="fc-ex" role="radiogroup" aria-label={g.title}>{g.exercises.map((id) => <button key={id} type="button" role="radio" aria-checked={ex === id} disabled={mode === 'loading'} className={ex === id ? 'on' : ''} onClick={() => change(id)}>{RULES[id].name}</button>)}</div></details>)}<p className="fc-small">{RULES[ex].tip}</p></aside>
      <div className="fc-center">
        <div ref={panel} className={`fc-split ${focus ? "fc-workout-focused" : ""} ${referenceVisible ? "" : "fc-no-reference"}`}><div className="fc-camera-panel" aria-label="Camera training view">
          <div className="fc-view" data-matrix-native><div className="fc-scene" style={{ transform: options.autoFrame ? `translate(${framing.x * 100}%,${framing.y * 100}%) scale(${framing.scale})` : undefined }}><video ref={video} className="fc-video" playsInline muted hidden={mode !== 'camera' && mode !== 'loading'} aria-label="Mirrored workout camera" /><canvas ref={maskCanvas} className="fc-background-mask" hidden={!options.dimming || mode !== 'camera'} aria-hidden="true" /><canvas ref={canvas} className="fc-canvas" width={640} height={480} aria-label="Live skeletal joint overlay" />
            {viewMode === "game" && <CoachBattle frame={trailFrames.at(-1)} frames={trailFrames} active={ready && !workoutPaused && !trackingPaused && calibration >= 1 && countdown === 0} demo={mode === 'demo'} source={mode} mirror={mode === 'camera'} handControls={gestures} onExercise={change} onReward={onReward} onActivity={setGameActivity} />}
            {ready && options.battery && <span className="fc-battery-badge">Battery saver · 10 fps · background focus and finger inference held</span>}
            {ready && viewMode === 'advanced' && ex !== 'observe' && options.ghost && ghost && ghostFrame(ghost, metrics.seconds) && <CoachGhost exercise={ex} pose={ghostFrame(ghost, metrics.seconds)!} mirror={mode === 'camera'} />}
            {ready && viewMode !== 'basic' && options.reaction && drill.cueAt > 0 && <div className={`fc-reaction ${drill.hit ? 'hit' : ''}`} style={{ left: `${(mode === 'camera' ? drill.side === 15 ? .7 : .3 : drill.side === 15 ? .3 : .7) * 100}%` }} role="status">{drill.hit ? '✓' : '●'}</div>}
            {ready && options.trails && ['boxing', 'karate', 'kungFu'].includes(ex) && <CoachTrails frames={trailFrames} mirror={mode === 'camera'} />}
            </div>
            {mode === 'idle' && <p className="fc-tip">{accessible ? 'Show your head, torso and arms. No need to show your legs.' : RULES[ex].tip}</p>}
            {ready && (calibration >= 1 || !accessible) && useCountdown && countdown > 0 && <div className="fc-start-countdown" role="status" aria-label="Workout start countdown">{countdown}<small>Get comfortable · starting soon</small><button type="button" onClick={() => { countdownElapsed.current = 3; setCountdown(0) }}>Skip countdown</button></div>}
            {!focus && ready && options.extension && ['boxing', 'karate', 'kungFu'].includes(ex) && combat.deceleration > 2 && Math.max(jointAngles.left ?? 0, jointAngles.right ?? 0) > 175 && <span className="fc-extension-cue">Near full projected elbow extension during rapid slowdown</span>}
            {mode === 'loading' && <p className="fc-tip">Preparing your camera and tracking model…</p>}
            {ready && <><div className={`fc-camera-controls fc-controls-${controlSide} ${compactControls ? "fc-controls-compact" : ""}`} aria-label="Hand-hover controls"><div className="fc-control-actions">{finishPending ? <>{control('continueWorkout', 'Keep training', continueWorkout)}{control('confirmFinish', 'Finish and save', finish)}</> : [control('pauseWorkout', workoutPaused ? 'Resume' : 'Pause', () => setWorkoutPaused(value => !value)), control('log', 'Log set', logSet), control('finish', 'Finish', requestFinish), control('previous', 'Previous', () => nextExercise(-1)), control('next', 'Next workout', () => nextExercise(1)), focus ? control('exit', 'Exit fullscreen', exitFocus) : control('fullscreen', 'Fullscreen', enterFocus)].slice(controlPage * controlsPerPage, (controlPage + 1) * controlsPerPage).map((button, index) => <span className="fc-control-slot" key={`${controlPage}-${index}`}>{button}</span>)}</div><nav hidden={finishPending} className="fc-control-navigation" aria-label="Camera action pages"><button type="button" data-gesture="menuBack" aria-label="Previous controls" disabled={controlPage === 0} onClick={() => { gestureState.current = { id: "menuBack", elapsed: 0, latched: true, away: 0 }; setControlPage(value => Math.max(0, value - 1)) }}><ChevronLeft aria-hidden="true" /></button><small>{`${controlPage * controlsPerPage < 3 ? "Set" : "Workout"} · ${controlPage + 1} / ${controlPages}`}</small><button type="button" data-gesture="menuNext" aria-label="More controls" disabled={controlPage === controlPages - 1} onClick={() => { gestureState.current = { id: "menuNext", elapsed: 0, latched: true, away: 0 }; setControlPage(value => Math.min(controlPages - 1, value + 1)) }}><ChevronRight aria-hidden="true" /></button></nav></div></>}
          </div>
        </div>
        <aside className="fc-guide-column" aria-label="Workout guide and progress">{finishPending && <p className="fc-side-status" role="status">Finish this workout? Choose Keep training or Finish and save.</p>}{ready && <small className="fc-side-status">{label}</small>}{corrections && fault && <p className="fc-side-fault" role="status">{fault}</p>}{referenceVisible && <CoachReference activity={viewMode === 'game' ? gameActivity || undefined : undefined} exercise={ex === 'observe' ? 'seatedPress' : ex} anglesVisible={viewMode === 'advanced' && options.angles} lineage={lineage} paused={workoutPaused || options.autoPause && trackingPaused} battery={options.battery} />}<div className={`fc-workout-hud ${((RULES[ex].timed ? held : reps.length) >= target && ex !== 'observe') ? 'fc-goal-complete' : ''}`} role="status" aria-live="polite"><strong>{viewMode === "game" && gameActivity ? COMBAT_MODES.find(activity => activity.id === gameActivity)?.name : RULES[ex].name}</strong>{focus && encouragement && <span className="fc-encouragement">{fault ? "Reset gently. The next movement is a fresh start." : (RULES[ex].timed ? held : reps.length) >= target ? "Set complete. Take a comfortable breath." : ["Steady and comfortable.", "You are building consistency.", "Keep your own pace.", "Good effort. Stay within your comfortable range."][Math.floor((RULES[ex].timed ? held : reps.length) / 3) % 4]}</span>}<small>{mode === "idle" ? "Camera off" : mode === "loading" ? "Preparing camera" : mode === "demo" ? workoutPaused ? "Demo paused · no rewards" : "Demo · no rewards" : workoutPaused ? "Workout paused" : trackingPaused ? "Return to camera frame" : calibration < 1 ? "Calibrating your position" : "Your workout"}</small>{ex !== 'observe' && <><b>{RULES[ex].timed ? held : reps.length} / {target} {RULES[ex].timed ? 'seconds' : ex === 'boxing' ? 'air punches' : 'reps'}</b>{ex === 'boxing' && <small>{Object.entries(strikes.counts).map(([kind, count]) => `${kind}: ${count}`).join(' · ') || 'Extend and return each punch · either arm'}</small>}<progress aria-label="Set progress" value={Math.min(target, RULES[ex].timed ? held : reps.length)} max={target} /><span>{(RULES[ex].timed ? held : reps.length) >= target ? 'Set complete · Log set or Finish' : `${Math.max(0, target - (RULES[ex].timed ? held : reps.length))} remaining`}</span></>}</div> {focus && viewMode === 'advanced' && options.fullscreenMetrics && <div className="fc-floating-metrics">{RULES[ex].timed ? `${held}s active` : `${reps.length} reps`} · {Math.round(metrics.watts)} W est. · {metrics.joules.toFixed(1)} J est.</div>}</aside></div>
        {viewMode === 'advanced' && options.angles && <div className="fc-live-angles">Projected angles · Elbows L {jointAngles.left ?? '—'}° / R {jointAngles.right ?? '—'}° · Wrists L {jointAngles.leftWrist ?? '—'}° / R {jointAngles.rightWrist ?? '—'}°</div>}
        <div hidden={!showAlignment} className="fc-asymmetry"><strong>Asymmetry Alert <small>silent · relative to your neutral position</small></strong><div className="fc-balance-track" role="meter" aria-label="Upper-body asymmetry" aria-valuemin={-100} aria-valuemax={100} aria-valuenow={Math.round((balance?.value ?? 0) * 100)} aria-valuetext={silentStatus}><i style={{ left: `${50 + (balance?.value ?? 0) * 45}%`, background: balance?.alert ? '#ffd43b' : '#5dffc0' }} /></div><span>{silentStatus}</span></div>
        {ready && options.autoPause && trackingPaused && <p role="status" className="fc-error">Tracking and pacing paused. Return your head and arms to the frame to resume.</p>}
        <p className="fc-instructions">{accessible ? 'Face camera. Calibrated for upper-body forms.' : 'Face camera. Keep the exercise joints visible.'}</p>
        <details className="fc-setup"><summary>Camera setup & personal calibration</summary><div className="fc-calibration"><span>{calibration < 1 && ready ? `Stay in your comfortable neutral position · ${Math.round(calibration * 100)}%` : calibration >= 1 ? 'Neutral position calibrated' : 'Calibration begins when you start'}</span><button type="button" className="fc-ghost" onClick={recalibrate} disabled={!ready}>Recalibrate</button></div>
        {!RULES[ex].timed && <div className="fc-range-calibration fc-advanced-only"><span role="status">{romStatus}</span><button type="button" disabled={!ready || calibration < 1} onClick={() => { rom.current = { active: true, seconds: 0, low: Infinity, high: -Infinity }; resetSet(); setRomStatus('Move through your comfortable range for 8 seconds') }}>Calibrate movement range</button></div>}
        </details>
      </div>
      <div className="fc-side"><div className="fc-pacing"><RepRing count={RULES[ex].timed ? held : reps.length} target={target} timed={!!RULES[ex].timed} /><div className="fc-metronome fc-advanced-only"><strong>Rhythm Metronome</strong><div className={ready && !(options.autoPause && trackingPaused) ? 'fc-beat running' : 'fc-beat'} style={{ '--fc-beat': `${60000 / bpm}ms` } as CSSProperties} aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ height: `${12 + (4 - Math.abs(i - 4)) * 7}px` }} />)}</div><label>Pace <input type="number" aria-label="Metronome BPM" min="20" max="140" value={bpm} onChange={(e) => setBpm(Math.max(20, Math.min(140, Number(e.target.value) || 40)))} /> BPM</label></div></div>
        <label className="fc-target">{RULES[ex].timed ? "Target seconds" : "Target reps"} <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>{[5, 8, 10, 12, 15, 20, 30].map((n) => <option key={n}>{n}</option>)}</select></label>
        {options.energy && <div className="fc-energy fc-advanced-only" aria-label="Energy metrics"><h4>Energy Metrics {mode === 'demo' && <small>DEMO</small>}</h4><dl><div><dt>Est. Kcal</dt><dd>{metrics.kcal.toFixed(2)}</dd></div><div><dt>Est. kinetic work (J)</dt><dd>{metrics.joules.toFixed(1)}</dd></div><div><dt>Average Power (W) · est.</dt><dd>{(metrics.seconds ? metrics.joules / metrics.seconds : 0).toFixed(1)}</dd></div><div><dt>Active Power (W) · est.</dt><dd>{Math.round(metrics.watts)}</dd></div><div><dt>Motion Intensity</dt><dd>{metrics.left + metrics.right > 2 ? 'High' : metrics.left + metrics.right > .5 ? 'Moderate' : 'Low'}</dd></div><div><dt>Left / right hand · est. m/s</dt><dd>{metrics.left.toFixed(2)} / {metrics.right.toFixed(2)}</dd></div><div><dt>Arm velocity · est. m/s</dt><dd>{metrics.arm.toFixed(2)}</dd></div></dl><small>Arm-mass and velocity estimates, not measured mechanical work. Calories use a motion-based activity proxy, adjusted for seated upper-body exercise. {metrics.source === 'world' ? 'Using model-estimated 3D coordinates.' : 'Scale estimated from shoulder span.'}</small><label>Shoulder span (cm) <input type="number" min="20" max="70" value={span} onChange={(e) => { setSpan(Math.max(20, Math.min(70, Number(e.target.value) || 40))); motion.current.points = null }} /></label></div>}
        <details className="fc-tools fc-advanced-only"><summary>Training insights, history & connections</summary><div className="fc-tool-grid">
        {options.reaction && <div className="fc-diagnostics"><h4>Reaction drill</h4><p>Onset: {drill.elapsed == null ? 'Wait for the target, then move' : `${drill.elapsed}ms`} · {drill.hit ? 'Target reached' : 'Reach the lit target'}</p><small>Measured from the rendered cue to detected hand movement; includes camera sampling delay.</small></div>}
        {options.technique && ex === 'kungFu' && <div className="fc-diagnostics"><h4>Hand structure · projected finger angles</h4><label>Hand form <select value={handTarget} onChange={e => setHandTarget(e.target.value as typeof handTarget)}><option value="open">Open palm</option><option value="fist">Closed fist</option><option value="claw">Claw shape</option></select></label><button disabled={mode !== 'camera' || handStatus.startsWith('Preparing')} onClick={() => void enableHands()}>Enable detailed hand tracking</button><p>{handStatus}</p>{handScores.map((score, i) => score && <p key={i}>Hand {i + 1}: {score.score}% shape match · fingers {score.bends.join('° / ')}°</p>)}<small>Shape guide only; does not certify traditional technique.</small></div>}
        {options.technique && ex === 'karate' && <div className="fc-diagnostics"><h4>Block guidance</h4><p>{block || 'Start tracking to see your block position'}</p></div>}
        {ex === 'boxing'  && <div className="fc-diagnostics"><h4>Boxing · camera estimates</h4><label>Lead hand <select value={lead} onChange={e => setLead(e.target.value as 'left' | 'right')}><option value="left">Left</option><option value="right">Right</option></select></label><p>{strikes.strike} · {Object.entries(strikes.counts).map(([name, count]) => `${name}: ${count}`).join(' / ')}</p>{options.guard && <p>{strikes.guard ? 'Guard near face' : 'Return the non-striking hand to guard'}</p>}<small>Heuristic classification; angled or occluded strikes may be missed.</small></div>}
        {ex === 'taiChi'  && <div className="fc-diagnostics"><label>Reference style <select aria-label="Tai Chi lineage" value={lineage} onChange={e => setLineage(e.target.value as Lineage)}><option>Yang</option><option>Chen</option></select></label><p>{lineage === 'Yang' ? 'Broad, even sweeping guide' : 'Circular, spiralling guide'}</p>{options.flow && <p>Flow smoothness: {flowScore == null ? 'Move continuously to grade flow' : `${Math.round(flowScore)} / 100`}</p>}<small>Illustrative style presets; not validated lineage instruction.</small></div>}
        {options.rhythm && ex === 'boxing' && <div className="fc-diagnostics"><h4>Combo rhythm</h4><p>{rhythmGrade(reps.map(rep => rep.at)) ? `${rhythmGrade(reps.map(rep => rep.at))!.score}% consistency · ${rhythmGrade(reps.map(rep => rep.at))!.gap}ms average gap` : 'Complete three strikes to grade timing'}</p></div>}
        {options.snap && ['boxing', 'karate', 'kungFu'].includes(ex) && <div className="fc-diagnostics"><h4>Strike deceleration · estimate</h4><p>Snap proxy: {combat.snap ?? '—'} / 100 · sampled slowdown: {combat.stopMs == null ? '—' : `${Math.round(combat.stopMs)} ms`}</p><small>Camera sampling cannot resolve precise impact or contact force.</small></div>}
        {options.routing && recoverySuggestion(history) && <div className="fc-diagnostics"><h4>A gentler flow today?</h4><p>Yesterday included {Math.round(recoverySuggestion(history)!.minutes)} active minutes and {Math.round(recoverySuggestion(history)!.work)} estimated J. Consider seated mobility to keep your habit comfortable.</p><button onClick={() => change('taiChi')}>Choose gentle Tai Chi</button><small>Based on logged workload, not a diagnosis of fatigue.</small></div>}
        {options.xp && ex !== 'observe' && <div className="fc-diagnostics"><h4>Perfect form XP</h4><p>{RULES[ex].timed ? flowXP : formXP(reps).xp} XP · {RULES[ex].timed ? 'Compounding XP per continuous 5s of 90%+ flow' : `${formXP(reps).streak} streak · ×${formXP(reps).multiplier.toFixed(2)}`}</p><small>Saved to your local RPG streak ledger when you log a real set.</small></div>}
        {options.ghost && ex !== 'observe' && <div className="fc-diagnostics"><h4>Personal best ghost</h4><select aria-label="Ghost record" value={ghostKind} onChange={e => setGhostKind(e.target.value as typeof ghostKind)}><option value="form">Best form</option><option value="power">Most powerful</option></select><p>{ghost ? `${Math.round(ghost.score)}% form · ${ghost.power.toFixed(1)} W` : 'Enable this option and log a camera set to record a ghost.'}</p><small>Stores skeletal points only, up to the last 15 seconds of a set. Your camera video is never saved.</small></div>}
        {viewMode !== 'basic' && options.breathing && <div className="fc-diagnostics fc-breathing"><div className={`fc-breath-ring ${ready && !(options.autoPause && trackingPaused) ? 'running' : ''}`} style={{ '--fc-breath': `${120000 / bpm}ms` } as CSSProperties} aria-hidden="true" /><div><h4>Breathing guide</h4><p>Expand: inhale · Contract: exhale</p><small>Follow your comfortable pace; never hold your breath.</small></div></div>}
        {(options.efficiency || options.consistency || options.degradation || options.stability) && <div className="fc-diagnostics"><h4>Movement insights · estimates</h4>{options.efficiency && <p>Active / rest: {Math.round(activity.current.active)}s / {Math.round(activity.current.rest)}s · {metrics.seconds ? (metrics.joules / metrics.seconds * 60).toFixed(1) : '0'} J/min</p>}{options.consistency && <p>Power consistency: {consistencyGrade(activity.current.powers) ?? '—'} / 100</p>}{options.stability && <p>Upper-body stability proxy: {balance ? Math.round((1 - Math.abs(balance.value)) * 100) : '—'} / 100</p>}{options.degradation && <p>{outputDrop(activity.current.early, activity.current.recent) ? 'Recent movement is slower than earlier in this set. Consider a comfortable break.' : 'Compare your pace and comfort through the set.'}</p>}<small>Rest means visible, still frames. Stability uses head/shoulder alignment, not a measured centre of gravity. Strike intervals naturally vary in power.</small></div>}
        {options.muscles && <CoachMuscles exercise={ex} />}
        {options.fatigue && <div className="fc-diagnostics"><h4>Limb workload · fatigue proxy</h4>{[['Left', metrics.leftWork], ['Right', metrics.rightWork]].map(([name, work]) => <label className="fc-workload" key={String(name)}>{name} · {Number(work).toFixed(1)} J <meter min="0" max="1000" value={Math.min(1000, Number(work))} aria-label={`${name} limb workload`} /></label>)}<p>{Math.abs(metrics.leftWork - metrics.rightWork) > Math.max(50, (metrics.leftWork + metrics.rightWork) * .35) ? 'One arm has done substantially more estimated work. Consider a gentle break.' : 'Monitor your comfort and alternate sides.'}</p><small>Work volume is not a measurement of muscle fatigue.</small></div>}
        {options.rpg && ex !== 'observe' && <div className="fc-diagnostics fc-rpg"><h4>Garden battle</h4><Sprite name="boss" label="Pixel garden enemy" size={48} /><p>{Math.floor(metrics.joules / 10)} damage earned · applied to your weekly raid when you log this real set</p><small>Game conversion: 10 estimated joules = 1 damage. Demo awards nothing.</small></div>}
        {options.replay && worstRep && <CoachReplayPanel replay={worstRep} />}
        <button disabled={!history.length} onClick={() => download(new Blob([coachMarkdown(history)], { type: 'text/markdown;charset=utf-8' }), `bloom-form-coach-${new Date().toISOString().slice(0, 10)}.md`)}>Export Form Coach Markdown</button>
        {options.history && <CoachHistoryPanel history={history} exercise={ex} />}
        <div className="fc-diagnostics"><h4>Offline training</h4><button disabled={preparingOffline} onClick={() => { setPreparingOffline(true); void prepareCoachOffline(setOfflineStatus).catch(error => setOfflineStatus(error instanceof Error ? error.message : 'Offline setup failed')).finally(() => setPreparingOffline(false)) }}>Prepare offline tracking</button><p role="status">{offlineStatus}</p><small>Processing stays local. Latency depends on your hardware; the GPU delegate does not guarantee WebGPU or zero latency.</small></div>
        {options.routine && <div className="fc-diagnostics"><h4>Custom routine</h4>{routine.map((step, i) => <div className="fc-routine-step" key={i}><select aria-label={`Routine exercise ${i + 1}`} disabled={routineIndex >= 0} value={step.exercise} onChange={event => setRoutine(routine.map((row, index) => index === i ? { ...row, exercise: event.target.value as Exercise } : row))}>{Object.entries(RULES).filter(([, rule]) => !accessible || rule.upper).map(([id, rule]) => <option key={id} value={id}>{rule.name}</option>)}</select><input aria-label={`Routine amount ${i + 1}`} disabled={routineIndex >= 0} type="number" min="1" max="300" value={step.amount} onChange={event => setRoutine(routine.map((row, index) => index === i ? { ...row, amount: Math.max(1, Math.min(300, Number(event.target.value) || 1)) } : row))} /><span>{RULES[step.exercise].timed ? 'sec' : 'reps'}</span><button disabled={routineIndex >= 0} onClick={() => setRoutine(routine.filter((_, index) => index !== i))}>Remove</button></div>)}<button disabled={routine.length >= 12 || routineIndex >= 0} onClick={() => setRoutine([...routine, { exercise: ex, amount: 10 }])}>Add movement</button><button disabled={!ready || !routine.length || routineIndex >= 0} onClick={() => { if (counter.current.reps.length || Math.floor(hold.current.seconds)) logSet(); change(routine[0].exercise, true); resetSet(routine[0].exercise); setRoutineIndex(0) }}>Start routine</button><button disabled={routineIndex < 0} onClick={() => setRoutineIndex(-1)}>Stop routine</button><p>{routineIndex >= 0 ? `Step ${routineIndex + 1} / ${routine.length} · goal ${routine[routineIndex]?.amount}` : 'Sets log and exercises change automatically at each goal.'}</p></div>}
        <CoachWearables enabled={options.haptics} onReady={receiveWearable} />
        <CoachSecondary onPose={pose => { sidePose.current = pose }} />
        <div className="fc-diagnostics"><label>Side camera position <select value={depthDirection} onChange={event => { setDepthDirection(Number(event.target.value)); depth.current = null; setDepthStatus('Recalibrate after changing camera position') }}><option value="1">At your left side</option><option value="-1">At your right side</option></select></label><button disabled={!ready} onClick={() => { const side = sidePose.current; const calibration = side && performance.now() - side.at < 150 ? calibrateDepth(frontPose.current, side.pose, depthDirection) : null; depth.current = calibration; setDepthStatus(calibration ? '90° side-depth estimate calibrated. Keep both cameras fixed.' : 'Both feeds must show your head, shoulders and arms to calibrate.') }}>Calibrate two-camera depth</button><p>{depthStatus}</p><small>Approximate orthogonal projection. Side-view occlusions retain front-camera estimates; this is not flawless 3D reconstruction.</small></div>
        {options.contrast && <div className="fc-diagnostics"><h4>Skeleton colors</h4><label>Left side <input aria-label="Left skeleton color" type="color" value={colors.left} onChange={e => setColors({ ...colors, left: e.target.value })} /></label><label>Right side <input aria-label="Right skeleton color" type="color" value={colors.right} onChange={e => setColors({ ...colors, right: e.target.value })} /></label></div>}
        {!RULES[ex].timed && <details className="fc-diagnostics"><summary>Personal rep triggers</summary><label>Lower trigger (degrees)<input aria-label="Lower rep trigger" type="number" min="0" max="175" value={ranges.current[ex]?.down ?? RULES[ex].down} onChange={event => setThreshold('down', Number(event.target.value))} /></label><label>Return trigger (degrees)<input aria-label="Return rep trigger" type="number" min="5" max="180" value={ranges.current[ex]?.up ?? RULES[ex].up} onChange={event => setThreshold('up', Number(event.target.value))} /></label><button onClick={() => { delete ranges.current[ex]; counter.current.range = null; try { localStorage.setItem('bloom-coach-ranges-v1', JSON.stringify(ranges.current)) } catch { /* optional */ }; setRomStatus('Default rep triggers restored') }}>Use default triggers</button></details>}
        </div></details>
        <details className="fc-settings"><summary>Coach settings</summary><label>Reach side <select aria-label="Reach side" value={controlSide} onChange={event => setControlSide(event.target.value as 'left' | 'right')}><option value="left">Left side</option><option value="right">Right side</option></select></label><label>Hand hold time <select aria-label="Hand hold time" value={holdSeconds} onChange={event => { setHoldSeconds(Number(event.target.value)); gestureState.current = emptyGesture() }}>{[2, 2.8, 4, 5].map(value => <option key={value} value={value}>{value} seconds</option>)}</select></label>{viewMode === "advanced" && <label>Find an option <input type="search" value={settingsSearch} onChange={event => setSettingsSearch(event.target.value)} placeholder="Search settings" /></label>}<label><input type="checkbox" checked={gestures} onChange={(e) => { setGestures(e.target.checked); gestureState.current = emptyGesture() }} /> Hand-hover controls</label><label><input type="checkbox" checked={encouragement} onChange={event => setEncouragement(event.target.checked)} /> Fullscreen encouragement</label><label><input type="checkbox" checked={useCountdown} onChange={event => setUseCountdown(event.target.checked)} /> 3–2–1 start countdown</label><label><input type="checkbox" checked={corrections} onChange={event => setCorrections(event.target.checked)} /> Red form corrections</label><label><input type="checkbox" checked={overlay} onChange={(e) => setOverlay(e.target.checked)} /> Skeletal overlay</label>{viewMode === 'advanced' && Object.entries(COACH_OPTIONS).filter(([, name]) => name.toLowerCase().includes(settingsSearch.toLowerCase())).map(([key, name]) => <label key={key}><input type="checkbox" checked={options[key as keyof typeof options]} onChange={(e) => setOptions(previous => ({ ...previous, [key]: e.target.checked }))} />{name}</label>)}<p className="fc-small">Audio feedback: off. All coaching is visual or silent.</p><small>Hold either hand inside a button until its countdown finishes. Move away to rearm. Next workout changes the exercise and logs completed reps first.</small></details>

        {err && <p role="alert" className="fc-error">{err}</p>}<p role="status" className="fc-message">{message}</p><p className="fc-small">Video stays on your device. Tracking files download on first use.</p>
      </div>
    </div>
  </section>
}
