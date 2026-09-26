import { defaultRules, idleClock, isSlouching, measure, postureTick, score, type Baseline, type Landmark, type PostureEvent, type PostureRules } from './postureModel'

/**
 * Camera + MediaPipe pose loop, as a small singleton store so it keeps running
 * in the background while you use other pages. Inference runs on-device; the
 * WASM runtime and model are downloaded once (after opt-in) and cached by the
 * browser. No frames are stored or sent anywhere.
 */
const VERSION = '1.0.1'
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}/wasm`
const MODEL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
export const POSTURE_KEY = 'bloom-posture-v1'

export type PostureSnapshot = {
  status: 'off' | 'loading' | 'running' | 'error'
  error: string
  score: number | null
  slouching: boolean
  absent: boolean
  landmarks: Landmark[] | null
  baseline: Baseline | null
  slouchSince: number | null
  warnedAt: number | null
  stream: MediaStream | null
}

type Settings = { baseline: Baseline | null; sensitivity: number; rules: PostureRules }
function readSettings(): Settings {
  try {
    const v = JSON.parse(localStorage.getItem(POSTURE_KEY) ?? 'null') as Partial<Settings> | null
    return { baseline: v?.baseline ?? null, sensitivity: v?.sensitivity ?? 1, rules: { ...defaultRules, ...v?.rules } }
  } catch {
    return { baseline: null, sensitivity: 1, rules: defaultRules }
  }
}
export function savePostureSettings(update: Partial<Settings>) {
  const next = { ...readSettings(), ...update }
  try {
    localStorage.setItem(POSTURE_KEY, JSON.stringify(next))
  } catch {
    /* settings apply for this visit */
  }
  return next
}
export const postureSettings = readSettings

let snapshot: PostureSnapshot = {
  status: 'off',
  error: '',
  score: null,
  slouching: false,
  absent: false,
  landmarks: null,
  baseline: readSettings().baseline,
  slouchSince: null,
  warnedAt: null,
  stream: null,
}
const listeners = new Set<() => void>()
const eventListeners = new Set<(event: PostureEvent) => void>()
const set = (patch: Partial<PostureSnapshot>) => {
  snapshot = { ...snapshot, ...patch }
  listeners.forEach((l) => l())
}
export const subscribePosture = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}
export const getPosture = () => snapshot
export const onPostureEvent = (l: (e: PostureEvent) => void) => {
  eventListeners.add(l)
  return () => {
    eventListeners.delete(l)
  }
}

type Landmarker = { detectForVideo: (video: HTMLVideoElement, t: number) => { landmarks: Landmark[][] }; close: () => void }
let landmarker: Landmarker | null = null
let video: HTMLVideoElement | null = null
let timer: ReturnType<typeof setInterval> | null = null
let clock = { ...idleClock }
let latest: ReturnType<typeof measure> = null

export async function startPosture() {
  if (snapshot.status === 'running' || snapshot.status === 'loading') return
  set({ status: 'loading', error: '' })
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' }, audio: false })
    video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = stream
    await video.play()
    // Show the preview while the model downloads (first run only).
    set({ stream })
    if (!landmarker) {
      const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
      const files = await FilesetResolver.forVisionTasks(WASM)
      landmarker = (await PoseLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      })) as unknown as Landmarker
    }
    set({ status: 'running', stream })
    clock = { ...idleClock }
    // One sample per second is plenty for posture and light on the CPU.
    timer = setInterval(sample, 1000)
  } catch (error) {
    stopPosture()
    set({
      status: 'error',
      error:
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera permission was not granted.'
          : 'The posture model could not start on this device.',
    })
  }
}

function sample() {
  if (!landmarker || !video || video.readyState < 2) return
  const result = landmarker.detectForVideo(video, performance.now())
  const points = result.landmarks[0] ?? null
  latest = points ? measure(points) : null
  const { baseline, sensitivity, rules } = readSettings()
  const now = Date.now()
  if (!latest || !baseline) {
    const tick = postureTick(clock, { at: now, absent: true }, rules)
    clock = tick.clock
    set({ landmarks: points, score: null, absent: !latest, slouching: false, slouchSince: null, warnedAt: null, baseline })
    return
  }
  const value = score(latest, baseline, sensitivity)
  const slouching = isSlouching(value)
  const tick = postureTick(clock, { at: now, score: value, slouching }, rules)
  clock = tick.clock
  tick.events.forEach((e) => eventListeners.forEach((l) => l(e)))
  set({ landmarks: points, score: value, slouching, absent: false, slouchSince: clock.slouchSince, warnedAt: clock.warnedAt, baseline })
}

/** Uses the current pose as "good posture". */
export function calibratePosture() {
  if (!latest) return false
  const baseline = { ratio: latest.ratio, tilt: latest.tilt }
  savePostureSettings({ baseline })
  set({ baseline })
  return true
}

/** Resets the slouch timer after the user straightens up on request. */
export function acknowledgePosture() {
  clock = { ...idleClock }
  set({ slouchSince: null, warnedAt: null })
}

export function stopPosture() {
  if (timer) clearInterval(timer)
  timer = null
  snapshot.stream?.getTracks().forEach((t) => t.stop())
  ;(video?.srcObject as MediaStream | null)?.getTracks().forEach((t) => t.stop())
  video = null
  clock = { ...idleClock }
  set({ status: 'off', stream: null, score: null, landmarks: null, slouching: false, slouchSince: null, warnedAt: null })
}
