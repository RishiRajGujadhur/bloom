import Sentiment from 'sentiment'

/**
 * Local sentiment analysis (AFINN word list) over everything you write.
 * Nothing leaves the device. Scores are "comparative": total word score
 * divided by word count, so long and short entries compare fairly.
 */
const analyzer = new Sentiment()
export type Source = 'journal' | 'daybook' | 'gratitude' | 'voice' | 'mood'
export type Text = { id: string; at: number; text: string; source: Source }
export type Scored = Text & { score: number; comparative: number; positive: string[]; negative: string[] }

export function score(t: Text): Scored {
  const r = analyzer.analyze(t.text)
  return { ...t, score: r.score, comparative: r.comparative, positive: r.positive, negative: r.negative }
}

const dayKey = (at: number) => new Date(at).toISOString().slice(0, 10)

/** Mean comparative score per day. */
export function daily(items: Scored[]) {
  const m = new Map<string, number[]>()
  for (const i of items) m.set(dayKey(i.at), [...(m.get(dayKey(i.at)) ?? []), i.comparative])
  return [...m].map(([date, v]) => ({ date, value: v.reduce((a, b) => a + b, 0) / v.length })).sort((a, b) => a.date.localeCompare(b.date))
}

/** Most frequent words on each side. */
export function topWords(items: Scored[], side: 'positive' | 'negative', n = 12) {
  const c = new Map<string, number>()
  for (const i of items) for (const w of i[side]) c.set(w, (c.get(w) ?? 0) + 1)
  return [...c].sort((a, b) => b[1] - a[1]).slice(0, n)
}

export function byWeekday(items: Scored[]) {
  const sums = Array.from({ length: 7 }, () => ({ total: 0, n: 0 }))
  for (const i of items) {
    const d = new Date(i.at).getDay()
    sums[d].total += i.comparative
    sums[d].n++
  }
  return sums.map((s, d) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d], value: s.n ? s.total / s.n : null }))
}

/** How closely the written tone tracks the mood you logged (Pearson r). */
export function agreement(days: { date: string; value: number }[], moods: { at: number; mood: number }[]) {
  const moodBy = new Map<string, number[]>()
  for (const m of moods) moodBy.set(dayKey(m.at), [...(moodBy.get(dayKey(m.at)) ?? []), m.mood])
  const pairs = days.filter((d) => moodBy.has(d.date)).map((d) => [d.value, moodBy.get(d.date)!.reduce((a, b) => a + b, 0) / moodBy.get(d.date)!.length])
  if (pairs.length < 4) return null
  const mx = pairs.reduce((a, p) => a + p[0], 0) / pairs.length
  const my = pairs.reduce((a, p) => a + p[1], 0) / pairs.length
  let num = 0, dx = 0, dy = 0
  for (const [x, y] of pairs) {
    num += (x - mx) * (y - my)
    dx += (x - mx) ** 2
    dy += (y - my) ** 2
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : null
}

/** Gentle reframes for common heavy words. */
const reframes: Record<string, string> = {
  stressed: 'Stress often means something matters to you. What’s one small part you can control?',
  tired: 'Tiredness is information, not failure. What would rest look like today?',
  anxious: 'Anxiety tries to protect you. Can you name what it’s worried about, kindly?',
  hate: 'Strong words point at strong needs. What need is underneath?',
  sad: 'Sadness shows what you care about. Be as gentle with yourself as with a friend.',
  alone: 'Feeling alone is common and hard. Who is one person you could reach out to?',
  fail: 'A setback is an event, not an identity. What did you learn?',
  angry: 'Anger can be a boundary asking to be heard. What would you like to say, calmly?',
  worried: 'Worry lives in the future. What’s true right now, in this room?',
  overwhelmed: 'Overwhelm shrinks when you shrink the task. What is the next tiny step?',
}
export function reframesFor(items: Scored[]) {
  const seen = new Set(items.flatMap((i) => i.negative))
  return Object.entries(reframes).filter(([w]) => seen.has(w) || [...seen].some((s) => s.startsWith(w)))
}

export const label = (c: number) => (c > 0.25 ? 'Bright' : c > 0.05 ? 'Warm' : c < -0.25 ? 'Heavy' : c < -0.05 ? 'Cloudy' : 'Neutral')
