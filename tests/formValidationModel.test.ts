import { checkValidationRules, STARTER_RULES, TARGET_RULES, validateForm } from '../src/features/code/formValidationModel'

describe('form validation project', () => {
  it('requires the intended name, email, and password rules', () => {
    expect(checkValidationRules(STARTER_RULES).pass).toBe(false)
    expect(checkValidationRules(TARGET_RULES).pass).toBe(true)
  })
  it('returns field-specific errors and accepts valid values', () => {
    expect(validateForm({ name: 'A', email: 'bad', password: '123' }, TARGET_RULES)).toEqual(expect.objectContaining({ name: expect.any(String), email: expect.any(String), password: expect.any(String) }))
    expect(validateForm({ name: 'Ada', email: 'ada@example.com', password: 'rainbow88' }, TARGET_RULES)).toEqual({})
  })
})
