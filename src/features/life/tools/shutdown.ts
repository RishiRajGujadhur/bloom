import type { Tool } from '../types'
import * as F from '../fields'
export const shutdown: Tool = {
  id: 'shutdown',
  name: 'Programmer shutdown desk',
  category: 'Work & focus',
  color: '#6c8c89',
  library: 'fast-diff',
  description:
    'Leave a clear trail for your future self. Capture the working state, what changed, and the smallest step to resume.',
  links: ['focus', 'todos', 'roadmap'],
  fields: [
    F.textField('project', 'Project'),
    F.textField('branch', 'Branch note'),
    F.area('objective', 'Current objective'),
    F.area('working', 'Last working state'),
    F.area('repro', 'Reproduction steps'),
    F.area('expected', 'Expected behavior'),
    F.area('actual', 'Actual behavior'),
    F.area('hypothesis', 'Current hypothesis'),
    F.area('attempt', 'Attempted fix'),
    F.textField('command', 'Test command', 'Stored as text; never executed.'),
    F.area('test', 'Test result'),
    F.area('blocker', 'Blocker'),
    F.area('next', 'Smallest next step'),
    F.area('links', 'Reference links'),
    F.area('before', 'Before note or snippet'),
    F.area('after', 'After note or snippet'),
    F.select(
      'testState',
      'Verification state',
      ['Not run', 'Passing', 'Failing', 'Blocked'],
      'Not run',
    ),
    F.area('checklist', 'Shutdown checklist', 'One item per line.'),
    F.dateField('resume', 'Resume date'),
    F.numeric('minutes', 'Next focus session (minutes)', '25', 5, 180),
  ],
  async analyze(v) {
    const { default: diff } = await import('fast-diff')
    F.requireText(v.project, 'Project')
    const before = v.before || '',
      after = v.after || ''
    const chunks = diff(before, after)
    const added = chunks
      .filter(([kind]) => kind === 1)
      .reduce((n, [, text]) => n + text.length, 0)
    const removed = chunks
      .filter(([kind]) => kind === -1)
      .reduce((n, [, text]) => n + text.length, 0)
    const summary = [
      `Project: ${v.project}`,
      `Branch: ${v.branch || 'not recorded'}`,
      `Resume with: ${v.next || 'Choose the smallest reproducible step.'}`,
      `Verification: ${v.testState || 'Not run'}`,
      `Test command (not executed): ${v.command || 'not recorded'}`,
      `Test result: ${v.test || 'not recorded'}`,
      `Blocker: ${v.blocker || 'none recorded'}`,
    ]
    return {
      title: 'Your return-to-work card',
      lines: [
        ...summary,
        ...chunks
          .filter(([kind]) => kind !== 0)
          .map(
            ([kind, text]) => `${kind === 1 ? 'Added' : 'Removed'}: ${text}`,
          ),
      ],
      bars: [
        { label: 'Characters added', value: added },
        { label: 'Characters removed', value: removed },
      ],
      download: {
        name: 'resume-work.txt',
        text: summary.join('\n'),
        mime: 'text/plain',
      },
    }
  },
}
