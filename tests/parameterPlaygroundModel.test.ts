import { checkParameterTask, PARAMETER_TASKS, runParameterTask } from '../src/features/code/parameterPlaygroundModel'

test('maps positional arguments and uses defaults when omitted', () => {
  expect(runParameterTask(PARAMETER_TASKS[0], ['North', 'kale']).output).toBe('North: kale')
  expect(checkParameterTask(PARAMETER_TASKS[0], PARAMETER_TASKS[0].defaults).pass).toBe(false)
  expect(runParameterTask(PARAMETER_TASKS[1], ['Mira', '']).bindings[1]).toBe('! (default)')
  expect(PARAMETER_TASKS.every((task) => checkParameterTask(task, task.expected).pass)).toBe(true)
})
