import type { Tool } from '../types'
import * as F from '../fields'
export const reading: Tool = {
  id: 'reading',
  name: 'Reading companion',
  category: 'Learning & craft',
  color: '#6c8c89',
  library: 'reading-time',
  description:
    'Turn a chapter or article into a calm reading session, a useful idea, and something worth remembering.',
  links: ['cards', 'palace', 'focus'],
  fields: [
    F.textField('book', 'Book or article'),
    F.textField('author', 'Author'),
    F.textField('source', 'Source link'),
    F.area(
      'excerpt',
      'Text to read',
      'Paste text to estimate its reading time.',
    ),
    F.numeric('speed', 'Reading speed (words per minute)', '200', 50, 1000),
    F.numeric('budget', 'Session budget (minutes)', '15', 1, 240),
    F.numeric('target', 'Pages per session', '10', 1, 1000),
    F.numeric('page', 'Current page', '0', 0, 100000),
    F.numeric('total', 'Total pages', '100', 1, 100000),
    F.select(
      'status',
      'Reading state',
      ['To read', 'Reading', 'Finished', 'Paused'],
      'Reading',
    ),
    F.area('vocabulary', 'Vocabulary to revisit'),
    F.area('questions', 'Questions to explore'),
    F.area('idea', 'Key idea'),
    F.area('connection', 'Connection to your life'),
    F.area('action', 'Something to try'),
    F.area('recall', 'Recall without looking'),
    F.dateField('revisit', 'Revisit date'),
    F.dateField('finished', 'Finished date'),
    F.area('history', 'Reading session notes'),
    F.select(
      'format',
      'Reading format',
      ['Paper', 'E-book', 'Article', 'Audio transcript'],
      'Paper',
    ),
  ],
  async analyze(v) {
    const { default: readingTime } = await import('reading-time')
    const text = F.requireText(v.excerpt, 'Text to read')
    const speed = F.finite(v.speed, 'Reading speed', 50, 1000)
    const budget = F.finite(v.budget, 'Session budget', 1, 240)
    const total = F.finite(v.total, 'Total pages', 1, 100000)
    const page = F.finite(v.page, 'Current page', 0, total)
    const target = F.finite(v.target, 'Pages per session', 1, 1000)
    const estimate = readingTime(text, { wordsPerMinute: speed })
    const note = [v.book, v.idea, v.connection, v.action, v.recall]
      .filter(Boolean)
      .join('\n\n')
    return {
      title: `${estimate.words} words · ${Math.ceil(estimate.minutes)} minute read`,
      lines: [
        `${Math.max(1, Math.ceil(estimate.minutes / budget))} reading session(s) at your chosen pace.`,
        `Page ${page} of ${total}: ${Math.round((page / total) * 100)}% complete.`,
        `${Math.ceil((total - page) / target)} page-based sessions remain. Text and page estimates are separate.`,
        ...(v.questions ? [`Carry this question: ${v.questions}`] : []),
      ],
      bars: [
        { label: 'Pages read', value: page },
        { label: 'Pages remaining', value: total - page },
      ],
      download: { name: 'reading-notes.txt', text: note, mime: 'text/plain' },
    }
  },
}
