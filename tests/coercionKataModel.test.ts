import { checkCoercion, COERCION_CARDS } from '../src/features/code/coercionKataModel'

test('checks value and type separately across coercion cases', () => {
  expect(COERCION_CARDS).toHaveLength(5)
  for (const card of COERCION_CARDS) {
    expect(checkCoercion(card, card.answer, card.outputType).pass).toBe(true)
    expect(checkCoercion(card, card.answer, 'undefined').typePass).toBe(false)
  }
  expect(checkCoercion(COERCION_CARDS[0], " '52' ", 'string').pass).toBe(true)
  expect(checkCoercion(COERCION_CARDS[3], 'false', 'boolean').valuePass).toBe(false)
})
