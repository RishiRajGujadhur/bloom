/** Cosine similarity; invalid, empty and zero vectors have no similarity. */
export function calculateCosineSimilarity(
  vecA: Float32Array,
  vecB: Float32Array,
): number {
  if (!vecA.length || vecA.length !== vecB.length) return 0
  let dot = 0,
    normA = 0,
    normB = 0
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i],
      b = vecB[i]
    if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
    dot += a * b
    normA += a * a
    normB += b * b
  }
  return normA && normB
    ? Math.max(-1, Math.min(1, dot / Math.sqrt(normA * normB)))
    : 0
}
