/**
 * Sound Lab DSP, kept pure so it runs in workers and in tests.
 *
 * Spectral gating: learn each frequency bin's noise floor from the quietest
 * frames, then attenuate bins that don't rise clearly above it (smoothed over
 * time and frequency so it doesn't "warble"). The FFT is injected: in the
 * worker it's PFFFT compiled to WebAssembly with SIMD128; tests use `jsFft`.
 */

/** Real FFT of size n. `forward` writes [re0, reN/2, re1, im1, re2, im2, …]; `inverse` reads that and is unnormalised. */
export type RealFft = { n: number; forward: (input: Float32Array, out: Float32Array) => void; inverse: (input: Float32Array, out: Float32Array) => void }

export const FRAME = 1024
export const HOP = 256

/** Plain radix-2 FFT with PFFFT's ordered layout (fallback and tests). */
export function jsFft(n: number): RealFft {
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  const fft = (inv: boolean) => {
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1
      for (; j & bit; bit >>= 1) j ^= bit
      j ^= bit
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inv ? 2 : -2) * Math.PI) / len
      for (let i = 0; i < n; i += len) {
        for (let k = 0; k < len / 2; k++) {
          const wr = Math.cos(ang * k), wi = Math.sin(ang * k)
          const a = i + k, b = a + len / 2
          const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr
          re[b] = re[a] - tr; im[b] = im[a] - ti
          re[a] += tr; im[a] += ti
        }
      }
    }
  }
  return {
    n,
    forward(input, out) {
      for (let i = 0; i < n; i++) { re[i] = input[i]; im[i] = 0 }
      fft(false)
      out[0] = re[0]; out[1] = re[n / 2]
      for (let k = 1; k < n / 2; k++) { out[2 * k] = re[k]; out[2 * k + 1] = im[k] }
    },
    inverse(input, out) {
      re[0] = input[0]; im[0] = 0; re[n / 2] = input[1]; im[n / 2] = 0
      for (let k = 1; k < n / 2; k++) { re[k] = input[2 * k]; im[k] = input[2 * k + 1]; re[n - k] = input[2 * k]; im[n - k] = -input[2 * k + 1] }
      fft(true)
      for (let i = 0; i < n; i++) out[i] = re[i]
    },
  }
}

const hann = (() => {
  const w = new Float32Array(FRAME)
  for (let i = 0; i < FRAME; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / FRAME)
  return w
})()

/** Magnitude of bin k from the ordered layout. */
const mag = (s: Float32Array, k: number, n: number) => (k === 0 ? Math.abs(s[0]) : k === n / 2 ? Math.abs(s[1]) : Math.hypot(s[2 * k], s[2 * k + 1]))

function frames(signal: Float32Array) {
  return Math.max(1, Math.ceil((signal.length - FRAME) / HOP) + 1)
}

/** Per-bin noise floor: the mean magnitude of the quietest `quantile` of frames. */
export function noiseProfile(signal: Float32Array, fft: RealFft, quantile = 0.1): Float32Array {
  const bins = FRAME / 2 + 1
  const nf = frames(signal)
  const buf = new Float32Array(FRAME)
  const spec = new Float32Array(FRAME)
  const energies: { e: number; m: Float32Array }[] = []
  for (let f = 0; f < nf; f++) {
    const off = f * HOP
    for (let i = 0; i < FRAME; i++) buf[i] = (signal[off + i] ?? 0) * hann[i]
    fft.forward(buf, spec)
    const m = new Float32Array(bins)
    let e = 0
    for (let k = 0; k < bins; k++) { m[k] = mag(spec, k, FRAME); e += m[k] * m[k] }
    energies.push({ e, m })
  }
  energies.sort((a, b) => a.e - b.e)
  const take = energies.slice(0, Math.max(1, Math.round(energies.length * quantile)))
  const profile = new Float32Array(bins)
  for (const { m } of take) for (let k = 0; k < bins; k++) profile[k] += m[k] / take.length
  return profile
}

/**
 * Attenuates bins below `threshold × noise floor`. `strength` 0..1 sets how
 * far noise is pushed down (1 ≈ −30 dB). Returns a new signal of the same length.
 */
