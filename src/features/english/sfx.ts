/** Tiny Web Audio chimes for lessons (no files to load). */
let ctx: AudioContext | null = null
const notes: Record<'right' | 'wrong' | 'tick' | 'done', [number, number][]> = {
  right: [[660, 0], [990, 0.09]],
  wrong: [[220, 0], [180, 0.12]],
  tick: [[880, 0]],
  done: [[523, 0], [659, 0.12], [784, 0.24], [1046, 0.36]],
}
export function sfx(kind: keyof typeof notes) {
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime
    for (const [f, at] of notes[kind]) {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = kind === 'wrong' ? 'triangle' : 'sine'
      o.frequency.value = f
      g.gain.setValueAtTime(0.0001, t0 + at)
      g.gain.exponentialRampToValueAtTime(0.12, t0 + at + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.25)
      o.connect(g).connect(ctx.destination)
      o.start(t0 + at)
      o.stop(t0 + at + 0.3)
    }
  } catch {
    /* audio unavailable */
  }
}
