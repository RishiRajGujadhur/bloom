import seedrandom from 'seedrandom'

/**
 * Typing Dojo model: keyboard layout with the finger for each key, lessons
 * that add a few keys at a time, and drills built from real English words that
 * use only the letters learned so far.
 */
export const rows: string[][] = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
]
export const rowOffset = [0, 0.5, 0.75, 1.25]
/** Finger index 0–7 (left pinky → right pinky), 8 = thumbs. */
export const finger: Record<string, number> = {}
// Standard touch-typing fingers: the number row is shifted one key left of the letter rows.
const numberRow = [0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 7, 7]
const letterRows = [0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 7, 7]
rows.forEach((row, r) => row.forEach((k, i) => (finger[k] = (r === 0 ? numberRow : letterRows)[i] ?? 7)))
finger[' '] = 8
export const fingerNames = ['left pinky', 'left ring', 'left middle', 'left index', 'right index', 'right middle', 'right ring', 'right pinky', 'thumb']
export const fingerColors = ['#ff6f91', '#ff9671', '#ffc75f', '#9ede73', '#4fc3f7', '#8f7ae5', '#c77dff', '#f06ba8', '#9aa3ad']

export type Lesson = { id: string; title: string; keys: string; tip: string }
export const lessons: Lesson[] = [
  { id: 'home', title: 'Home row: F and J', keys: 'fj', tip: 'Rest your index fingers on the bumps on F and J. Every lesson starts from here.' },
  { id: 'home2', title: 'Home row: D K', keys: 'fjdk', tip: 'Middle fingers rest on D and K.' },
  { id: 'home3', title: 'Home row: S L A ;', keys: 'fjdksla;', tip: 'Ring fingers on S and L, pinkies on A and ;.' },
  { id: 'home4', title: 'Home row: G H', keys: 'asdfghjkl;', tip: 'Index fingers stretch in to G and H, then return home.' },
  { id: 'top1', title: 'Top row: E I R U', keys: 'asdfghjkl;eiru', tip: 'Reach up with the middle and index fingers, then back to home.' },
  { id: 'top2', title: 'Top row: T Y O W', keys: 'asdfghjkl;eiruotyw', tip: 'Index fingers reach T and Y; ring fingers O and W.' },
  { id: 'top3', title: 'Top row: Q P', keys: 'asdfghjkl;eiruotywqp', tip: 'Pinkies reach up to Q and P.' },
  { id: 'bottom', title: 'Bottom row: C V N M', keys: 'asdfghjkleiruotywqpcvnm', tip: 'Curl down with the index and middle fingers.' },
  { id: 'all', title: 'Every letter', keys: 'abcdefghijklmnopqrstuvwxyz', tip: 'The whole alphabet. Keep your eyes on the screen, not your hands.' },
]

let words: string[] | null = null
export async function loadWords() {
  if (!words) words = (await import('an-array-of-english-words')).default.filter((w: string) => w.length >= 2 && w.length <= 7)
  return words
}

/** A drill of about n words using only the lesson's keys (falls back to key patterns). */
export function makeDrill(all: string[], keys: string, n = 14, seed = String(Date.now())) {
  const rng = seedrandom(seed)
  const letters = new Set(keys.replace(/[^a-z]/g, ''))
  const pool = all.filter((w) => [...w].every((c) => letters.has(c)))
  const out: string[] = []
  for (let i = 0; i < n; i++) {
    if (pool.length > 20 && rng() > 0.15) out.push(pool[Math.floor(rng() * pool.length)])
    else out.push(Array.from({ length: 3 + Math.floor(rng() * 3) }, () => keys[Math.floor(rng() * keys.length)]).join(''))
  }
  return out.join(' ')
}

/** Words per minute (5 characters = 1 word) and accuracy. */
export function stats(typed: number, errors: number, ms: number) {
  const minutes = Math.max(ms, 1) / 60000
  return { wpm: Math.round(typed / 5 / minutes), accuracy: typed ? Math.round(((typed - errors) / typed) * 100) : 100 }
}
