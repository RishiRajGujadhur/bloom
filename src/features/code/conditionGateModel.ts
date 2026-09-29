export type GateRule = { left: string; operator: '&&' | '||'; right: string; invertRight: boolean }
export type GateCase = { name: string; facts: Record<string, boolean>; expected: boolean }
export type GateTask = { id: string; title: string; story: string; predicates: { id: string; label: string }[]; cases: GateCase[]; starter: GateRule; lesson: string }

export const GATE_TASKS: GateTask[] = [
  {
    id: 'greenhouse', title: 'Greenhouse entrance', story: 'The garden opens only for visitors who have a ticket and are at least 13.',
    predicates: [{ id: 'ticket', label: 'hasTicket' }, { id: 'teen', label: 'age >= 13' }, { id: 'member', label: 'isMember' }],
    cases: [
      { name: 'Ari', facts: { ticket: true, teen: true, member: false }, expected: true },
      { name: 'Bo', facts: { ticket: true, teen: false, member: true }, expected: false },
      { name: 'Cleo', facts: { ticket: false, teen: true, member: true }, expected: false },
      { name: 'Dax', facts: { ticket: false, teen: false, member: false }, expected: false },
    ],
    starter: { left: 'ticket', operator: '||', right: 'teen', invertRight: false },
    lesson: 'AND admits a visitor only when both conditions are true.',
  },
  {
    id: 'gear', title: 'Weather gear station', story: 'Offer a coat when it is raining or the temperature is below 10°C.',
    predicates: [{ id: 'rain', label: 'isRaining' }, { id: 'cold', label: 'temperature < 10' }, { id: 'wind', label: 'isWindy' }],
    cases: [
      { name: 'Rainy', facts: { rain: true, cold: false, wind: false }, expected: true },
      { name: 'Cold', facts: { rain: false, cold: true, wind: false }, expected: true },
      { name: 'Windy', facts: { rain: false, cold: false, wind: true }, expected: false },
      { name: 'Mild', facts: { rain: false, cold: false, wind: false }, expected: false },
    ],
    starter: { left: 'rain', operator: '&&', right: 'cold', invertRight: false },
    lesson: 'OR admits a case when either condition is true.',
  },
  {
    id: 'archive', title: 'Archive door', story: 'Open the archive only when the visitor has a key and the room is not locked.',
    predicates: [{ id: 'key', label: 'hasKey' }, { id: 'locked', label: 'isLocked' }, { id: 'admin', label: 'isAdmin' }],
    cases: [
      { name: 'Keeper', facts: { key: true, locked: false, admin: false }, expected: true },
      { name: 'Sealed', facts: { key: true, locked: true, admin: true }, expected: false },
      { name: 'Visitor', facts: { key: false, locked: false, admin: true }, expected: false },
      { name: 'Stranger', facts: { key: false, locked: true, admin: false }, expected: false },
    ],
    starter: { left: 'key', operator: '&&', right: 'locked', invertRight: false },
    lesson: 'NOT reverses a boolean before AND combines it with the key check.',
  },
]

export function evaluateGate(rule: GateRule, facts: Record<string, boolean>) {
  const left = !!facts[rule.left]
  const right = rule.invertRight ? !facts[rule.right] : !!facts[rule.right]
  return rule.operator === '&&' ? left && right : left || right
}

export function checkGate(task: GateTask, rule: GateRule) {
  const cases = task.cases.map((item) => ({ ...item, actual: evaluateGate(rule, item.facts) }))
  const passed = cases.filter((item) => item.actual === item.expected).length
  const firstMiss = cases.find((item) => item.actual !== item.expected)
  const feedback = firstMiss ? `${firstMiss.name} should be ${firstMiss.expected ? 'admitted' : 'blocked'}, but your rule ${firstMiss.actual ? 'admits' : 'blocks'} them. Compare both conditions for that case.` : `All four cases pass. ${task.lesson}`
  return { cases, passed, pass: passed === cases.length, feedback }
}
