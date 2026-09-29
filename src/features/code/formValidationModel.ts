export type Rule = { required: boolean; format: 'text' | 'email'; minLength: number }
export type Rules = Record<'name' | 'email' | 'password', Rule>
export const STARTER_RULES: Rules = {
  name: { required: true, format: 'text', minLength: 0 },
  email: { required: true, format: 'text', minLength: 0 },
  password: { required: false, format: 'text', minLength: 4 },
}
export const TARGET_RULES: Rules = {
  name: { required: true, format: 'text', minLength: 2 },
  email: { required: true, format: 'email', minLength: 0 },
  password: { required: true, format: 'text', minLength: 8 },
}
export type FormValues = Record<keyof Rules, string>

export function validateForm(values: FormValues, rules: Rules) {
  const errors: Partial<Record<keyof Rules, string>> = {}
  for (const key of ['name', 'email', 'password'] as const) {
    const value = values[key].trim()
    const rule = rules[key]
    if (rule.required && !value) errors[key] = `${key} is required.`
    else if (value && value.length < rule.minLength) errors[key] = `${key} needs at least ${rule.minLength} characters.`
    else if (value && rule.format === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors[key] = 'Enter an email address with @ and a domain.'
  }
  return errors
}

const CASES: { label: string; values: FormValues; expected: keyof Rules | null }[] = [
  { label: 'Everything blank', values: { name: '', email: '', password: '' }, expected: 'name' },
  { label: 'Short name', values: { name: 'A', email: 'a@b.co', password: 'rainbow88' }, expected: 'name' },
  { label: 'Email missing', values: { name: 'Ada', email: '', password: 'rainbow88' }, expected: 'email' },
  { label: 'Invalid email', values: { name: 'Ada', email: 'ada.example.com', password: 'rainbow88' }, expected: 'email' },
  { label: 'Password missing', values: { name: 'Ada', email: 'ada@example.com', password: '' }, expected: 'password' },
  { label: 'Short password', values: { name: 'Ada', email: 'ada@example.com', password: '1234567' }, expected: 'password' },
  { label: 'Valid signup', values: { name: 'Ada', email: 'ada@example.com', password: 'rainbow88' }, expected: null },
]

export function checkValidationRules(rules: Rules) {
  const results = CASES.map((item) => {
    const errors = validateForm(item.values, rules)
    const actual = (Object.keys(errors)[0] as keyof Rules | undefined) ?? null
    return { label: item.label, pass: actual === item.expected, expected: item.expected, actual }
  })
  return { pass: results.every((item) => item.pass), results }
}
