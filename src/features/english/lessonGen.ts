import { allWords, units, type Unit, type Word } from './englishCourse'
import { shuffle } from './englishNlp'
import type { Mistake } from './englishModel'

export type Exercise =
  | { kind: 'picture'; word: Word; options: Word[] }
  | { kind: 'choice'; prompt: string; answer: string; options: string[]; word?: string }
  | { kind: 'bank'; sentence: string; chips: string[]; hint: string }
  | { kind: 'type'; prompt: string; emoji: string; answer: string; word: string }
  | { kind: 'cloze'; text: string; answer: string; options: string[]; tip: string }
  | { kind: 'listen'; answer: string }
  | { kind: 'speak'; answer: string }
  | { kind: 'match'; pairs: { en: string; hint: string }[] }

const distractors = (w: Word, pool: Word[], n: number) => shuffle(pool.filter((x) => x.en !== w.en)).slice(0, n)

/**
 * A lesson mixes 8–10 exercises from one unit. Early lessons lean on pictures
 * and matching; later ones on typing, word banks, listening and speaking.
 */
export function makeLesson(unit: Unit, lesson: number, opts: { speak?: boolean; listen?: boolean } = {}): Exercise[] {
  const words = shuffle(unit.words)
  const out: Exercise[] = []
  const pool = unit.words.length >= 4 ? unit.words : allWords
  const w = (i: number) => words[i % words.length]
  out.push({ kind: 'picture', word: w(0), options: shuffle([w(0), ...distractors(w(0), pool, 3)]) })
  out.push({ kind: 'choice', prompt: `Which word means “${w(1).meaning}”?`, answer: w(1).en, options: shuffle([w(1).en, ...distractors(w(1), pool, 2).map((x) => x.en)]), word: w(1).en })
  out.push({ kind: 'match', pairs: shuffle(unit.words).slice(0, 4).map((x) => ({ en: x.en, hint: `${x.emoji} ${x.meaning}` })) })
  const phrase = unit.phrases[lesson % unit.phrases.length]
  out.push({ kind: 'bank', sentence: phrase.en, chips: shuffle([...phrase.en.split(' '), ...shuffle(allWords.map((x) => x.en).filter((x) => !x.includes(' '))).slice(0, 2)]), hint: phrase.meaning })
  const c = unit.grammar.cloze[lesson % unit.grammar.cloze.length]
  out.push({ kind: 'cloze', text: c.text, answer: c.answer, options: shuffle(c.options), tip: unit.grammar.rule })
  out.push({ kind: 'type', prompt: w(2).meaning, emoji: w(2).emoji, answer: w(2).en, word: w(2).en })
  if (opts.listen !== false) out.push({ kind: 'listen', answer: w(3).example })
  if (lesson >= 1) out.push({ kind: 'picture', word: w(4), options: shuffle([w(4), ...distractors(w(4), pool, 3)]) })
  if (lesson >= 1 && opts.speak) out.push({ kind: 'speak', answer: unit.phrases[(lesson + 1) % unit.phrases.length].en })
  if (lesson >= 2) {
    const p2 = unit.phrases[(lesson + 2) % unit.phrases.length]
    out.push({ kind: 'bank', sentence: p2.en, chips: shuffle(p2.en.split(' ')), hint: p2.meaning })
  }
  if (lesson >= 3) out.push({ kind: 'type', prompt: w(5).meaning, emoji: w(5).emoji, answer: w(5).en, word: w(5).en })
  return out
}

/** A practice session of words due for review. */
export function makeReview(words: Word[]): Exercise[] {
  return shuffle(words).slice(0, 8).map((w, i) =>
    i % 2
      ? { kind: 'type', prompt: w.meaning, emoji: w.emoji, answer: w.en, word: w.en }
      : { kind: 'picture', word: w, options: shuffle([w, ...distractors(w, allWords, 3)]) },
  )
}

/** Replay past mistakes as choice questions. */
export function makeMistakes(ms: Mistake[]): Exercise[] {
  return ms.slice(-8).map((m) => ({ kind: 'choice', prompt: m.prompt, answer: m.answer, options: shuffle([m.answer, ...shuffle(allWords.map((w) => w.en).filter((x) => x !== m.answer)).slice(0, 2)]) }))
}

/** Placement test: a couple of questions per unit, harder as you go. */
export function makePlacement(): (Exercise & { unit: number })[] {
  return units.flatMap((u, i) => {
    const c = u.grammar.cloze[0]
    const w = u.words[i % u.words.length]
    return [
      { kind: 'cloze' as const, text: c.text, answer: c.answer, options: shuffle(c.options), tip: u.grammar.rule, unit: i },
      { kind: 'choice' as const, prompt: `Which word means “${w.meaning}”?`, answer: w.en, options: shuffle([w.en, ...distractors(w, u.words, 2).map((x) => x.en)]), unit: i },
    ]
  })
}

export const promptOf = (e: Exercise): string => {
  switch (e.kind) {
    case 'picture': return `Which one is “${e.word.en}”?`
    case 'choice': return e.prompt
    case 'bank': return `Build: ${e.hint}`
    case 'type': return `${e.emoji} ${e.prompt}`
    case 'cloze': return e.text
    case 'listen': return 'Type what you hear'
    case 'speak': return `Say: ${e.answer}`
    case 'match': return 'Match the pairs'
  }
}
export const answerOf = (e: Exercise): string => {
  switch (e.kind) {
    case 'picture': return e.word.en
    case 'bank': return e.sentence
    case 'match': return e.pairs.map((p) => p.en).join(', ')
    default: return e.answer
  }
}
