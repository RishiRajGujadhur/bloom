import { OBJECT_CHECKS, OBJECT_SOLUTION } from '../src/features/code/objectUpdateModel'
import { syntaxError } from '../src/features/code/codeRunner'

test('object update solution passes dynamic lookup and immutability cases', () => {
  expect(syntaxError(OBJECT_SOLUTION)).toBeNull()
  for (const check of OBJECT_CHECKS) {
    if (!check.probe) continue
    expect(new Function(`${OBJECT_SOLUTION}; return ${check.probe}`)()).toEqual(check.equals)
  }
})
