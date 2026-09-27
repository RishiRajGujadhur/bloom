import { analogyItem, iqTest, leaderboard, matrixItem, personalBests, reasoningIndex, scoreEq, seriesItem, eqStatements } from '../src/features/games/assessModel'

test('matrix items have exactly one correct option', () => {
  for (let l = 1; l < 10; l++) {
    const m = matrixItem(l)
    expect(m.answer).toBeGreaterThanOrEqual(0)
    const key = JSON.stringify(m.options[m.answer])
    expect(m.options.filter((o) => JSON.stringify(o) === key)).toHaveLength(1)
  }
})

test('series and analogies include their answer', () => {
  for (let l = 1; l < 9; l++) {
    const s = seriesItem(l)
    expect(s.options).toContain(s.answer)
  }
  const a = analogyItem()
  expect(a.options[a.answer]).toBeTruthy()
  expect(iqTest()).toHaveLength(15)
})

test('reasoning index is centred and bounded', () => {
  expect(reasoningIndex(8, 15, 600)).toBeGreaterThan(85)
  expect(reasoningIndex(8, 15, 600)).toBeLessThan(115)
  expect(reasoningIndex(15, 15, 200)).toBeLessThanOrEqual(145)
  expect(reasoningIndex(0, 15, 900)).toBeGreaterThanOrEqual(55)
})

test('EQ scores domains 0-100 with reverse items', () => {
  const allAgree = eqStatements.map(() => 5)
  const r = scoreEq(allAgree, 6, 6, [{ domain: 'empathy', ok: true }])
  expect(r.overall).toBeGreaterThan(40)
  expect(r.overall).toBeLessThanOrEqual(100)
  const reverse = eqStatements.map((s) => (s.reverse ? 1 : 5))
  expect(scoreEq(reverse, 6, 6, []).overall).toBeGreaterThan(r.overall)
})

test('personal leaderboard ranks and finds bests', () => {
  const runs = [
    { at: 1, game: 'matrix', score: 50, label: 'M' },
    { at: 2, game: 'matrix', score: 80, label: 'M' },
    { at: 3, game: 'faces', score: 60, label: 'F' },
  ]
  expect(leaderboard(runs).map((r) => r.score)).toEqual([80, 60, 50])
  expect(personalBests(runs).find((b) => b.game === 'matrix')!.best.score).toBe(80)
})
