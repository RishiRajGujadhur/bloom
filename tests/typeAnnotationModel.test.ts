import { ANNOTATION_TASKS, checkAnnotation, normalizeAnnotation } from '../src/features/code/typeAnnotationModel'

describe('TypeScript annotation primer', () => {
  it('accepts the intended primitive, array, and object types', () => {
    for (const task of ANNOTATION_TASKS) expect(checkAnnotation(task, task.expected).pass).toBe(true)
    expect(checkAnnotation(ANNOTATION_TASKS[3], 'Array<string>').pass).toBe(true)
    expect(checkAnnotation(ANNOTATION_TASKS[4], '{ steps: number, title: string }').pass).toBe(true)
  })

  it('rejects a wrong value type with a useful explanation', () => {
    expect(checkAnnotation(ANNOTATION_TASKS[1], 'string').pass).toBe(false)
    expect(checkAnnotation(ANNOTATION_TASKS[1], 'string').feedback).toMatch(/number/)
    expect(normalizeAnnotation(' { title: string; steps: number } ')).toBe('steps:number;title:string')
  })
})
