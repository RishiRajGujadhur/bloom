import { db, EMBEDDING_MODEL, journalText, type SearchEntry } from './db'
import { calculateCosineSimilarity } from '../utils/cosineSimilarity'
import { journalModes } from '../components/daybook/mockData'
import type { JournalEntry } from '../components/daybook/types'

export type SemanticResult = SearchEntry & { score: number }
type Embed = (text: string) => Promise<Float32Array>

/**
 * Brings the rebuildable search index in line with the saved Daybook pages,
 * embedding only pages whose text changed. Shared by the Daybook search and
 * the command palette. Returns false when cancelled part-way.
 */
export async function syncSemanticIndex(
  entries: JournalEntry[],
  embed: Embed,
  cancelled: () => boolean = () => false,
) {
  const activeIds = new Set(entries.map((entry) => entry.id))
  const existing = await db.entries.toArray()
  if (cancelled()) return false
  await db.entries.bulkDelete(
    existing.filter((entry) => !activeIds.has(entry.id)).map((e) => e.id),
  )
  for (const entry of entries) {
    if (cancelled()) return false
    const text = journalText(entry.content).trim()
    const previous = await db.entries.get(entry.id)
    if (cancelled()) return false
    if (!text) {
      await db.entries.delete(entry.id)
      continue
    }
    const record: SearchEntry = {
      id: entry.id,
      text,
      timestamp: Date.parse(entry.updatedAt),
      category:
        journalModes.find((mode) => mode.id === entry.modeId)?.category ??
        'reflection',
      title: entry.modeTitle,
      modeId: entry.modeId,
    }
    if (
      previous?.text === text &&
      previous.model === EMBEDDING_MODEL &&
      previous.embedding?.length === 384
    ) {
      await db.entries.put({
        ...record,
        embedding: previous.embedding,
        model: previous.model,
      })
      continue
    }
    await db.entries.put(record)
    const embedding = await embed(text)
    if (cancelled()) return false
    await db.entries.put({ ...record, embedding, model: EMBEDDING_MODEL })
  }
  return true
}

/** Closest indexed pages to a query, ranked by meaning. */
export async function semanticSearch(
  query: string,
  embed: Embed,
  limit = 5,
): Promise<SemanticResult[]> {
  const vector = await embed(query)
  const rows = await db.entries.toArray()
  return rows
    .filter(
      (row) =>
        row.embedding?.length === vector.length &&
        row.model === EMBEDDING_MODEL,
    )
    .map((row) => ({
      ...row,
      score: calculateCosineSimilarity(vector, row.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
