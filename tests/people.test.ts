import { health, nextBirthday, suggestions, type Person } from '../src/features/people/peopleModel'

const p = (over: Partial<Person>): Person => ({ id: 'x', name: 'Ana', emoji: '🙂', every: 7, last: '2026-09-29', ...over })
test('plants wilt past their rhythm', () => {
  const today = new Date('2026-09-29T12:00:00')
  expect(health(p({ last: '2026-09-29' }), today)).toBe(1)
  expect(health(p({ last: '2026-09-22' }), today)).toBeCloseTo(0.75)
  expect(health(p({ last: '2026-09-01' }), today)).toBe(0)
})
test('next birthday rolls to next year', () => {
  const nb = nextBirthday(p({ birthday: '1990-03-14' }), new Date('2026-09-29T12:00:00'))
  expect(nb?.getUTCFullYear()).toBe(2027)
  expect(nb?.getUTCMonth()).toBe(2)
})
test('suggestions put birthdays first, then the overdue', () => {
  const today = new Date('2026-09-29T12:00:00')
  const s = suggestions([p({ id: 'a', name: 'Overdue', last: '2026-08-01' }), p({ id: 'b', name: 'Bday', last: '2026-09-29', birthday: '1990-10-02' })], today)
  expect(s.map((x) => x.p.name)).toEqual(['Bday', 'Overdue'])
})
