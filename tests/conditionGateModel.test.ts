import { checkGate, evaluateGate, GATE_TASKS, type GateRule } from '../src/features/code/conditionGateModel'

describe('condition gate builder', () => {
  const solutions: GateRule[] = [
    { left: 'ticket', operator: '&&', right: 'teen', invertRight: false },
    { left: 'rain', operator: '||', right: 'cold', invertRight: false },
    { left: 'key', operator: '&&', right: 'locked', invertRight: true },
  ]

  it('starts with a failing rule and accepts each intended logic pattern', () => {
    GATE_TASKS.forEach((task, index) => {
      expect(checkGate(task, task.starter).pass).toBe(false)
      expect(checkGate(task, solutions[index]).pass).toBe(true)
    })
  })

  it('reports the first mismatched visitor without executing user code', () => {
    const result = checkGate(GATE_TASKS[0], GATE_TASKS[0].starter)
    expect(result.feedback).toMatch(/should be blocked/)
    expect(result.cases.some((item) => item.actual !== item.expected)).toBe(true)
    expect(evaluateGate(solutions[2], { key: true, locked: false })).toBe(true)
  })
})
