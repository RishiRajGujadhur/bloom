import { shutdown } from '../src/features/life/tools/shutdown'
test('Programmer shutdown desk produces the expected domain result', async () => {
  const result = await shutdown.analyze(
    {
      project: 'Bloom',
      before: 'hello',
      after: 'hello world',
      testState: 'Passing',
    },
    [],
  )
  expect(JSON.stringify(result)).toContain('Characters added')
})
