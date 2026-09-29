export type CoercionCard = { id: string; title: string; expression: string; inputType: string; outputType: 'string' | 'number' | 'boolean'; answer: string; rule: string; steps: string[] }

export const COERCION_CARDS: CoercionCard[] = [
  { id: 'join', title: 'Plus meets a string', expression: "'5' + 2", inputType: 'string + number', outputType: 'string', answer: '52', rule: 'With a string operand, + joins text.', steps: ['One operand is a string', '2 becomes text', "'5' + '2' becomes '52'"] },
  { id: 'subtract', title: 'Minus needs numbers', expression: "'5' - 2", inputType: 'string - number', outputType: 'number', answer: '3', rule: '- converts numeric text to a number.', steps: ["'5' becomes 5", 'Subtract 2', 'Result is the number 3'] },
  { id: 'truthy', title: 'A nonempty string', expression: "Boolean('0')", inputType: 'string', outputType: 'boolean', answer: 'true', rule: 'A nonempty string is truthy, even when it contains the character 0.', steps: ["'0' has one character", 'Nonempty strings are truthy', 'Result is true'] },
  { id: 'loose', title: 'Loose comparison', expression: '0 == false', inputType: 'number == boolean', outputType: 'boolean', answer: 'true', rule: 'Loose equality converts false to 0 before comparing.', steps: ['false becomes 0', 'Compare 0 == 0', 'Result is true'] },
  { id: 'strict', title: 'Strict comparison', expression: '0 === false', inputType: 'number === boolean', outputType: 'boolean', answer: 'false', rule: 'Strict equality compares values and types without this conversion.', steps: ['0 is a number', 'false is a boolean', 'Different types: result is false'] },
]

export function checkCoercion(card: CoercionCard, value: string, type: string) {
  const normalized = value.trim().replace(/^["']|["']$/g, '').toLowerCase()
  const valuePass = normalized === card.answer.toLowerCase()
  const typePass = type === card.outputType
  return { valuePass, typePass, pass: valuePass && typePass }
}
