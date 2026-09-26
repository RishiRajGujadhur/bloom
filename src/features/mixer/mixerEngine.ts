import { createNoise2D } from 'simplex-noise'

/**
 * Procedural soundscapes: every layer is synthesised (no audio files), then
 * simplex noise drifts each layer's level, tone and position so the scene
 * never loops — waves swell, wind gusts, fire crackles, birds wander.
 */
export type LayerId = 'rain' | 'wind' | 'ocean' | 'fire' | 'birds' | 'stream' | 'white' | 'pink' | 'brown'
export const layers: { id: LayerId; label: string; emoji: string; noise?: boolean }[] = [
  { id: 'rain', label: 'Rain', emoji: '🌧️' },
  { id: 'wind', label: 'Wind', emoji: '🌬️' },
  { id: 'ocean', label: 'Ocean', emoji: '🌊' },
  { id: 'fire', label: 'Fire', emoji: '🔥' },
  { id: 'birds', label: 'Birds', emoji: '🐦' },
  { id: 'stream', label: 'Stream', emoji: '💧' },
  { id: 'white', label: 'White noise', emoji: '⚪', noise: true },
  { id: 'pink', label: 'Pink noise', emoji: '🌸', noise: true },
  { id: 'brown', label: 'Brown noise', emoji: '🟤', noise: true },
]
export type Mix = Partial<Record<LayerId, number>>
export const presets: { id: string; name: string; emoji: string; mix: Mix }[] = [
  { id: 'rainynight', name: 'Rainy night', emoji: '🌧️', mix: { rain: 0.8, wind: 0.3, brown: 0.2 } },
  { id: 'beach', name: 'Beach', emoji: '🏖️', mix: { ocean: 0.8, wind: 0.25, birds: 0.2 } },
  { id: 'campfire', name: 'Campfire', emoji: '🏕️', mix: { fire: 0.8, wind: 0.2, stream: 0.2 } },
  { id: 'forest', name: 'Forest morning', emoji: '🌲', mix: { birds: 0.6, stream: 0.5, wind: 0.2 } },
  { id: 'deep', name: 'Deep focus', emoji: '🧠', mix: { brown: 0.7, rain: 0.2 } },
]

/** Coloured noise buffers (Voss–McCartney pink, integrated brown). */
function noiseBuffer(ctx: AudioContext, colour: 'white' | 'pink' | 'brown') {
  const buf = ctx.createBuffer(2, ctx.sampleRate * 4, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1
      if (colour === 'white') d[i] = w * 0.5
      else if (colour === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      } else {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.5
      }
    }
  }
  return buf
}

type Channel = { gain: GainNode; filter: BiquadFilterNode; pan: StereoPannerNode; src?: AudioBufferSourceNode }

