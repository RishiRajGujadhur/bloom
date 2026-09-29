import { hasCap } from '../../platform/caps'
import { opfsRead, opfsWrite } from '../../platform/opfs'
import { encodeWav } from '../voice/soundModel'
import { splitSentences } from './briefingModel'

/**
 * The briefing's voice. Kokoro (an 82M-parameter text-to-speech model) runs
 * on-device, on WebGPU when available and WebAssembly otherwise; today's
 * rendered audio is cached in OPFS so replays are instant and offline. The
 * browser's built-in speech is the fallback.
 */
export const VOICES = [
  { id: 'af_heart', label: 'Heart (warm)' },
  { id: 'af_bella', label: 'Bella (bright)' },
  { id: 'am_michael', label: 'Michael (calm)' },
  { id: 'bf_emma', label: 'Emma (British)' },
  { id: 'bm_george', label: 'George (British)' },
] as const

type Tts = { generate: (t: string, o: { voice: string; speed?: number }) => Promise<{ audio: Float32Array; sampling_rate: number }> }
let ttsP: Promise<Tts> | null = null

export function loadVoice(onProgress: (p: number) => void): Promise<Tts> {
  ttsP ??= import('kokoro-js').then(({ KokoroTTS }) => {
    const gpu = hasCap('gpu')
    return KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: gpu ? 'fp32' : 'q8',
      device: gpu ? 'webgpu' : 'wasm',
      progress_callback: (p: { status: string; progress?: number }) => { if (p.status === 'progress' && p.progress != null) onProgress(p.progress / 100) },
    }) as unknown as Promise<Tts>
  }).catch((e) => { ttsP = null; throw e })
  return ttsP
}

/** Renders the script sentence by sentence (so the transcript can follow along) and caches the result. */
export async function render(text: string, voice: string, key: string, onProgress: (done: number, total: number) => void) {
  const cached = await opfsRead(`briefing/${key}.wav`)
  const marks = await opfsRead(`briefing/${key}.json`)
  if (cached && marks) return { wav: cached, marks: JSON.parse(await marks.text()) as number[] }
  const tts = await loadVoice(() => {})
  const sentences = splitSentences(text)
  const parts: Float32Array[] = []
  const starts: number[] = []
  let rate = 24000
  let t = 0
  for (let i = 0; i < sentences.length; i++) {
    const r = await tts.generate(sentences[i].trim(), { voice })
    rate = r.sampling_rate
    starts.push(t)
    parts.push(r.audio)
    t += r.audio.length / rate
    onProgress(i + 1, sentences.length)
  }
  const all = new Float32Array(parts.reduce((a, p) => a + p.length, 0))
  let o = 0
  for (const p of parts) { all.set(p, o); o += p.length }
  const wav = encodeWav(all, rate)
  await opfsWrite(`briefing/${key}.wav`, wav)
  await opfsWrite(`briefing/${key}.json`, JSON.stringify(starts))
  return { wav, marks: starts }
}

/** Five rising notes from Tone.js before the voice starts. */
export async function jingle() {
  const Tone = await import('tone')
  await Tone.start()
  const synth = new Tone.PolySynth(Tone.FMSynth, { harmonicity: 2, modulationIndex: 3, envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 0.8 } }).toDestination()
  synth.volume.value = -14
  const now = Tone.now()
  ;['C5', 'E5', 'G5', 'B5', 'D6'].forEach((n, i) => synth.triggerAttackRelease(n, '8n', now + i * 0.11))
  await new Promise((r) => setTimeout(r, 1100))
  synth.dispose()
}
