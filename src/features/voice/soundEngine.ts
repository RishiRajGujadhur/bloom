/**
 * Main-thread side of Sound Lab: decodes a memo to 48 kHz mono, fans the work
 * out across every core (WorkerPool + Atomics progress), then crossfades the
 * chunks back together and applies levelling and silence trimming.
 */
import { WorkerPool } from '../../platform/workerPool'
import DspWorker from './dspWorker?worker'
import type { DspResult, DspTask } from './dspWorker'
import { encodeWav, join, levelVoice, noiseFloorDb, split, trimSilence } from './soundModel'

export const RATE = 48000
let pool: WorkerPool<DspTask, DspResult> | null = null
export const getPool = () => (pool ??= new WorkerPool<DspTask, DspResult>(() => new DspWorker()))

export async function decode48k(blob: Blob) {
  const ctx = new AudioContext()
  const decoded = await ctx.decodeAudioData(await blob.arrayBuffer())
  void ctx.close()
  const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * RATE)), RATE)
  const src = off.createBufferSource()
  src.buffer = decoded
  src.connect(off.destination)
  src.start()
  return (await off.startRendering()).getChannelData(0)
}

export type CleanOptions = { ai: boolean; gate: boolean; strength: number; level: boolean; trim: boolean }
export type CleanResult = { samples: Float32Array; blob: Blob; backend: DspResult['backend']; threads: number; ms: number; beforeDb: number; afterDb: number }

/** `onProgress(done, total)` is fed from the pool's shared Atomics counter. */
export async function clean(input: Float32Array, o: CleanOptions, onProgress?: (done: number, total: number) => void): Promise<CleanResult> {
  const t0 = performance.now()
  const p = getPool()
  const base = p.done
  const parts = Math.max(p.size * 2, 2)
  const total = parts + 1
  let raf = 0
  const tick = () => { onProgress?.(p.done - base, total); raf = requestAnimationFrame(tick) }
  tick()
  try {
    const prof = await p.run({ kind: 'profile', data: input.slice() })
    const chunks = split(input, parts, RATE / 4)
    const done = await Promise.all(chunks.map((c) => p.run({ kind: 'clean', data: c.data, profile: prof.out as Float32Array, strength: o.strength, ai: o.ai, gate: o.gate }, [c.data.buffer]).then((r) => ({ start: c.start, data: r.out as Float32Array, backend: r.backend }))))
    let out = join(done, input.length)
    if (o.level) out = levelVoice(out, RATE)
    if (o.trim) out = trimSilence(out, RATE)
    onProgress?.(total, total)
    return { samples: out, blob: encodeWav(out, RATE), backend: done[0]?.backend ?? prof.backend, threads: p.size, ms: performance.now() - t0, beforeDb: noiseFloorDb(input, RATE), afterDb: noiseFloorDb(out, RATE) }
  } finally {
    cancelAnimationFrame(raf)
  }
}

export async function spectro(samples: Float32Array) {
  const r = await getPool().run({ kind: 'spectro', data: samples.slice(), sampleRate: RATE })
  return r.out as Uint8Array
}

export async function toMp3(samples: Float32Array): Promise<Blob> {
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  const enc = new Mp3Encoder(1, RATE, 128)
  const pcm = new Int16Array(samples.length)
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff
  const parts: BlobPart[] = []
  for (let i = 0; i < pcm.length; i += 1152) {
    const b = enc.encodeBuffer(pcm.subarray(i, i + 1152))
    if (b.length) parts.push(new Uint8Array(b))
  }
  const end = enc.flush()
  if (end.length) parts.push(new Uint8Array(end))
  return new Blob(parts, { type: 'audio/mpeg' })
}
