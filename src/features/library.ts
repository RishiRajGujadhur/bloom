import type { Stat } from '../rpg/schema'

/**
 * Ready-made habits and routines people can adopt in one tap, so starting
 * never begins with a blank form. Grounded in common, low-effort practices.
 */
export type HabitTemplate = {
  id: string
  emoji: string
  title: string
  detail: string
  why: string
  minutes: number
  category: 'mind' | 'body' | 'sleep' | 'focus' | 'connection' | 'growth'
  stat: Stat
  color: string
}

export const habitCategories = [
  { id: 'all', label: 'All' },
  { id: 'mind', label: 'Mind' },
  { id: 'body', label: 'Body' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'focus', label: 'Focus' },
  { id: 'connection', label: 'Connection' },
  { id: 'growth', label: 'Growth' },
] as const

export const habitTemplates: HabitTemplate[] = [
  { id: 'meditate-5', emoji: '🧘', title: 'Meditate for 5 minutes', detail: 'Sit, breathe, notice.', why: 'Short daily sits lower stress and sharpen attention.', minutes: 5, category: 'mind', stat: 'spirit', color: '#855abe' },
  { id: 'gratitude-3', emoji: '🙏', title: 'Three good things', detail: 'Write three things that went well.', why: 'Builds a habit of noticing what is going right.', minutes: 3, category: 'mind', stat: 'spirit', color: '#cb5476' },
  { id: 'journal-line', emoji: '✍️', title: 'One-line journal', detail: 'A single sentence about today.', why: 'Tiny enough to never skip; adds up to a year of memories.', minutes: 2, category: 'mind', stat: 'intelligence', color: '#3788bd' },
  { id: 'breathe-box', emoji: '🌬️', title: 'Box breathing break', detail: 'Four rounds of 4-4-4-4.', why: 'Calms the nervous system in under two minutes.', minutes: 2, category: 'mind', stat: 'spirit', color: '#16866b' },
  { id: 'walk-10', emoji: '🚶', title: 'Walk for 10 minutes', detail: 'Outside if you can.', why: 'Boosts mood and energy; daylight helps sleep.', minutes: 10, category: 'body', stat: 'strength', color: '#16866b' },
  { id: 'stretch', emoji: '🤸', title: 'Stretch after waking', detail: 'Neck, shoulders, hips.', why: 'Loosens stiffness and signals the start of the day.', minutes: 5, category: 'body', stat: 'strength', color: '#bd791b' },
  { id: 'water', emoji: '💧', title: 'Drink a glass of water', detail: 'Before your first coffee.', why: 'Even mild dehydration dulls focus and mood.', minutes: 1, category: 'body', stat: 'strength', color: '#3788bd' },
  { id: 'veg', emoji: '🥗', title: 'Eat a vegetable', detail: 'With at least one meal.', why: 'An easy nudge toward a more balanced plate.', minutes: 5, category: 'body', stat: 'strength', color: '#16866b' },
  { id: 'pushups', emoji: '💪', title: 'Ten push-ups', detail: 'Knees are fine.', why: 'Small strength work compounds quickly.', minutes: 2, category: 'body', stat: 'strength', color: '#cb5476' },
  { id: 'screens-off', emoji: '📵', title: 'Screens off before bed', detail: 'Thirty minutes of no screens.', why: 'Less blue light and stimulation means easier sleep.', minutes: 30, category: 'sleep', stat: 'spirit', color: '#855abe' },
  { id: 'same-bedtime', emoji: '🌙', title: 'Consistent bedtime', detail: 'Within 30 minutes of your target.', why: 'A steady rhythm is the strongest sleep habit.', minutes: 1, category: 'sleep', stat: 'spirit', color: '#3788bd' },
  { id: 'read-night', emoji: '📖', title: 'Read before sleep', detail: 'Ten pages, paper if possible.', why: 'Winds the mind down and grows your reading list.', minutes: 15, category: 'sleep', stat: 'intelligence', color: '#bd791b' },
  { id: 'top-task', emoji: '🎯', title: 'Pick one top task', detail: 'Before opening email.', why: 'Protects the day for what matters most.', minutes: 2, category: 'focus', stat: 'intelligence', color: '#cb5476' },
  { id: 'deep-block', emoji: '⏱️', title: 'One focus block', detail: '25 minutes, notifications off.', why: 'Deep work is where meaningful progress happens.', minutes: 25, category: 'focus', stat: 'intelligence', color: '#855abe' },
  { id: 'inbox-zero', emoji: '📥', title: 'Process your inbox once', detail: 'One batch, not all day.', why: 'Batching cuts context switching.', minutes: 15, category: 'focus', stat: 'intelligence', color: '#3788bd' },
  { id: 'desk-reset', emoji: '🧹', title: 'Reset your desk', detail: 'Clear it at the end of the day.', why: 'A clear start makes tomorrow easier.', minutes: 5, category: 'focus', stat: 'strength', color: '#bd791b' },
  { id: 'message-friend', emoji: '💬', title: 'Message someone you care about', detail: 'A quick hello counts.', why: 'Small check-ins keep relationships warm.', minutes: 2, category: 'connection', stat: 'spirit', color: '#cb5476' },
  { id: 'thank-you', emoji: '💌', title: 'Say a specific thank-you', detail: 'Name what they did.', why: 'Specific gratitude strengthens bonds.', minutes: 2, category: 'connection', stat: 'spirit', color: '#16866b' },
  { id: 'phone-free-meal', emoji: '🍽️', title: 'Phone-free meal', detail: 'Eat with people or with yourself.', why: 'Presence makes meals and conversations better.', minutes: 20, category: 'connection', stat: 'spirit', color: '#bd791b' },
  { id: 'learn-10', emoji: '🧠', title: 'Learn for 10 minutes', detail: 'A course, a language, a skill.', why: 'Ten minutes a day is 60 hours a year.', minutes: 10, category: 'growth', stat: 'intelligence', color: '#855abe' },
  { id: 'reflect-week', emoji: '🔎', title: 'Evening reflection', detail: 'What went well? What will you change?', why: 'Reflection turns experience into learning.', minutes: 5, category: 'growth', stat: 'intelligence', color: '#3788bd' },
  { id: 'save-money', emoji: '🪙', title: 'No-spend check', detail: 'Pause before non-essential buys.', why: 'A small pause prevents impulse spending.', minutes: 1, category: 'growth', stat: 'intelligence', color: '#16866b' },
]

