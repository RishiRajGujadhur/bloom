export type InferenceCase = {
  id: string
  title: string
  code: string
  target: string
  options: string[]
  answer: string
  explanation: string
  clue: string
}

export const INFERENCE_CASES: InferenceCase[] = [
  { id: 'mutable', title: 'Mutable signal', code: "let signal = 'ready'", target: 'signal', options: ['string', '"ready"', 'boolean'], answer: 'string', clue: 'A let binding can receive another string later.', explanation: 'TypeScript widens a mutable let binding from the literal "ready" to string.' },
  { id: 'fixed', title: 'Fixed signal', code: "const signal = 'ready'", target: 'signal', options: ['string', '"ready"', 'boolean'], answer: '"ready"', clue: 'A const binding cannot be reassigned.', explanation: 'A const primitive keeps its literal type: only the value "ready".' },
  { id: 'array', title: 'Score queue', code: 'const scores = [3, 5, 8]', target: 'scores', options: ['number', 'number[]', '[3, 5, 8]'], answer: 'number[]', clue: 'An ordinary array can gain more numbers.', explanation: 'Array elements are numbers, so TypeScript infers number[]. A tuple needs a stronger signal such as as const.' },
  { id: 'object', title: 'Lesson card', code: "const card = { title: 'Orbit', ready: true }", target: 'card.title', options: ['string', '"Orbit"', 'boolean'], answer: 'string', clue: 'The object property can be changed even though card is const.', explanation: 'const fixes the object binding, not its properties. card.title widens to string.' },
  { id: 'return', title: 'Double points', code: 'function double(points: number) { return points * 2 }', target: 'return type of double', options: ['number', 'number[]', 'void'], answer: 'number', clue: 'Multiplying two numbers produces a number.', explanation: 'TypeScript follows the return expression and infers number without an explicit return annotation.' },
]

export function checkInference(item: InferenceCase, choice: string) {
  if (!choice) return { pass: false, feedback: 'Choose the type TypeScript infers, then check your prediction.' }
  if (choice === item.answer) return { pass: true, feedback: `Correct. ${item.explanation}` }
  return { pass: false, feedback: `Not quite. ${item.clue} Try another type.` }
}
