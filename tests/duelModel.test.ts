import { makeRound, points, roomCode } from '../src/features/english/duelModel'

describe('Study Duel', () => {
  it('both players get exactly the same round from the same seed', () => {
    expect(makeRound('ABCDE')).toEqual(makeRound('ABCDE'))
    expect(makeRound('ABCDE')).not.toEqual(makeRound('ZZZZZ'))
  })
  it('every question has four-ish options including the answer, no duplicates', () => {
    for (const q of makeRound('seed-2', 12)) {
      expect(q.options).toContain(q.answer)
      expect(new Set(q.options).size).toBe(q.options.length)
    }
  })
  it('rewards speed and streaks, never wrong answers', () => {
    expect(points(false, 500, 3)).toBe(0)
    expect(points(true, 1000, 0)).toBe(200)
    expect(points(true, 20000, 0)).toBe(100)
    expect(points(true, 7000, 2)).toBe(100 + 50 + 40)
  })
  it('room codes avoid look-alike characters', () => {
    expect(roomCode()).toMatch(/^[A-HJKMNP-Z2-9]{5}$/)
  })
})
