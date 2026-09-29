import { mean, standardDeviation } from 'simple-statistics'
import { z } from 'zod'
import type { RealFft } from '../../platform/fftCore'

/**
 * Morning Readiness model. A minute of beat-to-beat (RR) intervals, from a
 * Bluetooth strap, a fingertip on the camera, or the simulator, gives heart
 * rate variability: RMSSD in the time domain and LF/HF from an FFT of the
 * resampled tachogram. Readiness compares today's ln(RMSSD) and resting heart
 * rate with your own 30-day baseline, the way HRV apps do.
 */

export const scanSchema = z.object({
  date: z.string(),
  at: z.number(),
  source: z.enum(['bluetooth', 'camera', 'simulated']),
  hr: z.number(),
  rmssd: z.number(),
  sdnn: z.number(),
  lnRmssd: z.number(),
  lfhf: z.number().nullable(),
  beats: z.number(),
  score: z.number().nullable(),
})
export type Scan = z.infer<typeof scanSchema>

/** Heart Rate Measurement characteristic (0x2A37): bpm plus RR intervals in ms. */
export function parseHeartRate(v: DataView): { bpm: number; rr: number[] } {
  const flags = v.getUint8(0)
  const wide = flags & 0x01
  let o = 1
  const bpm = wide ? v.getUint16(o, true) : v.getUint8(o)
  o += wide ? 2 : 1
  if (flags & 0x08) o += 2 // energy expended
  const rr: number[] = []
  if (flags & 0x10) for (; o + 1 < v.byteLength; o += 2) rr.push((v.getUint16(o, true) / 1024) * 1000)
  return { bpm, rr }
}

/** Drops artefacts: impossible intervals, and beats more than 20% off the local median (missed or extra beats). */
export function cleanRR(rr: number[]): number[] {
  const inRange = rr.filter((x) => x >= 300 && x <= 2000)
  return inRange.filter((x, i) => {
    const win = inRange.slice(Math.max(0, i - 3), i + 4).sort((a, b) => a - b)
    const med = win[Math.floor(win.length / 2)]
    return Math.abs(x - med) <= med * 0.2
  })
}

export function rmssd(rr: number[]) {
  if (rr.length < 3) return 0
  let s = 0
  for (let i = 1; i < rr.length; i++) s += (rr[i] - rr[i - 1]) ** 2
  return Math.sqrt(s / (rr.length - 1))
}
export const sdnn = (rr: number[]) => (rr.length > 2 ? standardDeviation(rr) : 0)
export const heartRate = (rr: number[]) => (rr.length ? 60000 / mean(rr) : 0)

export const TACHO_HZ = 4
export const TACHO_N = 256

/**
 * Frequency-domain HRV: resample the tachogram evenly at 4 Hz, remove the
 * mean, apply a Hann window, FFT (256 points = 64 s), and sum power in the
 * LF (0.04–0.15 Hz) and HF (0.15–0.40 Hz, breathing) bands.
 */
export function lfhf(rr: number[], fft: RealFft): { lf: number; hf: number; ratio: number } | null {
  if (rr.length < 30) return null
  const times: number[] = []
  let t = 0
  for (const x of rr) times.push((t += x / 1000))
  const N = fft.n
  const buf = new Float32Array(N)
  let j = 0
  for (let i = 0; i < N; i++) {
    const at = times[0] + i / TACHO_HZ
    while (j < times.length - 2 && times[j + 1] < at) j++
    const f = Math.max(0, Math.min(1, (at - times[j]) / (times[j + 1] - times[j])))
    buf[i] = at > times[times.length - 1] ? rr[rr.length - 1] : rr[j] + (rr[j + 1] - rr[j]) * f
  }
  const m = buf.reduce((a, x) => a + x, 0) / N
  for (let i = 0; i < N; i++) buf[i] = (buf[i] - m) * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N))
  const spec = new Float32Array(N)
  fft.forward(buf, spec)
  let lf = 0
  let hf = 0
  for (let k = 1; k < N / 2; k++) {
    const hz = (k * TACHO_HZ) / N
    const p = spec[2 * k] ** 2 + spec[2 * k + 1] ** 2
    if (hz >= 0.04 && hz < 0.15) lf += p
    else if (hz >= 0.15 && hz < 0.4) hf += p
  }
  return { lf, hf, ratio: hf > 0 ? lf / hf : 0 }
}

export type Verdict = { score: number | null; label: string; advice: string; tone: 'push' | 'steady' | 'recover' | 'baseline' }

/** Readiness 0–100 from today against the last 30 days (needs at least 3 earlier scans). */
export function readiness(today: { lnRmssd: number; hr: number }, history: Scan[]): Verdict {
  const past = history.slice(-30)
  if (past.length < 3) return { score: null, label: 'Building your baseline', advice: `Scan ${3 - past.length} more morning${past.length === 2 ? '' : 's'} and your readiness score appears. Same time, same position, before coffee.`, tone: 'baseline' }
  const ln = past.map((s) => s.lnRmssd)
  const hr = past.map((s) => s.hr)
  const zHrv = (today.lnRmssd - mean(ln)) / Math.max(0.05, standardDeviation(ln))
  const zHr = (today.hr - mean(hr)) / Math.max(1, standardDeviation(hr))
  const score = Math.round(Math.max(0, Math.min(100, 60 + zHrv * 18 - zHr * 8)))
  if (score >= 70) return { score, label: 'Primed', advice: 'Your nervous system is well recovered. A good day for intervals, a heavy lift or a long run.', tone: 'push' }
  if (score >= 45) return { score, label: 'Steady', advice: 'Normal for you. Train as planned, but keep the hardest efforts short.', tone: 'steady' }
  return { score, label: 'Recover', advice: 'Below your baseline, which can come from poor sleep, stress, alcohol or a bug. Choose a walk, mobility or yoga, and go to bed early.', tone: 'recover' }
}

/** A seeded simulated chest strap: ~resting HR with breathing-linked variability (RSA) and slow drift. */
export function* simulatedBeats(opts: { hr?: number; rsa?: number; seed?: number } = {}) {
  const base = 60000 / (opts.hr ?? 58)
  const rsa = opts.rsa ?? 55
  let seed = opts.seed ?? 42
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1
  let t = 0
  for (;;) {
    const breath = Math.sin((2 * Math.PI * t) / 5.5) // ~11 breaths/min
    const mayer = Math.sin((2 * Math.PI * t) / 10) // ~0.1 Hz baroreflex wave
    const rr = base + rsa * breath + 18 * mayer + rnd() * 12
    t += rr / 1000
    yield rr
  }
}

/**
 * Beats from a camera PPG trace (fingertip over the lens): after a band-pass,
 * find peaks at least 0.33 s apart that rise above a moving threshold.
 */
export function ppgBeats(signal: number[], fs: number): number[] {
  const out: number[] = []
  const minGap = Math.round(fs * 0.33)
  let last = -minGap
  for (let i = 2; i < signal.length - 2; i++) {
    const win = signal.slice(Math.max(0, i - Math.round(fs)), i + 1)
    const thr = mean(win) + 0.4 * (Math.max(...win) - mean(win))
    const s = signal[i]
    if (s > thr && s >= signal[i - 1] && s >= signal[i - 2] && s > signal[i + 1] && s >= signal[i + 2] && i - last >= minGap) {
      if (last >= 0) out.push(((i - last) / fs) * 1000)
      last = i
    }
  }
  return out
}

export const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
