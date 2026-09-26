import { bassFor, elements, type ElementId } from './stanceModel'

/**
 * Generative Wu Xing soundscape with Tone.js: slow, random pentatonic
 * strikes (bowls, chimes, bells) over a bass drone that deepens and swells as
 * your stance grounds. Tone is loaded only when you press play.
 */
export type WuXingEngine = {
  setElement: (id: ElementId) => void
  setGrounding: (g: number) => void
  setDensity: (d: number) => void
  stop: () => void
}

export async function startWuXing(initial: ElementId, opts: { bass: boolean; chimes: boolean }): Promise<WuXingEngine> {
  const Tone = await import('tone')
  await Tone.start()
  let element = elements[initial]
  let density = 0.5

  const reverb = new Tone.Reverb({ decay: 9, wet: 0.55 }).toDestination()
  const delay = new Tone.FeedbackDelay({ delayTime: '4n.', feedback: 0.35, wet: 0.25 }).connect(reverb)
  const bowl = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2.01,
    modulationIndex: 3,
    envelope: { attack: 0.02, decay: 3, sustain: 0.1, release: 6 },
    modulationEnvelope: { attack: 0.01, decay: 1.5, sustain: 0.2, release: 4 },
    volume: -16,
  }).connect(delay)
  const bell = new Tone.PolySynth(Tone.AMSynth, { harmonicity: 3.5, envelope: { attack: 0.005, decay: 2, sustain: 0, release: 4 }, volume: -20 }).connect(delay)

  const bassFilter = new Tone.Filter(300, 'lowpass').connect(reverb)
  const bass = new Tone.Oscillator(element.root / 4, 'sine').connect(bassFilter)
  const sub = new Tone.Oscillator(element.root / 8, 'triangle').connect(bassFilter)
  bass.volume.value = -48
  sub.volume.value = -60
  if (opts.bass) {
    bass.start()
    sub.start()
  }

  const loop = new Tone.Loop((time) => {
    if (!opts.chimes || Math.random() > 0.35 + density * 0.55) return
    const step = element.scale[Math.floor(Math.random() * element.scale.length)]
    const octave = element.timbre === 'deep' ? 0.5 : element.timbre === 'bright' || element.timbre === 'chime' ? 2 : 1
    const f = element.root * octave * Math.pow(2, step / 12)
    const synth = element.timbre === 'bell' || element.timbre === 'chime' ? bell : bowl
    synth.triggerAttackRelease(f, element.timbre === 'bowl' || element.timbre === 'deep' ? '2n' : '8n', time, 0.4 + Math.random() * 0.5)
  }, '4n')
  Tone.getTransport().bpm.value = 52
  loop.start(0)
  Tone.getTransport().start()

  return {
    setElement(id) {
      element = elements[id]
    },
    setGrounding(g) {
      const b = bassFor(g, element.root)
      bass.frequency.rampTo(b.frequency, 1.2)
      sub.frequency.rampTo(b.frequency / 2, 1.2)
      bass.volume.rampTo(b.volumeDb, 0.8)
      sub.volume.rampTo(b.volumeDb - 6, 0.8)
      bassFilter.frequency.rampTo(b.cutoff, 0.8)
    },
    setDensity(d) {
      density = d
    },
    stop() {
      loop.dispose()
      Tone.getTransport().stop()
      bass.stop()
      sub.stop()
      ;[bowl, bell, bass, sub, bassFilter, delay, reverb].forEach((n) => n.dispose())
    },
  }
}
