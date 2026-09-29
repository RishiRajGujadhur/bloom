import { checkModuleImport, importStatement, MODULE_TASKS } from '../src/features/code/moduleOrganizerModel'

describe('JavaScript module organizer', () => {
  it('accepts the correct source and export style for each task', () => {
    for (const task of MODULE_TASKS) expect(checkModuleImport(task, { from: task.source, style: task.style }).pass).toBe(true)
  })
  it('explains both a wrong file and wrong style', () => {
    const task = MODULE_TASKS[0]
    const result = checkModuleImport(task, { from: './stats.js', style: 'default' })
    expect(result.pass).toBe(false)
    expect(result.feedback).toContain('./format.js')
    expect(result.feedback).toContain('named')
    expect(importStatement(task, { from: task.source, style: task.style })).toContain('{ formatScore }')
  })
})
