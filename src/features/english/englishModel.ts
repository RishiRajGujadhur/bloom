import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { allWords, leagues, rivalNames, units } from './englishCourse'
import { pick, seeded, shuffle } from './englishNlp'

/**
 * Bloom English learner state: XP, streak (with freezes), hearts that refill,
 * gems, weekly league, daily quests, achievements, FSRS word cards, mistakes.
 */
export type Mistake = { prompt: string; answer: string; given: string; at: string }
export type EnglishStore = {
  xpLog: Record<string, number>
  goal: number
  streakDays: string[]
  freezes: number
  hearts: number
  heartsAt: number
  gems: number
  doubleXpUntil: number
  done: Record<string, number>
  cards: Record<string, Card>
  mistakes: Mistake[]
  questsClaimed: Record<string, string[]>
  league: number
  leagueWeek: string
  badges: string[]
  placed: boolean
  perfect: number
  writings: number
}
export const ENGLISH_KEY = 'bloom-english-v1'
export const emptyEnglish: EnglishStore = {
  xpLog: {}, goal: 20, streakDays: [], freezes: 0, hearts: 5, heartsAt: 0, gems: 50, doubleXpUntil: 0,
  done: {}, cards: {}, mistakes: [], questsClaimed: {}, league: 0, leagueWeek: '', badges: [], placed: false, perfect: 0, writings: 0,
}

export const MAX_HEARTS = 5
export const HEART_MS = 30 * 60 * 1000
export const LESSONS_PER_UNIT = 4

export const goals = [
  { xp: 10, label: 'Casual' },
  { xp: 20, label: 'Regular' },
  { xp: 30, label: 'Serious' },
  { xp: 50, label: 'Intense' },
]

/** Hearts regenerate one every 30 minutes. */
export function heartsNow(s: EnglishStore, now = Date.now()) {
  if (s.hearts >= MAX_HEARTS) return { hearts: MAX_HEARTS, nextIn: 0 }
  const gained = Math.floor((now - s.heartsAt) / HEART_MS)
  const hearts = Math.min(MAX_HEARTS, s.hearts + gained)
  return { hearts, nextIn: hearts >= MAX_HEARTS ? 0 : HEART_MS - ((now - s.heartsAt) % HEART_MS) }
}
export function loseHeart(s: EnglishStore, now = Date.now()): EnglishStore {
  const { hearts } = heartsNow(s, now)
  return { ...s, hearts: Math.max(0, hearts - 1), heartsAt: hearts >= MAX_HEARTS ? now : s.heartsAt + Math.floor((now - s.heartsAt) / HEART_MS) * HEART_MS }
}

