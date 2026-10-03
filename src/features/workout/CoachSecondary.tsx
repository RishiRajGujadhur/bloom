import { useEffect, useRef, useState } from 'react'
import { COACH_WASM, COACH_MODEL } from './coachOffline'
import { upperVisible, type P } from './formModel'
type SidePose = { at: number; pose: P[] }
export type DepthCalibration = { frontY: number; sideY: number; sideX: number; scale: number; direction: number }
export function calibrateDepth(front: P[], side: P[], direction = 1): DepthCalibration | null {
  if (!upperVisible(front) || !upperVisible(side)) return null
  const frontY = (front[11].y + front[12].y) / 2, sideY = (side[11].y + side[12].y) / 2
  const neck = Math.abs(sideY - side[0].y)
  if (neck < .04) return null
  return { frontY, sideY, sideX: (side[11].x + side[12].x) / 2, scale: Math.abs(frontY - front[0].y) / neck, direction }
}
/** Orthogonal-camera approximation, valid only for fixed, aligned 90-degree views. */
export function fuseDepth(front: P[], side: SidePose | null, calibration: DepthCalibration | null, at: number): P[] {
  if (!side || !calibration || at - side.at > 150 || at < side.at) return front
  return front.map((point, i) => (side.pose[i]?.visibility ?? 0) >= .55 ? { ...point, z: (side.pose[i].x - calibration.sideX) * calibration.scale * calibration.direction } : point)
}
const encode = (description: RTCSessionDescriptionInit) => JSON.stringify(description)
async function completeICE(peer: RTCPeerConnection) {
  if (peer.iceGatheringState === 'complete') return
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Local camera connection timed out. Try again on the same network.')) }, 10000)
    const changed = () => { if (peer.iceGatheringState === 'complete') { cleanup(); resolve() } }
    const cleanup = () => { clearTimeout(timeout); peer.removeEventListener('icegatheringstatechange', changed) }
    peer.addEventListener('icegatheringstatechange', changed)
  })
}
function description(text: string, type: 'offer' | 'answer'): RTCSessionDescriptionInit {
  const value = JSON.parse(text)
  if (value.type !== type || typeof value.sdp !== 'string' || value.sdp.length > 100000) throw new Error(`Paste a camera ${type} from Bloom.`)
  return { type, sdp: value.sdp }
}
export function CoachSecondary({ onPose }: { onPose: (pose: SidePose | null) => void }) {
  const [input, setInput] = useState(''), [output, setOutput] = useState(''), [status, setStatus] = useState('Disconnected')
  const peer = useRef<RTCPeerConnection | null>(null), stream = useRef<MediaStream | null>(null), video = useRef<HTMLVideoElement>(null)
  const model = useRef<{ close: () => void; detectForVideo: (v: HTMLVideoElement, at: number) => { landmarks: P[][] } } | null>(null)
  const generation = useRef(0), raf = useRef(0), poseCallback = useRef(onPose)
  poseCallback.current = onPose
  const close = () => {
    generation.current++; cancelAnimationFrame(raf.current); peer.current?.close(); peer.current = null
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; model.current?.close(); model.current = null
    if (video.current) video.current.srcObject = null
    poseCallback.current(null); setStatus('Disconnected'); setOutput('')
  }
  useEffect(() => () => { generation.current++; cancelAnimationFrame(raf.current); peer.current?.close(); stream.current?.getTracks().forEach(track => track.stop()); model.current?.close() }, [])
  const receiveTracking = async (run: number) => {
    const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
    const files = await FilesetResolver.forVisionTasks(COACH_WASM)
    const detector = await PoseLandmarker.createFromOptions(files, { baseOptions: { modelAssetPath: COACH_MODEL, delegate: 'CPU' }, runningMode: 'VIDEO', numPoses: 1 })
    if (run !== generation.current) { detector.close(); return }
    model.current = detector
    let last = 0, videoTime = -1
    const loop = (at: number) => {
      if (run !== generation.current) return
      const v = video.current
      if (!document.hidden && v && v.readyState >= 2 && at - last > 100 && v.currentTime !== videoTime) {
        last = at; videoTime = v.currentTime
        try { const pose = detector.detectForVideo(v, at).landmarks[0]; poseCallback.current(pose ? { at, pose } : null) }
        catch { setStatus('Side tracking failed. Reconnect camera.'); poseCallback.current(null); return }
      }
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  const createPeer = () => {
    close(); const connection = new RTCPeerConnection({ iceServers: [] }); peer.current = connection
    connection.onconnectionstatechange = () => { setStatus(`Camera ${connection.connectionState}`); if (connection.connectionState !== 'connected') poseCallback.current(null) }
    return connection
  }
  const offer = async () => {
    try {
      const connection = createPeer(), run = generation.current
      connection.addTransceiver('video', { direction: 'recvonly' })
      connection.ontrack = event => {
        if (run !== generation.current || !video.current) return
        video.current.srcObject = event.streams[0] ?? new MediaStream([event.track])
        void video.current.play().then(() => receiveTracking(run)).catch(error => setStatus(String(error)))
      }
      await connection.setLocalDescription(await connection.createOffer()); await completeICE(connection)
      if (run === generation.current) { setOutput(encode(connection.localDescription!)); setStatus('Send this offer to Bloom on your second device') }
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Connection failed') }
  }
  const answer = async () => {
    try {
      const parsed = description(input, 'offer'), connection = createPeer(), run = generation.current
      const camera = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false })
      if (run !== generation.current) { camera.getTracks().forEach(track => track.stop()); return }
      stream.current = camera; video.current!.srcObject = camera; await video.current!.play()
      camera.getTracks().forEach(track => connection.addTrack(track, camera))
      await connection.setRemoteDescription(parsed); await connection.setLocalDescription(await connection.createAnswer()); await completeICE(connection)
      if (run === generation.current) { setOutput(encode(connection.localDescription!)); setStatus('Send this answer back to the main device') }
    } catch (error) { close(); setStatus(error instanceof Error ? error.message : 'Camera sharing failed') }
  }
  return <details className="fc-diagnostics"><summary>Secondary camera · local network</summary><p>Open Bloom on both devices using HTTPS or localhost. Keep cameras fixed at 90° to each other, at the same height. No relay server is used; network isolation may prevent connection.</p><button onClick={() => void offer()}>Main device: create camera offer</button><label>Paste offer / answer<textarea aria-label="Camera pairing input" value={input} onChange={event => setInput(event.target.value)} /></label><button onClick={() => void answer()}>Second device: share camera and answer</button><button disabled={!peer.current} onClick={() => { try { void peer.current?.setRemoteDescription(description(input, 'answer')).catch(error => setStatus(String(error))) } catch (error) { setStatus(error instanceof Error ? error.message : 'Invalid camera answer') } }}>Main device: accept answer</button><label>Pairing code<textarea readOnly aria-label="Camera pairing output" value={output} /></label><button disabled={!output} onClick={() => { void navigator.clipboard.writeText(output).catch(() => setStatus('Select and copy the pairing code manually.')) }}>Copy pairing code</button><button onClick={close}>Disconnect second camera</button><p role="status">{status}</p><video ref={video} muted playsInline className="fc-side-video" aria-label="Secondary camera feed" /></details>
}
