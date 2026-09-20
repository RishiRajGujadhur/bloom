import type { AppData, UrgeEvent } from '../model'
import { id } from '../model'

export const urgeContexts = {
  'Internal state': [
    'Hungry',
    'Angry',
    'Lonely',
    'Tired',
    'Bored',
    'Stressed',
    'Anxious',
  ],
  Location: ['Home', 'Work', 'Commute'],
  Social: ['Alone', 'Friends', 'Coworkers'],
} as const

export type TimeBucket = UrgeEvent['timeBucket']

export const timeBucketLabels: Record<TimeBucket, string> = {
  'early-morning': 'Early morning',
  morning: 'Morning',
  'post-lunch': 'Post-lunch',
  afternoon: 'Afternoon',
  evening: 'Evening',
  'late-night': 'Late night',
}

export function timeBucketAt(timestamp: number): TimeBucket {
  const hour = new Date(timestamp).getHours()
  if (hour >= 5 && hour < 9) return 'early-morning'
  if (hour >= 9 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 16) return 'post-lunch'
  if (hour >= 16 && hour < 19) return 'afternoon'
  if (hour >= 19 && hour < 22) return 'evening'
  return 'late-night'
}

export function dayTypeAt(timestamp: number): UrgeEvent['dayType'] {
  const day = new Date(timestamp).getDay()
  return day === 0 || day === 6 ? 'weekend' : 'weekday'
}

export function dayNameAt(timestamp: number): UrgeEvent['dayOfWeek'] {
  return [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ][new Date(timestamp).getDay()] as UrgeEvent['dayOfWeek']
}

export function createUrgeEvent(
  input: Pick<UrgeEvent, 'habitId' | 'kind' | 'intensity' | 'tags'>,
  context: { sessionSeconds: number; visibilityChanges: number },
  now = Date.now(),
): UrgeEvent {
  return {
    id: id(),
    ...input,
    timestamp: now,
    timeBucket: timeBucketAt(now),
    dayType: dayTypeAt(now),
    dayOfWeek: dayNameAt(now),
    sessionSeconds: Math.max(0, Math.round(context.sessionSeconds)),
    visibilityChanges: Math.max(0, Math.round(context.visibilityChanges)),
  }
}

export interface TriggerCorrelation {
  habitId: string
  tag: string
  observations: number
  slips: number
  probability: number
}

export function calculateCorrelations(
  events: UrgeEvent[],
): TriggerCorrelation[] {
  const groups = new Map<string, UrgeEvent[]>()
  for (const event of events) {
    for (const tag of new Set(event.tags)) {
      const key = `${event.habitId}\u0000${tag}`
      groups.set(key, [...(groups.get(key) ?? []), event])
    }
  }
  return [...groups.entries()]
    .map(([key, observations]) => {
      const [habitId, tag] = key.split('\u0000')
      const slips = observations.filter((event) => event.kind === 'slip').length
      return {
        habitId,
        tag,
        observations: observations.length,
        slips,
        probability: Math.round((slips / observations.length) * 100),
      }
    })
    .sort(
      (a, b) =>
        b.observations - a.observations ||
        b.probability - a.probability ||
        a.tag.localeCompare(b.tag),
    )
}

export function urgeInterruptionRate(events: UrgeEvent[]) {
  if (!events.length) return 0
  return Math.round(
    (events.filter((event) => event.kind === 'urge').length / events.length) *
      100,
  )
}

const suggestions: Record<string, string> = {
  Hungry: 'Prepare a filling snack before this window.',
  Angry: 'Use a two-minute pause before deciding what to do next.',
  Lonely: 'Plan a brief message or check-in with someone you trust.',
  Tired: 'Protect a short rest or lower-friction task before this window.',
  Bored: 'Schedule a five-minute physical stretch just before this window.',
  Stressed: 'Place a one-minute breathing reset before this window.',
  Anxious: 'Try a sensory grounding exercise before this window.',
  Home: 'Change rooms or put the cue out of sight for five minutes.',
  Work: 'Use a brief walk or water break as an interruption.',
  Commute: 'Prepare an alternative audio or hands-free ritual.',
  Alone: 'Make the alternative action visible and easy to start.',
}

export interface UrgeInsight {
  habitId: string
  message: string
  suggestion: string
  daysObserved: number
}

export function buildUrgeInsight(events: UrgeEvent[]): UrgeInsight | null {
  if (events.length < 5) return null
  const timestamps = events.map((event) => event.timestamp)
  const daysObserved =
    Math.floor(
      (Math.max(...timestamps) - Math.min(...timestamps)) / 86_400_000,
    ) + 1
  if (daysObserved < 7) return null

  const correlations = calculateCorrelations(events).filter(
    (item) => item.observations >= 2,
  )
  const strongest = correlations.sort(
    (a, b) => b.probability - a.probability || b.observations - a.observations,
  )[0]
  if (!strongest) return null
  const relatedSlips = events.filter(
    (event) => event.habitId === strongest.habitId && event.kind === 'slip',
  )
  const bucketCounts = relatedSlips.reduce<Partial<Record<TimeBucket, number>>>(
    (counts, event) => ({
      ...counts,
      [event.timeBucket]: (counts[event.timeBucket] ?? 0) + 1,
    }),
    {},
  )
  const dominantBucket = (
    Object.entries(bucketCounts) as [TimeBucket, number][]
  ).sort((a, b) => b[1] - a[1])[0]?.[0]
  const when = dominantBucket
    ? ` during ${timeBucketLabels[dominantBucket]}`
    : ''
  const weekdaySlips = relatedSlips.filter(
    (event) => event.dayType === 'weekday',
  ).length
  const dayWindow =
    weekdaySlips >= relatedSlips.length / 2 ? 'weekdays' : 'weekends'
  return {
    habitId: strongest.habitId,
    daysObserved,
    message: `${strongest.probability}% of logged episodes with “${strongest.tag}” became slips${when} on ${dayWindow}.`,
    suggestion:
      suggestions[strongest.tag] ??
      'Put a small alternative action where this trigger usually appears.',
  }
}

export function addUrgeHabit(data: AppData, title: string): AppData {
  const clean = title.trim()
  if (!clean) return data
  return {
    ...data,
    urgeHabits: [
      ...data.urgeHabits,
      { id: id(), title: clean, archived: false },
    ],
  }
}
