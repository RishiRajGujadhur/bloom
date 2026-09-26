import type { Tool } from '../types'
import { lines } from '../types'
import {
  area,
  dateField,
  finite,
  numeric,
  requireText,
  select,
  textField,
} from '../fields'
export async function practiceSchedule(history: string, retention = 0.9) {
  const { fsrs, createEmptyCard, Rating } = await import('ts-fsrs')
  const entries = lines(history).map((line) => {
    const [date, rating] = line.split('|').map((s) => s.trim())
    const time = new Date(date.includes('T') ? date : date + 'T12:00:00Z')
    if (
      !/^\d{4}-\d{2}-\d{2}(T.*Z)?$/.test(date) ||
      !Number.isFinite(time.getTime()) ||
      !['Again', 'Hard', 'Good', 'Easy'].includes(rating)
    )
      throw new Error(
        'Review history uses one line per review: YYYY-MM-DD | Again, Hard, Good, or Easy.',
      )
    return { time, rating }
  })
  if (!entries.length)
    throw new Error(
      'Add at least one completed review to get a next practice date.',
    )
  if (entries.some((e, i) => i > 0 && e.time <= entries[i - 1].time))
    throw new Error(
      'Keep review dates in increasing order, with at most one review per day.',
    )
  const scheduler = fsrs({ request_retention: retention, enable_fuzz: false })
  let card = createEmptyCard(entries[0].time)
  for (const e of entries)
    card = scheduler.next(
      card,
      e.time,
      Rating[e.rating as 'Again' | 'Hard' | 'Good' | 'Easy'],
    ).card
  return card
}
export const practice: Tool = {
  id: 'practice',
  name: 'Skill practice planner',
  category: 'Learning & craft',
  color: '#6088a5',
  library: 'ts-fsrs (MIT)',
  description:
    'Practice with intention, then return at a useful time. Keep your evidence, reflection, and next review together.',
  links: ['cards', 'palace', 'focus', 'todos'],
  fields: [
    textField('skill', 'Skill'),
    area('parts', 'Smaller parts of the skill'),
    area('objective', 'Today’s practice objective'),
    area('baseline', 'Starting point'),
    area('evidence', 'What you produced or demonstrated'),
    numeric('short', 'Short session (minutes)', '10', 1, 240),
    numeric('long', 'Long session (minutes)', '30', 1, 480),
    area(
      'history',
      'Completed review history',
      'One per line: YYYY-MM-DD | Again, Hard, Good, or Easy.',
    ),
    select(
      'meaning',
      'Rating guide',
      [
        'Again: could not recall',
        'Hard: recalled with difficulty',
        'Good: recalled with effort',
        'Easy: recalled readily',
      ],
      'Good: recalled with effort',
    ),
    numeric('retention', 'Desired retention (0.7–0.97)', '0.9', 0.7, 0.97),
    dateField('today', 'Planning date'),
    select('priority', 'Priority', ['Gentle', 'Normal', 'Important'], 'Normal'),
    textField('context', 'Practice environment'),
    numeric('confidence', 'Confidence (0–10)', '5', 0, 10),
    area('reflection', 'What helped or got in the way?'),
    area('recovery', 'Small restart after a missed day'),
    area('feedback', 'Feedback received'),
    area('resources', 'Practice resources'),
    select('mode', 'Session size', ['Short', 'Long'], 'Short'),
    area('next', 'Next practice task'),
  ],
  async analyze(v) {
    const skill = requireText(v.skill, 'Skill')
    const card = await practiceSchedule(
      v.history,
      finite(v.retention, 'Desired retention', 0.7, 0.97),
    )
    return {
      title: `Next review for ${skill}`,
      lines: [
        `Review on ${card.due.toISOString().slice(0, 10)} at ${card.due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} local time.`,
        `${card.reps} reviews replayed from your history. Add a new dated rating after your next practice.`,
        `${v.mode === 'Long' ? v.long : v.short} minutes planned. ${v.next || 'Choose one small practice task.'}`,
        'This schedules recall practice; it does not measure mastery of a physical or professional skill.',
      ],
      bars: [
        { label: 'Reviews', value: card.reps },
        { label: 'Interval (days)', value: card.scheduled_days },
      ],
    }
  },
}
