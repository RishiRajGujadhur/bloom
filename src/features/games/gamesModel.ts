export type GameId = 'nback' | 'memory' | 'stroop' | 'reaction' | 'maths' | 'simon' | 'rotate' | 'scramble' | 'track' | 'stream'
export type Skill = 'memory' | 'attention' | 'speed' | 'maths' | 'spatial' | 'language'
export const games: { id: GameId; name: string; emoji: string; skill: Skill; blurb: string }[] = [
  { id: 'nback', name: 'N-back', emoji: '🔲', skill: 'memory', blurb: 'Tap when the square repeats from N steps back.' },
  { id: 'memory', name: 'Memory grid', emoji: '🧩', skill: 'memory', blurb: 'Remember the lit tiles, then tap them.' },
  { id: 'stroop', name: 'Colour clash', emoji: '🎨', skill: 'attention', blurb: 'Pick the ink colour, not the word.' },
  { id: 'reaction', name: 'Reaction', emoji: '⚡', skill: 'speed', blurb: 'Tap the moment it turns green.' },
  { id: 'maths', name: 'Speed maths', emoji: '➗', skill: 'maths', blurb: 'Solve as many as you can in 45 s.' },
  { id: 'simon', name: 'Pattern echo', emoji: '🎵', skill: 'memory', blurb: 'Watch the pads light up, then play the pattern back.' },
  { id: 'rotate', name: '3D rotation', emoji: '🧊', skill: 'spatial', blurb: 'Same shape turned, or its mirror image?' },
  { id: 'scramble', name: 'Word scramble', emoji: '🔤', skill: 'language', blurb: 'Unscramble the letters into a word.' },
  { id: 'track', name: 'Focus tracker', emoji: '🎯', skill: 'attention', blurb: 'Follow the marked dots as they move, then find them.' },
  { id: 'stream', name: 'Number stream', emoji: '🔢', skill: 'maths', blurb: 'Keep a running total of the numbers as they flash.' },
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
  const out: Record<Skill, number> = { memory: 0, attention: 0, speed: 0, maths: 0, spatial: 0, language: 0 }
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

/** Pattern echo: the sequence to repeat grows with level. */
export const simonLength = (level: number) => Math.min(12, 2 + level)
export const simonSequence = (length: number, rand = Math.random) => Array.from({ length }, () => Math.floor(rand() * 4))

/** 3D rotation: a polycube as a random walk of unit cubes. */
export type Vec = [number, number, number]
export function polycube(size: number, rand = Math.random): Vec[] {
  const cubes: Vec[] = [[0, 0, 0]]
  const dirs: Vec[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  let guard = 0
  while (cubes.length < size && guard++ < 500) {
    const from = cubes[Math.floor(rand() * cubes.length)]
    const d = dirs[Math.floor(rand() * 6)]
    const next: Vec = [from[0] + d[0], from[1] + d[1], from[2] + d[2]]
    if (!cubes.some((c) => c[0] === next[0] && c[1] === next[1] && c[2] === next[2])) cubes.push(next)
  }
  return cubes
}
export const mirror = (shape: Vec[]): Vec[] => shape.map(([x, y, z]) => [-x, y, z])
const key = (shape: Vec[]) => {
  const min = [0, 1, 2].map((a) => Math.min(...shape.map((c) => c[a])))
  return shape.map((c) => c.map((v, a) => v - min[a]).join(',')).sort().join(';')
}
/** The 24 proper rotations of a cube, as functions on integer vectors. */
const rotations: ((v: Vec) => Vec)[] = (() => {
  const turnX = ([x, y, z]: Vec): Vec => [x, -z, y]
  const turnY = ([x, y, z]: Vec): Vec => [z, y, -x]
  const out: ((v: Vec) => Vec)[] = []
  const seen = new Set<string>()
  const probe: Vec[] = [[1, 2, 3]]
  const queue: ((v: Vec) => Vec)[] = [(v) => v]
  while (queue.length) {
    const f = queue.shift()!
    const k = f(probe[0]).join(',')
    if (seen.has(k)) continue
    seen.add(k)
    out.push(f)
    queue.push((v) => turnX(f(v)), (v) => turnY(f(v)))
  }
  return out
})()
/** True when no rotation turns the shape into its mirror image. */
export function isChiral(shape: Vec[]) {
  const target = key(mirror(shape))
  return !rotations.some((r) => key(shape.map(r)) === target)
}
export function rotationTrial(level: number, rand = Math.random) {
  const size = Math.min(8, 4 + Math.floor(level / 2))
  let shape = polycube(size, rand)
  for (let i = 0; i < 60 && !isChiral(shape); i++) shape = polycube(size, rand)
  const same = rand() < 0.5
  const angle = (0.6 + rand() * 1.6) * (level > 4 ? 1.4 : 1)
  return { shape, other: same ? shape : mirror(shape), same, angle }
}

export const wordBank = [
  'calm', 'mind', 'rest', 'grow', 'kind', 'hope', 'glow', 'seed', 'tree', 'rain', 'moon', 'star',
  'bloom', 'focus', 'quiet', 'peace', 'light', 'smile', 'river', 'ocean', 'petal', 'dream', 'heart', 'brave',
  'garden', 'breath', 'gentle', 'streak', 'wonder', 'thrive', 'spring', 'meadow', 'forest', 'sunset', 'mellow', 'steady',
  'balance', 'harmony', 'journey', 'kindness', 'patience', 'gratitude', 'mindful', 'blossom', 'serenity', 'resilient',
]
export function scrambleTrial(level: number, rand = Math.random) {
  const min = Math.min(8, 4 + Math.floor(level / 2))
  const pool = wordBank.filter((w) => w.length >= min - 1 && w.length <= min + 1)
  const word = (pool.length ? pool : wordBank)[Math.floor(rand() * (pool.length || wordBank.length))]
  let letters = word.split('')
  for (let k = 0; k < 10 && letters.join('') === word; k++) {
    letters = [...letters]
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[letters[i], letters[j]] = [letters[j], letters[i]]
    }
  }
  return { word, letters: letters.join('') }
}

/** Focus tracker: how many dots, how many marked, how long they move. */
export const trackSetup = (level: number) => ({ dots: Math.min(12, 5 + level), targets: Math.min(5, 1 + Math.floor(level / 2)), seconds: Math.min(10, 4 + level * 0.5) })

/** Number stream: digits shown one by one; answer is the total. */
export function streamTrial(level: number, rand = Math.random) {
  const n = Math.min(12, 3 + level)
  const max = level < 4 ? 9 : 19
  const nums = Array.from({ length: n }, () => 1 + Math.floor(rand() * max))
  return { nums, total: nums.reduce((a, b) => a + b, 0), ms: Math.max(550, 1300 - level * 60) }
}
