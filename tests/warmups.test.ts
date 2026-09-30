import { warmups } from '../src/features/workout/workoutModel'

test('ramps up to the working weight', () => {
  expect(warmups(100)).toEqual([
    { weight: 20, reps: 10 },
    { weight: 50, reps: 5 },
    { weight: 70, reps: 3 },
    { weight: 85, reps: 1 },
  ])
})
test('skips duplicate or too-heavy steps and light weights', () => {
  expect(warmups(30)).toEqual([])
  expect(warmups(45).map((s) => s.weight)).toEqual([20, 22.5, 32.5, 37.5])
})
