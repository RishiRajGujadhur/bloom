import { isChiral, mirror, polycube, rotationTrial, scrambleTrial, streamTrial } from '../src/features/games/gamesModel'

test('3D rotation only asks about shapes whose mirror is truly different', () => {
  expect(isChiral([[0, 0, 0], [1, 0, 0], [2, 0, 0]])).toBe(false)
  const l: [number, number, number][] = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]
  expect(isChiral(l)).toBe(true)
  expect(isChiral(mirror(l))).toBe(true)
  for (let i = 0; i < 20; i++) expect(isChiral(rotationTrial(3).shape)).toBe(true)
  expect(polycube(6)).toHaveLength(6)
})

test('scramble and number stream trials are solvable', () => {
  const s = scrambleTrial(3)
  expect(s.letters.split('').sort().join('')).toBe(s.word.split('').sort().join(''))
  const n = streamTrial(2)
  expect(n.total).toBe(n.nums.reduce((a, b) => a + b, 0))
})
