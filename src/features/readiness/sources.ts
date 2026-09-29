import Fili from 'fili'
import { opfsRead, opfsWrite } from '../../platform/opfs'
import { parseHeartRate, ppgBeats, scanSchema, simulatedBeats, type Scan } from './readinessModel'

/**
 * Where beats come from: a Bluetooth heart-rate strap or watch (standard GATT
 * heart_rate service), a fingertip over the camera (photoplethysmography), or
 * a simulated strap. Every source reports RR intervals in milliseconds.
 */
export type Source = 'bluetooth' | 'camera' | 'simulated'
export type Session = { name: string; stop: () => void }
type Handlers = { onBeat: (rr: number) => void; onBpm?: (bpm: number) => void; onWave?: (v: number) => void; onError?: (msg: string) => void }

type BtChar = EventTarget & { value?: DataView; startNotifications: () => Promise<BtChar>; stopNotifications: () => Promise<BtChar> }
type BtDevice = EventTarget & { name?: string; gatt?: { connect: () => Promise<{ getPrimaryService: (s: string) => Promise<{ getCharacteristic: (c: string) => Promise<BtChar> }>; disconnect: () => void }>; connected: boolean; disconnect: () => void } }

export async function connectBluetooth(h: Handlers): Promise<Session> {
  const bt = (navigator as unknown as { bluetooth?: { requestDevice: (o: unknown) => Promise<BtDevice> } }).bluetooth
  if (!bt) throw new Error('Web Bluetooth isn’t available in this browser. Try Chrome or Edge, or use the camera.')
  const device = await bt.requestDevice({ filters: [{ services: ['heart_rate'] }] })
  const server = await device.gatt!.connect()
  const ch = await (await server.getPrimaryService('heart_rate')).getCharacteristic('heart_rate_measurement')
  const onValue = () => {
    if (!ch.value) return
    const { bpm, rr } = parseHeartRate(ch.value)
    h.onBpm?.(bpm)
    rr.forEach(h.onBeat)
  }
  ch.addEventListener('characteristicvaluechanged', onValue)
  device.addEventListener('gattserverdisconnected', () => h.onError?.('The strap disconnected.'))
  await ch.startNotifications()
  return {
    name: device.name || 'Heart-rate strap',
    stop: () => {
      ch.removeEventListener('characteristicvaluechanged', onValue)
      void ch.stopNotifications().catch(() => {})
      device.gatt?.disconnect()
    },
  }
}

export function simulate(h: Handlers, opts: { hr?: number; rsa?: number; seed?: number } = {}): Session {
  const beats = simulatedBeats(opts)
  let timer = 0
  let stopped = false
  const next = () => {
    const rr = beats.next().value as number
    timer = window.setTimeout(() => {
      if (stopped) return
      h.onBeat(rr)
      h.onBpm?.(Math.round(60000 / rr))
      next()
    }, rr)
  }
  next()
  return { name: 'Simulated strap', stop: () => { stopped = true; clearTimeout(timer) } }
}

/** Fingertip PPG: red-channel brightness of a tiny video frame, band-passed 0.7–3.5 Hz. */
export async function cameraPpg(h: Handlers, video: HTMLVideoElement): Promise<Session> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 160, height: 120 } })
  const track = stream.getVideoTracks()[0]
  try { await track.applyConstraints({ advanced: [{ torch: true } as MediaTrackConstraintSet] }) } catch { /* no torch: daylight works too */ }
  video.srcObject = stream
  await video.play()
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 24
  const g = canvas.getContext('2d', { willReadFrequently: true })!
  const FS = 30
  const calc = new Fili.CalcCascades()
  const filter = new Fili.IirFilter(calc.bandpass({ order: 2, characteristic: 'butterworth', Fs: FS, Fc: 1.6, BW: 2.8 }))
  const trace: number[] = []
  let raf = 0
  let lastT = 0
  let emitted = 0
  let stopped = false
  const loop = (t: number) => {
    if (stopped) return
    raf = requestAnimationFrame(loop)
    if (t - lastT < 1000 / FS - 2) return
    lastT = t
    g.drawImage(video, 0, 0, 32, 24)
    const px = g.getImageData(0, 0, 32, 24).data
    let red = 0
    for (let i = 0; i < px.length; i += 4) red += px[i]
    const v = -filter.singleStep(red / (px.length / 4)) // blood volume up = less light
    trace.push(v)
    h.onWave?.(v)
    if (trace.length % FS === 0 && trace.length > FS * 3) {
      const beats = ppgBeats(trace.slice(FS * 2), FS) // skip the filter's settling time
      for (; emitted < beats.length; emitted++) h.onBeat(beats[emitted])
    }
  }
  raf = requestAnimationFrame(loop)
  return {
    name: 'Camera (fingertip)',
    stop: () => {
      stopped = true
      cancelAnimationFrame(raf)
      stream.getTracks().forEach((tr) => tr.stop())
      video.srcObject = null
    },
  }
}

// Scans live in the Origin Private File System: a summary list plus each morning's raw beats.
const LIST = 'readiness/scans.json'
export async function loadScans(): Promise<Scan[]> {
  const blob = await opfsRead(LIST)
  if (!blob) return []
  try {
    const parsed = scanSchema.array().safeParse(JSON.parse(await blob.text()))
    return parsed.success ? parsed.data : []
  } catch { return [] }
}
export async function saveScan(scan: Scan, rr: number[]) {
  const list = (await loadScans()).filter((s) => s.date !== scan.date)
  list.push(scan)
  list.sort((a, b) => a.at - b.at)
  await opfsWrite(LIST, JSON.stringify(list))
  await opfsWrite(`readiness/beats-${scan.date}.json`, JSON.stringify(rr.map((x) => Math.round(x))))
  return list
}
