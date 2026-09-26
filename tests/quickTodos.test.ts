import { parseQuickTask } from '../src/features/quick/TodosQuick'

test('natural quick-add parses date, priority and tags', () => {
  const ref = new Date('2026-09-27T09:00:00')
  const t = parseQuickTask('call mum tomorrow !1 #family', ref)
  expect(t).toMatchObject({ title: 'call mum', due: '2026-09-28', priority: 'P1', tags: ['family'] })
  expect(parseQuickTask('water plants', ref)).toMatchObject({ title: 'water plants', due: '2026-09-27', priority: 'P3' })
})
