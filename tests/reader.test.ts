import { msFor, questions, texts, tokenize } from '../src/features/reader/readerModel'

test('tokens carry a focal letter and slow down at full stops', () => {
  const t = tokenize('Octopuses are clever. Really!')
  expect(t[0].word).toBe('Octopuses')
  expect(t[0].orp).toBe(2)
  expect(msFor(t[2], 300)).toBeGreaterThan(msFor(t[1], 300))
})
test('comprehension questions come from the text', () => {
  for (const x of texts) {
    const qs = questions(x.body, 3, 's')
    expect(qs.length).toBeGreaterThan(0)
    for (const q of qs) {
      expect(q.options).toContain(q.answer)
      expect(x.body.toLowerCase()).toContain(q.answer)
    }
  }
})

test('questions never ask about pronouns', () => {
  for (const x of texts) for (const q of questions(x.body, 5, 'p')) expect(['them', 'it', 'they', 'we', 'you', 'its', 'ours']).not.toContain(q.answer)
})
