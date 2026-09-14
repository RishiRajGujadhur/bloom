import { advance, newSession, reply } from '../src/model'
import { filterArchive, journalArchive, loreCards, unlockedLoreCards } from '../src/rpg/featureEngine'

function completedSession(text: string, tags: string[] = []) {
  let session = newSession()
  session.metadata.tags = tags
  for (const answer of [text, 'I paused', 'I tried again', 'Three breaths']) session = advance(reply(session, answer))
  return session
}

test('scientific lore cards unlock only at their momentum milestones', () => {
  expect(loreCards).toHaveLength(3)
  expect(unlockedLoreCards(2).filter(card => card.unlocked)).toHaveLength(1)
  expect(unlockedLoreCards(3).filter(card => card.unlocked)).toHaveLength(2)
  expect(unlockedLoreCards(7).every(card => card.unlocked)).toBe(true)
})

test('inventory archive derives completed sessions and supplies a reflection fallback tag', () => {
  const complete = completedSession('A walk helped me reset')
  const incomplete = newSession()
  const entries = journalArchive([complete, incomplete])
  expect(entries).toHaveLength(1)
  expect(entries[0].title).toBe('A walk helped me reset')
  expect(entries[0].tags).toEqual(['reflection'])
})

test('inventory archive search and tag filters are case-insensitive and composable', () => {
  const first = completedSession('Read a quiet chapter', ['focus'])
  const second = completedSession('Took a short walk', ['movement'])
  const entries = journalArchive([first, second])
  expect(filterArchive(entries, 'QUIET', 'all')).toHaveLength(1)
  expect(filterArchive(entries, '', 'movement')[0].title).toBe('Took a short walk')
  expect(filterArchive(entries, 'quiet', 'movement')).toHaveLength(0)
})
