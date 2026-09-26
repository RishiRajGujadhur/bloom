import type { Tool } from '../types'
import {
  area,
  dateField,
  finite,
  numeric,
  requireText,
  select,
  textField,
} from '../fields'
export const connections: Tool = {
  id: 'connections',
  name: 'Connection garden',
  category: 'Connection & care',
  color: '#598775',
  library: 'fuse.js (Apache-2.0)',
  description:
    'Keep the people you care about in view. Remember what matters to them and make space for a gentle check-in.',
  links: ['calendar', 'gratitude', 'todos'],
  fields: [
    textField('name', 'Preferred name'),
    select('circle', 'Relationship circle', [
      'Family',
      'Friend',
      'Colleague',
      'Community',
      'Mentor',
      'Other',
    ]),
    select('channel', 'Preferred channel', [
      'In person',
      'Phone',
      'Text',
      'Email',
      'Video',
      'Written card',
    ]),
    numeric('cadence', 'Check-in interval (days)', '14', 1, 365),
    dateField('last', 'Last meaningful contact'),
    dateField('today', 'Plan for date'),
    area('notes', 'Conversation notes'),
    dateField('important', 'Important date'),
    area('interests', 'Shared interests'),
    area('access', 'Access and communication preferences'),
    textField(
      'zone',
      'Their timezone',
      'Use an IANA name such as Indian/Mauritius.',
    ),
    textField('quiet', 'Quiet hours'),
    area('gratitude', 'Something to appreciate'),
    area('invite', 'An invitation to offer'),
    area('support', 'Practical support you can offer'),
    area('followup', 'Next conversation thread'),
    select('archive', 'Contact state', ['Active', 'Archived'], 'Active'),
    area('history', 'Earlier contact notes'),
    textField(
      'query',
      'Find a saved connection',
      'Fuzzy search across saved names, circles, and interests.',
    ),
    numeric('limit', 'Maximum search results', '5', 1, 20),
  ],
  async analyze(v, records) {
    const { default: Fuse } = await import('fuse.js')
    const name = requireText(v.name, 'Preferred name')
    const interval = finite(v.cadence, 'Check-in interval', 1, 365)
    const day = /^\d{4}-\d{2}-\d{2}$/
    if (!day.test(v.last ?? '') || !day.test(v.today ?? ''))
      throw new Error('Choose a last-contact date and a planning date.')
    const last = new Date(v.last + 'T12:00:00Z'),
      today = new Date(v.today + 'T12:00:00Z')
    if (
      !Number.isFinite(last.getTime()) ||
      !Number.isFinite(today.getTime()) ||
      last > today
    )
      throw new Error(
        'Last contact must be a valid date on or before your planning date.',
      )
    const due = new Date(last.getTime() + interval * 86400000)
    const days = Math.ceil((due.getTime() - today.getTime()) / 86400000)
    const pool = records.filter(
      (r) => r.tool === 'connections' && r.values.archive !== 'Archived',
    )
    const matches = v.query?.trim()
      ? new Fuse(pool, {
          keys: ['values.name', 'values.circle', 'values.interests'],
          threshold: 0.35,
        })
          .search(v.query)
          .slice(0, finite(v.limit || '5', 'Maximum results', 1, 20))
          .map((r) => r.item)
      : []
    return {
      title:
        v.archive === 'Archived'
          ? `${name} is archived`
          : days <= 0
            ? `A gentle time to check in with ${name}`
            : `Your next check-in is in ${days} days`,
      lines: [
        `Next contact date: ${due.toISOString().slice(0, 10)}. This is your chosen cadence, not an obligation.`,
        ...(v.followup ? [`Pick up this thread: ${v.followup}`] : []),
        ...(v.gratitude ? [`Appreciation: ${v.gratitude}`] : []),
        ...(v.access ? [`Remember: ${v.access}`] : []),
        ...(v.query
          ? [
              matches.length
                ? `Matching connections: ${matches.map((r) => r.values.name).join(', ')}`
                : 'No saved connection matches yet.',
            ]
          : []),
      ],
      bars: [
        {
          label: 'Days since contact',
          value: Math.floor((today.getTime() - last.getTime()) / 86400000),
        },
        { label: 'Chosen interval', value: interval },
      ],
    }
  },
}
