import { moodWeek } from '../src/features/wellbeing/store'
import { lottieIconData, segments } from '../src/components/ui/lottieIcons'

test('moodWeek averages each day and leaves quiet days empty', () => {
  const now = new Date(2026, 8, 26, 18)
  const at = (day: number, hour: number) => new Date(2026, 8, day, hour).getTime()
  const week = moodWeek(
    [
      { id: 'a', at: at(26, 9), mood: 4, note: '' },
      { id: 'b', at: at(26, 17), mood: 2, note: '' },
      { id: 'c', at: at(24, 12), mood: 5, note: '' },
    ],
    7,
    now,
  )
  expect(week).toHaveLength(7)
  expect(week[6].mood).toBe(3)
  expect(week[4].mood).toBe(5)
  expect(week[5].mood).toBeNull()
})

test('animated icons expose distinct hover-in, hover-out and click segments', () => {
  const data = lottieIconData('check') as { op: number; layers: unknown[] }
  expect(data.layers).toHaveLength(2)
  expect(segments.in[1]).toBe(segments.out[0])
  expect(segments.out[1]).toBe(segments.click[0])
  expect(segments.click[1]).toBe(data.op)
  expect(lottieIconData('check')).toBe(data)
})
