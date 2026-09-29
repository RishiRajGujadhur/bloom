import { create, insert, search } from '@orama/orama'
import { keywordScore, type Bill } from './billsModel'

/**
 * Ask your bills: questions and bills are embedded on-device (MiniLM via
 * transformers.js, in the existing search worker), indexed in an Orama
 * vector + full-text index, and searched in hybrid mode. If the model isn't
 * available (first run offline) it falls back to keyword scoring.
 */
let worker: Worker | null = null
let seq = 0
const waiting = new Map<number, (v: number[] | null) => void>()

export function embed(text: string): Promise<number[] | null> {
  if (!worker) {
    worker = new Worker(new URL('../../search/worker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e: MessageEvent<{ type: string; id: number; embedding?: Float32Array }>) => {
      if (e.data.type === 'progress') return
      waiting.get(e.data.id)?.(e.data.type === 'result' && e.data.embedding ? Array.from(e.data.embedding) : null)
      waiting.delete(e.data.id)
    }
  }
  const id = ++seq
  return new Promise((res) => {
    waiting.set(id, res)
    worker!.postMessage({ id, text: text.slice(0, 2000) })
  })
}

export async function ask(question: string, bills: Bill[]): Promise<{ bill: Bill; score: number; semantic: boolean } | null> {
  if (!bills.length) return null
  const qv = await embed(question)
  const withVec = bills.filter((b) => b.embedding?.length === 384)
  if (qv && withVec.length) {
    const db = create({ schema: { id: 'string', biller: 'string', text: 'string', embedding: 'vector[384]' } as const })
    for (const b of withVec) await insert(db, { id: b.id, biller: b.biller, text: b.text, embedding: b.embedding! })
    const r = await search(db, { mode: 'hybrid', term: question, vector: { value: qv, property: 'embedding' }, similarity: 0.1, limit: 3 } as never)
    const top = r.hits[0]
    if (top) {
      // Nudge ties with keyword overlap (biller names matter most).
      const ranked = r.hits.map((h) => ({ bill: bills.find((b) => b.id === h.id)!, score: h.score + keywordScore(question, bills.find((b) => b.id === h.id)!) * 0.05 })).sort((a, b) => b.score - a.score)
      return { ...ranked[0], semantic: true }
    }
  }
  const scored = bills.map((bill) => ({ bill, score: keywordScore(question, bill) })).sort((a, b) => b.score - a.score)
  return scored[0].score > 0 ? { ...scored[0], semantic: false } : null
}