export function spectralGate(signal: Float32Array, profile: Float32Array, fft: RealFft, strength = 0.8, threshold = 1.8): Float32Array {
  const bins = FRAME / 2 + 1
  const nf = frames(signal)
  const out = new Float32Array(signal.length + FRAME)
  const norm = new Float32Array(signal.length + FRAME)
  const buf = new Float32Array(FRAME)
  const spec = new Float32Array(FRAME)
  const back = new Float32Array(FRAME)
  const floor = 1 - strength * 0.97
  let prev = new Float32Array(bins).fill(1)
  const gain = new Float32Array(bins)
  for (let f = 0; f < nf; f++) {
    const off = f * HOP
    for (let i = 0; i < FRAME; i++) buf[i] = (signal[off + i] ?? 0) * hann[i]
    fft.forward(buf, spec)
    for (let k = 0; k < bins; k++) {
      const ratio = mag(spec, k, FRAME) / (profile[k] * threshold + 1e-9)
      // Soft knee: fully open well above the floor, down to `floor` at or below it.
      const g = ratio >= 2 ? 1 : ratio <= 1 ? floor : floor + (1 - floor) * (ratio - 1)
      gain[k] = g
    }
    // Smooth across frequency (3-tap) and time (fast attack, slower release).
    const next = new Float32Array(bins)
    for (let k = 0; k < bins; k++) {
      const s = (gain[Math.max(0, k - 1)] + 2 * gain[k] + gain[Math.min(bins - 1, k + 1)]) / 4
      next[k] = s > prev[k] ? s : prev[k] * 0.6 + s * 0.4
    }
    prev = next
    spec[0] *= next[0]
    spec[1] *= next[bins - 1]
    for (let k = 1; k < bins - 1; k++) { spec[2 * k] *= next[k]; spec[2 * k + 1] *= next[k] }
    fft.inverse(spec, back)
    for (let i = 0; i < FRAME; i++) {
      out[off + i] += (back[i] / FRAME) * hann[i]
      norm[off + i] += hann[i] * hann[i]
    }
  }
  const res = new Float32Array(signal.length)
  for (let i = 0; i < res.length; i++) res[i] = norm[i] > 1e-6 ? out[i] / norm[i] : 0
  return res
}

/** Log-magnitude spectrogram as bytes: `cols` time slices × `rows` log-spaced bands (for the 3D mountain). */
export function spectrogram(signal: Float32Array, sampleRate: number, fft: RealFft, cols = 160, rows = 64): Uint8Array {
  const out = new Uint8Array(cols * rows)
  const buf = new Float32Array(FRAME)
  const spec = new Float32Array(FRAME)
  const bins = FRAME / 2
  const fMin = 60, fMax = Math.min(12000, sampleRate / 2)
  for (let c = 0; c < cols; c++) {
    const off = Math.floor((c / cols) * Math.max(0, signal.length - FRAME))
    for (let i = 0; i < FRAME; i++) buf[i] = (signal[off + i] ?? 0) * hann[i]
    fft.forward(buf, spec)
    for (let r = 0; r < rows; r++) {
      const lo = fMin * Math.pow(fMax / fMin, r / rows)
      const hi = fMin * Math.pow(fMax / fMin, (r + 1) / rows)
      const k0 = Math.max(1, Math.floor((lo / sampleRate) * FRAME))
      const k1 = Math.min(bins - 1, Math.max(k0, Math.ceil((hi / sampleRate) * FRAME)))
      let m = 0
      for (let k = k0; k <= k1; k++) m = Math.max(m, mag(spec, k, FRAME))
      const db = 20 * Math.log10(m / FRAME + 1e-9)
      out[c * rows + r] = Math.max(0, Math.min(255, Math.round(((db + 90) / 80) * 255)))
    }
  }
  return out
}

export const rmsDb = (s: Float32Array, from = 0, to = s.length) => {
  let e = 0
  for (let i = from; i < to; i++) e += s[i] * s[i]
  return 10 * Math.log10(e / Math.max(1, to - from) + 1e-12)
}

