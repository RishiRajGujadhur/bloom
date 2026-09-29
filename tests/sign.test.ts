import { alphabet, classify, score, words, type Pt } from '../src/features/sign/signModel'

/** Build a synthetic hand: wrist at origin, fingers pointing up when extended. */
function hand(ext: [number, number, number, number, number], spread = false): Pt[] {
  const lm: Pt[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }))
  lm[0] = { x: 0, y: 0 }
  const base = [-0.3, -0.12, 0, 0.12, 0.24]
  for (let f = 1; f < 5; f++) {
    const x = base[f] + (spread && f === 1 ? -0.08 : spread && f === 2 ? 0.08 : 0)
    const mcp = 1 + (f - 1) * 4, pip = mcp + 1, dip = mcp + 2, tip = mcp + 3
    lm[mcp] = { x: base[f], y: -0.5 }
    lm[pip] = { x: base[f], y: -0.7 }
    lm[dip] = ext[f] ? { x, y: -0.85 } : { x: base[f], y: -0.6 }
    lm[tip] = ext[f] ? { x, y: -1.0 } : { x: base[f], y: -0.45 }
  }
  // indices above are shifted by one for fingers; set real MediaPipe indices
  const real: Pt[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }))
  real[0] = lm[0]
  const fingers = [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]
  fingers.forEach((idx, fi) => idx.forEach((ri, k) => (real[ri] = lm[1 + fi * 4 + k])))
  real[1] = { x: -0.15, y: -0.2 }; real[2] = { x: -0.25, y: -0.3 }
  real[3] = ext[0] ? { x: -0.45, y: -0.35 } : { x: -0.12, y: -0.45 }
  real[4] = ext[0] ? { x: -0.65, y: -0.4 } : { x: -0.05, y: -0.5 }
  return real
}

test('classifies letters from finger states', () => {
  expect(classify(hand([0, 1, 1, 1, 1]))).toBe('B')
  expect(classify(hand([1, 1, 0, 0, 0]))).toBe('L')
  expect(classify(hand([0, 0, 0, 0, 1]))).toBe('I')
  expect(classify(hand([1, 0, 0, 0, 1]))).toBe('Y')
  expect(classify(hand([0, 1, 1, 0, 0], true))).toBe('V')
  expect(classify(hand([0, 1, 1, 0, 0], false))).toBe('U')
})

test('practice words only use signable letters, and scoring', () => {
  for (const w of words) for (const c of w) expect(alphabet).toContain(c)
  expect(score('BAD', 'BAD').dist).toBe(0)
  expect(score('BID', 'BAD').right).toBe(2)
})
