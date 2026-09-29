import { ARRAY_KATA } from '../src/features/code/arrayKataModel'
import { syntaxError } from '../src/features/code/codeRunner'

test('array kata solutions satisfy every example and edge case', () => {
  expect(ARRAY_KATA).toHaveLength(3)
  for (const task of ARRAY_KATA) {
    expect(syntaxError(task.solution)).toBeNull()
    for (const check of task.checks) {
      if (!check.probe) continue
      const actual = new Function(`${task.solution}; return ${check.probe}`)()
      expect(actual).toEqual(check.equals)
    }
  }
})
