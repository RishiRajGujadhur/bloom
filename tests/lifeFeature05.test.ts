import { reading } from '../src/features/life/tools/reading'
test('Reading companion produces the expected domain result', async () => {
  const result = await reading.analyze(
    {
      excerpt: 'one two three four',
      speed: '200',
      budget: '15',
      total: '100',
      page: '20',
      target: '10',
    },
    [],
  )
  expect(JSON.stringify(result)).toContain('8 page-based sessions')
})
