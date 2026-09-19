import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { calculateCosineSimilarity } from '../src/utils/cosineSimilarity'
import { journalText, db } from '../src/search/db'
import { SemanticSearch } from '../src/components/daybook/SemanticSearch'

jest.mock('../src/search/useAIWorker', () => ({
  useAIWorker: () => ({ embed: mockEmbed, status: 'Ready' }),
}))
const mockEmbed = jest.fn(async () => new Float32Array(384).fill(1))

test('cosine handles matching, opposite, perpendicular, zero and invalid vectors', () => {
  const v = (...values: number[]) => new Float32Array(values)
  expect(calculateCosineSimilarity(v(1, 2), v(2, 4))).toBeCloseTo(1)
  expect(calculateCosineSimilarity(v(1, 0), v(-1, 0))).toBe(-1)
  expect(calculateCosineSimilarity(v(1, 0), v(0, 1))).toBe(0)
  expect(calculateCosineSimilarity(v(0, 0), v(1, 0))).toBe(0)
  expect(calculateCosineSimilarity(v(1), v(1, 2))).toBe(0)
  expect(calculateCosineSimilarity(v(NaN), v(1))).toBe(0)
})

test('extracts legacy and rich text across guided fields without formatting metadata', () => {
  expect(
    journalText({
      left: 'A thought',
      right: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Feeling ', marks: [{ type: 'bold' }] },
              { type: 'text', text: 'tired' },
            ],
          },
        ],
      },
    }),
  ).toBe('A thought\nFeeling tired')
})

test('downloads nothing until enabled, indexes saved pages, and opens ranked results', async () => {
  const rows = new Map<string, any>()
  jest
    .spyOn(db.entries, 'toArray')
    .mockImplementation(async () => [...rows.values()])
  jest
    .spyOn(db.entries, 'get')
    .mockImplementation(async (id: any) => rows.get(id))
  jest.spyOn(db.entries, 'put').mockImplementation(async (row: any) => {
    rows.set(row.id, row)
    return row.id
  })
  jest.spyOn(db.entries, 'bulkDelete').mockResolvedValue(undefined)
  const onOpen = jest.fn()
  render(
    <SemanticSearch
      entries={[
        {
          id: 'one',
          modeId: 'free-writing',
          modeTitle: 'A hard day',
          createdAt: '2026-09-19',
          updatedAt: '2026-09-19',
          content: { body: 'Exhausted after work' },
        },
      ]}
      onOpen={onOpen}
    />,
  )
  expect(mockEmbed).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Enable private search' }))
  await waitFor(() => expect(rows.get('one')?.embedding).toHaveLength(384))
  fireEvent.change(screen.getByRole('searchbox'), {
    target: { value: 'burnt out' },
  })
  fireEvent.click(await screen.findByRole('button', { name: /A hard day/ }))
  expect(onOpen).toHaveBeenCalledWith('free-writing')
  expect(mockEmbed).toHaveBeenCalledTimes(2)
  fireEvent.click(screen.getByRole('button', { name: /Ask Local Coach/ }))
  expect(screen.getByText(/No agent is connected/)).toBeInTheDocument()
  jest.restoreAllMocks()
})
