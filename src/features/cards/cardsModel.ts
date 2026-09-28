import { supermemo, type SuperMemoGrade } from 'supermemo'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

export type Card = { id: string; deck: string; front: string; back: string; tags: string[]; interval: number; repetition: number; efactor: number; due: string; reviews: number; lapses: number }
export type Deck = { id: string; name: string; emoji: string }
export type CardStore = { decks: Deck[]; cards: Card[]; dailyLimit: number; log: { date: string; count: number; correct: number }[] }
export const CARDS_KEY = 'bloom-cards-v1'

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

export function newCard(deck: string, front: string, back: string, today: string, tags: string[] = []): Card {
  return { id: crypto.randomUUID(), deck, front: front.trim(), back: back.trim(), tags, interval: 0, repetition: 0, efactor: 2.5, due: today, reviews: 0, lapses: 0 }
}

export const grades: { label: string; grade: SuperMemoGrade; key: string }[] = [
  { label: 'Again', grade: 1, key: '1' },
  { label: 'Hard', grade: 3, key: '2' },
  { label: 'Good', grade: 4, key: '3' },
  { label: 'Easy', grade: 5, key: '4' },
]

export function review(c: Card, grade: SuperMemoGrade, today: string): Card {
  const r = supermemo({ interval: c.interval, repetition: c.repetition, efactor: c.efactor }, grade)
  return { ...c, ...r, due: addDays(today, Math.max(1, r.interval)), reviews: c.reviews + 1, lapses: c.lapses + (grade < 3 ? 1 : 0) }
}

export const dueCards = (cards: Card[], today: string, limit = Infinity, deck?: string) => cards.filter((c) => c.due <= today && (!deck || c.deck === deck)).slice(0, limit)

/** Cloze: "The {{c1::heart}} pumps blood" → front hides, back reveals. */
export const hasCloze = (s: string) => /\{\{c\d+::[^}]+\}\}/.test(s)
export const clozeFront = (s: string) => s.replace(/\{\{c\d+::([^}]+)\}\}/g, '[…]')
export const clozeBack = (s: string) => s.replace(/\{\{c\d+::([^}]+)\}\}/g, '**$1**')

/** Markdown → safe HTML: marked output sanitised by DOMPurify (no scripts, handlers or javascript: URLs). */
export function render(md: string) {
  return DOMPurify.sanitize(marked.parse(md, { async: false, gfm: true, breaks: true }) as string)
}

/** Import "front<TAB or ;>back" lines (CSV-ish, Anki text export). */
export function parseImport(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const sep = l.includes('\t') ? '\t' : l.includes(';') ? ';' : ','
      const [front, ...rest] = l.split(sep)
      return { front: front.replace(/^"|"$/g, '').trim(), back: rest.join(sep).replace(/^"|"$/g, '').trim() }
    })
    .filter((x) => x.front && x.back)
}

export function stats(cards: Card[], today: string) {
  const mature = cards.filter((c) => c.interval >= 21).length
  const young = cards.filter((c) => c.repetition > 0 && c.interval < 21).length
  const fresh = cards.filter((c) => c.repetition === 0).length
  const next7 = Array.from({ length: 7 }, (_, i) => cards.filter((c) => c.due === addDays(today, i) || (i === 0 && c.due < today)).length)
  return { mature, young, fresh, next7, total: cards.length }
}

export const starterDeck: { front: string; back: string }[] = [
  { front: 'What is the **4-7-8** breath?', back: 'Inhale 4, hold 7, exhale 8. Calms the nervous system.' },
  { front: 'The {{c1::amygdala}} drives the fight-or-flight response.', back: '' },
  { front: 'What does **SM-2** do?', back: 'Schedules reviews just before you would forget.' },
  { front: 'Name the 5 senses for grounding', back: '5 see · 4 feel · 3 hear · 2 smell · 1 taste' },
]
