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
  kind: z.enum(['streak-shield', 'focus-elixir']),
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
export const rpgSchema = z.object({
  createdAt: stamp,
  lastSeenAt: stamp,
  ledger: z.record(z.string(), z.object({ day: z.string(), at: stamp, exp: z.number().int().nonnegative(), stat: statSchema.nullable(), points: z.number().int().nonnegative(), gold: z.number().int().nonnegative().default(0), active: z.boolean(), kind: z.enum(['habit','journal','priority','boss']), sourceId: z.string() })),
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
})
export type Rpg = z.infer<typeof rpgSchema>
export const initialRpg = (now = Date.now()): Rpg => ({ createdAt: now, lastSeenAt: now, ledger: {}, bosses: {}, loot: [], palette: 'bloom', companion: 'none', sound: false, gold: 0, buffs: [], skills: {}, graceDays: [], weeklyRaid: null, badges: [] })
export const statNames: Record<Stat,string> = { strength: 'Strength', intelligence: 'Intelligence', spirit: 'Spirit' }
export function inferStat(title: string): Stat {
  return /cod|study|learn|read|focus|deep work/i.test(title) ? 'intelligence' : /workout|exercis|walk|run|move|gym|strength|stretch/i.test(title) ? 'strength' : 'spirit'
}