/** Brings speech to about −18 dBFS RMS (measured on voiced parts only) with a peak ceiling of −1 dBFS. */
export function levelVoice(s: Float32Array, sampleRate: number, targetDb = -18): Float32Array {
  const win = Math.round(sampleRate * 0.05)
  const loud: number[] = []
  for (let i = 0; i + win <= s.length; i += win) { const d = rmsDb(s, i, i + win); if (d > -50) loud.push(d) }
  if (!loud.length) return s.slice()
  const voiced = 10 * Math.log10(loud.reduce((a, d) => a + Math.pow(10, d / 10), 0) / loud.length)
  let peak = 0
  for (let i = 0; i < s.length; i++) peak = Math.max(peak, Math.abs(s[i]))
  const g = Math.min(Math.pow(10, (targetDb - voiced) / 20), 0.89 / Math.max(peak, 1e-6))
  return s.map((v) => v * g)
}

/** Shortens pauses longer than `maxGap` seconds down to `maxGap` (with short fades so cuts don't click). */
export function trimSilence(s: Float32Array, sampleRate: number, maxGap = 0.6, thresholdDb = -45): Float32Array {
  const win = Math.round(sampleRate * 0.02)
  const quiet: boolean[] = []
  for (let i = 0; i < s.length; i += win) quiet.push(rmsDb(s, i, Math.min(s.length, i + win)) < thresholdDb)
  const keep = Math.round(maxGap / 0.02)
  const parts: Float32Array[] = []
  let run = 0
  for (let w = 0; w < quiet.length; w++) {
    run = quiet[w] ? run + 1 : 0
    if (quiet[w] && run > keep) continue
    parts.push(s.subarray(w * win, Math.min(s.length, (w + 1) * win)))
  }
  const total = parts.reduce((a, p) => a + p.length, 0)
  const out = new Float32Array(total)
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

/** Chunks with overlap for parallel processing; `join` crossfades them back. */
export function split(s: Float32Array, parts: number, overlap: number) {
  const size = Math.ceil(s.length / parts)
  const out: { start: number; data: Float32Array }[] = []
  for (let p = 0; p < parts; p++) {
    const a = Math.max(0, p * size - overlap)
    const b = Math.min(s.length, (p + 1) * size + overlap)
    if (a < b) out.push({ start: a, data: s.slice(a, b) })
  }
  return out
}

export function join(chunks: { start: number; data: Float32Array }[], length: number): Float32Array {
  const out = new Float32Array(length)
  const w = new Float32Array(length)
  for (const { start, data } of chunks) {
    const fade = Math.min(2048, Math.floor(data.length / 4))
    for (let i = 0; i < data.length && start + i < length; i++) {
      const edge = Math.min(1, (i + 1) / fade, (data.length - i) / fade)
      out[start + i] += data[i] * edge
      w[start + i] += edge
    }
  }
  for (let i = 0; i < length; i++) if (w[i] > 0) out[i] /= w[i]
  return out
}

/** 16-bit PCM mono WAV. */
export function encodeWav(s: Float32Array, sampleRate: number): Blob {
  const buf = new ArrayBuffer(44 + s.length * 2)
  const v = new DataView(buf)
  const str = (o: number, t: string) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)) }
  str(0, 'RIFF'); v.setUint32(4, 36 + s.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ')
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sampleRate, true)
  v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, s.length * 2, true)
  for (let i = 0; i < s.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, s[i])) * 0x7fff, true)
  return new Blob([buf], { type: 'audio/wav' })
}

/** How much quieter the noise floor got, in dB (quietest 10% of 50 ms windows). */
export function noiseFloorDb(s: Float32Array, sampleRate: number) {
  const win = Math.round(sampleRate * 0.05)
  const d: number[] = []
  for (let i = 0; i + win <= s.length; i += win) d.push(rmsDb(s, i, i + win))
  d.sort((a, b) => a - b)
  const q = d.slice(0, Math.max(1, Math.round(d.length * 0.1)))
  return q.reduce((a, x) => a + x, 0) / q.length
}
