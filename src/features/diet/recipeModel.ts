import { create, all } from 'mathjs'
import { emptyNutrients, foods, nutrientIds, scale, type FoodRow, type Nutrients } from './nutrients'

const math = create(all, {})

export type Ingredient = { foodId: string; grams: number }
export type Recipe = {
  id: string
  name: string
  servings: number
  ingredients: Ingredient[]
  /** Optional preparation instructions for cook-along mode. */
  steps?: string[]
  /** Apply each ingredient's cooking yield (moisture loss or water absorbed). */
  cooked: boolean
  /** Optional measured weight of the finished dish, overriding the estimate. */
  cookedWeight?: number
  createdAt: number
}

export const foodById = (id: string) => foods.find((f) => f.id === id)

const massAliases: Record<string, string> = { g: 'g', gram: 'g', grams: 'g', kg: 'kg', mg: 'mg', oz: 'oz', ounce: 'oz', ounces: 'oz', lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb' }
const volumeAliases: Record<string, string> = {
  tbsp: 'tablespoon',
  tbs: 'tablespoon',
  tablespoons: 'tablespoon',
  tsp: 'teaspoon',
  teaspoons: 'teaspoon',
  cups: 'cup',
  ml: 'ml',
  l: 'l',
  litre: 'l',
  liter: 'l',
}

/** "1 1/2" → 1.5, "3/4" → 0.75, "2.5" → 2.5 (mathjs fractions keep it exact). */
export function parseAmount(text: string): number | null {
  const t = text.trim()
  if (!t) return null
  const mixed = t.match(/^(\d+)\s+(\d+\/\d+)$/)
  try {
    const v = mixed ? math.add(math.fraction(mixed[1]), math.fraction(mixed[2])) : math.fraction(t)
    const n = Number(math.number(v as never))
    return Number.isFinite(n) && n > 0 ? n : null
  } catch {
    return null
  }
}

/**
 * Converts free text like "1 1/2 tbsp", "2 cups", "4 oz", "150g" or "2"
 * (pieces) into grams for a given food. Volumes use the food's density.
 */
export function parseQuantity(input: string, food: FoodRow): number | null {
  const m = input.trim().toLowerCase().match(/^([\d./\s]+?)\s*([a-z]+)?\.?$/)
  if (!m) return null
  const amount = parseAmount(m[1])
  if (amount == null) return null
  const u = m[2]
  if (!u || ['piece', 'pieces', 'x', 'whole', 'item', 'items', 'slice', 'slices', 'clove', 'cloves'].includes(u))
    return food.piece ? Math.round(amount * food.piece) : null
  try {
    if (massAliases[u]) return Math.round(math.unit(amount, massAliases[u]).toNumber('g'))
    const vol = volumeAliases[u] ?? u
    const ml = math.unit(amount, vol).toNumber('ml')
    return food.density ? Math.round(ml * food.density) : null
  } catch {
    return null
  }
}

export type RecipeTotals = Nutrients & {
  kcal: number
  protein: number
  carbs: number
  fat: number
  rawWeight: number
  cookedWeight: number
}

export function recipeTotals(r: Pick<Recipe, 'ingredients' | 'cooked' | 'cookedWeight'>): RecipeTotals {
  const t = { ...emptyNutrients(), kcal: 0, protein: 0, carbs: 0, fat: 0, rawWeight: 0, cookedWeight: 0 } as RecipeTotals
  for (const ing of r.ingredients) {
    const food = foodById(ing.foodId)
    if (!food) continue
    const s = scale(food, ing.grams)
    t.kcal += s.kcal
    t.protein += s.protein
    t.carbs += s.carbs
    t.fat += s.fat
    for (const k of nutrientIds) t[k] += s[k]
    t.rawWeight += ing.grams
    t.cookedWeight += r.cooked ? ing.grams * food.yield : ing.grams
  }
  if (r.cooked && r.cookedWeight && r.cookedWeight > 0) t.cookedWeight = r.cookedWeight
  return t
}

/** Calories in 100 g of the finished dish: moisture loss concentrates them. */
export const kcalPer100 = (t: RecipeTotals) => (t.cookedWeight ? (t.kcal / t.cookedWeight) * 100 : 0)

export function perServing(t: RecipeTotals, servings: number): RecipeTotals {
  const n = Math.max(1, servings)
  const out = { ...t }
  for (const k of Object.keys(out) as (keyof RecipeTotals)[]) out[k] = t[k] / n
  return out
}

/** Grams of cooked dish for a portion expressed as a fraction of servings. */
export const portionGrams = (t: RecipeTotals, servings: number, portions = 1) => (t.cookedWeight / Math.max(1, servings)) * portions
