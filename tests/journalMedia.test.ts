import 'fake-indexeddb/auto'
import { db } from '../src/search/db'
import {
  loadJournalMedia,
  saveJournalMedia,
} from '../src/components/journal/journalMedia'

beforeAll(() => {
  if (!global.structuredClone)
    global.structuredClone = ((value: unknown): unknown => {
      if (value instanceof Blob) return value.slice(0, value.size, value.type)
      if (Array.isArray(value)) return value.map(global.structuredClone)
      if (value && typeof value === 'object')
        return Object.fromEntries(
          Object.entries(value).map(([key, item]) => [
            key,
            global.structuredClone(item),
          ]),
        )
      return value
    }) as typeof structuredClone
})

beforeEach(async () => {
  await db.journal_attachments.clear()
})

test('journal media blobs are stored outside local JSON and restored in entry order', async () => {
  await saveJournalMedia('entry-1', [
    {
      id: 'photo-1',
      kind: 'photo',
      name: 'morning.png',
      mimeType: 'image/png',
      duration: null,
      blob: new Blob(['image-bytes'], { type: 'image/png' }),
      previewUrl: 'blob:preview-only',
    },
    {
      id: 'voice-1',
      kind: 'audio',
      name: 'Voice note',
      mimeType: 'audio/webm',
      duration: 12,
      blob: new Blob(['audio-bytes'], { type: 'audio/webm' }),
      previewUrl: 'blob:preview-only-2',
    },
  ])
  const restored = await loadJournalMedia(['voice-1', 'photo-1'])
  expect(restored.map((item) => item.id)).toEqual(['voice-1', 'photo-1'])
  expect(restored[0]).toMatchObject({
    sessionId: 'entry-1',
    kind: 'audio',
    duration: 12,
  })
  expect(restored[1].blob).toBeInstanceOf(Blob)
})
