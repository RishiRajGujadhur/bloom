import type { VisionPoint } from './visionModel'

/** Each game owns its stream; stopping also cancels pending model/camera setup. */
export function visionCamera(video: HTMLVideoElement, numHands: 1 | 2 = 2) {
  let cancelled = false
  let stream: MediaStream | null = null
  let model: { detectForVideo: (video: HTMLVideoElement, time: number) => { landmarks: VisionPoint[][] }; close: () => void } | null = null
  const stop = () => {
    cancelled = true
    stream?.getTracks().forEach((track) => track.stop())
    model?.close()
    model = null
    // A cancelled older start may finish after a new session owns the preview.
    if (video.srcObject === stream) { video.pause(); video.srcObject = null }
  }
  return {
    stop,
    detect: (time: number) => model && video.readyState >= 2 ? model.detectForVideo(video, time).landmarks : [],
    async start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access needs HTTPS or localhost and a supported browser.')
        const acquired = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false })
        if (cancelled) { acquired.getTracks().forEach((t) => t.stop()); return false }
        stream = acquired
        video.srcObject = stream
        await video.play()
        if (cancelled) return false
        const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
        const files = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm')
        if (cancelled) return false
        const options = { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task' }
        const tracking = { runningMode: 'VIDEO' as const, numHands, minHandDetectionConfidence: .4, minHandPresenceConfidence: .4, minTrackingConfidence: .4 }
        let loaded
        try {
          loaded = await HandLandmarker.createFromOptions(files, { baseOptions: { ...options, delegate: 'GPU' }, ...tracking })
        } catch {
          if (cancelled) return false
          loaded = await HandLandmarker.createFromOptions(files, { baseOptions: { ...options, delegate: 'CPU' }, ...tracking })
        }
        if (cancelled) { loaded.close(); return false }
        model = loaded
        return true
      } catch (error) {
        stop()
        if (error instanceof DOMException && error.name === 'NotAllowedError') throw new Error('Camera permission was declined. Allow access and try again, or choose practice mode.', { cause: error })
        throw error
      }
    },
  }
}
