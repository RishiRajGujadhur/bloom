import { codePaths } from '../src/features/code/learningPaths'
import { recommendChapter, skillQuestions } from '../src/features/code/skillCheck'

test('skill check identifies the first gap and keeps recommendations inside each path', () => {
  for (const path of codePaths) {
    const questions = skillQuestions[path.id]
    expect(questions).toHaveLength(4)
    expect(questions.every((question) => question.options[question.answer])).toBe(true)
    const correct = questions.map((question) => question.answer)
    expect(recommendChapter(path, correct)).toBe(4)
    expect(recommendChapter(path, [null, ...correct.slice(1)])).toBe(0)
    expect(recommendChapter(path, [...correct.slice(0, 2), null, correct[3]])).toBe(2)
  }
})
