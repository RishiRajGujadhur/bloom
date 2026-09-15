import { z } from 'zod'
import i18n from './i18n/i18n'
import { initialRpg, inferStat, rpgSchema, statSchema } from './rpg/schema'
export { dayKey } from './dates'

export const id = () => crypto.randomUUID()

/** Categories are stable data keys; their prompt/chip text comes from the active locale. */
export const stepCategories = [
  'reflection',
  'win',
  'obstacle',
  'action_step',
] as const
export type StepCategory = (typeof stepCategories)[number]
export const STEPS = stepCategories.length

type Translator = (key: string, options?: Record<string, unknown>) => unknown

const translator = (language: string): Translator =>
  i18n.getFixedT(language) as unknown as Translator

export function stepPrompt(step: number, language = 'en'): string {
  const category = stepCategories[step] ?? stepCategories[0]
  return String(translator(language)(`prompts.${category}.prompt`))
}

export function stepChips(step: number, language = 'en'): string[] {
  const category = stepCategories[step] ?? stepCategories[0]
  const chips = translator(language)(`prompts.${category}.chips`, {
    returnObjects: true,
  })
  return Array.isArray(chips) ? (chips as string[]) : []
}

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
export function newSession(language = 'en'): Session {
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
        text: stepPrompt(0, language),
        timestamp: Date.now(),
        category: 'reflection',
      },
    ],
    flow: { step: 0, typing: false, complete: false },
  }
}
export const defaults = (language = 'en'): AppData => {
  const tt = translator(language)
  const text = (key: string) => String(tt(key))
  return {
    version: 2,
    habits: [
      {
        id: id(),
        title: text('defaults.move'),
        stat: 'strength',
        detail: text('defaults.moveDetail'),
        dates: [],
      },
      {
        id: id(),
        title: text('defaults.hydrate'),
        stat: 'spirit',
        detail: text('defaults.hydrateDetail'),
        dates: [],
      },
      {
        id: id(),
        title: text('defaults.mindful'),
        stat: 'spirit',
        detail: text('defaults.mindfulDetail'),
        dates: [],
      },
    ],
    plans: [],
    affirmation: text('defaults.affirmation'),
    draft: null,
    sessions: [],
    rpg: initialRpg(),
  }
}

export function reply(session: Session, text: string): Session {
  const trimmed = text.trim()
  if (
    !trimmed ||
    trimmed.length > 2000 ||
    session.flow.typing ||
    session.flow.complete
  )
    return session
  const final = session.flow.step === STEPS - 1
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: id(),
        sender: 'user',
        text: trimmed,
        timestamp: Date.now(),
        category: stepCategories[session.flow.step],
      },
    ],
    flow: { ...session.flow, typing: !final, complete: final },
  }
}
export function advance(session: Session, language = 'en'): Session {
  if (!session.flow.typing || session.flow.complete) return session
  const step = session.flow.step + 1
  if (step >= STEPS) return session
  return {
    ...session,
    messages: [
      ...session.messages,
      {
        id: id(),
        sender: 'bot',
        text: stepPrompt(step, language),
        timestamp: Date.now(),
        category: stepCategories[step],
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
export function loadData(language = 'en'): { data: AppData; error: string } {
  const tt = translator(language)
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: defaults(language), error: '' }
    return { data: parseData(JSON.parse(raw)), error: '' }
  } catch {
    return {
      data: defaults(language),
      error: String(tt('errors.load')),
    }
  }
}