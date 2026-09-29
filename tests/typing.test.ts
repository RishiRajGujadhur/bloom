import { finger, makeDrill, stats } from '../src/features/typing/typingModel'

test('touch-typing fingers', () => {
  expect(finger.f).toBe(3)
  expect(finger.j).toBe(4)
  expect(finger.w).toBe(1)
  expect(finger.p).toBe(7)
  expect(finger[' ']).toBe(8)
})
test('drills only use the lesson keys', () => {
  const drill = makeDrill(['sad', 'lad', 'jazz', 'fall', 'dad'], 'asdfjkl', 30, 'x')
  expect([...drill.replace(/ /g, '')].every((c) => 'asdfjkl'.includes(c))).toBe(true)
})
test('WPM and accuracy', () => {
  expect(stats(250, 5, 60000)).toEqual({ wpm: 50, accuracy: 98 })
})
