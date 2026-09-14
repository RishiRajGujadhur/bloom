import type { JournalMode } from './types'

const mode = (id: string, title: string, category: JournalMode['category'], description: string, icon: string, editorType: JournalMode['editorType'], prompts?: string[]): JournalMode => ({
  id, title, category, description, icon, editorType, prompts, metadata: { time: editorType === 'focus' ? '5 min' : editorType === 'guided' ? '10 min' : '15 min', bestFor: category === 'Daily Planning & Productivity' ? 'Starting with intention' : 'Making sense of your inner world' },
})

export const journalModes: JournalMode[] = [
  mode('morning-intentionality', 'Morning Intentionality (The One Thing)', 'Daily Planning & Productivity', 'Choose the one thing that would make today feel meaningful.', '☀', 'focus'),
  mode('bullet-journal', 'Bullet Journal (BuJo) Rapid Logging', 'Daily Planning & Productivity', 'Rapid-log tasks, events, notes, and completions without breaking your rhythm.', '•', 'bujo'),
  mode('weekly-review', 'Weekly Review & Brain Dump', 'Daily Planning & Productivity', 'Clear the mental tabs and decide what deserves your attention next.', '↗', 'split-pane'),
  mode('done-list', 'The Done List (Reverse To-Do list)', 'Daily Planning & Productivity', 'Notice what you finished, carried, and quietly made progress on.', '✓', 'freeform'),
  mode('energy-audit', 'End of Day Energy Audit', 'Daily Planning & Productivity', 'Trace what restored your energy and what asked too much of it.', '◒', 'guided', ['What gave you energy today?', 'What drained or scattered you?', 'What will you protect tomorrow?']),
  mode('nightly-reflection', 'Nightly Reflection', 'Mental Health & Reflection', 'Close the day with a softer, more honest look back.', '☾', 'guided', ['What moment stays with you?', 'What did you learn about yourself?', 'What can you release before sleep?']),
  mode('mental-health-check-in', 'Mental Health Check-in', 'Mental Health & Reflection', 'Name your current state without needing to fix it immediately.', '♡', 'guided', ['What are you feeling?', 'Where do you feel it in your body?', 'What kind of support would help?']),
  mode('gratitude-log', 'Gratitude Log', 'Mental Health & Reflection', 'Collect three specific things that made today a little brighter.', '✦', 'guided', ['Something small I noticed', 'Someone or something I appreciate', 'A way I showed up for myself']),
  mode('unsent-letter', 'Unsent Letter', 'Mental Health & Reflection', 'Give the words somewhere private to land.', '✉', 'freeform'),
  mode('shadow-work', 'Shadow Work Prompts', 'Mental Health & Reflection', 'Meet the patterns you usually edit out with curiosity instead of judgment.', '◐', 'guided', ['What reaction surprised you recently?', 'What might this part of you be protecting?', 'What would compassion sound like here?']),
  mode('future-self-vision', 'Future Self (1-Year Vision)', 'Vision & Future Self', 'Describe a year that feels aligned, vivid, and recognizably yours.', '◎', 'split-pane'),
  mode('future-self-letter', 'Future Self (Letter from the Future)', 'Vision & Future Self', 'Write from the perspective of a future you who kept going.', '⌁', 'freeform'),
  mode('fear-setting', 'Fear Setting', 'Vision & Future Self', 'Make fear concrete, then give yourself a path through it.', '△', 'split-pane'),
  mode('stoic-visualization', 'Stoic Negative Visualization', 'Vision & Future Self', 'Imagine absence briefly so presence becomes easier to appreciate.', '◇', 'guided', ['What are you taking for granted?', 'What would you miss?', 'How can you meet this moment fully?']),
  mode('dream-journal', 'Dream Journal', 'Vision & Future Self', 'Capture the texture of a dream before the details dissolve.', '☁', 'freeform'),
  mode('rpg-quest-log', 'RPG Quest Log (Epic framing for daily tasks)', 'Gamified & Habit Analysis', 'Frame today’s tasks as quests with a clear next action and reward.', '⚔', 'guided', ['What is today’s main quest?', 'What is the smallest next attack?', 'What loot will completion unlock?']),
  mode('peak-experience', 'Peak Experience Log (Logging a major win/loot drop)', 'Gamified & Habit Analysis', 'Record a major win while the glow is still present.', '★', 'guided', ['What happened?', 'What strengths did you use?', 'How will you remember this win?']),
  mode('habit-autopsy', 'Habit Autopsy (Why did a habit fail?)', 'Gamified & Habit Analysis', 'Study a missed habit without turning the evidence into shame.', '⌁', 'split-pane'),
  mode('five-minute-morning', '5-Minute Morning Journal', 'Gamified & Habit Analysis', 'A quick check-in for momentum before the day gets loud.', '5', 'guided', ['How do I want to feel?', 'What is one doable move?', 'What would make today a win?']),
  mode('decision-matrix', 'Decision Matrix Journal', 'Gamified & Habit Analysis', 'Lay out the trade-offs so your next choice can feel grounded.', '⊞', 'split-pane'),
]
