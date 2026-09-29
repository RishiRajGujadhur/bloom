import { encodeWav, FRAME, join, jsFft, levelVoice, noiseFloorDb, noiseProfile, rmsDb, spectralGate, split, trimSilence } from '../src/features/voice/soundModel'

const RATE = 16000
/** A deterministic pseudo-random generator so the tests don't flake. */
const rng = (seed: number) => () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1

/** 1 s of hiss, then 1 s of a 440 Hz "voice" on top of the hiss, then 1 s of hiss. */
function noisySpeech() {
  const r = rng(7)
  const s = new Float32Array(RATE * 3)
  for (let i = 0; i < s.length; i++) {
    s[i] = r() * 0.02
    if (i >= RATE && i < 2 * RATE) s[i] += 0.4 * Math.sin((2 * Math.PI * 440 * i) / RATE)
  }
  return s
}

describe('Sound Lab DSP', () => {
  it('jsFft round-trips a signal (forward then inverse / N)', () => {
    const fft = jsFft(FRAME)
    const x = new Float32Array(FRAME).map((_, i) => Math.sin(i / 7) + 0.3 * Math.cos(i / 3))
    const spec = new Float32Array(FRAME)
    const back = new Float32Array(FRAME)
    fft.forward(x, spec)
    fft.inverse(spec, back)
    for (let i = 0; i < FRAME; i += 97) expect(back[i] / FRAME).toBeCloseTo(x[i], 4)
  })

  it('the spectral gate lowers the hiss by well over 10 dB and keeps the voice', () => {
    const s = noisySpeech()
    const fft = jsFft(FRAME)
    const out = spectralGate(s, noiseProfile(s, fft), fft, 1)
    expect(rmsDb(s, 0, RATE) - rmsDb(out, 0, RATE)).toBeGreaterThan(10)
    expect(Math.abs(rmsDb(out, RATE + 2000, 2 * RATE - 2000) - rmsDb(s, RATE + 2000, 2 * RATE - 2000))).toBeLessThan(1.5)
    expect(noiseFloorDb(out, RATE)).toBeLessThan(noiseFloorDb(s, RATE) - 10)
  })

  it('split/join with overlaps reconstructs the signal exactly', () => {
    const s = new Float32Array(10000).map((_, i) => Math.sin(i / 10))
    const back = join(split(s, 4, 500), s.length)
    for (let i = 0; i < s.length; i += 123) expect(back[i]).toBeCloseTo(s[i], 5)
  })

  it('levelVoice brings quiet speech up without clipping', () => {
    const s = new Float32Array(RATE).map((_, i) => 0.02 * Math.sin(i / 5))
    const out = levelVoice(s, RATE)
    expect(rmsDb(out)).toBeGreaterThan(rmsDb(s) + 10)
    expect(Math.max(...out.map(Math.abs))).toBeLessThanOrEqual(0.9)
  })

  it('trimSilence shortens a long pause to the maximum gap', () => {
    const s = new Float32Array(RATE * 4)
    for (let i = 0; i < RATE; i++) s[i] = 0.3 * Math.sin(i / 4)
    for (let i = 3 * RATE; i < 4 * RATE; i++) s[i] = 0.3 * Math.sin(i / 4)
    const out = trimSilence(s, RATE, 0.5)
    expect(out.length / RATE).toBeCloseTo(2.5, 1)
  })

  it('encodes a valid 16-bit mono WAV header', async () => {
    const blob = encodeWav(new Float32Array([0, 0.5, -0.5, 1]), 48000)
    const buf = await new Promise<ArrayBuffer>((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result as ArrayBuffer); fr.readAsArrayBuffer(blob) })
    const v = new DataView(buf)
    expect(String.fromCharCode(v.getUint8(0), v.getUint8(1), v.getUint8(2), v.getUint8(3))).toBe('RIFF')
    expect(v.getUint32(24, true)).toBe(48000)
    expect(v.getUint16(34, true)).toBe(16)
    expect(v.getInt16(44 + 6, true)).toBe(0x7fff)
  })
})
