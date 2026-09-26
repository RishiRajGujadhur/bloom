import { writing } from '../src/features/life/tools/writing'
test('Clear writing lab produces the expected domain result', async () => {
  const result = await writing.analyze(
    {
      draft: 'I read a book. We write a clear note.',
      long: '25',
      limit: '300',
    },
    [],
  )
  expect(JSON.stringify(result)).toContain('0 words above')
})
