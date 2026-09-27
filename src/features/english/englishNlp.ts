import nlp from 'compromise'
import { distance } from 'fastest-levenshtein'
import { doubleMetaphone } from 'double-metaphone'
import { syllable } from 'syllable'
import pluralize from 'pluralize'
import lemmatizer from 'wink-lemmatizer'
import numberToWords from 'number-to-words'
import seedrandom from 'seedrandom'

/** Normalise an answer: lower case, no punctuation, single spaces. */
export const norm = (s: string) =>
  s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * Typo-tolerant check (Levenshtein): exact, a small typo (≤ 1 edit per 6
 * characters) still counts, anything else is wrong.
 */
export function checkTyped(given: string, expected: string): 'exact' | 'typo' | 'wrong' {
  const a = norm(given)
  const b = norm(expected)
  if (a === b) return 'exact'
  return distance(a, b) <= Math.max(1, Math.floor(b.length / 6)) ? 'typo' : 'wrong'
}

/** Sound-alike score (0–1) for speech answers, via Double Metaphone codes. */
export function soundScore(heard: string, expected: string) {
  const code = (s: string) => norm(s).split(' ').filter(Boolean).map((w) => doubleMetaphone(w)[0])
  const want = code(expected)
  const got = new Set(code(heard))
  if (!want.length) return 0
  return want.filter((c) => got.has(c)).length / want.length
}

export const syllables = (w: string) => syllable(w)
export const plural = (w: string) => pluralize.plural(w)
export const singular = (w: string) => pluralize.singular(w)
export const lemma = (w: string) => {
  const v = lemmatizer.verb(w)
  return v !== w ? v : lemmatizer.noun(w)
}
export const numberWords = (n: number) => numberToWords.toWords(n)

/** Conjugate a verb with compromise: past, present (3rd person), gerund, future. */
export function conjugate(verb: string) {
  const c = nlp(verb).verbs().conjugate()[0] as Record<string, string> | undefined
  return c ? { past: c.PastTense, present: c.PresentTense, gerund: c.Gerund, future: c.FutureTense, infinitive: c.Infinitive } : null
}

/** Put a sentence into the past tense (compromise). */
export const toPast = (s: string) => nlp(s).sentences().toPastTense().text()

/** Seeded random helpers so daily quests and challenges stay the same all day. */
export const seeded = (seed: string) => seedrandom(seed)
export function shuffle<T>(xs: T[], rng: () => number = Math.random) {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
export const pick = <T,>(xs: T[], rng: () => number = Math.random) => xs[Math.floor(rng() * xs.length)]

/** Lazily loaded big data: CMU pronouncing dictionary and a full English word list. */
let cmu: Record<string, string> | null = null
export async function loadCmu() {
  if (!cmu) cmu = (await import('cmu-pronouncing-dictionary')).dictionary
  return cmu
}
let wordSet: Set<string> | null = null
export async function isWord(w: string) {
  if (!wordSet) wordSet = new Set((await import('an-array-of-english-words')).default)
  return wordSet.has(w.toLowerCase())
}

/** Phonemes with stress for a word (ARPAbet), e.g. "B IH0 Y UW1 T". */
export async function phonemes(w: string) {
  return (await loadCmu())[w.toLowerCase()] ?? null
}

/** Words that rhyme: same phonemes from the last stressed vowel. */
export async function rhymes(w: string, max = 24) {
  const d = await loadCmu()
  const tail = (p: string) => {
    const parts = p.split(' ')
    let i = parts.length - 1
    while (i > 0 && !/[12]$/.test(parts[i])) i--
    return parts.slice(i).join(' ').replace(/[012]/g, '')
  }
  const p = d[w.toLowerCase()]
  if (!p) return []
  const t = tail(p)
  const out: string[] = []
  for (const [k, v] of Object.entries(d)) {
    if (k !== w.toLowerCase() && !k.includes('(') && /^[a-z]+$/.test(k) && tail(v) === t) out.push(k)
    if (out.length > 400) break
  }
  return out.sort((a, b) => a.length - b.length).slice(0, max)
}

/** Syllables of a word as text chunks via compromise-speech. */
export async function syllableChunks(w: string) {
  const speech = (await import('compromise-speech')).default
  const n = nlp.extend(speech) as unknown as (s: string) => { syllables(): string[][] }
  return (n(w).syllables()[0] ?? [w]).map(String)
}

/** Speak English text with the browser voice. */
export function speak(text: string, rate = 0.95) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-GB'
  u.rate = rate
  const v = window.speechSynthesis.getVoices().find((x) => x.lang.startsWith('en'))
  if (v) u.voice = v
  window.speechSynthesis.speak(u)
}

type Rec = { lang: string; interimResults: boolean; onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void; onerror: () => void; onend: () => void; start(): void; stop(): void }
/** Listen for one English phrase (Web Speech API). Resolves with the transcript, or null. */
export function listen(): Promise<string | null> {
  const W = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec }
  const R = W.SpeechRecognition ?? W.webkitSpeechRecognition
  if (!R) return Promise.resolve(null)
  return new Promise((resolve) => {
    const r = new R()
    r.lang = 'en-GB'
    r.interimResults = false
    let done = false
    r.onresult = (e) => {
      done = true
      resolve(e.results[0][0].transcript)
    }
    r.onerror = () => resolve(null)
    r.onend = () => !done && resolve(null)
    r.start()
  })
}
export const canListen = () => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
