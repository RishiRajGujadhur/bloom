import { dayKey } from '../../dates'

export const DIET_KEY = 'bloom-diet-v1'
export const DIET_EVENT = 'bloom:diet-changed'

export type MealKind = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Meal = {
  id: string
  at: number
  date: string
  name: string
  kind: MealKind
  kcal: number
  protein: number
  carbs: number
  fat: number
  /** Mindful eating: 1 (starving) – 5 (not hungry) before, 1 (still hungry) – 5 (stuffed) after. */
  hunger?: number
  fullness?: number
  feeling?: 'energised' | 'steady' | 'sluggish'
}
export type DietTargets = { kcal: number; protein: number; carbs: number; fat: number; water: number }
export type DietState = { meals: Meal[]; water: Record<string, number>; targets: DietTargets }

export const defaultDiet: DietState = {
  meals: [],
  water: {},
  targets: { kcal: 2000, protein: 90, carbs: 230, fat: 70, water: 8 },
}

export type Food = Omit<Meal, 'id' | 'at' | 'date' | 'kind' | 'hunger' | 'fullness' | 'feeling'> & { emoji: string }
export const foodLibrary: Food[] = [
  { emoji: '🥣', name: 'Oats with berries', kcal: 320, protein: 11, carbs: 54, fat: 7 },
  { emoji: '🍳', name: 'Two eggs on toast', kcal: 360, protein: 20, carbs: 28, fat: 18 },
  { emoji: '🥑', name: 'Avocado toast', kcal: 290, protein: 8, carbs: 30, fat: 16 },
  { emoji: '🥗', name: 'Chicken salad', kcal: 420, protein: 38, carbs: 18, fat: 22 },
  { emoji: '🍛', name: 'Rice and curry', kcal: 620, protein: 24, carbs: 88, fat: 18 },
  { emoji: '🍝', name: 'Pasta bowl', kcal: 580, protein: 20, carbs: 90, fat: 14 },
  { emoji: '🍣', name: 'Salmon and greens', kcal: 480, protein: 36, carbs: 12, fat: 30 },
  { emoji: '🌯', name: 'Wrap', kcal: 450, protein: 22, carbs: 50, fat: 17 },
  { emoji: '🍲', name: 'Lentil soup', kcal: 260, protein: 16, carbs: 38, fat: 5 },
  { emoji: '🍌', name: 'Banana', kcal: 105, protein: 1, carbs: 27, fat: 0 },
  { emoji: '🍎', name: 'Apple', kcal: 95, protein: 0, carbs: 25, fat: 0 },
  { emoji: '🥜', name: 'Handful of nuts', kcal: 180, protein: 6, carbs: 6, fat: 16 },
  { emoji: '🥛', name: 'Greek yoghurt', kcal: 150, protein: 15, carbs: 8, fat: 6 },
  { emoji: '🍫', name: 'Chocolate', kcal: 210, protein: 3, carbs: 24, fat: 12 },
  { emoji: '☕', name: 'Latte', kcal: 140, protein: 8, carbs: 12, fat: 6 },
  { emoji: '🍕', name: 'Pizza slices', kcal: 570, protein: 24, carbs: 64, fat: 24 },
]

export const kindFor = (hour: number): MealKind =>
  hour < 11 ? 'breakfast' : hour < 15 ? 'lunch' : hour >= 17 && hour < 22 ? 'dinner' : 'snack'

export function dayTotals(meals: Meal[], date: string) {
  const list = meals.filter((m) => m.date === date)
  const sum = (k: 'kcal' | 'protein' | 'carbs' | 'fat') => list.reduce((s, m) => s + m[k], 0)
  return { meals: list.length, kcal: sum('kcal'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat') }
}

export function lastDays(today: string, days = 7) {
  const out: string[] = []
  const d = new Date(`${today}T12:00:00`)
  for (let i = days - 1; i >= 0; i--) {
    const x = new Date(d)
    x.setDate(d.getDate() - i)
    out.push(dayKey(x))
  }
  return out
}

/** Gentle, non-judgemental observations from the last two weeks. */
export function dietInsights(state: DietState, today: string): string[] {
  const days = lastDays(today, 14)
  const meals = state.meals.filter((m) => days.includes(m.date))
  const out: string[] = []
  if (!meals.length) return out
  const late = meals.filter((m) => new Date(m.at).getHours() >= 21).length
  if (late >= 3) out.push(`${late} late meals in two weeks. Earlier dinners often mean better sleep.`)
  const mindful = meals.filter((m) => m.fullness != null)
  if (mindful.length >= 3) {
    const avg = mindful.reduce((s, m) => s + (m.fullness ?? 0), 0) / mindful.length
    out.push(avg > 4 ? 'You often finish very full. Try pausing halfway through a meal.' : avg < 2.5 ? 'You often finish still hungry. A little more at meals may steady your energy.' : 'You tend to stop at comfortably full. Lovely.')
  }
  const sluggish = meals.filter((m) => m.feeling === 'sluggish')
  if (sluggish.length >= 2) {
    const names = [...new Set(sluggish.map((m) => m.name))].slice(0, 2).join(' and ')
    out.push(`${names} left you sluggish. Worth noticing.`)
  }
  const waterDays = days.filter((d) => (state.water[d] ?? 0) >= state.targets.water).length
  out.push(`Water goal met on ${waterDays} of the last 14 days.`)
  const logged = days.filter((d) => meals.some((m) => m.date === d))
  const avgKcal = Math.round(logged.reduce((s, d) => s + dayTotals(meals, d).kcal, 0) / Math.max(1, logged.length))
  out.push(`Average of ${avgKcal} kcal on the ${logged.length} days you logged.`)
  return out
}

export function readDiet(): DietState {
  try {
    const raw = localStorage.getItem(DIET_KEY)
    return raw ? { ...defaultDiet, ...(JSON.parse(raw) as Partial<DietState>) } : defaultDiet
  } catch {
    return defaultDiet
  }
}
export function saveDiet(state: DietState) {
  try {
    localStorage.setItem(DIET_KEY, JSON.stringify(state))
  } catch {
    /* Keeps working for this visit. */
  }
  window.dispatchEvent(new Event(DIET_EVENT))
}
