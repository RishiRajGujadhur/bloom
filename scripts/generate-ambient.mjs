// Original procedural demo stems; no third-party recordings or samples.
// Run: node scripts/generate-ambient.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const directory = fileURLToPath(new URL('../public/audio/', import.meta.url))
mkdirSync(directory, { recursive: true })
const rate = 22050,
  length = rate * 13,
  overlap = rate
let seed = 317
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
  return (seed / 4294967296) * 2 - 1
}
const sine = (frequency, t) => Math.sin(2 * Math.PI * frequency * t)
for (const id of [
  'rain',
  'thunder',
  'wind',
  'space',
  'fire',
  'tavern',
  'strings',
  'cello',
  'piano',
  'brown',
]) {
  const raw = new Float32Array(length)
  let low = 0,
    brown = 0,
    crack = 0
  for (let i = 0; i < length; i++) {
    const t = i / rate,
      white = random()
    low = low * 0.985 + white * 0.015
    brown = (brown + white * 0.025) / 1.025
    crack = random() > 0.999 ? 0.7 : crack * 0.86
    const swell = 0.6 + 0.4 * sine(0.13, t)
    let value = 0
    if (id === 'rain') value = white * 0.3 + low * 2
    if (id === 'thunder')
      value = brown * 3 * Math.pow(0.5 + 0.5 * sine(0.09, t), 4)
    if (id === 'wind') value = low * 4 * swell
    if (id === 'brown') value = brown * 3
    if (id === 'fire') value = low * 1.7 + crack * white
    if (id === 'space') value = sine(55, t) * 0.25 + sine(82.5, t) * 0.1 + low
    if (id === 'tavern')
      value =
        low * 2 +
        sine(143 + 8 * sine(0.7, t), t) * 0.09 * swell +
        sine(217, t) * 0.035
    if (id === 'strings')
      value =
        [130.81, 164.81, 196].reduce(
          (sum, f) => sum + sine(f, t) * 0.1 + sine(f * 2, t) * 0.03,
          0,
        ) * swell
    if (id === 'cello')
      value =
        (sine(130.81, t) * 0.3 +
          sine(261.62, t) * 0.09 +
          sine(392.43, t) * 0.035) *
        swell
    if (id === 'piano') {
      const notes = [261.63, 329.63, 392, 523.25, 392, 329.63]
      const local = t % 2,
        f = notes[Math.floor(t / 2) % notes.length]
      value =
        (sine(f, local) * 0.35 + sine(f * 2, local) * 0.12) *
        Math.min(1, local * 100) *
        Math.exp(-local * 2)
    }
    raw[i] = value
  }
  // Overlap tail with head; end and beginning are adjacent samples in the source.
  const count = length - overlap,
    output = new Float32Array(count)
  for (let i = 0; i < count; i++)
    output[i] =
      i < overlap
        ? raw[count + i] * (1 - i / overlap) + (raw[i] * i) / overlap
        : raw[i]
  let peak = 0
  for (const sample of output) peak = Math.max(peak, Math.abs(sample))
  const buffer = Buffer.alloc(44 + count * 2)
  buffer.write('RIFF')
  buffer.writeUInt32LE(buffer.length - 8, 4)
  buffer.write('WAVEfmt ', 8)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(rate, 24)
  buffer.writeUInt32LE(rate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(count * 2, 40)
  // Conservative headroom: even all ten stems at maximum cannot clip their sum.
  for (let i = 0; i < count; i++)
    buffer.writeInt16LE(
      Math.round((output[i] / peak) * 0.08 * 32767),
      44 + i * 2,
    )
  writeFileSync(`${directory}/${id}.wav`, buffer)
}
console.log('Generated ten original 12-second seamless demo loops.')
