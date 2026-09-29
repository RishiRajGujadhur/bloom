import { evaluate } from 'mathjs'
import { z } from 'zod'

/**
 * Decision Lab model — a weighted decision matrix (criteria × options, scores
 * 1–5, weights 1–5), the result as percentages, a “regret test” for the
 * 10/10/10 rule, and zod-validated storage. Totals are computed with mathjs so
 * users can type small expressions (e.g. “3+1”) into a score.
 */
export const criterionSchema = z.object({ id: z.string(), name: z.string().min(1).max(40), weight: z.number().int().min(1).max(5) })
export const optionSchema = z.object({ id: z.string(), name: z.string().min(1).max(40) })
export const decisionSchema = z.object({
  question: z.string().max(120).default('Which offer should I take?'),
  options: z.array(optionSchema).default([{ id: 'a', name: 'Option A' }, { id: 'b', name: 'Option B' }]),
  criteria: z.array(criterionSchema).default([
    { id: 'c1', name: 'Joy', weight: 5 },
    { id: 'c2', name: 'Money', weight: 3 },
    { id: 'c3', name: 'Growth', weight: 4 },
    { id: 'c4', name: 'Time', weight: 2 },
  ]),
  scores: z.record(z.string(), z.number().min(0).max(5)).default({}),
})
export type Decision = z.infer<typeof decisionSchema>

export const cellKey = (o: string, c: string) => `${o}:${c}`
/** Parse a score like "4" or "3+1" with mathjs, clamped to 0–5. */
export function parseScore(input: string): number | null {
  try {
    const v = Number(evaluate(input))
    return Number.isFinite(v) ? Math.max(0, Math.min(5, Math.round(v * 2) / 2)) : null
  } catch {
    return null
  }
}
/** Weighted percentage for each option (100% = all 5s). */
export function results(d: Decision) {
  const max = d.criteria.reduce((a, c) => a + c.weight * 5, 0) || 1
  return d.options.map((o) => {
    const total = d.criteria.reduce((a, c) => a + c.weight * (d.scores[cellKey(o.id, c.id)] ?? 0), 0)
    return { id: o.id, name: o.name, total, pct: Math.round((total / max) * 100) }
  }).sort((a, b) => b.pct - a.pct)
}
/** Where each option wins most (the criterion contributing the most weighted points). */
export function strongest(d: Decision, optionId: string) {
  let best: { name: string; pts: number } | null = null
  for (const c of d.criteria) {
    const pts = c.weight * (d.scores[cellKey(optionId, c.id)] ?? 0)
    if (!best || pts > best.pts) best = { name: c.name, pts }
  }
  return best?.name ?? '—'
}
