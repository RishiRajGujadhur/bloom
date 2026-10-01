import { z } from 'zod'
export const statSchema = z.enum(['strength', 'intelligence', 'spirit'])
export type Stat = z.infer<typeof statSchema>
const stamp = z.number().finite().nonnegative()
const skillStateSchema = z.enum(['locked', 'available', 'unlocked'])
const skillProgressSchema = z.object({
  state: skillStateSchema,
  prerequisites: z.array(z.string()),
  attribute: statSchema.nullable(),
  threshold: z.number().int().nonnegative(),
  expCost: z.number().int().nonnegative(),
})
const buffSchema = z.object({
  kind: z.enum(['streak-shield', 'focus-elixir', 'hydrated']),
  expiresAt: stamp.nullable(),
  quantity: z.number().int().positive(),
})
const weeklyRaidSchema = z.object({
  weekStart: z.string(),
  maxHp: z.number().int().positive(),
  hp: z.number().int().nonnegative(),
  defeated: z.boolean(),
  lootClaimed: z.boolean(),
  badgeUnlocked: z.boolean(),
})
const momentumSchema = z.object({
  startedAt: stamp.nullable(),
  resetAt: stamp.nullable(),
  shatteredAt: stamp.nullable(),
})
const focusQuestSchema = z.object({
  durationMinutes: z.number().int().min(5).max(120).default(25),
  taskId: z.string().nullable().default(null),
  strict: z.boolean().default(false),
  startedAt: stamp.nullable(),
  completedAt: stamp.nullable(),
  failedAt: stamp.nullable(),
  damage: z.number().int().nonnegative(),
  soundscape: z.enum(['rain', 'forest', 'brown-noise']).default('rain'),
})
const contractSchema = z.object({
  id: z.string(),
  given: z.string().min(1).max(240),
  when: z.string().min(1).max(240),
  then: z.string().min(1).max(240),
  createdAt: stamp,
  completed: z.boolean(),
  signature: z.string(),
})
export const rpgSchema = z.object({
  createdAt: stamp,
  lastSeenAt: stamp,
  ledger: z.record(z.string(), z.object({ day: z.string(), at: stamp, exp: z.number().int().nonnegative(), stat: statSchema.nullable(), points: z.number().int().nonnegative(), gold: z.number().int().nonnegative().default(0), active: z.boolean(), kind: z.enum(['habit','journal','priority','boss','impact']), sourceId: z.string() })),
  bosses: z.record(z.string(), z.object({ day: z.string(), habitIds: z.array(z.string()), priorityIds: z.array(z.string()).min(1).max(3), startedAt: stamp, defeated: z.boolean(), settled: z.boolean(), penalty: z.number().int().min(0).max(5) })),
  loot: z.array(z.object({ milestone: z.union([z.literal(7), z.literal(30)]), earnedAt: stamp, opened: z.boolean() })),
  palette: z.enum(['bloom','forest','amber']),
  companion: z.enum(['none','fox','spirit']),
  sound: z.boolean(),
  gold: z.number().int().nonnegative().default(0),
  buffs: z.array(buffSchema).default([]),
  skills: z.record(z.string(), skillProgressSchema).default({}),
  graceDays: z.array(z.string()).default([]),
  weeklyRaid: weeklyRaidSchema.nullable().default(null),
  badges: z.array(z.string()).default([]),
  momentum: momentumSchema.default({ startedAt: null, resetAt: null, shatteredAt: null }),
  focusHistory: z.array(z.object({ id: z.string(), completedAt: stamp, minutes: z.number(), taskTitle: z.string(), note: z.string().optional() })).default([]),
  focusQuest: focusQuestSchema.default({ durationMinutes: 25, taskId: null, strict: false, startedAt: null, completedAt: null, failedAt: null, damage: 0, soundscape: 'rain' }),
  contracts: z.array(contractSchema).default([]),
  /** Posture guard effects: poison (−HP) for ignored slouching, stamina (+HP) for good posture. */
  posture: z.array(z.object({ at: stamp, kind: z.enum(['poison','stamina']), amount: z.number().int().nonnegative() })).default([]),
})
export type Rpg = z.infer<typeof rpgSchema>
export const initialRpg = (now = Date.now()): Rpg => ({ createdAt: now, lastSeenAt: now, ledger: {}, bosses: {}, loot: [], palette: 'bloom', companion: 'none', sound: false, gold: 0, buffs: [], skills: {}, graceDays: [], weeklyRaid: null, badges: [], momentum: { startedAt: null, resetAt: null, shatteredAt: null }, focusHistory: [], focusQuest: { durationMinutes: 25, taskId: null, strict: false, startedAt: null, completedAt: null, failedAt: null, damage: 0, soundscape: 'rain' }, contracts: [], posture: [] })
export const statNames: Record<Stat,string> = { strength: 'Strength', intelligence: 'Intelligence', spirit: 'Spirit' }
export function inferStat(title: string): Stat {
  return /cod|study|learn|read|focus|deep work/i.test(title) ? 'intelligence' : /workout|exercis|walk|run|move|gym|strength|stretch/i.test(title) ? 'strength' : 'spirit'
}
