import type { Tool } from '../types'
import * as F from '../fields'
export const meetings: Tool = {
  id: 'meetings',
  name: 'Meeting preparation',
  category: 'Work & focus',
  color: '#6c8c89',
  library: 'ics',
  description:
    'Give your meeting a clear purpose, a realistic agenda, and an accessible plan. Export the time you have chosen.',
  links: ['calendar', 'todos', 'focus'],
  fields: [
    F.textField('title', 'Meeting title'),
    F.area('objective', 'Objective'),
    F.dateField('date', 'Meeting date'),
    { key: 'start', label: 'Start time', kind: 'time', initial: '09:00' },
    F.numeric('duration', 'Meeting duration (minutes)', '30', 5, 480),
    F.select(
      'zone',
      'Time basis',
      ['Device local time', 'UTC'],
      'Device local time',
    ),
    F.area('agenda', 'Agenda', 'One item per line: title | minutes.'),
    F.numeric('break', 'Break allocation (minutes)', '0', 0, 120),
    F.area('attendees', 'Attendee notes', 'No invitations are sent.'),
    F.area('access', 'Access requirements'),
    F.area('reading', 'Pre-reading'),
    F.area('decisions', 'Decisions needed'),
    F.area('questions', 'Questions'),
    F.textField('facilitator', 'Facilitator'),
    F.textField('location', 'Location or meeting link'),
    F.area('notes', 'Meeting notes'),
    F.area('owners', 'Actions and owners'),
    F.dateField('followup', 'Follow-up date'),
    F.area('review', 'Post-meeting review'),
    F.select(
      'status',
      'Meeting state',
      ['Preparing', 'Ready', 'Completed'],
      'Preparing',
    ),
  ],
  async analyze(v) {
    const { createEvent } = await import('ics')
    const title = F.requireText(v.title, 'Meeting title')
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(v.date || '') ||
      !/^\d{2}:\d{2}$/.test(v.start || '')
    )
      throw new Error('Choose a meeting date and start time.')
    const duration = F.finite(v.duration, 'Duration', 5, 480),
      rest = F.finite(v.break || '0', 'Break allocation', 0, 120)
    const agenda = (v.agenda || '')
      .split('\n')
      .filter((s) => s.trim())
      .map((s) => {
        const [label, minutes] = s.split('|')
        return {
          label: label.trim(),
          value: F.finite(minutes?.trim(), 'Agenda minutes', 1, 480),
        }
      })
    const used = agenda.reduce((n, x) => n + x.value, rest)
    if (used > duration)
      throw new Error(
        `Your agenda and breaks need ${used} minutes, but the meeting has ${duration}.`,
      )
    const [year, month, day] = v.date.split('-').map(Number),
      [hour, minute] = v.start.split(':').map(Number)
    const event = createEvent({
      title,
      start: [year, month, day, hour, minute],
      startInputType: v.zone === 'UTC' ? 'utc' : 'local',
      duration: { minutes: duration },
      location: v.location || '',
      description: [v.objective, v.agenda, v.access]
        .filter(Boolean)
        .join('\n\n'),
    })
    if (event.error || !event.value)
      throw new Error(
        'The calendar file could not be created. Check the date and time.',
      )
    return {
      title: `${duration - used} minutes of breathing room`,
      lines: [
        `${used} minutes allocated including breaks.`,
        `Time basis: ${v.zone || 'Device local time'}. Import the file into your calendar and check the displayed timezone.`,
        `Access preparation: ${v.access || 'Ask attendees what would help them participate.'}`,
      ],
      bars: agenda,
      download: {
        name: 'prepared-meeting.ics',
        mime: 'text/calendar',
        text: event.value,
      },
    }
  },
}
