import writeGood from 'write-good'
import { flesch } from 'flesch'
import { automatedReadability } from 'automated-readability'
import { franc } from 'franc-min'
import { removeStopwords, eng } from 'stopword'
import Sentiment from 'sentiment'
import { syllable } from 'syllable'
import { lemma, norm } from './englishNlp'

/* Writing analysis lives apart from the lesson helpers so its libraries only
   load when the Write tab opens. */

/** Did the learner answer in another language? (franc-min) */
export function notEnglish(text: string) {
  if (text.trim().split(/\s+/).length < 4) return false
  const lang = franc(text, { minLength: 10 })
  return lang !== 'und' && lang !== 'eng'
}

/** Keywords of a text (stopwords removed, lemmatised, most frequent first). */
export function keywords(text: string, max = 12) {
  const words = removeStopwords(norm(text).split(' ').filter((w) => w.length > 2), eng)
  const counts = new Map<string, number>()
  for (const w of words) counts.set(lemma(w), (counts.get(lemma(w)) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, max).map(([w]) => w)
}

const sentimentModel = new Sentiment()

/** Writing coach: suggestions, readability, CEFR estimate and tone. */
export function analyseWriting(text: string) {
  const sentences = Math.max(1, (text.match(/[.!?]+(\s|$)/g) ?? []).length || (text.trim() ? 1 : 0))
  const words = text.trim() ? text.trim().split(/\s+/) : []
  const syl = words.reduce((a, w) => a + syllable(w), 0)
  const chars = words.join('').replace(/[^a-z0-9]/gi, '').length
  const counts = { sentence: sentences, word: words.length, syllable: syl, character: chars }
  const ease = words.length ? Math.round(flesch(counts)) : 0
  const ari = words.length ? Math.round(automatedReadability(counts) * 10) / 10 : 0
  const unique = new Set(words.map((w) => norm(w))).size
  const variety = words.length ? unique / words.length : 0
  const longWords = words.filter((w) => syllable(w) >= 3).length / Math.max(1, words.length)
  // Rough CEFR from sentence length, word length and vocabulary variety.
  const score = (words.length / sentences) * 0.08 + longWords * 6 + variety * 2 + ari * 0.1
  const cefr = !words.length ? '—' : score < 1.6 ? 'A1' : score < 2.2 ? 'A2' : score < 2.8 ? 'B1' : score < 3.4 ? 'B2' : score < 4 ? 'C1' : 'C2'
  const tone = sentimentModel.analyze(text).comparative
  return {
    suggestions: writeGood(text).map((s) => ({ ...s, text: text.slice(s.index, s.index + s.offset) })),
    ease,
    ari,
    cefr,
    words: words.length,
    sentences,
    variety: Math.round(variety * 100),
    tone: tone > 0.1 ? 'positive' : tone < -0.1 ? 'negative' : 'neutral',
    keywords: keywords(text, 8),
    foreign: notEnglish(text),
  }
}

