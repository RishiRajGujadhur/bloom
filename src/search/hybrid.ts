import MiniSearch from 'minisearch'
import { calculateCosineSimilarity } from '../utils/cosineSimilarity'

export type Doc = { id: string; title: string; text: string; timestamp: number }
export type Scored = Doc & { score: number; keyword?: number; meaning?: number; tags?: string[] }

/** Fast full-text index: works instantly, with no model download. */
export function keywordIndex(docs: Doc[]) {
  const index = new MiniSearch<Doc>({
    fields: ['title', 'text'],
    storeFields: ['id', 'title', 'text', 'timestamp'],
    searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true, combineWith: 'OR' },
  })
  index.addAll(docs)
  return index
}

export function keywordSearch(index: MiniSearch<Doc>, query: string, limit = 5): Scored[] {
  if (!query.trim()) return []
  return index
    .search(query)
    .slice(0, limit)
    .map((r) => ({ id: r.id as string, title: r.title as string, text: r.text as string, timestamp: r.timestamp as number, score: r.score, keyword: r.score }))
}

/**
 * Blend keyword and meaning scores (each normalised to 0–1). Meaning leads so
 * "burnt out at work" finds "long day with client meetings"; exact words still
 * lift a page.
 */
export function hybridMerge(meaning: Scored[], keyword: Scored[], weight = 0.7, limit = 6): Scored[] {
  const maxK = Math.max(1e-9, ...keyword.map((k) => k.keyword ?? 0))
  const byId = new Map<string, Scored>()
  for (const m of meaning) byId.set(m.id, { ...m, meaning: m.score, keyword: 0 })
  for (const k of keyword) {
    const prev = byId.get(k.id)
    byId.set(k.id, { ...(prev ?? k), meaning: prev?.meaning ?? 0, keyword: (k.keyword ?? 0) / maxK })
  }
  return [...byId.values()]
    .map((d) => ({ ...d, score: weight * Math.max(0, d.meaning ?? 0) + (1 - weight) * (d.keyword ?? 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Descriptions embedded once; pages are tagged by their nearest themes. */
export const tagPrototypes: Record<string, string> = {
  work: 'work, meetings, clients, deadlines, my job and career',
  burnout: 'feeling exhausted, burnt out, drained and overwhelmed',
  anxiety: 'anxious, worried, nervous about what might happen',
  relationships: 'my partner, friends, love, connection and conflict',
  family: 'my family, parents, children, siblings and home',
  health: 'exercise, body, food, eating well and feeling physically well',
  sleep: 'sleep, tiredness, dreams, rest and bedtime',
  gratitude: 'thankful and grateful for good things in my life',
  growth: 'learning, progress, goals, becoming a better person',
  creativity: 'ideas, making things, art, writing and creative projects',
  calm: 'peaceful, calm, relaxed and present in the moment',
}

export function autoTags(vector: Float32Array, prototypes: Record<string, Float32Array>, max = 3, threshold = 0.22) {
  return Object.entries(prototypes)
    .map(([tag, v]) => ({ tag, s: calculateCosineSimilarity(vector, v) }))
    .filter((t) => t.s >= threshold)
    .sort((a, b) => b.s - a.s)
    .slice(0, max)
    .map((t) => t.tag)
}

/** Pages sharing the most distinctive words with what you're writing now. */
export function relatedPages(current: string, docs: Doc[], excludeId?: string, limit = 3) {
  const words = [...new Set(current.toLowerCase().match(/[a-zÀ-ɏ]{5,}/g) ?? [])].slice(-40)
  if (words.length < 3) return []
  const others = docs.filter((d) => d.id !== excludeId)
  if (!others.length) return []
  return keywordSearch(keywordIndex(others), words.join(' '), limit)
}