class MixerEngine {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  private ch = new Map<LayerId, Channel>()
  private buffers: Partial<Record<'white' | 'pink' | 'brown', AudioBuffer>> = {}
  private mod: ReturnType<typeof setInterval> | null = null
  private sleep: ReturnType<typeof setTimeout> | null = null
  private noise = createNoise2D()
  private t = 0
  mix: Mix = {}
  playing = false
  organic = true
  spatial = true
  fade = true
  endsAt: number | null = null
  private listeners = new Set<() => void>()
  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => void this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((l) => l())
  }

  private channel(id: LayerId): Channel {
    const existing = this.ch.get(id)
    if (existing) return existing
    const ctx = this.ctx!
    const colour = id === 'white' || id === 'rain' || id === 'stream' ? 'white' : id === 'pink' || id === 'wind' ? 'pink' : 'brown'
    const buffer = (this.buffers[colour] ??= noiseBuffer(ctx, colour))
    const gain = ctx.createGain()
    gain.gain.value = 0
    const filter = ctx.createBiquadFilter()
    const setup: Record<LayerId, [BiquadFilterType, number, number]> = {
      rain: ['bandpass', 2600, 0.6],
      wind: ['lowpass', 500, 1],
      ocean: ['lowpass', 700, 0.7],
      fire: ['lowpass', 300, 0.7],
      birds: ['bandpass', 3000, 8],
      stream: ['bandpass', 1400, 1.2],
      white: ['allpass', 1000, 0.7],
      pink: ['allpass', 1000, 0.7],
      brown: ['lowpass', 900, 0.7],
    }
    const [type, f, q] = setup[id]
    filter.type = type
    filter.frequency.value = f
    filter.Q.value = q
    const pan = ctx.createStereoPanner()
    const c: Channel = { gain, filter, pan }
    if (id !== 'birds') {
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.loop = true
      src.loopStart = Math.random()
      src.connect(filter)
      src.start(0, Math.random() * 3)
      c.src = src
    }
    filter.connect(gain).connect(pan).connect(this.master!)
    this.ch.set(id, c)
    return c
  }

  private chirp(c: Channel, vol: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const t = ctx.currentTime
    const f = 2200 + Math.random() * 2600
    o.frequency.setValueAtTime(f, t)
    o.frequency.exponentialRampToValueAtTime(f * (0.7 + Math.random() * 0.8), t + 0.12)
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.25 * vol, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16)
    o.connect(g).connect(c.pan)
    o.start(t)
    o.stop(t + 0.2)
  }

  private crackle(c: Channel, vol: number) {
    const ctx = this.ctx!
    const src = ctx.createBufferSource()
    src.buffer = this.buffers.white ??= noiseBuffer(ctx, 'white')
    const g = ctx.createGain()
    const t = ctx.currentTime
    g.gain.setValueAtTime(0.4 * vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05)
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1500
    src.connect(hp).connect(g).connect(c.pan)
    src.start(t, Math.random() * 3, 0.1)
  }

  /** Every 100 ms: drift levels, tone and pan with simplex noise. */
  private modulate = () => {
    const ctx = this.ctx
    if (!ctx) return
    this.t += 0.1
    layers.forEach((l, i) => {
      const vol = this.mix[l.id] ?? 0
      const c = this.ch.get(l.id)
      if (!c) return
      const n = this.organic ? this.noise(this.t * 0.08, i * 10) : 0
      let level = vol
      if (l.id === 'ocean') level = vol * (0.55 + 0.45 * Math.sin(this.t * 0.8 + n))
      else if (l.id === 'wind') {
        level = vol * (0.6 + 0.4 * n)
        c.filter.frequency.setTargetAtTime(350 + 450 * (n + 1), ctx.currentTime, 0.5)
      } else if (l.id === 'stream') c.filter.frequency.setTargetAtTime(1300 + 300 * n, ctx.currentTime, 0.2)
      else if (!l.noise) level = vol * (0.85 + 0.15 * n)
      c.gain.gain.setTargetAtTime(level * (l.noise ? 0.6 : 1), ctx.currentTime, 0.3)
      if (this.spatial) c.pan.pan.setTargetAtTime(l.noise ? 0 : this.noise(this.t * 0.03, i * 20 + 5) * 0.8, ctx.currentTime, 1)
      if (vol > 0 && l.id === 'birds' && Math.random() < 0.05 + 0.1 * (n + 1)) {
        this.chirp(c, vol)
        if (Math.random() < 0.5) setTimeout(() => this.chirp(c, vol), 120)
      }
      if (vol > 0 && l.id === 'fire' && Math.random() < 0.25 + 0.2 * n) this.crackle(c, vol)
    })
  }

  setMix(mix: Mix) {
    this.mix = mix
    if (this.playing) for (const l of layers) if ((mix[l.id] ?? 0) > 0) this.channel(l.id)
    this.emit()
  }

  async play(sleepMinutes: number | null) {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
    }
    await this.ctx.resume()
    for (const l of layers) if ((this.mix[l.id] ?? 0) > 0) this.channel(l.id)
    this.master!.gain.setTargetAtTime(0.9, this.ctx.currentTime, this.fade ? 1.2 : 0.02)
    this.mod ??= setInterval(this.modulate, 100)
    this.playing = true
    if (this.sleep) clearTimeout(this.sleep)
    this.endsAt = sleepMinutes ? Date.now() + sleepMinutes * 60_000 : null
    if (sleepMinutes) this.sleep = setTimeout(() => this.stop(), sleepMinutes * 60_000)
    this.emit()
  }

  stop() {
    if (!this.ctx || !this.master) return
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, this.fade ? 1.5 : 0.02)
    this.playing = false
    this.endsAt = null
    if (this.sleep) clearTimeout(this.sleep)
    setTimeout(() => {
      if (this.playing) return
      if (this.mod) clearInterval(this.mod)
      this.mod = null
    }, 6000)
    this.emit()
  }
}

export const mixer = new MixerEngine()
