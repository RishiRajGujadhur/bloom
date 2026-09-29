import { checkFormLabels, FORM_STARTER } from '../src/features/code/formLabelModel'

test('checks connected labels for every field', () => {
  expect(checkFormLabels(FORM_STARTER).filter((item) => item.pass)).toHaveLength(3)
  const repaired = FORM_STARTER.replace('<label>Your name</label>', '<label for="name">Your name</label>').replace('for="mail"', 'for="email"')
  expect(checkFormLabels(repaired).every((item) => item.pass)).toBe(true)
  expect(checkFormLabels(repaired.replace('id="email"', 'id="name"')).every((item) => item.pass)).toBe(false)
})
