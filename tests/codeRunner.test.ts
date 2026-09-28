import { nodeTypes, syntaxError } from '../src/features/code/codeRunner'
import { lessons } from '../src/features/code/codeCourse'

test('friendly syntax errors with a line number', () => {
  expect(syntaxError('const x = 1')).toBeNull()
  const e = syntaxError('const x = \nconsole.log(')
  expect(e?.line).toBeGreaterThan(0)
  expect(e?.message).not.toMatch(/\(\d+:\d+\)$/)
})

test('detects syntax used for "uses" checks', () => {
  expect(nodeTypes('for (let i = 0; i < 3; i++) {}').has('ForStatement')).toBe(true)
  expect(nodeTypes('const f = (n) => n').has('ArrowFunctionExpression')).toBe(true)
})

test('every lesson solution parses and meets its syntax checks', () => {
  for (const l of lessons) {
    expect(syntaxError(l.solution)).toBeNull()
    const types = nodeTypes(l.solution)
    for (const c of l.checks) if (c.uses && c.uses !== 'VariableDeclaration') expect(types.has(c.uses)).toBe(true)
  }
})
