import seedrandom from 'seedrandom'
import { allWords, units } from './englishCourse'

/**
 * Study Duel: both players build the *same* round from a shared seed, so only
 * the seed, answers and scores travel between devices. Faster correct answers
 * score more; streaks add a bonus.
 */
export type DuelQ = { id: string; kind: 'meaning' | 'emoji' | 'grammar'; prompt: string; hint?: string; options: string[]; answer: string }

function shuffle<T>(xs: T[], rnd: () => number) {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function makeRound(seed: string, n = 10): DuelQ[] {
  const rnd = seedrandom(seed)
  const words = shuffle(allWords, rnd)
  const cloze = shuffle(units.flatMap((u) => u.grammar.cloze.map((c) => ({ ...c, title: u.grammar.title }))), rnd)
  const qs: DuelQ[] = []
  for (let i = 0; qs.length < n; i++) {
    const kind = (['meaning', 'emoji', 'grammar'] as const)[i % 3]
    if (kind === 'grammar' && cloze.length) {
      const c = cloze.shift()!
      qs.push({ id: `g${i}`, kind, prompt: c.text, hint: c.title, options: shuffle(c.options, rnd), answer: c.answer })
      continue
    }
    const w = words[i % words.length]
    const wrong = shuffle(words.filter((x) => x.en !== w.en), rnd).slice(0, 3).map((x) => x.en)
    qs.push(kind === 'meaning'
      ? { id: `m${i}`, kind, prompt: `Which word means “${w.meaning}”?`, options: shuffle([w.en, ...wrong], rnd), answer: w.en }
      : { id: `e${i}`, kind, prompt: `${w.emoji}  What is this?`, hint: w.example.replace(new RegExp(w.en, 'i'), '____'), options: shuffle([w.en, ...wrong], rnd), answer: w.en })
  }
  return qs
}

/** 100 for a correct answer, up to +100 for speed (full bonus under 2 s, none after 12 s), +20 per streak step. */
export function points(correct: boolean, ms: number, streak: number) {
  if (!correct) return 0
  const speed = Math.round(100 * Math.max(0, Math.min(1, (12000 - ms) / 10000)))
  return 100 + speed + Math.min(5, streak) * 20
}

export const roomCode = (rnd = Math.random) => Array.from({ length: 5 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(rnd() * 31)]).join('')
