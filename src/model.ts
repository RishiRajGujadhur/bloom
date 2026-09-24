import { z } from 'zod'
import i18n from './i18n'
import { initialRpg, inferStat, rpgSchema, statSchema } from './rpg/schema'
export { dayKey } from './dates'

export const id = () => crypto.randomUUID()

/** Categories are stable data keys; their prompt and chip text comes from the active locale. */
export const stepCategories = [
  'reflection',
  'win',
  'obstacle',
  'action_step',
] as const
export type StepCategory = (typeof stepCategories)[number]
export const STEPS = stepCategories.length

type Translator = (key: string, options?: Record<string, unknown>) => unknown
const translator = (language: string) =>
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
export const journalAttachmentSchema = z.object({
  id: z.string(),
  kind: z.enum(['photo', 'audio']),
  name: z.string().max(160),
  mimeType: z.string().max(100),
  duration: z.number().nonnegative().nullable().default(null),
})
const sessionSchema = z.object({
  metadata: z.object({
    id: z.string(),
    date: z.string(),
    mood: z.number().int().min(1).max(5).nullable(),
    energy: z.number().int().min(1).max(5).nullable(),
    tags: z.array(z.string()),
    entryType: z.enum(['guided', 'micro']).default('guided'),
    attachments: z.array(journalAttachmentSchema).default([]),
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
export const subtaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  done: z.boolean(),
})
export const taskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(150),
  done: z.boolean(),
  due: z.string(),
  challengeId: z.string().nullable(),
  rewarded: z.boolean().default(false),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).default('P3'),
  tags: z.array(z.string().min(1).max(30)).default([]),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  seriesId: z.string().nullable().default(null),
  subtasks: z.array(subtaskSchema).default([]),
  planning: z
    .object({
      projectId: z.string().nullable().default(null),
      deferUntil: z.string().default(''),
      context: z.string().max(60).default(''),
      energy: z.enum(['any', 'low', 'medium', 'high']).default('any'),
      timeOfDay: z
        .enum(['any', 'morning', 'afternoon', 'evening', 'night'])
        .default('any'),
      minutes: z.number().int().min(5).max(1440).default(30),
      deepWork: z.boolean().default(false),
      order: z.number().default(0),
    })
    .optional(),
})
export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(120),
  parentId: z.string().nullable().default(null),
  mode: z.enum(['parallel', 'sequential']).default('parallel'),
  order: z.number().default(0),
  deferUntil: z.string().default(''),
})
export const perspectiveSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  projectId: z.string().default('all'),
  context: z.string().default(''),
  energy: z.enum(['any', 'low', 'medium', 'high']).default('any'),
  timeOfDay: z
    .enum(['any', 'morning', 'afternoon', 'evening', 'night'])
    .default('any'),
  availability: z
    .enum(['all', 'available', 'deferred', 'blocked'])
    .default('all'),
})
export const calendarBlockSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1).max(150),
    taskId: z.string().nullable(),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
    deepWork: z.boolean(),
  })
  .refine(
    (block) => Date.parse(block.end) > Date.parse(block.start),
    'End must follow start',
  )
