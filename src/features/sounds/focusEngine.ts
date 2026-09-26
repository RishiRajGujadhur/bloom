import Tuna from 'tunajs'

/**
 * Functional music, generated live. Notes from a mode-specific scale are
 * scheduled a little ahead of time; the mix passes through tuna.js effects:
 *   chorus → tremolo (the "neural phase" amplitude modulation, at a rate
 *   matched to the mode's brainwave band) → ping-pong delay → master.
 * A singleton, so music keeps playing while you use other pages.
 */
export type Mode = 'focus' | 'relax' | 'sleep' | 'meditate'
export type Genre = 'ambient' | 'piano' | 'lofi' | 'nature'

export const modes: Record<Mode, { label: string; band: string; am: number; beat: number; bpm: number; root: number; scale: number[]; density: number; color: string }> = {
  focus: { label: 'Focus', band: 'Beta', am: 16, beat: 16, bpm: 108, root: 261.63, scale: [0, 2, 4, 7, 9, 12], density: 0.75, color: '#e2703f' },
  relax: { label: 'Relax', band: 'Alpha', am: 10, beat: 10, bpm: 72, root: 220, scale: [0, 3, 5, 7, 10, 12], density: 0.45, color: '#3f8a76' },
  meditate: { label: 'Meditate', band: 'Theta', am: 6, beat: 6, bpm: 56, root: 196, scale: [0, 2, 7, 9, 12], density: 0.3, color: '#8f7ae5' },
  sleep: { label: 'Sleep', band: 'Delta', am: 2, beat: 3, bpm: 44, root: 146.83, scale: [0, 5, 7, 12], density: 0.2, color: '#3f6fb5' },
}

type Opts = { mode: Mode; genre: Genre; intensity: number; binaural: boolean; neural: boolean; fade: boolean }

