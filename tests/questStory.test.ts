import { questAchievement, questCast, questInterludes, questPrologue } from '../src/features/code/questStory'

describe('lost art of programming story', () => {
  it('has a scene after every playable level and a recovery reward for each art', () => {
    expect(Object.keys(questInterludes).map(Number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(Object.keys(questAchievement).map(Number)).toEqual([3, 6, 9, 12])
    for (const lines of [questPrologue, ...Object.values(questInterludes)]) {
      expect(lines.length).toBeGreaterThan(0)
      for (const [speaker, text] of lines) {
        expect(questCast[speaker]).toBeDefined()
        expect(text.length).toBeGreaterThan(10)
      }
    }
  })
})