export type RoutineTemplate = {
  id: string
  emoji: string
  title: string
  detail: string
  period: 'morning' | 'afternoon' | 'evening' | 'night'
  days: number[]
  steps: { title: string; minutes: number }[]
}

export const routineTemplates: RoutineTemplate[] = [
  { id: 'gentle-morning', emoji: '🌅', title: 'Gentle morning', detail: 'Wake slowly and set the tone.', period: 'morning', days: [0, 1, 2, 3, 4, 5, 6], steps: [ { title: 'Drink a glass of water', minutes: 1 }, { title: 'Stretch', minutes: 5 }, { title: 'Breathe or meditate', minutes: 5 }, { title: 'Write one intention', minutes: 2 } ] },
  { id: 'focus-launch', emoji: '🚀', title: 'Workday launch', detail: 'Start work with a clear plan.', period: 'morning', days: [1, 2, 3, 4, 5], steps: [ { title: 'Review calendar', minutes: 3 }, { title: 'Pick one top task', minutes: 2 }, { title: 'Silence notifications', minutes: 1 }, { title: 'First focus block', minutes: 25 } ] },
  { id: 'midday-reset', emoji: '🌤️', title: 'Midday reset', detail: 'Recharge between tasks.', period: 'afternoon', days: [1, 2, 3, 4, 5], steps: [ { title: 'Step away from the screen', minutes: 2 }, { title: 'Walk outside', minutes: 10 }, { title: 'Box breathing', minutes: 2 }, { title: 'Re-check priorities', minutes: 3 } ] },
  { id: 'workday-shutdown', emoji: '🧾', title: 'Workday shutdown', detail: 'Close loops and switch off.', period: 'evening', days: [1, 2, 3, 4, 5], steps: [ { title: 'Capture open loops', minutes: 5 }, { title: 'Plan tomorrow', minutes: 5 }, { title: 'Reset your desk', minutes: 3 }, { title: 'Say “shutdown complete”', minutes: 1 } ] },
  { id: 'wind-down', emoji: '🌙', title: 'Wind-down', detail: 'Ease into restful sleep.', period: 'night', days: [0, 1, 2, 3, 4, 5, 6], steps: [ { title: 'Screens off', minutes: 1 }, { title: 'Tidy one thing', minutes: 5 }, { title: 'Three good things', minutes: 3 }, { title: 'Read', minutes: 15 } ] },
  { id: 'sunday-review', emoji: '🗓️', title: 'Weekly review', detail: 'Look back, then plan ahead.', period: 'afternoon', days: [0], steps: [ { title: 'Review last week', minutes: 10 }, { title: 'Celebrate one win', minutes: 3 }, { title: 'Choose next week’s priorities', minutes: 10 }, { title: 'Block focus time', minutes: 5 } ] },
  { id: 'move-break', emoji: '🏃', title: 'Movement snack', detail: 'A quick burst to get unstuck.', period: 'afternoon', days: [0, 1, 2, 3, 4, 5, 6], steps: [ { title: 'Ten squats', minutes: 2 }, { title: 'Shoulder rolls', minutes: 1 }, { title: 'Brisk walk', minutes: 5 } ] },
  { id: 'calm-evening', emoji: '🕯️', title: 'Calm evening', detail: 'Let the day settle.', period: 'evening', days: [0, 1, 2, 3, 4, 5, 6], steps: [ { title: 'Phone-free dinner', minutes: 20 }, { title: 'Evening reflection', minutes: 5 }, { title: 'Gentle stretch', minutes: 5 } ] },
]
