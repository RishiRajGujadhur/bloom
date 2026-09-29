import { isQuestAnswer, questLevels } from '../src/features/code/questLevels'

describe('3D Code Quest curriculum', () => {
  it('unlocks a continuous path through JavaScript, HTML, CSS, and Flexbox', () => {
    expect(questLevels.map((level) => level.number)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    expect(questLevels.map((level) => level.group)).toEqual([
      'JavaScript', 'HTML', 'HTML', 'HTML', 'CSS', 'CSS', 'CSS', 'Flexbox', 'Flexbox', 'Flexbox',
    ])
    for (const level of questLevels) {
      expect(level.answer.every((piece) => level.options.includes(piece))).toBe(true)
      expect(isQuestAnswer(level, level.answer)).toBe(true)
    }
  })

  it('requires the full nesting order and a left float for wrapped text', () => {
    const tags = questLevels.find((level) => level.kind === 'stack')!
    expect(isQuestAnswer(tags, ['<section>', '<h1>', '</section>', '</h1>'])).toBe(false)
    expect(isQuestAnswer(tags, tags.answer.slice(0, 3))).toBe(false)
    const float = questLevels.find((level) => level.kind === 'float')!
    expect(isQuestAnswer(float, ['float: left'])).toBe(true)
    expect(isQuestAnswer(float, ['float: right'])).toBe(false)
  })
})
