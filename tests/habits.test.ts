import { gridDays, habitStats } from '../src/features/habits'
import { defaults, parseData } from '../src/model'

test('streak stays active until today ends, ignores duplicates and future days', () => {
  expect(
    habitStats(
      ['2026-09-19', '2026-09-20', '2026-09-20', '2026-09-22'],
      '2026-09-21',
    ),
  ).toEqual({ current: 2, best: 2, total: 2 })
  expect(habitStats(['2026-09-18', '2026-09-19'], '2026-09-21').current).toBe(0)
})
test('streak crosses months and leap days', () => {
  expect(
    habitStats(['2024-02-28', '2024-02-29', '2024-03-01'], '2024-03-01'),
  ).toEqual({ current: 3, best: 3, total: 3 })
})
test('grid has complete Sunday-first weeks including today', () => {
  const days = gridDays('2026-09-21')
  expect(days).toHaveLength(140)
  expect(new Date(`${days[0]}T12:00:00`).getDay()).toBe(0)
  expect(days).toContain('2026-09-21')
  expect(days.at(-1)).toBe('2026-09-26')
})
test('older saves load and routines survive schema validation', () => {
  const data = defaults()
  expect(parseData(data).habits).toEqual(data.habits)
  const routine = {
    id: 'r',
    title: 'Morning',
    period: 'morning',
    days: [1],
    steps: [{ id: 's', title: 'Read', minutes: 5 }],
    dates: ['2026-09-21'],
  }
  expect(parseData({ ...data, routines: [routine] }).routines).toEqual([
    routine,
  ])
  expect(() =>
    parseData({ ...data, routines: [{ ...routine, steps: [] }] }),
  ).toThrow()
})
