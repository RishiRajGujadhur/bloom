export type Kind = 'warmup' | 'work' | 'rest' | 'cooldown'
export type Segment = { kind: Kind; label: string; seconds: number; round?: number }
export type Program = { id: string; name: string; emoji: string; work: number; rest: number; rounds: number; warmup: number; cooldown: number; workLabel?: string; restLabel?: string }
export function normalizeProgram(value: unknown, fallback: Program): Program {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  const number = (key: keyof Program, min: number, max: number) => typeof row[key] === 'number' && Number.isFinite(row[key]) ? Math.round(Math.max(min, Math.min(max, row[key] as number))) : fallback[key] as number
  const text = (key: 'id' | 'name' | 'emoji') => typeof row[key] === 'string' && row[key].trim() ? row[key].trim().slice(0, key === 'id' ? 100 : 40) : fallback[key]
  return { id: text('id'), name: text('name'), emoji: text('emoji'), work: number('work', 5, 300), rest: number('rest', 0, 180), rounds: number('rounds', 1, 30), warmup: number('warmup', 0, 600), cooldown: number('cooldown', 0, 600) }
}

export const presets: Program[] = [
  { id: 'tabata', name: 'Tabata', emoji: '⚡', work: 20, rest: 10, rounds: 8, warmup: 120, cooldown: 120 },
  { id: 'hiit', name: 'HIIT 40/20', emoji: '🔥', work: 40, rest: 20, rounds: 10, warmup: 180, cooldown: 120 },
  { id: 'emom', name: 'EMOM 10', emoji: '⏱️', work: 45, rest: 15, rounds: 10, warmup: 120, cooldown: 60, workLabel: 'Every minute' },
  { id: 'sprints', name: 'Sprints', emoji: '🏃', work: 30, rest: 90, rounds: 6, warmup: 300, cooldown: 300, workLabel: 'Sprint', restLabel: 'Walk' },
  { id: 'gentle', name: 'Gentle 30/30', emoji: '🌿', work: 30, rest: 30, rounds: 8, warmup: 120, cooldown: 120 },
]

/** Couch-to-5K style plan: 9 weeks × 3 runs, run/walk intervals growing. */
export const c25k: { week: number; run: number; walk: number; rounds: number }[] = [
  { week: 1, run: 60, walk: 90, rounds: 8 },
  { week: 2, run: 90, walk: 120, rounds: 6 },
  { week: 3, run: 180, walk: 90, rounds: 4 },
  { week: 4, run: 300, walk: 150, rounds: 3 },
  { week: 5, run: 480, walk: 300, rounds: 2 },
  { week: 6, run: 600, walk: 180, rounds: 2 },
  { week: 7, run: 1500, walk: 0, rounds: 1 },
  { week: 8, run: 1680, walk: 0, rounds: 1 },
  { week: 9, run: 1800, walk: 0, rounds: 1 },
]
export function c25kProgram(done: number): Program {
  const i = Math.min(c25k.length - 1, Math.floor(done / 3))
  const w = c25k[i]
  return { id: `c25k-${w.week}-${(done % 3) + 1}`, name: `C25K W${w.week} D${(done % 3) + 1}`, emoji: '👟', work: w.run, rest: w.walk, rounds: w.rounds, warmup: 300, cooldown: 300, workLabel: 'Run', restLabel: 'Walk' }
}

export function segments(p: Program, warmCool = true): Segment[] {
  const out: Segment[] = []
  if (warmCool && p.warmup) out.push({ kind: 'warmup', label: 'Warm up', seconds: p.warmup })
  for (let r = 1; r <= p.rounds; r++) {
    out.push({ kind: 'work', label: p.workLabel ?? 'Work', seconds: p.work, round: r })
    if (p.rest && r < p.rounds) out.push({ kind: 'rest', label: p.restLabel ?? 'Rest', seconds: p.rest, round: r })
  }
  if (warmCool && p.cooldown) out.push({ kind: 'cooldown', label: 'Cool down', seconds: p.cooldown })
  return out
}

export const total = (s: Segment[]) => s.reduce((t, x) => t + x.seconds, 0)

/** Where we are after `elapsed` seconds. */
export function position(s: Segment[], elapsed: number) {
  let t = 0
  for (let i = 0; i < s.length; i++) {
    if (elapsed < t + s[i].seconds) return { index: i, segment: s[i], into: elapsed - t, left: t + s[i].seconds - elapsed }
    t += s[i].seconds
  }
  return null
}

/** kcal from METs: work ≈ 8, rest/walk ≈ 3.5, warm-up/cool-down ≈ 3. */
export function calories(s: Segment[], elapsed: number, kg: number) {
  const met: Record<Kind, number> = { work: 8, rest: 3.5, warmup: 3, cooldown: 3 }
  let t = 0
  let kcal = 0
  for (const x of s) {
    const secs = Math.max(0, Math.min(x.seconds, elapsed - t))
    kcal += (met[x.kind] * 3.5 * kg) / 200 / 60 * secs
    t += x.seconds
  }
  return Math.round(kcal)
}

export const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`
