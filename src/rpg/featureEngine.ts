import type { Session } from '../model'

export type LoreCard = {
  at: number
  titleKey: string
  bodyKey: string
  unlockKey: string
}

export const loreCards: LoreCard[] = [
  {
    at: 0,
    titleKey: 'rpg.lore.attentionTitle',
    bodyKey: 'rpg.lore.attentionBody',
    unlockKey: 'rpg.lore.alwaysAvailable',
  },
  {
    at: 3,
    titleKey: 'rpg.lore.momentumTitle',
    bodyKey: 'rpg.lore.momentumBody',
    unlockKey: 'rpg.lore.momentumUnlock',
  },
  {
    at: 7,
    titleKey: 'rpg.lore.recoveryTitle',
    bodyKey: 'rpg.lore.recoveryBody',
    unlockKey: 'rpg.lore.recoveryUnlock',
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

export function journalArchive(sessions: Session[], fallbackTitle = 'A quiet reflection'): ArchiveEntry[] {
  return sessions
    .filter(session => session.flow.complete)
    .map(session => ({
      id: session.metadata.id,
      date: session.metadata.date,
      title: session.messages.find(message => message.sender === 'user')?.text ?? fallbackTitle,
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