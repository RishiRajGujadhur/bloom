export type GameId = 'nback' | 'memory' | 'stroop' | 'reaction' | 'maths'
export type Skill = 'memory' | 'attention' | 'speed' | 'maths'
export const games: { id: GameId; name: string; emoji: string; skill: Skill; blurb: string }[] = [
  { id: 'nback', name: 'N-back', emoji: '🔲', skill: 'memory', blurb: 'Tap when the square repeats from N steps back.' },
  { id: 'memory', name: 'Memory grid', emoji: '🧩', skill: 'memory', blurb: 'Remember the lit tiles, then tap them.' },
  { id: 'stroop', name: 'Colour clash', emoji: '🎨', skill: 'attention', blurb: 'Pick the ink colour, not the word.' },
  { id: 'reaction', name: 'Reaction', emoji: '⚡', skill: 'speed', blurb: 'Tap the moment it turns green.' },
  { id: 'maths', name: 'Speed maths', emoji: '➗', skill: 'maths', blurb: 'Solve as many as you can in 45 s.' },
]
export type Result = { at: number; game: GameId; level: number; score: number; accuracy: number }
export type GamesStore = { levels: Record<GameId, number>; results: Result[]; sound: boolean }
export const GAMES_KEY = 'bloom-games-v1'

/** Seeded RNG so each session is reproducible in tests. */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

/** Position stream for n-back with ~30% targets. */
export function nbackSequence(n: number, length: number, rand = Math.random) {
  const seq: number[] = []
  for (let i = 0; i < length; i++) {
    if (i >= n && rand() < 0.3) seq.push(seq[i - n])
    else {
      let p = Math.floor(rand() * 9)
      if (i >= n && p === seq[i - n]) p = (p + 1 + Math.floor(rand() * 8)) % 9
      seq.push(p)
    }
  }
  return seq
}
export const isTarget = (seq: number[], i: number, n: number) => i >= n && seq[i] === seq[i - n]
export function scoreNback(seq: number[], n: number, pressed: Set<number>) {
  let hits = 0, misses = 0, false_ = 0, correctRejections = 0
  for (let i = n; i < seq.length; i++) {
    const t = isTarget(seq, i, n)
    if (t && pressed.has(i)) hits++
    else if (t) misses++
    else if (pressed.has(i)) false_++
    else correctRejections++
  }
  const total = hits + misses + false_ + correctRejections
  return { hits, misses, false: false_, accuracy: total ? (hits + correctRejections) / total : 0 }
}

/** Memory grid difficulty: grid size and how many tiles light up. */
export const memorySetup = (level: number) => ({ size: Math.min(6, 3 + Math.floor(level / 3)), tiles: Math.min(14, 3 + level) })
export function memoryPattern(size: number, tiles: number, rand = Math.random) {
  const cells = Array.from({ length: size * size }, (_, i) => i)
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  return new Set(cells.slice(0, tiles))
}

export const stroopColors = [
  { name: 'Red', hex: '#e2553f' },
  { name: 'Blue', hex: '#3f7fd0' },
  { name: 'Green', hex: '#3f8a5a' },
  { name: 'Yellow', hex: '#d9a400' },
  { name: 'Purple', hex: '#8f7ae5' },
]
export function stroopTrial(level: number, rand = Math.random) {
  const pool = stroopColors.slice(0, Math.min(stroopColors.length, 3 + Math.floor(level / 2)))
  const word = pool[Math.floor(rand() * pool.length)]
  const congruent = rand() < Math.max(0.15, 0.5 - level * 0.05)
  const ink = congruent ? word : pool.filter((c) => c.name !== word.name)[Math.floor(rand() * (pool.length - 1))]
  return { word: word.name, ink: ink.name, options: pool.map((c) => c.name) }
}

export function mathsProblem(level: number, rand = Math.random) {
  const max = 10 + level * 8
  const ops = level < 2 ? ['+', '−'] : level < 5 ? ['+', '−', '×'] : ['+', '−', '×', '÷']
  const op = ops[Math.floor(rand() * ops.length)]
  let a = 1 + Math.floor(rand() * max)
  let b = 1 + Math.floor(rand() * max)
  if (op === '×') {
    a = 2 + Math.floor(rand() * (3 + level))
    b = 2 + Math.floor(rand() * 12)
  }
  if (op === '÷') {
    b = 2 + Math.floor(rand() * (3 + level))
    a = b * (1 + Math.floor(rand() * 12))
  }
  if (op === '−' && b > a) [a, b] = [b, a]
  const answer = op === '+' ? a + b : op === '−' ? a - b : op === '×' ? a * b : a / b
  return { text: `${a} ${op} ${b}`, answer }
}

/** Adaptive difficulty: step up at ≥80 %, down below 50 %. */
export const nextLevel = (level: number, accuracy: number) => Math.max(1, Math.min(20, level + (accuracy >= 0.8 ? 1 : accuracy < 0.5 ? -1 : 0)))

/** Reaction ms → 0–100 score (150 ms ≈ 100, 450 ms ≈ 0). */
export const reactionScore = (ms: number) => Math.round(Math.max(0, Math.min(100, ((450 - ms) / 300) * 100)))

/** Recent performance per skill, 0–100. */
export function skillScores(results: Result[]) {
  const out: Record<Skill, number> = { memory: 0, attention: 0, speed: 0, maths: 0 }
  for (const s of Object.keys(out) as Skill[]) {
    const r = results.filter((x) => games.find((g) => g.id === x.game)?.skill === s).slice(-6)
    out[s] = r.length ? Math.round(r.reduce((t, x) => t + Math.min(100, x.accuracy * 60 + x.level * 4), 0) / r.length) : 0
  }
  return out
}

/** Three games a day, rotating by date. */
export function dailyWorkout(date: string) {
  const n = Number(date.replace(/-/g, '')) % games.length
  return [0, 1, 2].map((i) => games[(n + i * 2) % games.length].id)
}
