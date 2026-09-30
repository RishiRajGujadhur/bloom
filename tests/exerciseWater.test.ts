import { exerciseWaterBonus } from '../src/features/diet/dietModel'

test('one glass per 30 active minutes, capped at four', () => {
  expect([0, 29, 30, 65, 300].map(exerciseWaterBonus)).toEqual([0, 0, 1, 2, 4])
})
