import { checkExpression, EXPRESSION_CARDS } from '../src/features/code/expressionTraceModel'

test('each expression has one available correct answer and a useful trace', () => {
  expect(EXPRESSION_CARDS).toHaveLength(4)
  for (const card of EXPRESSION_CARDS) {
    expect(card.options.filter((option) => checkExpression(card, option).correct)).toEqual([card.answer])
    expect(card.steps).toHaveLength(3)
    expect(card.steps[2]).toContain(card.answer)
  }
})
