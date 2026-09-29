import { checkInference, INFERENCE_CASES } from '../src/features/code/inferenceModel'

describe('TypeScript inference prediction', () => {
  it('checks five distinct inference cases', () => {
    expect(INFERENCE_CASES).toHaveLength(5)
    expect(new Set(INFERENCE_CASES.map((item) => item.id)).size).toBe(5)
    for (const item of INFERENCE_CASES) expect(checkInference(item, item.answer).pass).toBe(true)
  })

  it('teaches literal widening and object property mutability', () => {
    expect(INFERENCE_CASES[0].answer).toBe('string')
    expect(INFERENCE_CASES[1].answer).toBe('"ready"')
    expect(INFERENCE_CASES[3].answer).toBe('string')
    expect(checkInference(INFERENCE_CASES[3], '"Orbit"').feedback).toMatch(/property can be changed/)
  })
})
