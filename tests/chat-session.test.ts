import { readConversation, readDraft, writeSession } from '../src/companion/chatSession'

beforeEach(() => sessionStorage.clear())
afterEach(() => jest.restoreAllMocks())

test('draft recovery bounds text and tolerates storage being blocked', () => {
  writeSession('draft', 'a'.repeat(2000))
  expect(readDraft('draft')).toHaveLength(1000)
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked') })
  expect(readDraft('draft')).toBe('')
})

test('conversation recovery discards malformed data and keeps the latest sixty valid entries', () => {
  const valid = (v: unknown): v is { text: string } => !!v && typeof v === 'object' && 'text' in v && typeof v.text === 'string'
  writeSession('chat', '{broken')
  expect(readConversation('chat', valid)).toEqual([])
  writeSession('chat', JSON.stringify([null, { text: 5 }, ...Array.from({ length: 80 }, (_, i) => ({ text: String(i) }))]))
  const recovered = readConversation('chat', valid)
  expect(recovered).toHaveLength(60)
  expect(recovered[0].text).toBe('20')
  expect(recovered[59].text).toBe('79')
})

test('storage failures never prevent an active chat from proceeding', () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Quota exceeded') })
  expect(() => writeSession('draft', 'Hello')).not.toThrow()
})