const addDays = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00`)
  x.setDate(x.getDate() + n)
  return x.toISOString().slice(0, 10)
}

/** Current streak, counting frozen days as kept. */
export function streak(s: EnglishStore, today: string) {
  const set = new Set(s.streakDays)
  let d = set.has(today) ? today : addDays(today, -1)
  let n = 0
  while (set.has(d)) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export const xpToday = (s: EnglishStore, today: string) => s.xpLog[today] ?? 0
export const totalXp = (s: EnglishStore) => Object.values(s.xpLog).reduce((a, b) => a + b, 0)

/** Record XP from a lesson (double XP boost applies) and keep the streak. */
export function earn(s: EnglishStore, today: string, xp: number, now = Date.now()): EnglishStore {
  const gain = now < s.doubleXpUntil ? xp * 2 : xp
  return {
    ...s,
    xpLog: { ...s.xpLog, [today]: (s.xpLog[today] ?? 0) + gain },
    streakDays: s.streakDays.includes(today) ? s.streakDays : [...s.streakDays, today],
  }
}

/** Use streak freezes automatically for missed days (up to the freezes owned). */
export function applyFreezes(s: EnglishStore, today: string): EnglishStore {
  if (!s.streakDays.length || s.streakDays.includes(today)) return s
  const last = [...s.streakDays].sort().at(-1)!
  let d = addDays(last, 1)
  const add: string[] = []
  let freezes = s.freezes
  while (d < today && freezes > 0) {
    add.push(d)
    freezes--
    d = addDays(d, 1)
  }
  return add.length && d === today ? { ...s, freezes, streakDays: [...s.streakDays, ...add] } : s
}

/** Unit progress and path state. */
export const unitProgress = (s: EnglishStore, unitId: string) => Math.min(LESSONS_PER_UNIT, s.done[unitId] ?? 0)
export function unitUnlocked(s: EnglishStore, index: number) {
  if (index === 0) return true
  return unitProgress(s, units[index - 1].id) >= LESSONS_PER_UNIT || !!s.done[units[index].id]
}

/* ---------- Words & spaced repetition (FSRS) ---------- */
const scheduler = fsrs()
export function reviewWord(s: EnglishStore, en: string, good: boolean, now = new Date()): EnglishStore {
  const card = s.cards[en] ?? createEmptyCard(now)
  const next = scheduler.next(card, now, good ? Rating.Good : Rating.Again).card
  return { ...s, cards: { ...s.cards, [en]: next } }
}
export const learnedWords = (s: EnglishStore) => allWords.filter((w) => s.cards[w.en])
export const dueWords = (s: EnglishStore, now = new Date()) => learnedWords(s).filter((w) => new Date(s.cards[w.en].due) <= now)
/** Strength 0–4 from FSRS stability (days). */
export function strength(c?: Card) {
  if (!c) return 0
  const st = c.stability
  return st > 30 ? 4 : st > 10 ? 3 : st > 3 ? 2 : st > 0.5 ? 1 : 0
}

/** Word of the day: seeded by the date. */
export const wordOfDay = (today: string) => pick(allWords, seeded(`wod-${today}`))

/* ---------- Daily quests ---------- */
export type Quest = { id: string; title: string; target: number; gems: number; measure: (s: EnglishStore, today: string) => number }
const questPool: Quest[] = [
  { id: 'xp20', title: 'Earn 20 XP', target: 20, gems: 10, measure: (s, t) => xpToday(s, t) },
  { id: 'xp50', title: 'Earn 50 XP', target: 50, gems: 20, measure: (s, t) => xpToday(s, t) },
  { id: 'lesson2', title: 'Finish 2 lessons', target: 2, gems: 10, measure: (s, t) => Math.floor(xpToday(s, t) / 10) },
  { id: 'review', title: 'Review 5 words', target: 5, gems: 10, measure: (s, t) => Object.values(s.cards).filter((c) => c.last_review && new Date(c.last_review).toISOString().slice(0, 10) === t).length },
  { id: 'streak', title: 'Keep your streak', target: 1, gems: 5, measure: (s, t) => (s.streakDays.includes(t) ? 1 : 0) },
  { id: 'goal', title: 'Hit your daily goal', target: 1, gems: 15, measure: (s, t) => (xpToday(s, t) >= s.goal ? 1 : 0) },
]
export const questsFor = (today: string) => shuffle(questPool, seeded(`quests-${today}`)).slice(0, 3)

/* ---------- Weekly league with seeded rivals ---------- */
export const weekOf = (today: string) => {
  const d = new Date(`${today}T12:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.toISOString().slice(0, 10)
}
export const weekXp = (s: EnglishStore, today: string) => {
  const start = weekOf(today)
  return Object.entries(s.xpLog).filter(([d]) => d >= start && d <= today).reduce((a, [, v]) => a + v, 0)
}
export function leagueTable(s: EnglishStore, today: string, me = 'You') {
  const week = weekOf(today)
  const rng = seeded(`league-${week}-${s.league}`)
  const dayIndex = (new Date(`${today}T12:00:00`).getDay() + 6) % 7
  const rivals = shuffle(rivalNames, rng).slice(0, 14).map((name) => {
    const pace = 10 + rng() * (30 + s.league * 12)
    return { name, xp: Math.round(pace * (dayIndex + 1) * (0.6 + rng() * 0.8)), me: false }
  })
  return [...rivals, { name: me, xp: weekXp(s, today), me: true }].sort((a, b) => b.xp - a.xp)
}
/** At the start of a new week: top 5 promote, bottom 5 demote. */
export function rollLeague(s: EnglishStore, today: string): EnglishStore {
  const week = weekOf(today)
  if (s.leagueWeek === week) return s
  if (!s.leagueWeek) return { ...s, leagueWeek: week }
  const lastDay = addDays(week, -1)
  const table = leagueTable({ ...s }, lastDay)
  const rank = table.findIndex((r) => r.me) + 1
  const league = rank <= 5 ? Math.min(leagues.length - 1, s.league + 1) : rank > 10 ? Math.max(0, s.league - 1) : s.league
  return { ...s, league, leagueWeek: week }
}

/* ---------- Achievements ---------- */
export const badgeDefs = [
  { id: 'first', emoji: '🌱', title: 'First steps', desc: 'Finish your first lesson', test: (s: EnglishStore) => totalXp(s) > 0 },
  { id: 'streak7', emoji: '🔥', title: 'Week of fire', desc: 'A 7-day streak', test: (s: EnglishStore, t: string) => streak(s, t) >= 7 },
  { id: 'streak30', emoji: '🏆', title: 'Unstoppable', desc: 'A 30-day streak', test: (s: EnglishStore, t: string) => streak(s, t) >= 30 },
  { id: 'words25', emoji: '📚', title: 'Word collector', desc: 'Learn 25 words', test: (s: EnglishStore) => Object.keys(s.cards).length >= 25 },
  { id: 'words50', emoji: '🧠', title: 'Wordsmith', desc: 'Learn 50 words', test: (s: EnglishStore) => Object.keys(s.cards).length >= 50 },
  { id: 'perfect', emoji: '💯', title: 'Flawless', desc: 'A lesson with no mistakes', test: (s: EnglishStore) => s.perfect >= 1 },
  { id: 'perfect10', emoji: '💎', title: 'Sharpshooter', desc: '10 perfect lessons', test: (s: EnglishStore) => s.perfect >= 10 },
  { id: 'xp1000', emoji: '⚡', title: 'Thousand club', desc: 'Earn 1,000 XP', test: (s: EnglishStore) => totalXp(s) >= 1000 },
  { id: 'writer', emoji: '✍️', title: 'Writer', desc: 'Get feedback on 3 pieces of writing', test: (s: EnglishStore) => s.writings >= 3 },
  { id: 'league', emoji: '🥇', title: 'Climber', desc: 'Reach the Gold league', test: (s: EnglishStore) => s.league >= 2 },
  { id: 'unit', emoji: '🗺️', title: 'Explorer', desc: 'Complete a whole unit', test: (s: EnglishStore) => units.some((u) => unitProgress(s, u.id) >= LESSONS_PER_UNIT) },
]
export function newBadges(s: EnglishStore, today: string) {
  return badgeDefs.filter((b) => !s.badges.includes(b.id) && b.test(s, today)).map((b) => b.id)
}

/** XP per day for the last n days (for charts). */
export function xpSeries(s: EnglishStore, today: string, n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = addDays(today, i - n + 1)
    return { date: d, xp: s.xpLog[d] ?? 0 }
  })
}
