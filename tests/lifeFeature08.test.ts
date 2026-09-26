import { meetings } from '../src/features/life/tools/meetings'
test('Meeting preparation produces the expected domain result', async () => {
  const result = await meetings.analyze(
    {
      title: 'Planning',
      date: '2026-10-01',
      start: '09:00',
      duration: '30',
      break: '5',
      agenda: 'Decisions | 10',
      zone: 'UTC',
    },
    [],
  )
  expect(JSON.stringify(result)).toContain('15 minutes of breathing room')
})
