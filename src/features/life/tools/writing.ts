import type { Tool } from '../types'
import * as F from '../fields'
export const writing: Tool = {
  id: 'writing',
  name: 'Clear writing lab',
  category: 'Learning & craft',
  color: '#6c8c89',
  library: 'compromise',
  description:
    'Make your writing easier to follow with local language analysis and a thoughtful editing checklist.',
  links: ['journal', 'daybook', 'focus'],
  fields: [
    F.area('draft', 'Your draft'),
    F.textField('audience', 'Audience'),
    F.textField('purpose', 'Purpose'),
    F.numeric('limit', 'Word budget', '300', 1, 100000),
    F.numeric('long', 'Long sentence threshold (words)', '25', 5, 100),
    F.select(
      'tone',
      'Intended tone',
      ['Warm', 'Direct', 'Formal', 'Reflective'],
      'Warm',
    ),
    F.area('action', 'Action you want the reader to take'),
    F.area('opening', 'Revised opening'),
    F.area('closing', 'Revised closing'),
    F.area('jargon', 'Terms to explain', 'One term per line.'),
    F.area('before', 'Earlier version'),
    F.area('facts', 'Facts to verify'),
    F.area('sources', 'Source notes'),
    F.area(
      'access',
      'Accessibility check',
      'Explain unfamiliar abbreviations; use descriptive links.',
    ),
    F.area('questions', 'Questions for the reader'),
    F.area('headings', 'Proposed headings'),
    F.area('examples', 'Concrete examples'),
    F.area('cut', 'What can be removed?'),
    F.dateField('review', 'Review date'),
    F.select(
      'stage',
      'Draft stage',
      ['First draft', 'Revision', 'Ready'],
      'First draft',
    ),
  ],
  async analyze(v) {
    const { default: nlp } = await import('compromise')
    const draft = F.requireText(v.draft, 'Your draft')
    const doc = nlp(draft)
    const sentences = doc.sentences().out('array') as string[]
    const threshold = F.finite(v.long, 'Long sentence threshold', 5, 100)
    const words = draft.trim().split(/\s+/).length
    const budget = F.finite(v.limit, 'Word budget', 1, 100000)
    const counts = new Map<string, number>()
    for (const word of draft.toLowerCase().match(/[a-z]+/g) ?? [])
      if (word.length > 3) counts.set(word, (counts.get(word) ?? 0) + 1)
    const repeated = [...counts]
      .filter(([, n]) => n > 2)
      .sort((a, b) => b[1] - a[1])
    return {
      title: `${words} words · ${sentences.length} sentences`,
      lines: [
        `${Math.max(0, words - budget)} words above your budget.`,
        ...sentences
          .filter((s) => s.split(/\s+/).length > threshold)
          .map((s) => `Consider splitting: ${s}`),
        `Frequently repeated: ${repeated.map(([w, n]) => `${w} (${n})`).join(', ') || 'none above two uses'}.`,
        `Verbs: ${doc.verbs().out('array').join(', ') || 'none detected'}.`,
        `Questions: ${doc.questions().out('array').join(' ') || 'none detected'}.`,
        'Language analysis is a revision aid and can misclassify words.',
      ],
      bars: [
        { label: 'Nouns', value: doc.nouns().length },
        { label: 'Verbs', value: doc.verbs().length },
        { label: 'Adjectives', value: doc.adjectives().length },
      ],
      download: { name: 'writing-draft.txt', text: draft, mime: 'text/plain' },
    }
  },
}
