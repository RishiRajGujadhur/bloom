import {
  advance,
  defaults,
  dayKey,
  loadData,
  newMicroSession,
  newSession,
  parseData,
  reply,
  STORAGE_KEY,
  toggleHabit,
} from '../src/model'
beforeEach(() => localStorage.clear())
test('four answers keep their categories and complete exactly once', () => {
  let session = newSession()
  for (const answer of ['Okay', 'A walk', 'I took a break', 'Drink water']) {
    session = reply(session, answer)
    if (session.flow.typing) session = advance(session)
  }
  expect(session.flow.complete).toBe(true)
  expect(
    session.messages.filter((m) => m.sender === 'user').map((m) => m.category),
  ).toEqual(['reflection', 'win', 'obstacle', 'action_step'])
  expect(reply(session, 'Extra')).toBe(session)
})
test('rapid, blank and oversized submissions cannot skip prompts', () => {
  const session = newSession()
  expect(reply(session, '   ')).toBe(session)
  expect(reply(session, 'a'.repeat(2001))).toBe(session)
  const waiting = reply(session, 'First')
  expect(reply(waiting, 'Double click')).toBe(waiting)
  expect(advance(advance(waiting)).messages).toHaveLength(3)
})
test('new session clears metadata, completion and pacing state', () => {
  const session = newSession()
  expect(session.metadata.mood).toBeNull()
  expect(session.metadata.energy).toBeNull()
  expect(session.flow).toEqual({ step: 0, typing: false, complete: false })
})
test('micro journal entries keep text, tags, mood, and lightweight media references', () => {
  const session = newMicroSession(
    'A small moment worth keeping',
    ['grateful', 'outside'],
    [
      {
        id: 'photo-1',
        kind: 'photo',
        name: 'sunset.jpg',
        mimeType: 'image/jpeg',
        duration: null,
      },
    ],
    4,
  )
  expect(session.flow.complete).toBe(true)
  expect(session.metadata).toMatchObject({
    entryType: 'micro',
    mood: 4,
    tags: ['grateful', 'outside'],
  })
  expect(session.metadata.attachments[0].name).toBe('sunset.jpg')
  expect(session.messages[0].text).toBe('A small moment worth keeping')
  expect(parseData({ ...defaults(), sessions: [session] }).sessions[0]).toEqual(
    session,
  )
})
test('habits keep history while completion is specific to local calendar day', () => {
  const data = defaults()
  const yesterday = toggleHabit(data, data.habits[0].id, '2026-09-13')
  expect(yesterday.habits[0].dates).not.toContain('2026-09-14')
  const today = toggleHabit(yesterday, data.habits[0].id, '2026-09-14')
  expect(
    toggleHabit(today, data.habits[0].id, '2026-09-14').habits[0].dates,
  ).toEqual(['2026-09-13'])
  expect(dayKey(new Date(2026, 8, 14, 0, 1))).toBe('2026-09-14')
})
test('corrupt or incompatible storage is preserved and reported', () => {
  for (const value of [
    'not json',
    '{"version":2}',
    '{"version":1,"habits":[]}',
  ]) {
    localStorage.setItem(STORAGE_KEY, value)
    expect(loadData().error).not.toBe('')
    expect(localStorage.getItem(STORAGE_KEY)).toBe(value)
  }
})
test('valid draft restores its in-flight prompt and metadata', () => {
  const data = defaults()
  data.draft = reply(newSession(), 'Grounded')
  data.draft.metadata.mood = 4
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  const loaded = loadData()
  expect(loaded.error).toBe('')
  expect(advance(loaded.data.draft!).flow.step).toBe(1)
  expect(loaded.data.draft?.metadata.mood).toBe(4)
})
