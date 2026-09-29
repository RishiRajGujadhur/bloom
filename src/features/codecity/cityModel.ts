/**
 * Code City + Burnout Radar model. Turns commits into (a) per-file churn and
 * "late-night heat" for the 3D city, and (b) work-rhythm signals — late
 * nights, weekends, long days, days without a break — compared against the
 * app's own sleep, mood and readiness data to flag drift before burnout.
 */
export type CommitLite = { ts: number; tz: number; author: string; files: string[] }
export type FileStat = { path: string; churn: number; late: number; size: number; last: number }

/** Local wall-clock hour/day of the commit (git's timezoneOffset is minutes *behind* UTC, like JS). */
export function local(ts: number, tz: number) {
  const d = new Date(ts - tz * 60_000)
  return { hour: d.getUTCHours(), day: d.getUTCDay(), date: d.toISOString().slice(0, 10) }
}
export const isLate = (hour: number) => hour >= 22 || hour < 5

export function fileStats(commits: CommitLite[], sizes: Map<string, number>): FileStat[] {
  const m = new Map<string, FileStat>()
  for (const c of commits) {
    const late = isLate(local(c.ts, c.tz).hour)
    for (const f of c.files) {
      const s = m.get(f) ?? { path: f, churn: 0, late: 0, size: sizes.get(f) ?? 0, last: 0 }
      s.churn++
      if (late) s.late++
      s.last = Math.max(s.last, c.ts)
      m.set(f, s)
    }
  }
  for (const [path, size] of sizes) if (!m.has(path)) m.set(path, { path, churn: 0, late: 0, size, last: 0 })
  return [...m.values()].filter((f) => sizes.has(f.path))
}

export type Rhythm = { lateNights: number; weekends: number; longDays: number; noBreak: number; commitsPerDay: number; days: number }

/** Work rhythm over the last `windowDays` days, each metric as a 0..1 share or scaled level. */
export function rhythm(commits: CommitLite[], now = Date.now(), windowDays = 28): Rhythm {
  const from = now - windowDays * 864e5
  const recent = commits.filter((c) => c.ts >= from)
  const byDay = new Map<string, number[]>()
  let late = 0
  let weekend = 0
  for (const c of recent) {
    const l = local(c.ts, c.tz)
    if (isLate(l.hour)) late++
    if (l.day === 0 || l.day === 6) weekend++
    const hours = byDay.get(l.date) ?? []
    hours.push(l.hour + (l.hour < 5 ? 24 : 0))
    byDay.set(l.date, hours)
  }
  const long = [...byDay.values()].filter((h) => Math.max(...h) - Math.min(...h) >= 10).length
  // Longest run of consecutive days with commits.
  const dates = [...byDay.keys()].sort()
  let best = 0
  let run = 0
  let prev = ''
  for (const d of dates) {
    const next = prev && new Date(new Date(`${prev}T12:00:00Z`).getTime() + 864e5).toISOString().slice(0, 10)
    run = next === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  const n = Math.max(1, recent.length)
  return { lateNights: late / n, weekends: weekend / n, longDays: byDay.size ? long / byDay.size : 0, noBreak: Math.min(1, best / 14), commitsPerDay: recent.length / windowDays, days: byDay.size }
}

export type Body = { sleepHours: number | null; mood: number | null; readiness: number | null }
export type Axis = { key: string; label: string; value: number }

/** Radar axes (0 = fine, 1 = worrying) and an overall 0–100 risk. */
export function radar(r: Rhythm, b: Body): { axes: Axis[]; risk: number; notes: string[] } {
  const axes: Axis[] = [
    { key: 'late', label: 'Late nights', value: Math.min(1, r.lateNights / 0.3) },
    { key: 'weekend', label: 'Weekends', value: Math.min(1, r.weekends / 0.25) },
    { key: 'long', label: 'Long days', value: Math.min(1, r.longDays / 0.4) },
    { key: 'streak', label: 'No days off', value: r.noBreak },
    { key: 'sleep', label: 'Short sleep', value: b.sleepHours == null ? 0 : Math.max(0, Math.min(1, (7.5 - b.sleepHours) / 2)) },
    { key: 'mood', label: 'Low mood', value: b.mood == null ? 0 : Math.max(0, Math.min(1, (6 - b.mood) / 4)) },
    { key: 'ready', label: 'Low readiness', value: b.readiness == null ? 0 : Math.max(0, Math.min(1, (60 - b.readiness) / 40)) },
  ]
  const w = [1.2, 0.8, 1, 1.2, 1.2, 1, 0.8]
  const risk = Math.round((axes.reduce((a, x, i) => a + x.value * w[i], 0) / w.reduce((a, x) => a + x, 0)) * 100)
  const notes: string[] = []
  if (axes[0].value > 0.6) notes.push(`${Math.round(r.lateNights * 100)}% of your commits land after 10 pm.`)
  if (axes[1].value > 0.6) notes.push(`${Math.round(r.weekends * 100)}% of commits are on weekends.`)
  if (axes[3].value > 0.6) notes.push(`You've committed ${Math.round(r.noBreak * 14)} days in a row — schedule a day off.`)
  if (axes[4].value > 0.5 && axes[0].value > 0.4) notes.push('Late commits and short sleep are showing up together.')
  if (!notes.length) notes.push('Your rhythm looks sustainable. Keep protecting your evenings.')
  return { axes, risk, notes }
}
