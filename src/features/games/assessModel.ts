/**
 * IQ-style reasoning and EQ (emotional intelligence) assessments, plus the
 * item generators the training games share. These are self-reflection tools,
 * not clinical or standardised tests.
 */

export type Rand = () => number
const pick = <T,>(a: readonly T[], r: Rand) => a[Math.floor(r() * a.length)]
const shuffle = <T,>(a: T[], r: Rand) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/* ---------------- Matrix reasoning ---------------- */
export type Cell = { shape: 'circle' | 'square' | 'triangle' | 'diamond'; count: number; rot: number; fill: number }
export type MatrixItem = { kind: 'matrix'; grid: (Cell | null)[]; options: Cell[]; answer: number; rule: string }
const shapes = ['circle', 'square', 'triangle', 'diamond'] as const
const same = (a: Cell, b: Cell) => a.shape === b.shape && a.count === b.count && a.rot === b.rot && a.fill === b.fill

/** 3×3 matrix; each row follows the same rule(s). Level adds rules. */
export function matrixItem(level: number, r: Rand = Math.random): MatrixItem {
  const rules = shuffle(['count', 'shape', 'rot', 'fill'] as const, r).slice(0, Math.min(3, 1 + Math.floor(level / 3)))
  const base: Cell = { shape: pick(shapes, r), count: 1, rot: 0, fill: Math.floor(r() * 3) }
  const rowShapes = shuffle([...shapes], r).slice(0, 3)
  const grid: Cell[] = []
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 3; col++)
      grid.push({
        shape: rules.includes('shape') ? rowShapes[(row + col) % 3] : rules.includes('count') ? base.shape : shapes[row % 4],
        count: rules.includes('count') ? col + 1 : 1 + (row % 2),
        rot: rules.includes('rot') ? col * 45 : 0,
        fill: rules.includes('fill') ? (col + row) % 3 : base.fill,
      })
  const answerCell = grid[8]
  const distract = new Map<string, Cell>()
  const variants: Cell[] = [
    { ...answerCell, count: answerCell.count === 3 ? 2 : answerCell.count + 1 },
    { ...answerCell, shape: shapes[(shapes.indexOf(answerCell.shape) + 1) % 4] },
    { ...answerCell, rot: (answerCell.rot + 45) % 180 },
    { ...answerCell, fill: (answerCell.fill + 1) % 3 },
    { ...answerCell, count: Math.max(1, answerCell.count - 1), fill: (answerCell.fill + 2) % 3 },
  ]
  for (const v of variants) if (!same(v, answerCell)) distract.set(JSON.stringify(v), v)
  const options = shuffle([answerCell, ...[...distract.values()].slice(0, 5)], r)
  return { kind: 'matrix', grid: [...grid.slice(0, 8), null], options, answer: options.findIndex((o) => same(o, answerCell)), rule: rules.join(' + ') }
}

/* ---------------- Number series ---------------- */
export type SeriesItem = { kind: 'series'; terms: number[]; answer: number; options: number[]; rule: string }
export function seriesItem(level: number, r: Rand = Math.random): SeriesItem {
  const a = 1 + Math.floor(r() * 9)
  const d = 2 + Math.floor(r() * (3 + level))
  const kinds = level < 3 ? ['add', 'mul'] : level < 6 ? ['add', 'mul', 'alt', 'square'] : ['alt', 'square', 'fib', 'growing']
  const k = pick(kinds, r)
  const n = 6
  let terms: number[]
  if (k === 'add') terms = Array.from({ length: n }, (_, i) => a + i * d)
  else if (k === 'mul') terms = Array.from({ length: n }, (_, i) => a * Math.pow(2 + (d % 2), i))
  else if (k === 'alt') terms = Array.from({ length: n }, (_, i) => (i % 2 ? a + Math.floor(i / 2) * d * 2 : a * 3 + Math.floor(i / 2) * d))
  else if (k === 'square') terms = Array.from({ length: n }, (_, i) => (i + 1 + (a % 3)) ** 2)
  else if (k === 'fib') {
    terms = [a, a + d]
    while (terms.length < n) terms.push(terms.at(-1)! + terms.at(-2)!)
  } else terms = Array.from({ length: n }, (_, i) => a + (i * (i + 1) * d) / 2)
  const answer = terms[n - 1]
  const opts = new Set([answer, answer + d, answer - d, answer + 1, answer * 2, answer + Math.round(d / 2) + 2])
  opts.delete(answer)
  return { kind: 'series', terms: terms.slice(0, n - 1), answer, options: shuffle([answer, ...[...opts].filter((x) => x > 0).slice(0, 3)], r), rule: k }
}

