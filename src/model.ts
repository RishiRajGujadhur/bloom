import { z } from 'zod'
import { initialRpg, inferStat, rpgSchema, statSchema } from './rpg/schema'
export { dayKey } from './dates'

export const id = () => crypto.randomUUID()
export const steps = [
  {
    category: 'reflection',
    prompt: 'Let’s take a breath. How are you feeling today?',
    chips: [
      'Feeling grounded',
      'A little overwhelmed',
      'Ready for a fresh start',
    ],
  },
  {
    category: 'win',
    prompt: 'What’s one small win you want to give yourself credit for?',
    chips: ['I made time for myself', 'I showed up', 'I took a small step'],
  },
  {
    category: 'obstacle',
    prompt: 'What felt challenging, and what helped you get through it?',
    chips: [
      'I paused and tried again',
      'I asked for help',
      'I’m still working through it',
    ],
  },
  {
    category: 'action_step',
    prompt: 'What’s one gentle, doable action you’ll take tomorrow?',
    chips: [
      'Take a 10-minute walk',
      'Start with a glass of water',
      'Make space to rest',
    ],
  },
] as const
const categorySchema = z.enum(['reflection', 'win', 'obstacle', 'action_step'])
const messageSchema = z.object({
  id: z.string(),
  sender: z.enum(['user', 'bot']),
  text: z.string(),
  timestamp: z.number(),
  category: categorySchema,
})
const sessionSchema = z.object({
  metadata: z.object({
    id: z.string(),
    date: z.string(),
    mood: z.number().int().min(1).max(5).nullable(),
    energy: z.number().int().min(1).max(5).nullable(),
    tags: z.array(z.string()),
  }),
  messages: z.array(messageSchema),
  flow: z.object({
    step: z.number().int().min(0).max(3),
    typing: z.boolean(),
    complete: z.boolean(),
  }),
})
export const legacySchema = z.object({
  version: z.literal(1),
  habits: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(100),
      detail: z.string(),
      dates: z.array(z.string()),
    }),
  ),
  plans: z.array(
    z.object({
      id: z.string(),
      title: z.string().min(1).max(150),
      date: z.string(),
      done: z.boolean(),
    }),
  ),
  affirmation: z.string().min(1).max(300),
  draft: sessionSchema.nullable(),
  sessions: z.array(sessionSchema),
})
export const dataSchema = legacySchema.extend({ version: z.literal(2), habits: z.array(legacySchema.shape.habits.element.extend({ stat: statSchema })), rpg: rpgSchema })
export function parseData(input: unknown): AppData {
  if (typeof input === 'object' && input !== null && 'version' in input && input.version === 1) {
    const old = legacySchema.parse(input)
    return { ...old, version: 2, habits: old.habits.map(h => ({ ...h, stat: inferStat(h.title) })), rpg: initialRpg() }
  }
  return dataSchema.parse(input)
}
export type JournalMessage = z.infer<typeof messageSchema>
export type Session = z.infer<typeof sessionSchema>
export type AppData = z.infer<typeof dataSchema>
export function newSession(): Session {
  return {
    metadata: {
      id: id(),
      date: new Date().toISOString(),
      mood: null,
      energy: null,
      tags: [],
    },
    messages: [
      {
        id: id(),
        sender: 'bot',
        text: steps[0].prompt,
        timestamp: Date.now(),
        category: 'reflection',
      },
    ],
    flow: { step: 0, typing: false, complete: false },
  }
}
export const defaults = (): AppData => ({
  version: 2,
  habits: [
    {
      id: id(),
      title: 'Move with intention',
      stat: 'strength',
      detail: 'A walk, a stretch, a little movement',
      dates: [],
    },
    {
      id: id(),
      title: 'Stay hydrated',
      stat: 'spirit',
      detail: 'Make time for a glass of water',
      dates: [],
    },
    {
      id: id(),
      title: 'Take a mindful moment',
      stat: 'spirit',
      detail: 'Pause. Breathe. Come back to yourself.',
      dates: [],
    },
  ],
  plans: [],
  affirmation:
    'I don’t have to do it all. Small steps are still steps forward.',
  draft: null,
  sessions: [],
  rpg: initialRpg(),
})

export function reply(session: Session, text: string): Session {
  const trimmed = text.trim()
  if (
    !trimmed ||
    trimmed.length > 2000 ||
    session.flow.typing ||
    session.flow.complete
  )
    return session
  const final = session.flow.step === steps.length - 1
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: id(),
        sender: 'user',
        text: trimmed,
        timestamp: Date.now(),
        category: steps[session.flow.step].category,
      },
    ],
    flow: { ...session.flow, typing: !final, complete: final },
  }
}
export function advance(session: Session): Session {
  if (!session.flow.typing || session.flow.complete) return session
  const step = session.flow.step + 1
  if (step >= steps.length) return session
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: id(),
        sender: 'bot',
        text: steps[step].prompt,
        timestamp: Date.now(),
        category: steps[step].category,
      },
    ],
    flow: { step, typing: false, complete: false },
  }
}
export function toggleHabit(
  data: AppData,
  habitId: string,
  day: string,
): AppData {
  return {
    ...data,
    habits: data.habits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            dates: h.dates.includes(day)
              ? h.dates.filter((d) => d !== day)
              : [...h.dates, day],
          }
        : h,
    ),
  }
}
export const STORAGE_KEY = 'mindfulness-dashboard-v1'
export function loadData(): { data: AppData; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: defaults(), error: '' }
    return { data: parseData(JSON.parse(raw)), error: '' }
  } catch {
    return {
      data: defaults(),
      error:
        'Your saved data could not be read. It has not been overwritten. Export the original data before enabling saving again.',
    }
  }
}
