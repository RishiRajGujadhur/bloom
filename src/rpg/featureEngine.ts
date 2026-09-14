import type { Session } from '../model'

export type LoreCard = {
  at: number
  title: string
  body: string
  unlock: string
}

export const loreCards: LoreCard[] = [
  {
    at: 0,
    title: 'Attention is trainable',
    body: 'Repeatedly returning to one cue strengthens the brain’s ability to notice and redirect attention.',
    unlock: 'Always available',
  },
  {
    at: 3,
    title: 'Momentum lowers friction',
    body: 'A visible starting point makes the next action easier to choose, especially on low-energy days.',
    unlock: '3-day momentum',
  },
  {
    at: 7,
    title: 'Recovery is part of learning',
    body: 'Rest and reset protect consistency by making the practice resilient instead of brittle.',
    unlock: '7-day momentum',
  },
]

export const unlockedLoreCards = (days: number) =>
  loreCards.map(card => ({ ...card, unlocked: card.at === 0 || days >= card.at }))

export type ArchiveEntry = {
  id: string
  date: string
  title: string
  tags: string[]
  mood: number | null
}

export function journalArchive(sessions: Session[]): ArchiveEntry[] {
  return sessions
    .filter(session => session.flow.complete)
    .map(session => ({
      id: session.metadata.id,
      date: session.metadata.date,
      title: session.messages.find(message => message.sender === 'user')?.text ?? 'A quiet reflection',
      tags: session.metadata.tags.length ? session.metadata.tags : ['reflection'],
      mood: session.metadata.mood,
    }))
}

export function filterArchive(entries: ArchiveEntry[], query: string, tag: string) {
  const normalizedQuery = query.trim().toLowerCase()
  return entries.filter(entry =>
    `${entry.title} ${entry.tags.join(' ')}`.toLowerCase().includes(normalizedQuery) &&
    (tag === 'all' || entry.tags.includes(tag)),
  )
}
