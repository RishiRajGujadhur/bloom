import { checkEventWiring, EVENT_TASKS } from '../src/features/code/domEventModel'

describe('DOM event wiring project', () => {
  it('accepts the correct element, event, and handler for each preview', () => {
    for (const task of EVENT_TASKS) expect(checkEventWiring(task, { target: task.target, event: task.event, handler: task.handler }).pass).toBe(true)
  })
  it('explains each broken connection', () => {
    const task = EVENT_TASKS[2]
    const result = checkEventWiring(task, { target: '#join', event: 'click', handler: 'showWelcome' })
    expect(result.pass).toBe(false)
    expect(result.feedback).toContain('#signup')
    expect(result.feedback).toContain('submit')
    expect(result.feedback).toContain('showConfirmation')
  })
})
