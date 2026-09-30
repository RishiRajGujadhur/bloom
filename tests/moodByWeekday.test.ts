import { moodByWeekday } from '../src/features/wellbeing/store'

test('averages mood per weekday, Monday first', () => {
  const mon = new Date(2026, 8, 28, 9).getTime() // Monday 28 Sep 2026
  const sun = new Date(2026, 9, 4, 9).getTime()
  const r = moodByWeekday([
    { id: 'a', at: mon, mood: 2, note: '' },
    { id: 'b', at: mon + 3600e3, mood: 4, note: '' },
    { id: 'c', at: sun, mood: 5, note: '' },
  ])
  expect(r[0]).toEqual({ avg: 3, count: 2 })
  expect(r[6]).toEqual({ avg: 5, count: 1 })
  expect(r[3]).toBeNull()
})
