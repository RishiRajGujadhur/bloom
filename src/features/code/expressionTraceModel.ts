export type ExpressionCard = { id: string; title: string; expression: string; options: string[]; answer: string; steps: string[]; hint: string }

export const EXPRESSION_CARDS: ExpressionCard[] = [
  { id: 'precedence', title: 'Which operation goes first?', expression: '3 + 4 * 2', options: ['11', '14', '18', '9'], answer: '11', steps: ['Multiply first: 4 * 2 = 8', 'Then add: 3 + 8', 'Result: 11'], hint: 'Multiplication has higher precedence than addition.' },
  { id: 'property', title: 'Read a property', expression: "'Bloom'.length + 2", options: ['5', '7', '8', 'undefined'], answer: '7', steps: ["'Bloom' has 5 characters", 'Add 2 to 5', 'Result: 7'], hint: 'Count the letters before adding.' },
  { id: 'boolean', title: 'Trace a Boolean', expression: 'true && (5 > 3)', options: ['true', 'false', '5', '3'], answer: 'true', steps: ['Compare: 5 > 3 is true', 'Evaluate: true && true', 'Result: true'], hint: 'The comparison inside parentheses is evaluated first.' },
  { id: 'array', title: 'Index and multiply', expression: '[2, 4, 6][1] * 3', options: ['6', '9', '12', '18'], answer: '12', steps: ['Index 1 selects 4', 'Multiply: 4 * 3', 'Result: 12'], hint: 'Array indexes start at 0.' },
]

export function checkExpression(card: ExpressionCard, choice: string) {
  return { correct: choice === card.answer, explanation: card.steps.join(' → ') }
}
