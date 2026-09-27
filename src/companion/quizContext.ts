import { useSyncExternalStore } from 'react'

/**
 * The question currently on screen (an English lesson, a game…), so Bloom's
 * chat can give hints, explain, or reveal the answer.
 */
export type QuizContext = { source: string; question: string; answer: string; options?: string[]; explain?: string }

let current: QuizContext | null = null
let hints = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setQuiz(q: QuizContext | null) {
  if (q && !q.answer.trim()) q = null
  if (q?.question === current?.question && q?.answer === current?.answer) return
  current = q
  hints = 0
  emit()
}
export const getQuiz = () => current
export const useQuiz = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => current,
    () => null,
  )

/** Progressive hints: shape of the answer → rule out a wrong option → first half → the answer. */
export function nextHint(): string {
  const q = current
  if (!q) return 'There’s no question on screen right now. Start a lesson or a quiz and ask me again!'
  hints++
  const a = q.answer
  const words = a.split(/\s+/)
  if (hints === 1) return words.length > 1 ? `It’s ${words.length} words, starting with “${words[0]}”.` : `It has ${a.length} letters and starts with “${a[0]}”.`
  if (hints === 2 && q.options && q.options.length > 2) {
    const wrong = q.options.filter((o) => o !== a)
    return `It’s not “${wrong[Math.floor(Math.random() * wrong.length)]}”.`
  }
  if (hints <= 3) return `Here’s more: “${a.slice(0, Math.ceil(a.length / 2))}…”`
  return `The answer is “${a}”.${q.explain ? ` ${q.explain}` : ''}`
}
export function explain(): string {
  const q = current
  if (!q) return 'No question on screen right now.'
  return q.explain ?? `The question asks: ${q.question}. Think about the key word, then try again — or ask me for a hint.`
}
export function reveal(): string {
  return current ? `The answer is “${current.answer}”.` : 'No question on screen right now.'
}
