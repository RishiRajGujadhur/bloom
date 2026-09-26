import { measureStance, type Pt, type Stance } from './stanceModel'

const WASM = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

type Landmarker = { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Pt[][] }; close: () => void }

/** Full-body camera loop (~8 fps) reporting stance; all on-device. */
export async function startStance(video: HTMLVideoElement, onStance: (s: Stance | null, points: Pt[] | null) => void) {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
  video.srcObject = stream
  await video.play()
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  const files = await FilesetResolver.forVisionTasks(WASM)
  const landmarker = (await PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  })) as unknown as Landmarker
  const timer = setInterval(() => {
    if (video.readyState < 2) return
    const points = landmarker.detectForVideo(video, performance.now()).landmarks[0] ?? null
    onStance(points ? measureStance(points) : null, points)
  }, 125)
  return () => {
    clearInterval(timer)
    landmarker.close()
    stream.getTracks().forEach((t) => t.stop())
    video.srcObject = null
  }
}