/* ---------------- Verbal analogies ---------------- */
export type AnalogyItem = { kind: 'analogy'; stem: string; options: string[]; answer: number }
const analogies: [string, string, string[]][] = [
  ['Hand is to glove as foot is to…', 'sock', ['shoe lace', 'toe', 'leg']],
  ['Bird is to nest as bee is to…', 'hive', ['honey', 'flower', 'wing']],
  ['Hot is to cold as early is to…', 'late', ['soon', 'warm', 'morning']],
  ['Author is to book as composer is to…', 'symphony', ['piano', 'orchestra', 'concert']],
  ['Seed is to tree as egg is to…', 'bird', ['nest', 'shell', 'yolk']],
  ['Minute is to hour as month is to…', 'year', ['week', 'day', 'season']],
  ['Thermometer is to temperature as scale is to…', 'weight', ['height', 'fish', 'music']],
  ['Pen is to write as knife is to…', 'cut', ['fork', 'sharp', 'kitchen']],
  ['Caterpillar is to butterfly as tadpole is to…', 'frog', ['pond', 'fish', 'egg']],
  ['Library is to books as gallery is to…', 'paintings', ['artists', 'frames', 'visitors']],
  ['Drought is to water as famine is to…', 'food', ['hunger', 'rain', 'crops']],
  ['Brave is to fearless as tired is to…', 'weary', ['awake', 'lazy', 'bored']],
]
export function analogyItem(r: Rand = Math.random): AnalogyItem {
  const [stem, correct, wrong] = pick(analogies, r)
  const options = shuffle([correct, ...wrong], r)
  return { kind: 'analogy', stem, options, answer: options.indexOf(correct) }
}

export type IqItem = MatrixItem | SeriesItem | AnalogyItem
/** 15 items, easy → hard: 7 matrices, 5 series, 3 analogies. */
export function iqTest(r: Rand = Math.random): IqItem[] {
  return [
    ...Array.from({ length: 7 }, (_, i) => matrixItem(i + 1, r)),
    ...Array.from({ length: 5 }, (_, i) => seriesItem(i * 2 + 1, r)),
    ...Array.from({ length: 3 }, () => analogyItem(r)),
  ]
}
/** Reasoning index on an IQ-like scale (mean 100, SD 15) from a raw score. */
export function reasoningIndex(correct: number, total: number, seconds: number) {
  const speedBonus = Math.max(0, Math.min(1, (total * 45 - seconds) / (total * 30)))
  const z = (correct + speedBonus - total * 0.55) / (total * 0.18)
  return Math.round(Math.max(55, Math.min(145, 100 + z * 15)))
}
export const indexBand = (score: number) => (score >= 130 ? 'Exceptional' : score >= 115 ? 'High' : score >= 85 ? 'Average range' : score >= 70 ? 'Developing' : 'Early practice')

