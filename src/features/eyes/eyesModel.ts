export type Exercise = { id: string; name: string; emoji: string; seconds: number; cue: string; path?: string }

/** Paths live in a 600×360 box; the dot follows them. */
export const exercises: Exercise[] = [
  { id: 'rule20', name: '20-20-20', emoji: '🌳', seconds: 20, cue: 'Look at something 20 feet (6 m) away for 20 seconds.' },
  { id: 'eight', name: 'Figure eight', emoji: '♾️', seconds: 30, cue: 'Follow the dot with your eyes, head still.', path: 'M300 180 C 380 60, 520 60, 520 180 C 520 300, 380 300, 300 180 C 220 60, 80 60, 80 180 C 80 300, 220 300, 300 180 Z' },
  { id: 'circle', name: 'Slow circles', emoji: '⭕', seconds: 30, cue: 'Trace the circle slowly, then reverse.', path: 'M300 50 A 130 130 0 1 1 299.9 50 Z' },
  { id: 'zigzag', name: 'Zig-zag', emoji: '〰️', seconds: 25, cue: 'Let your eyes glide corner to corner.', path: 'M60 60 L540 60 L60 180 L540 180 L60 300 L540 300' },
  { id: 'nearfar', name: 'Near & far', emoji: '🔭', seconds: 40, cue: 'Focus on your thumb as the dot grows, then far away as it shrinks.' },
  { id: 'blink', name: 'Blink training', emoji: '😌', seconds: 30, cue: 'Blink gently each time the eye closes. Screens halve how often we blink.' },
  { id: 'palming', name: 'Palming', emoji: '🙌', seconds: 60, cue: 'Rub your palms warm and cup them over closed eyes. Breathe.' },
]
export const exerciseById = (id: string) => exercises.find((e) => e.id === id)!
export const routine = ['rule20', 'blink', 'eight', 'nearfar', 'palming']

export type EyesStore = { every: number; enabled: boolean; speed: number; sound: boolean; log: { at: number; id: string }[] }
export const EYES_KEY = 'bloom-eyes-v1'

/** Near/far: 0 → far (small), 1 → near (big), smooth over a 10 s cycle. */
export const nearFar = (t: number) => 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 10)
/** Blink cue: closed for 0.4 s every 3 s. */
export const blinkClosed = (t: number) => t % 3 > 2.6

export function streakDays(log: { at: number }[], now = Date.now()) {
  const days = new Set(log.map((l) => new Date(l.at).toDateString()))
  let n = 0
  const d = new Date(now)
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.has(d.toDateString())) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
