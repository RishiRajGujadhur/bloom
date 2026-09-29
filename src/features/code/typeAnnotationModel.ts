export type AnnotationTask = { id: string; title: string; before: string; after: string; expected: string; reason: string; valueKind: string }

export const ANNOTATION_TASKS: AnnotationTask[] = [
  { id: 'text', title: 'Welcome sign', before: 'const greeting:', after: "= 'Hello, Bloom'", expected: 'string', reason: 'Quoted text is a string.', valueKind: 'text' },
  { id: 'count', title: 'Focus timer', before: 'let focusMinutes:', after: '= 25', expected: 'number', reason: '25 is a number, not quoted text.', valueKind: 'number' },
  { id: 'flag', title: 'Rest switch', before: 'const isResting:', after: '= false', expected: 'boolean', reason: 'false is a boolean value.', valueKind: 'boolean' },
  { id: 'list', title: 'Practice cues', before: 'const cues:', after: "= ['breathe', 'stretch']", expected: 'string[]', reason: 'Every item is text, so this is an array of strings.', valueKind: 'array' },
  { id: 'object', title: 'Lesson card', before: 'const lesson:', after: "= { title: 'Lines', steps: 3 }", expected: '{ title: string; steps: number }', reason: 'The object has a text title and a numeric step count.', valueKind: 'object' },
]

export function normalizeAnnotation(value: string) {
  const trimmed = value.trim().replace(/;$/, '')
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed.slice(1, -1).split(/[;,]/).map((part) => part.replace(/\s+/g, '')).filter(Boolean).sort().join(';')
  }
  return trimmed.replace(/\s+/g, '').replace(/^Array<string>$/, 'string[]')
}

export function checkAnnotation(task: AnnotationTask, answer: string) {
  const pass = normalizeAnnotation(answer) === normalizeAnnotation(task.expected)
  if (pass) return { pass, feedback: `Correct. ${task.reason} TypeScript can check this before the code runs.` }
  if (!answer.trim()) return { pass, feedback: 'Add a type after the colon, then check it.' }
  return { pass, feedback: `${task.reason} Try an annotation that describes the value on the right.` }
}
