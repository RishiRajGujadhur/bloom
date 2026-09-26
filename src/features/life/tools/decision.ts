import Decimal from 'decimal.js'
import { lines, type Tool } from '../types'
export function rankDecision(values: Record<string, string>) {
  const alternatives = lines(values.alternatives)
  const criteria = lines(values.criteria).map((line) => {
    const [name, weight = '1'] = line.split('|')
    const w = Number(weight.trim())
    if (!name.trim() || !Number.isFinite(w) || w < 0 || w > 100)
      throw new Error(
        'Criteria use Name | weight, with a weight from 0 to 100.',
      )
    return { name: name.trim(), weight: w }
  })
  if (alternatives.length < 2 || alternatives.length > 12)
    throw new Error('Add between two and twelve alternatives, one per line.')
  if (new Set(alternatives).size !== alternatives.length)
    throw new Error('Give each alternative a unique name.')
  if (!criteria.length || criteria.length > 12)
    throw new Error('Add one to twelve criteria.')
  const multiplier = Number(values.sensitivity || 1)
  if (!Number.isFinite(multiplier) || multiplier < 0 || multiplier > 3)
    throw new Error('Sensitivity must be between 0 and 3.')
  const weights = criteria.map((c) =>
    new Decimal(c.weight).times(
      c.name.toLowerCase() === values.sensitive?.trim().toLowerCase()
        ? multiplier
        : 1,
    ),
  )
  const total = weights.reduce((sum, w) => sum.plus(w), new Decimal(0))
  if (total.isZero())
    throw new Error('At least one criterion needs a positive weight.')
  const rows = lines(values.scores)
  if (rows.length !== alternatives.length)
    throw new Error('Enter one score row per alternative in the same order.')
  const excluded = new Set(lines(values.excluded).map((s) => s.toLowerCase()))
  return alternatives
    .map((name, i) => {
      const scores = rows[i]
        .split(',')
        .map((s) => (s.trim() === '' ? NaN : Number(s.trim())))
      if (
        scores.length !== criteria.length ||
        scores.some((n) => !Number.isFinite(n) || n < 0 || n > 10)
      )
        throw new Error(
          `Provide ${criteria.length} scores from 0 to 10 for ${name}. Separate scores with commas.`,
        )
      const score = scores
        .reduce((sum, s, j) => sum.plus(weights[j].times(s)), new Decimal(0))
        .div(total)
        .times(10)
        .toDecimalPlaces(2)
        .toNumber()
      return { name, score, excluded: excluded.has(name.toLowerCase()) }
    })
    .sort(
      (a, b) => Number(a.excluded) - Number(b.excluded) || b.score - a.score,
    )
}
export const decision: Tool = {
  id: 'decision',
  name: 'Decision studio',
  category: 'Clarity & direction',
  color: '#8965b2',
  library: 'decimal.js (MIT)',
  description:
    'Give your choices a little space. Weigh what matters, explore tradeoffs, and choose one small next step.',
  links: ['planning', 'todos', 'journal'],
  fields: [
    {
      key: 'question',
      label: 'The decision',
      hint: 'What are you choosing, and why now?',
    },
    {
      key: 'alternatives',
      label: 'Alternatives',
      kind: 'area',
      initial: 'Option A\nOption B',
      hint: 'One per line, in the same order as your score rows.',
    },
    {
      key: 'criteria',
      label: 'Criteria and weights',
      kind: 'area',
      initial:
        'Cost | 2\nTime | 2\nEnergy | 2\nAccessibility | 3\nReversibility | 1',
      hint: 'One per line: name | weight (0–100). Weights do not need to add up to 100.',
    },
    {
      key: 'scores',
      label: 'Score each alternative',
      kind: 'area',
      initial: '5, 5, 5, 5, 5\n5, 5, 5, 5, 5',
      hint: 'One row per alternative; one 0–10 score per criterion. Higher is always better. For cost, score affordability rather than entering a price.',
    },
    { key: 'must', label: 'Non-negotiable requirements', kind: 'area' },
    {
      key: 'excluded',
      label: 'Alternatives that fail a requirement',
      kind: 'area',
      hint: 'Exact alternative names, one per line. Excluded options remain visible but cannot win.',
    },
    { key: 'cost', label: 'Cost tradeoffs', kind: 'area' },
    { key: 'time', label: 'Time tradeoffs', kind: 'area' },
    { key: 'energy', label: 'Energy tradeoffs', kind: 'area' },
    { key: 'access', label: 'Accessibility requirements', kind: 'area' },
    {
      key: 'reversibility',
      label: 'How could you reverse this choice?',
      kind: 'area',
    },
    { key: 'uncertainty', label: 'What is still uncertain?', kind: 'area' },
    { key: 'pros', label: 'Pros', kind: 'area' },
    { key: 'cons', label: 'Cons', kind: 'area' },
    {
      key: 'sensitive',
      label: 'Criterion to stress-test',
      hint: 'Exact criterion name. Change its weight temporarily using the multiplier.',
    },
    {
      key: 'sensitivity',
      label: 'Sensitivity multiplier',
      kind: 'number',
      min: 0,
      max: 3,
      initial: '1',
    },
    {
      key: 'tie',
      label: 'Tie preference',
      kind: 'select',
      options: [
        'Keep both open',
        'Choose the most reversible',
        'Gather more information',
      ],
      initial: 'Keep both open',
    },
    { key: 'deadline', label: 'Decision deadline', kind: 'date' },
    { key: 'journal', label: 'Why I chose this', kind: 'area' },
    {
      key: 'review',
      label: 'Outcome review',
      kind: 'area',
      hint: 'Come back after trying your choice. What did you learn?',
    },
  ],
  analyze(values) {
    const ranked = rankDecision(values)
    const eligible = ranked.filter((r) => !r.excluded)
    const tied = eligible.filter((r) => r.score === eligible[0]?.score)
    return {
      title: !eligible.length
        ? 'No option meets your requirements yet'
        : tied.length > 1
          ? 'A tie worth exploring'
          : `${eligible[0].name} leads on your criteria`,
      bars: ranked.map((r) => ({
        label: `${r.name}${r.excluded ? ' · excluded' : ''}`,
        value: r.score,
      })),
      lines: [
        ...ranked.map(
          (r) =>
            `${r.name}: ${r.score}/100${r.excluded ? ' — excluded by your must-have filter' : ''}`,
        ),
        ...(tied.length > 1
          ? [
              `Tie approach: ${values.tie || 'Keep both open'}. A score alone does not decide for you.`,
            ]
          : []),
        'These are your ratings, not an objective prediction. Try changing a weight to see whether your preference holds.',
        ...(values.uncertainty
          ? [`Still uncertain: ${values.uncertainty}`]
          : []),
      ],
    }
  },
}
