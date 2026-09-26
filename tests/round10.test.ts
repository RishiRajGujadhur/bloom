import { defaults } from '../src/model'
import { dayTotals, defaultDiet, dietInsights, kindFor } from '../src/features/diet/dietModel'
import { buildFlow, flowInsights } from '../src/features/energy/energyModel'
import { dailyRows, findings, pearson } from '../src/features/lab/labModel'
import { extract, habitIdeas, moodTags, toTipTap } from '../src/features/voice/voiceExtract'
import { commandGroup, isCommand, parseCommand } from '../src/components/layout/omnibox'
import { hybridMerge, keywordIndex, keywordSearch, relatedPages } from '../src/search/hybrid'

const meal = (date: string, kcal: number, extra = {}) => ({
  id: `${date}-${kcal}`,
  at: new Date(`${date}T12:00`).getTime(),
  date,
  name: 'Soup',
  kind: 'lunch' as const,
  kcal,
  protein: 10,
  carbs: 20,
  fat: 5,
  ...extra,
})

test('diet totals, meal kinds and gentle insights', () => {
  const state = { ...defaultDiet, meals: [meal('2026-09-26', 400), meal('2026-09-26', 300), meal('2026-09-25', 900)], water: { '2026-09-26': 8 } }
  expect(dayTotals(state.meals, '2026-09-26')).toMatchObject({ meals: 2, kcal: 700, protein: 20 })
  expect([kindFor(8), kindFor(13), kindFor(19), kindFor(23)]).toEqual(['breakfast', 'lunch', 'dinner', 'snack'])
  const insights = dietInsights(state, '2026-09-26')
  expect(insights.some((t) => t.includes('Water goal met on 1'))).toBe(true)
  expect(insights.some((t) => t.includes('Average of 800 kcal'))).toBe(true)
})

test('energy flow routes hours into stats, recovery and burnout', () => {
  const data = defaults()
  data.rpg.focusHistory = [{ id: 'f', completedAt: new Date('2026-09-25T10:00').getTime(), minutes: 120, taskTitle: 'x' }]
  const flow = buildFlow({
    data,
    today: '2026-09-26',
    days: 7,
    sleep: [{ id: 's', date: '2026-09-26', bedtime: '23:00', wake: '07:00', quality: 4, factors: [] }],
    logs: [
      { id: 'a', date: '2026-09-26', category: 'screens', hours: 4 },
      { id: 'b', date: '2026-09-26', category: 'projects', hours: 2 },
    ],
    daybook: [],
    includeBurnout: true,
  })
  const link = (s: string, t: string) => flow.links.find((l) => l.source === s && l.target === t)?.value
  expect(link('Sleep', 'Recovery')).toBe(8)
  expect(link('Deep work', 'Intelligence')).toBe(2)
  expect(link('Scrolling & videos', 'Burnout')).toBeCloseTo(3.2)
  expect(flow.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(['Sleep', 'Intelligence', 'Burnout']))
  expect(flowInsights(flow).join(' ')).toMatch(/Scrolling took 4 h/)
  const noBurn = buildFlow({ data, today: '2026-09-26', days: 7, sleep: [], logs: [{ id: 'a', date: '2026-09-26', category: 'screens', hours: 4 }], daybook: [], includeBurnout: false })
  expect(noBurn.links.some((l) => l.target === 'Burnout')).toBe(false)
})

test('correlations: Pearson over days with data for both, strongest findings first', () => {
  const data = defaults()
  const days = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']
  const hours = [5, 6, 7, 8, 6, 9]
  const sleep = days.map((date, i) => ({ id: date, date, bedtime: '23:00', wake: `0${(23 + hours[i]) % 24}:00`.slice(-5), quality: 3 as const, factors: [] }))
  const moods = days.map((d, i) => ({ at: new Date(`${d}T20:00`).getTime(), mood: Math.min(5, Math.round(hours[i] / 2)) }))
  const rows = dailyRows({ data, today: '2026-09-26', days: 7, sleep, moods, gratitude: [], diet: defaultDiet, energy: [] })
  expect(rows).toHaveLength(7)
  expect(rows[6].sleepHours).toBeNull()
  const c = pearson(rows, 'sleepHours', 'mood')
  expect(c?.n).toBe(6)
  expect(c!.r).toBeGreaterThan(0.8)
  expect(pearson(rows, 'sleepHours', 'kcal')).toBeNull()
  expect(findings(rows)[0].text).toMatch(/more sleep, mood goes up/)
})

test('voice transcripts become bullets, habit ideas and mood tags', () => {
  const text = "Um so today was a long day with client meetings. I felt kind of drained and anxious. I need to go for a walk tomorrow. Remember to call mum. Grateful for the sunshine though."
  expect(habitIdeas(text)).toEqual(['Go for a walk', 'Call mum'])
  expect(moodTags(text)).toEqual(expect.arrayContaining(['anxious', 'tired', 'grateful']))
  const out = extract(text)
  expect(out.bullets[0]).toBe('So today was a long day with client meetings.')
  const doc = toTipTap('Memo', text, [{ text: 'Hello there', start: 65 }])
  expect(JSON.stringify(doc)).toContain('[1:05] Hello there')
  expect(JSON.stringify(doc)).toContain('taskItem')
})

test('omnibox parses commands with arguments', () => {
  const data = defaults()
  const habit = data.habits[0]
  expect(isCommand('> water 2')).toBe(true)
  expect(isCommand('water')).toBe(false)
  const today = '2026-09-26'
  expect(parseCommand('> water 3', data, today)[0].action).toEqual({ type: 'water', glasses: 3 })
  expect(parseCommand('> meal: pasta 550', data, today)[0].action).toEqual({ type: 'meal', name: 'pasta', kcal: 550 })
  expect(parseCommand('> add task: call mum', data, today)[0].action).toEqual({ type: 'addTask', title: 'call mum' })
  expect(parseCommand('> mood 4', data, today)[0].action).toEqual({ type: 'mood', value: 4 })
  expect(parseCommand('> mood 9', data, today)[0].action).toBeNull()
  expect(parseCommand('> theme dracula', data, today)[0].action).toMatchObject({ type: 'theme', themeId: 'dracula' })
  const word = habit.title.split(' ')[0].toLowerCase()
  expect(parseCommand(`> log habit: ${word}`, data, today)[0].action).toMatchObject({ type: 'logHabit', habitId: habit.id })
  expect(parseCommand('>', data, today).length).toBeGreaterThan(4)
  expect(['habit-x', 'task', 'meal', 'theme-x'].map(commandGroup)).toEqual(['habits', 'tasks', 'nourish', 'themes'])
})

test('hybrid search blends meaning with keywords; related pages share words', () => {
  const docs = [
    { id: 'a', title: 'Long day', text: 'Client meetings all afternoon, exhausted after work.', timestamp: 1 },
    { id: 'b', title: 'Garden', text: 'Planted tomatoes in the garden with my daughter.', timestamp: 2 },
    { id: 'c', title: 'Meetings again', text: 'Another day of meetings with the client team.', timestamp: 3 },
  ]
  const index = keywordIndex(docs)
  expect(keywordSearch(index, 'garden')[0].id).toBe('b')
  const merged = hybridMerge([{ ...docs[0], score: 0.8 }, { ...docs[1], score: 0.1 }], keywordSearch(index, 'meetings'))
  expect(merged[0].id).toBe('a')
  expect(merged.map((m) => m.id)).toContain('c')
  expect(relatedPages('Today the client meetings were exhausting again', docs, 'c').map((r) => r.id)).toContain('a')
  expect(relatedPages('hi', docs)).toEqual([])
})
