/// <reference lib="webworker" />
/**
 * Sound Lab DSP worker (one per core, driven by the WorkerPool). FFTs run in
 * PFFFT compiled to WebAssembly (the SIMD128 build where the CPU supports it),
 * and the "AI" pass is RNNoise, a small recurrent neural network in Wasm.
 */
import { hasCap } from '../../platform/caps'
import { servePool } from '../../platform/workerPool'
import { FRAME, jsFft, noiseProfile, spectralGate, spectrogram, type RealFft } from './soundModel'
import simdUrl from '../../../node_modules/@echogarden/pffft-wasm/dist/simd/pffft.wasm?url'
import scalarUrl from '../../../node_modules/@echogarden/pffft-wasm/dist/non-simd/pffft.wasm?url'

export type DspTask =
  | { kind: 'profile'; data: Float32Array }
  | { kind: 'clean'; data: Float32Array; profile: Float32Array; strength: number; ai: boolean; gate: boolean }
  | { kind: 'spectro'; data: Float32Array; sampleRate: number }
export type DspResult = { out: Float32Array | Uint8Array; backend: 'simd' | 'wasm' | 'js' }

type PffftModule = {
  _pffft_new_setup: (n: number, t: number) => number
  _pffft_aligned_malloc: (bytes: number) => number
  _pffft_transform_ordered: (s: number, i: number, o: number, w: number, dir: number) => void
  HEAPF32: Float32Array
}

let fftP: Promise<{ fft: RealFft; backend: DspResult['backend'] }> | null = null
function getFft() {
  fftP ??= (async () => {
    const simd = hasCap('simd')
    try {
      const factory = (simd ? await import('@echogarden/pffft-wasm/simd') : await import('@echogarden/pffft-wasm')).default as (o: object) => Promise<PffftModule>
      const url = simd ? simdUrl : scalarUrl
      const m = await factory({ locateFile: () => url })
      const setup = m._pffft_new_setup(FRAME, 0)
      const inP = m._pffft_aligned_malloc(FRAME * 4)
      const outP = m._pffft_aligned_malloc(FRAME * 4)
      const workP = m._pffft_aligned_malloc(FRAME * 4)
      const run = (input: Float32Array, out: Float32Array, dir: number) => {
        m.HEAPF32.set(input, inP >> 2)
        m._pffft_transform_ordered(setup, inP, outP, workP, dir)
        out.set(m.HEAPF32.subarray(outP >> 2, (outP >> 2) + FRAME))
      }
      const fft: RealFft = { n: FRAME, forward: (i, o) => run(i, o, 0), inverse: (i, o) => run(i, o, 1) }
      return { fft, backend: simd ? 'simd' : 'wasm' }
    } catch {
      return { fft: jsFft(FRAME), backend: 'js' }
    }
  })()
  return fftP
}

type Denoiser = { processFrame: (f: Float32Array) => number; destroy: () => void }
let rnP: Promise<{ frameSize: number; createDenoiseState: () => Denoiser }> | null = null
const getRnnoise = () => (rnP ??= import('@shiguredo/rnnoise-wasm').then((m) => m.Rnnoise.load()))

/** RNNoise expects 48 kHz frames of 480 samples in 16-bit range. */
async function neural(data: Float32Array, strength: number) {
  const rn = await getRnnoise()
  const st = rn.createDenoiseState()
  const n = rn.frameSize
  const frame = new Float32Array(n)
  const out = new Float32Array(data.length)
  for (let off = 0; off < data.length; off += n) {
    frame.fill(0)
    for (let i = 0; i < n && off + i < data.length; i++) frame[i] = data[off + i] * 32768
    st.processFrame(frame)
    for (let i = 0; i < n && off + i < data.length; i++) out[off + i] = (frame[i] / 32768) * strength + data[off + i] * (1 - strength)
  }
  st.destroy()
  return out
}

servePool<DspTask, DspResult>(async (t) => {
  const { fft, backend } = await getFft()
  if (t.kind === 'profile') return { out: noiseProfile(t.data, fft), backend }
  if (t.kind === 'spectro') return { out: spectrogram(t.data, t.sampleRate, fft), backend }
  let s = t.data
  if (t.ai) s = await neural(s, Math.min(1, 0.4 + t.strength * 0.6))
  if (t.gate) s = spectralGate(s, t.profile, fft, t.strength)
  return { out: s, backend }
}, (r) => [r.out.buffer as ArrayBuffer])
