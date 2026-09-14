import { z } from 'zod'
export const statSchema = z.enum(['strength', 'intelligence', 'spirit'])
export type Stat = z.infer<typeof statSchema>
const stamp = z.number().finite().nonnegative()
export const rpgSchema = z.object({
  createdAt: stamp,
  lastSeenAt: stamp,
  ledger: z.record(z.string(), z.object({ day: z.string(), at: stamp, exp: z.number().int().nonnegative(), stat: statSchema.nullable(), points: z.number().int().nonnegative(), active: z.boolean(), kind: z.enum(['habit','journal','priority','boss']), sourceId: z.string() })),
  bosses: z.record(z.string(), z.object({ day: z.string(), habitIds: z.array(z.string()), priorityIds: z.array(z.string()).min(1).max(3), startedAt: stamp, defeated: z.boolean(), settled: z.boolean(), penalty: z.number().int().min(0).max(5) })),
  loot: z.array(z.object({ milestone: z.union([z.literal(7), z.literal(30)]), earnedAt: stamp, opened: z.boolean() })),
  palette: z.enum(['bloom','forest','amber']),
  companion: z.enum(['none','fox','spirit']),
  sound: z.boolean(),
})
export type Rpg = z.infer<typeof rpgSchema>
export const initialRpg = (now = Date.now()): Rpg => ({ createdAt: now, lastSeenAt: now, ledger: {}, bosses: {}, loot: [], palette: 'bloom', companion: 'none', sound: false })
export const statNames: Record<Stat,string> = { strength: 'Strength', intelligence: 'Intelligence', spirit: 'Spirit' }
export function inferStat(title: string): Stat {
  return /cod|study|learn|read|focus|deep work/i.test(title) ? 'intelligence' : /workout|exercis|walk|run|move|gym|strength|stretch/i.test(title) ? 'strength' : 'spirit'
}
