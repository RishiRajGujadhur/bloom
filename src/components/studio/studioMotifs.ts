/**
 * Page-specific motifs for Studio backdrops: what floats in the scene, how it
 * moves, and the shape of the flowing line. Every studio page gets its own,
 * so no two pages share the same background.
 */
export type MotifAnim = 'fall' | 'rise' | 'drift' | 'spin' | 'pulse' | 'march' | 'flip' | 'blink' | 'orbit' | 'sway'
export type Motif = { glyphs: string[]; anim: MotifAnim; count: number; size: [number, number] }

export const MOTIFS: Record<string, Motif> = {
  money: { glyphs: ['🪙', '💰', '💶', '🪙'], anim: 'fall', count: 14, size: [22, 40] },
  code: { glyphs: ['{', '}', '</>', ';', '=>', '[ ]', '()'], anim: 'rise', count: 18, size: [22, 44] },
  english: { glyphs: ['A', 'b', 'é', '?', 'Ñ', '“ ”', 'th', 'ing'], anim: 'drift', count: 16, size: [24, 52] },
  chess: { glyphs: ['♞', '♜', '♝', '♛', '♚', '♟'], anim: 'march', count: 10, size: [34, 60] },
  games: { glyphs: ['🎲', '🧩', '🎯', '🃏'], anim: 'spin', count: 10, size: [26, 44] },
  cards: { glyphs: ['🂡', '🂱', '🃁', '🃑'], anim: 'flip', count: 10, size: [34, 56] },
  sounds: { glyphs: ['♪', '♫', '♬', '𝄞'], anim: 'sway', count: 14, size: [26, 50] },
  eyes: { glyphs: ['👁', '◉', '20·20·20'], anim: 'blink', count: 8, size: [26, 46] },
  run: { glyphs: ['👣'], anim: 'march', count: 12, size: [22, 34] },
  yoga: { glyphs: ['🪷', '☯', '✿'], anim: 'pulse', count: 9, size: [30, 54] },
  affirm: { glyphs: ['♥', '✦', '♡'], anim: 'rise', count: 16, size: [18, 38] },
  joys: { glyphs: ['🎈', '✨', '🌼', '🍭'], anim: 'rise', count: 12, size: [24, 42] },
  fasting: { glyphs: ['🌙', '☀️', '⏳'], anim: 'orbit', count: 6, size: [30, 50] },
  intervals: { glyphs: ['⏱', '▶', '❚❚', '↻'], anim: 'pulse', count: 10, size: [26, 46] },
  roadmap: { glyphs: ['🚩', '📍', '⛳'], anim: 'march', count: 8, size: [26, 40] },
  routines: { glyphs: ['✓', '☐', '☑'], anim: 'fall', count: 14, size: [22, 40] },
  scan: { glyphs: ['▮▯▮▮▯', '▯▮▯▮▮', '⌁'], anim: 'drift', count: 10, size: [22, 36] },
  screen: { glyphs: ['▢', '📱', '⌚', '💻'], anim: 'blink', count: 10, size: [24, 44] },
  stretch: { glyphs: ['〰', '⌒', '∿'], anim: 'sway', count: 12, size: [30, 58] },
  workouts: { glyphs: ['🏋', '⚖', '💪'], anim: 'pulse', count: 9, size: [28, 48] },
  dojo: { glyphs: ['🥋', '✊', '⚡', '🎯'], anim: 'spin', count: 9, size: [26, 46] },
  exercises: { glyphs: ['💪', '🤸', '🏃'], anim: 'drift', count: 9, size: [28, 46] },
  body: { glyphs: ['📏', '⌖', '◎'], anim: 'pulse', count: 8, size: [26, 44] },
  breathwork: { glyphs: ['○', '◯', '◌'], anim: 'pulse', count: 10, size: [40, 90] },
  mirror: { glyphs: ['◇', '◆', '✧'], anim: 'flip', count: 12, size: [22, 42] },
  pointer: { glyphs: ['➶', '➹', '⌖', '✦'], anim: 'orbit', count: 10, size: [22, 40] },
  scanfood: { glyphs: ['🍎', '🥦', '🍋'], anim: 'fall', count: 10, size: [24, 40] },
}

/** A per-page line through the scene, derived from the name. */
export function linePath(name: string) {
  let h = 2166136261
  for (let i = 0; i < name.length; i++) h = Math.imul(h ^ name.charCodeAt(i), 16777619)
  const r = (k: number) => (((h >>> 0) * (k * 2654435761 + 97)) % 1000) / 1000
  const style = (h >>> 0) % 4
  const base = 380 + r(1) * 120
  if (style === 0) return `M0 ${base} C 180 ${base - 90 - r(2) * 60}, 320 ${base + 90}, 500 ${base} S 820 ${base - 80 - r(3) * 60}, 1000 ${base + 10}`
  if (style === 1) {
    const pts = Array.from({ length: 9 }, (_, i) => `${i * 125} ${base - (i % 2 ? 60 + r(i + 4) * 90 : 0)}`)
    return `M${pts.join(' L')}`
  }
  if (style === 2) {
    let d = `M0 ${base}`
    for (let x = 0; x <= 1000; x += 40) d += ` L${x} ${base + Math.sin(x / (40 + r(5) * 60)) * (20 + r(6) * 40)}`
    return d
  }
  return `M0 ${base} L${260 + r(7) * 100} ${base} L${300 + r(7) * 100} ${base - 70} L${340 + r(7) * 100} ${base + 80} L${380 + r(7) * 100} ${base - 30} L${420 + r(7) * 100} ${base} L1000 ${base}`
}