/* ---------------- EQ ---------------- */
export type EqDomain = 'selfAwareness' | 'selfRegulation' | 'motivation' | 'empathy' | 'social'
export const eqDomains: Record<EqDomain, string> = { selfAwareness: 'Self-awareness', selfRegulation: 'Self-regulation', motivation: 'Motivation', empathy: 'Empathy', social: 'Social skills' }
/** Self-report items (1–5 agreement). `reverse` items score 6 − answer. */
export const eqStatements: { text: string; domain: EqDomain; reverse?: boolean }[] = [
  { text: 'I can usually name what I am feeling, not just “good” or “bad”.', domain: 'selfAwareness' },
  { text: 'I notice how my mood changes the way I talk to people.', domain: 'selfAwareness' },
  { text: 'I am often surprised by how strongly I react.', domain: 'selfAwareness', reverse: true },
  { text: 'I know which situations tend to stress me out.', domain: 'selfAwareness' },
  { text: 'When I am upset I can pause before I respond.', domain: 'selfRegulation' },
  { text: 'I say things in anger that I later regret.', domain: 'selfRegulation', reverse: true },
  { text: 'I can calm myself down when I am anxious.', domain: 'selfRegulation' },
  { text: 'I stay flexible when plans change suddenly.', domain: 'selfRegulation' },
  { text: 'I keep going on goals even when progress is slow.', domain: 'motivation' },
  { text: 'Setbacks make me want to give up quickly.', domain: 'motivation', reverse: true },
  { text: 'I can find something meaningful in routine work.', domain: 'motivation' },
  { text: 'I bounce back after disappointment.', domain: 'motivation' },
  { text: 'I can tell how someone feels from their tone or face.', domain: 'empathy' },
  { text: 'I find it hard to see things from other people’s point of view.', domain: 'empathy', reverse: true },
  { text: 'People tell me I am a good listener.', domain: 'empathy' },
  { text: 'I notice when someone is left out.', domain: 'empathy' },
  { text: 'I can disagree with someone without it turning into a fight.', domain: 'social' },
  { text: 'I help people feel comfortable in a group.', domain: 'social' },
  { text: 'I avoid difficult conversations even when they matter.', domain: 'social', reverse: true },
  { text: 'I can ask for help when I need it.', domain: 'social' },
]

/** Facial expressions drawn as SVG parameters (brows, eyes, mouth). */
export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'afraid' | 'disgusted' | 'calm' | 'proud'
export const faces: Record<Emotion, { brow: number; browTilt: number; eye: number; mouth: number; open: number }> = {
  happy: { brow: 0, browTilt: 0, eye: 0.8, mouth: 10, open: 2 },
  sad: { brow: -2, browTilt: -10, eye: 0.8, mouth: -8, open: 0 },
  angry: { brow: 4, browTilt: 16, eye: 0.6, mouth: -5, open: 1 },
  surprised: { brow: -7, browTilt: 0, eye: 1.3, mouth: 0, open: 8 },
  afraid: { brow: -6, browTilt: -12, eye: 1.25, mouth: -3, open: 5 },
  disgusted: { brow: 3, browTilt: 8, eye: 0.5, mouth: -6, open: 2 },
  calm: { brow: 0, browTilt: 0, eye: 0.35, mouth: 4, open: 0 },
  proud: { brow: -1, browTilt: 4, eye: 0.6, mouth: 7, open: 0 },
}
export const emotionNames = Object.keys(faces) as Emotion[]
export function faceItem(r: Rand = Math.random, pool = 4) {
  const answer = pick(emotionNames, r)
  const options = shuffle([answer, ...shuffle(emotionNames.filter((e) => e !== answer), r).slice(0, pool - 1)], r)
  return { emotion: answer, options, answer: options.indexOf(answer) }
}

