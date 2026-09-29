export type Step = { id: string; label: string; queue: 'stack' | 'microtask' | 'timer'; reason: string }
export type Scenario = { id: string; title: string; code: string; steps: Step[] }
export const PROMISE_SCENARIOS: Scenario[] = [
  { id: 'first', title: 'One Promise, one timer', code: "console.log('Start')\nsetTimeout(() => console.log('Timer'), 0)\nPromise.resolve().then(() => console.log('Promise'))\nconsole.log('End')", steps: [
    { id: 'Start', label: 'Start', queue: 'stack', reason: 'The first synchronous line runs immediately.' },
    { id: 'End', label: 'End', queue: 'stack', reason: 'The remaining synchronous line runs before queued callbacks.' },
    { id: 'Promise', label: 'Promise', queue: 'microtask', reason: 'Promise callbacks use the microtask queue, which drains next.' },
    { id: 'Timer', label: 'Timer', queue: 'timer', reason: 'The timer callback runs after microtasks, even with a zero delay.' },
  ] },
  { id: 'chain', title: 'A Promise chain', code: "console.log('Open')\nPromise.resolve().then(() => console.log('A')).then(() => console.log('B'))\nsetTimeout(() => console.log('Timer'), 0)\nconsole.log('Close')", steps: [
    { id: 'Open', label: 'Open', queue: 'stack', reason: 'Synchronous work begins first.' },
    { id: 'Close', label: 'Close', queue: 'stack', reason: 'The stack finishes before callbacks run.' },
    { id: 'A', label: 'A', queue: 'microtask', reason: 'The first then callback enters the microtask queue.' },
    { id: 'B', label: 'B', queue: 'microtask', reason: 'The chained then callback is queued after A resolves.' },
    { id: 'Timer', label: 'Timer', queue: 'timer', reason: 'The timer waits until the microtask queue is empty.' },
  ] },
  { id: 'mixed', title: 'Two queues', code: "setTimeout(() => console.log('Timer 1'), 0)\nPromise.resolve().then(() => console.log('Micro 1'))\nconsole.log('Sync')\nPromise.resolve().then(() => console.log('Micro 2'))\nsetTimeout(() => console.log('Timer 2'), 0)", steps: [
    { id: 'Sync', label: 'Sync', queue: 'stack', reason: 'Synchronous logging happens while scheduling callbacks.' },
    { id: 'Micro 1', label: 'Micro 1', queue: 'microtask', reason: 'The first Promise callback runs before timers.' },
    { id: 'Micro 2', label: 'Micro 2', queue: 'microtask', reason: 'Microtasks keep their scheduling order.' },
    { id: 'Timer 1', label: 'Timer 1', queue: 'timer', reason: 'The first timer runs after microtasks.' },
    { id: 'Timer 2', label: 'Timer 2', queue: 'timer', reason: 'Timers keep their scheduling order here.' },
  ] },
]

export function checkPromiseOrder(scenario: Scenario, order: string[]) {
  const firstWrong = scenario.steps.findIndex((step, index) => step.id !== order[index])
  return { pass: firstWrong === -1 && order.length === scenario.steps.length, firstWrong, feedback: firstWrong === -1 ? 'Correct: the stack finishes, then microtasks drain, then timers run.' : `Position ${firstWrong + 1} should be ${scenario.steps[firstWrong].label}. ${scenario.steps[firstWrong].reason}` }
}
