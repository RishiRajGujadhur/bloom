import { checkPromiseOrder, PROMISE_SCENARIOS } from '../src/features/code/promiseOrderModel'

describe('Promise ordering visualizer', () => {
  it('accepts the execution order in each scenario', () => {
    for (const scenario of PROMISE_SCENARIOS) expect(checkPromiseOrder(scenario, scenario.steps.map((step) => step.id)).pass).toBe(true)
  })
  it('points to the first incorrect output', () => {
    const scenario = PROMISE_SCENARIOS[0]
    const result = checkPromiseOrder(scenario, ['Start', 'Promise', 'End', 'Timer'])
    expect(result.pass).toBe(false)
    expect(result.firstWrong).toBe(1)
    expect(result.feedback).toContain('End')
  })
})