class Engine {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  analyser: AnalyserNode | null = null
  private bus: GainNode | null = null
  private tremolo: { intensity: number; rate: number } | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private endTimer: ReturnType<typeof setTimeout> | null = null
  private binaural: { l: OscillatorNode; r: OscillatorNode; g: GainNode } | null = null
  private noise: { src: AudioBufferSourceNode; g: GainNode } | null = null
  private next = 0
  private step = 0
  opts: Opts = { mode: 'focus', genre: 'ambient', intensity: 0.5, binaural: false, neural: true, fade: true }
  playing = false
  endsAt: number | null = null
  private listeners = new Set<() => void>()

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => void this.listeners.delete(fn)
  }
  private emit() {
    this.listeners.forEach((l) => l())
  }

  private build() {
    const ctx = new AudioContext()
    const tuna = new Tuna(ctx)
    const bus = ctx.createGain()
    const chorus = new tuna.Chorus({ rate: 0.6, feedback: 0.25, delay: 0.0045, bypass: false })
    const tremolo = new tuna.Tremolo({ intensity: 0.4, rate: 16, stereoPhase: 0, bypass: false })
    const delay = new tuna.PingPongDelay({ wetLevel: 0.25, feedback: 0.35, delayTimeLeft: 280, delayTimeRight: 420 })
    const master = ctx.createGain()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    master.gain.value = 0
    bus.connect(chorus.input)
    chorus.connect(tremolo.input)
    tremolo.connect(delay.input)
    delay.connect(master)
    master.connect(analyser)
    analyser.connect(ctx.destination)
    this.ctx = ctx
    this.bus = bus
    this.master = master
    this.analyser = analyser
    this.tremolo = tremolo as unknown as { intensity: number; rate: number }
  }

  set(p: Partial<Opts>) {
    this.opts = { ...this.opts, ...p }
    const m = modes[this.opts.mode]
    if (this.tremolo) {
      this.tremolo.rate = m.am
      this.tremolo.intensity = this.opts.neural ? 0.15 + this.opts.intensity * 0.6 : 0
    }
    if (this.playing) {
      this.setBinaural(this.opts.binaural)
      this.setNoise(this.opts.genre === 'nature' || this.opts.genre === 'lofi')
    }
    this.emit()
  }

  private note(freq: number, at: number, len: number, kind: Genre, vel: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    const f = ctx.createBiquadFilter()
    o.type = kind === 'piano' ? 'triangle' : kind === 'lofi' ? 'square' : 'sine'
    o.frequency.value = freq
    f.type = 'lowpass'
    f.frequency.value = kind === 'lofi' ? 900 : kind === 'piano' ? 2600 : 1800
    const attack = kind === 'piano' ? 0.005 : 0.4
    g.gain.setValueAtTime(0.0001, at)
    g.gain.exponentialRampToValueAtTime(0.07 * vel, at + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, at + len)
    o.connect(f).connect(g).connect(this.bus!)
    o.start(at)
    o.stop(at + len + 0.05)
  }

  /** Schedule notes ~200 ms ahead so timing stays steady. */
  private tick = () => {
    const ctx = this.ctx
    if (!ctx) return
    const m = modes[this.opts.mode]
    const beat = 60 / m.bpm
    while (this.next < ctx.currentTime + 0.25) {
      const t = this.next
      const step = this.step++
      const pick = m.scale[(step * 5 + Math.floor(Math.random() * 3)) % m.scale.length]
      const octave = this.opts.genre === 'piano' ? 2 : 1
      if (Math.random() < m.density) this.note(m.root * octave * Math.pow(2, pick / 12), t, this.opts.genre === 'piano' ? 1.6 : beat * 3, this.opts.genre, 0.6 + Math.random() * 0.4)
      // A soft pad chord every bar.
      if (step % 4 === 0) [0, 7, 12].forEach((s) => this.note((m.root / 2) * Math.pow(2, s / 12), t, beat * 4.2, 'ambient', 0.5))
      this.next += this.opts.genre === 'lofi' && step % 2 ? beat * 0.62 : beat * (this.opts.genre === 'lofi' ? 0.38 : 0.5) * 2
    }
  }

  private setBinaural(on: boolean) {
    const ctx = this.ctx!
    if (!on && this.binaural) {
      this.binaural.l.stop()
      this.binaural.r.stop()
      this.binaural = null
    }
    if (on) {
      const m = modes[this.opts.mode]
      if (this.binaural) {
        this.binaural.r.frequency.value = 200 + m.beat
        return
      }
      const g = ctx.createGain()
      g.gain.value = 0.05
      const merger = ctx.createChannelMerger(2)
      const l = ctx.createOscillator()
      const r = ctx.createOscillator()
      l.frequency.value = 200
      r.frequency.value = 200 + m.beat
      l.connect(merger, 0, 0)
      r.connect(merger, 0, 1)
      merger.connect(g).connect(this.master!)
      l.start()
      r.start()
      this.binaural = { l, r, g }
    }
  }

  private setNoise(on: boolean) {
    const ctx = this.ctx!
    if (!on && this.noise) {
      this.noise.src.stop()
      this.noise = null
    }
    if (on && !this.noise) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
      const d = buf.getChannelData(0)
      let b = 0
      for (let i = 0; i < d.length; i++) {
        b = 0.98 * b + 0.02 * (Math.random() * 2 - 1)
        d[i] = b * 3 + (Math.random() < 0.0004 ? Math.random() * 0.6 : 0)
      }
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.loop = true
      const g = ctx.createGain()
      g.gain.value = 0.12
      src.connect(g).connect(this.master!)
      src.start()
      this.noise = { src, g }
    }
  }

  async play(minutes: number | null) {
    if (!this.ctx) this.build()
    const ctx = this.ctx!
    await ctx.resume()
    this.playing = true
    this.next = ctx.currentTime + 0.05
    this.set({})
    this.timer = setInterval(this.tick, 60)
    const g = this.master!.gain
    g.cancelScheduledValues(ctx.currentTime)
    g.setValueAtTime(g.value, ctx.currentTime)
    g.linearRampToValueAtTime(0.9, ctx.currentTime + (this.opts.fade ? 4 : 0.05))
    this.endsAt = minutes ? Date.now() + minutes * 60_000 : null
    if (this.endTimer) clearTimeout(this.endTimer)
    if (minutes) this.endTimer = setTimeout(() => this.stop(true), minutes * 60_000)
    this.emit()
  }

  stop(finished = false) {
    const ctx = this.ctx
    if (!ctx || !this.playing) return
    const fade = this.opts.fade ? 5 : 0.05
    this.master!.gain.cancelScheduledValues(ctx.currentTime)
    this.master!.gain.setValueAtTime(this.master!.gain.value, ctx.currentTime)
    this.master!.gain.linearRampToValueAtTime(0, ctx.currentTime + fade)
    setTimeout(() => {
      if (this.timer) clearInterval(this.timer)
      this.timer = null
      this.setBinaural(false)
      this.setNoise(false)
    }, fade * 1000)
    if (this.endTimer) clearTimeout(this.endTimer)
    this.playing = false
    this.endsAt = null
    this.emit()
    if (finished) window.dispatchEvent(new CustomEvent('bloom:sounds-finished'))
  }
}

export const engine = new Engine()
