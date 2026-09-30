import { usualFoods } from '../src/features/diet/dietModel'

const m = (name: string, kcal: number, at: number) => ({ name, kcal, protein: 1, carbs: 2, fat: 3, at })
test('ranks foods logged twice or more, most frequent first, with latest macros', () => {
  const now = 100 * 864e5
  const r = usualFoods([m('Oats', 300, now - 1000), m('oats ', 320, now - 10), m('Toast', 200, now - 5), m('Tea', 5, now - 3), m('Tea', 5, now - 2), m('Tea', 5, now - 1), m('Old', 1, 0), m('Old', 1, 1)], now)
  expect(r.map((x) => [x.name, x.count])).toEqual([['Tea', 3], ['oats ', 2]])
  expect(r[1].kcal).toBe(320)
})
