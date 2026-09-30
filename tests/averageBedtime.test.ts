import { averageBedtime } from '../src/features/sleep/sleepModel'

const night = (date: string, bedtime: string) => ({ id: date, date, bedtime, wake: '07:00', quality: 3 as const, factors: [] })
test('averages bedtimes across midnight', () => {
  expect(averageBedtime([night('2026-09-01', '23:30'), night('2026-09-02', '00:30')])).toBe('00:00')
  expect(averageBedtime([night('2026-09-01', '22:00'), night('2026-09-02', '23:00')])).toBe('22:30')
  expect(averageBedtime([])).toBeNull()
})