export const urgeHabitSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(80),
  archived: z.boolean().default(false),
})
export const urgeEventSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  kind: z.enum(['urge', 'slip']),
  intensity: z.number().int().min(1).max(5),
  tags: z.array(z.string().min(1).max(40)),
  timestamp: z.number(),
  timeBucket: z.enum([
    'early-morning',
    'morning',
    'post-lunch',
    'afternoon',
    'evening',
    'late-night',
  ]),
  dayType: z.enum(['weekday', 'weekend']),
  dayOfWeek: z.enum([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ]),
  sessionSeconds: z.number().nonnegative(),
  visibilityChanges: z.number().int().nonnegative(),
})
export const defaultUrgeHabits = [
  { id: 'urge-phone', title: 'Mindless phone scrolling', archived: false },
  { id: 'urge-procrastination', title: 'Procrastination', archived: false },
  { id: 'urge-snacking', title: 'Stress snacking', archived: false },
]
export const challengeSchema = z.object({
  id: z.string(),
  acceptedAt: z.number(),
  rewarded: z.boolean().default(false),
})
export const dataSchema = legacySchema.extend({
  version: z.literal(2),
  habits: z.array(
    legacySchema.shape.habits.element.extend({
      stat: statSchema,
      color: z.string().optional(),
    }),
  ),
  routines: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(100),
        period: z.enum(['morning', 'afternoon', 'evening', 'night']),
        days: z.array(z.number().int().min(0).max(6)).min(1),
        steps: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().min(1).max(100),
              minutes: z.number().int().min(1).max(180),
            }),
          )
          .min(1),
        dates: z.array(z.string()),
      }),
    )
    .optional(),
  rpg: rpgSchema,
  todos: z.array(taskSchema).default([]),
  projects: z.array(projectSchema).default([]),
  perspectives: z.array(perspectiveSchema).default([]),
  calendarBlocks: z.array(calendarBlockSchema).default([]),
  calendarHours: z
    .object({
      start: z.number().int().min(0).max(23),
      end: z.number().int().min(1).max(24),
    })
    .refine((hours) => hours.end > hours.start)
    .default({ start: 8, end: 18 }),
  challenges: z.array(challengeSchema).default([]),
  urgeHabits: z.array(urgeHabitSchema).default(defaultUrgeHabits),
  urgeEvents: z.array(urgeEventSchema).default([]),
})
export function parseData(input: unknown): AppData {
  if (
    typeof input === 'object' &&
    input !== null &&
    'version' in input &&
    input.version === 1
  ) {
    const old = legacySchema.parse(input)
    return {
      ...old,
      todos: [],
      projects: [],
      perspectives: [],
      calendarBlocks: [],
      calendarHours: { start: 8, end: 18 },
      challenges: [],
      urgeHabits: defaultUrgeHabits,
      urgeEvents: [],
      version: 2,
      habits: old.habits.map((h) => ({ ...h, stat: inferStat(h.title) })),
      rpg: initialRpg(),
    }
  }
  return dataSchema.parse(input)
}
export type JournalMessage = z.infer<typeof messageSchema>
export type JournalAttachmentMeta = z.infer<typeof journalAttachmentSchema>
export type Session = z.infer<typeof sessionSchema>
export type Todo = z.infer<typeof taskSchema>
export type TaskPlanning = NonNullable<Todo['planning']>
export type Project = z.infer<typeof projectSchema>
export type Perspective = z.infer<typeof perspectiveSchema>
export type CalendarBlock = z.infer<typeof calendarBlockSchema>
export type UrgeHabit = z.infer<typeof urgeHabitSchema>
export type UrgeEvent = z.infer<typeof urgeEventSchema>
export type AppData = z.infer<typeof dataSchema>
export function newSession(language = 'en'): Session {
  return {
    metadata: {
      id: id(),
      date: new Date().toISOString(),
      mood: null,
      energy: null,
      tags: [],
      entryType: 'guided',
      attachments: [],
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

export function newMicroSession(
  text: string,
  tags: string[],
  attachments: JournalAttachmentMeta[] = [],
  mood: number | null = null,
): Session {
  const created = new Date().toISOString()
  return {
    metadata: {
      id: id(),
      date: created,
      mood,
      energy: null,
      tags,
      entryType: 'micro',
      attachments,
    },
    messages: text.trim()
      ? [
          {
            id: id(),
            sender: 'user',
            text: text.trim(),
            timestamp: Date.parse(created),
            category: 'reflection',
          },
        ]
      : [],
    flow: { step: STEPS - 1, typing: false, complete: true },
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
    todos: [],
    projects: [],
    perspectives: [],
    calendarBlocks: [],
    calendarHours: { start: 8, end: 18 },
    challenges: [],
    urgeHabits: defaultUrgeHabits,
    urgeEvents: [],
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