/** Situational judgement: pick the most emotionally intelligent response. */
export type Scenario = { text: string; domain: EqDomain; options: string[]; best: number; why: string }
export const scenarios: Scenario[] = [
  { text: 'A colleague snaps at you in a meeting.', domain: 'selfRegulation', options: ['Snap back so they know it is not okay', 'Stay calm, then ask them privately if everything is alright', 'Ignore them for the rest of the week', 'Complain to others after the meeting'], best: 1, why: 'Regulating your reaction and checking in privately protects both of you.' },
  { text: 'A friend says they did not get the job they wanted.', domain: 'empathy', options: ['Tell them there are better jobs anyway', 'Share a story about your own rejection straight away', 'Say that sounds really disappointing and ask how they feel', 'Change the subject to cheer them up'], best: 2, why: 'Naming the feeling and listening comes before advice.' },
  { text: 'You feel anxious before a big presentation.', domain: 'selfAwareness', options: ['Tell yourself not to be silly', 'Notice the anxiety, breathe slowly, and remember it means you care', 'Cancel the presentation', 'Drink three coffees for energy'], best: 1, why: 'Accepting and reframing the feeling works better than fighting it.' },
  { text: 'Your project fails after weeks of work.', domain: 'motivation', options: ['Decide you are just not good at this', 'Blame the team', 'Feel the disappointment, then list what you learned for next time', 'Pretend it does not matter'], best: 2, why: 'Letting yourself feel it, then learning from it, keeps motivation alive.' },
  { text: 'Two friends are arguing and both want you to take their side.', domain: 'social', options: ['Pick the friend you like more', 'Help each of them feel heard and suggest they talk together', 'Avoid both of them', 'Post about it online'], best: 1, why: 'Staying fair and helping them talk builds trust with both.' },
  { text: 'A new person sits alone at a group lunch.', domain: 'empathy', options: ['Assume they want to be alone', 'Invite them to join and introduce them', 'Wait for someone else to do it', 'Talk about them with the group'], best: 1, why: 'Noticing and including others is empathy in action.' },
  { text: 'You get critical feedback that stings.', domain: 'selfRegulation', options: ['Argue every point right away', 'Thank them, take time to cool down, then look for what is useful', 'Quit the task', 'Criticise their work back'], best: 1, why: 'Pausing turns criticism into information instead of a threat.' },
  { text: 'You keep putting off a task you care about.', domain: 'motivation', options: ['Wait until you feel motivated', 'Start with just five minutes and reward yourself', 'Tell yourself you are lazy', 'Delete the task'], best: 1, why: 'Tiny starts beat waiting for motivation.' },
]

export type EqResult = { domains: Record<EqDomain, number>; overall: number }
/** Blend self-report (60%) with ability items (40%) into 0–100 per domain. */
export function scoreEq(answers: number[], faceCorrect: number, faceTotal: number, sjt: { domain: EqDomain; ok: boolean }[]): EqResult {
  const sums: Record<EqDomain, number[]> = { selfAwareness: [], selfRegulation: [], motivation: [], empathy: [], social: [] }
  eqStatements.forEach((s, i) => {
    const a = answers[i] ?? 3
    sums[s.domain].push(((s.reverse ? 6 - a : a) - 1) / 4)
  })
  const faceScore = faceTotal ? faceCorrect / faceTotal : 0.5
  const domains = {} as Record<EqDomain, number>
  for (const d of Object.keys(sums) as EqDomain[]) {
    const self = sums[d].reduce((a, b) => a + b, 0) / Math.max(1, sums[d].length)
    const ability = sjt.filter((x) => x.domain === d)
    const ab = d === 'empathy' ? (faceScore + (ability.length ? ability.filter((x) => x.ok).length / ability.length : faceScore)) / 2 : ability.length ? ability.filter((x) => x.ok).length / ability.length : self
    domains[d] = Math.round((self * 0.6 + ab * 0.4) * 100)
  }
  const overall = Math.round(Object.values(domains).reduce((a, b) => a + b, 0) / 5)
  return { domains, overall }
}

/* ---------------- Personal leaderboard ---------------- */
export type Run = { at: number; game: string; score: number; label: string }
export function leaderboard(runs: Run[], since = 0, limit = 10) {
  return [...runs].filter((r) => r.at >= since).sort((a, b) => b.score - a.score || a.at - b.at).slice(0, limit)
}
/** Best per game, with how the latest run compares with it. */
export function personalBests(runs: Run[]) {
  const out = new Map<string, { best: Run; last: Run; runs: number }>()
  for (const r of [...runs].sort((a, b) => a.at - b.at)) {
    const cur = out.get(r.game)
    out.set(r.game, { best: !cur || r.score > cur.best.score ? r : cur.best, last: r, runs: (cur?.runs ?? 0) + 1 })
  }
  return [...out.entries()].map(([game, v]) => ({ game, ...v }))
}
