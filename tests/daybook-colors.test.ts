import {
  calmJournalPalette,
  journalColor,
} from '../src/components/daybook/journalColors'

afterEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
})

test('assigns calm colours randomly once and preserves them on reopening', () => {
  const random = jest
    .spyOn(Math, 'random')
    .mockReturnValueOnce(0)
    .mockReturnValueOnce(0.99)
  expect(journalColor('first')).toBe(calmJournalPalette[0])
  expect(journalColor('second')).toBe(
    calmJournalPalette[calmJournalPalette.length - 1],
  )
  expect(journalColor('first')).toBe(calmJournalPalette[0])
  expect(random).toHaveBeenCalledTimes(2)
})

test('replaces invalid stored colours and handles unavailable storage consistently', () => {
  localStorage.setItem('bloom-journal-color:first', 'invalid')
  expect(calmJournalPalette).toContain(journalColor('first'))
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('unavailable')
  })
  expect(calmJournalPalette).toContain(journalColor('second'))
  expect(journalColor('second')).toBe(journalColor('second'))
})
