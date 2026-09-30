import { addDays, parseQuickTask, splitLines } from '../src/features/todos/quickTask'

describe('parseQuickTask', () => {
  const today = '2026-09-30'
  it('extracts date, priority, tags and recurrence', () => {
    const q = parseQuickTask('Call mum tomorrow p1 #family every week', today)
    expect(q).toEqual({ title: 'Call mum', due: '2026-10-01', priority: 'P1', tags: ['family'], recurrence: 'weekly' })
  })
  it('leaves plain titles alone', () => {
    expect(parseQuickTask('Buy milk', today)).toEqual({ title: 'Buy milk', due: null, priority: null, tags: [], recurrence: 'none' })
  })
  it('splits pasted lists and shifts days', () => {
    expect(splitLines('- a\n\n* b\n1. c\n[ ] d')).toEqual(['a', 'b', 'c', 'd'])
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
  })
})
