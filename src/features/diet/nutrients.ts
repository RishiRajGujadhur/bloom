/**
 * A compact, curated subset of USDA FoodData Central (SR Legacy, public
 * domain), values per 100 g as purchased (raw unless noted). Seeded into
 * Dexie on first use so lookups and recipes work offline.
 *
 *   yield   cooked weight ÷ raw weight (0.75 = loses a quarter to moisture)
 *   density grams per millilitre, for cups / tablespoons
 *   piece   grams in one typical item ("1 egg", "2 bananas")
 */
export type NutrientId =
  | 'fibre'
  | 'vitC'
  | 'vitA'
  | 'vitD'
  | 'b12'
  | 'folate'
  | 'iron'
  | 'calcium'
  | 'magnesium'
  | 'potassium'
  | 'sodium'
  | 'zinc'
  | 'omega3'

export type Nutrients = Record<NutrientId, number>
export type FoodRow = {
  id: string
  name: string
  emoji: string
  plant: boolean
  group: 'vegetable' | 'fruit' | 'grain' | 'legume' | 'nut' | 'dairy' | 'meat' | 'fish' | 'egg' | 'fat' | 'other'
  kcal: number
  protein: number
  carbs: number
  fat: number
  yield: number
  density?: number
  piece?: number
} & Nutrients

export const nutrientInfo: Record<NutrientId, { label: string; unit: string; target: number }> = {
  fibre: { label: 'Fibre', unit: 'g', target: 28 },
  vitC: { label: 'Vitamin C', unit: 'mg', target: 90 },
  vitA: { label: 'Vitamin A', unit: 'µg', target: 900 },
  vitD: { label: 'Vitamin D', unit: 'µg', target: 15 },
  b12: { label: 'Vitamin B12', unit: 'µg', target: 2.4 },
  folate: { label: 'Folate', unit: 'µg', target: 400 },
  iron: { label: 'Iron', unit: 'mg', target: 14 },
  calcium: { label: 'Calcium', unit: 'mg', target: 1000 },
  magnesium: { label: 'Magnesium', unit: 'mg', target: 400 },
  potassium: { label: 'Potassium', unit: 'mg', target: 3400 },
  sodium: { label: 'Sodium', unit: 'mg', target: 1500 },
  zinc: { label: 'Zinc', unit: 'mg', target: 11 },
  omega3: { label: 'Omega-3', unit: 'g', target: 1.6 },
}

type Seed = [string, string, string, boolean, FoodRow['group'], number, number, number, number, number, number[], { density?: number; piece?: number }?]
// id, name, emoji, plant, group, kcal, protein, carbs, fat, yield,
// [fibre, vitC, vitA, vitD, b12, folate, iron, calcium, magnesium, potassium, sodium, zinc, omega3]
const seeds: Seed[] = [
  ['oats', 'Rolled oats', '🌾', true, 'grain', 379, 13.2, 67.7, 6.5, 2.4, [10.1, 0, 0, 0, 0, 32, 4.3, 52, 138, 362, 6, 3.6, 0.1], { density: 0.41 }],
  ['rice', 'White rice', '🍚', true, 'grain', 365, 7.1, 80, 0.7, 2.8, [1.3, 0, 0, 0, 0, 8, 0.8, 28, 25, 115, 5, 1.1, 0], { density: 0.85 }],
  ['brown-rice', 'Brown rice', '🍘', true, 'grain', 367, 7.5, 76, 3.2, 2.6, [3.6, 0, 0, 0, 0, 20, 1.5, 9, 116, 250, 4, 2, 0.03], { density: 0.8 }],
  ['pasta', 'Pasta (dry)', '🍝', true, 'grain', 371, 13, 75, 1.5, 2.25, [3.2, 0, 0, 0, 0, 18, 1.3, 21, 53, 223, 6, 1.4, 0.02], { density: 0.45 }],
  ['bread', 'Wholemeal bread', '🍞', true, 'grain', 247, 13, 41, 3.4, 1, [6.8, 0, 0, 0, 0, 42, 2.5, 161, 76, 248, 450, 1.8, 0.07], { piece: 35 }],
  ['quinoa', 'Quinoa', '🌰', true, 'grain', 368, 14.1, 64, 6.1, 2.7, [7, 0, 1, 0, 0, 184, 4.6, 47, 197, 563, 5, 3.1, 0.26], { density: 0.72 }],
  ['lentils', 'Lentils (dry)', '🍲', true, 'legume', 352, 24.6, 63, 1.1, 2.5, [10.7, 4.5, 2, 0, 0, 479, 6.5, 35, 47, 677, 6, 3.3, 0.04], { density: 0.8 }],
  ['chickpeas', 'Chickpeas (canned)', '🟡', true, 'legume', 139, 7, 22.5, 2.6, 1, [6.4, 0.5, 1, 0, 0, 40, 1.3, 43, 23, 110, 246, 0.7, 0.03], { density: 0.65 }],
  ['black-beans', 'Black beans (canned)', '⚫', true, 'legume', 91, 6, 16.6, 0.3, 1, [6.9, 0, 0, 0, 0, 57, 1.4, 35, 42, 308, 237, 0.6, 0.1], { density: 0.7 }],
  ['tofu', 'Tofu (firm)', '🧊', true, 'legume', 144, 17.3, 2.8, 8.7, 1, [2.3, 0.2, 8, 0, 0, 29, 2.7, 683, 58, 237, 14, 1.6, 0.58]],
  ['spinach', 'Spinach', '🥬', true, 'vegetable', 23, 2.9, 3.6, 0.4, 0.3, [2.2, 28, 469, 0, 0, 194, 2.7, 99, 79, 558, 79, 0.5, 0.14], { density: 0.13 }],
  ['kale', 'Kale', '🥗', true, 'vegetable', 49, 4.3, 8.8, 0.9, 0.5, [3.6, 120, 500, 0, 0, 141, 1.5, 150, 47, 491, 38, 0.6, 0.18], { density: 0.28 }],
  ['broccoli', 'Broccoli', '🥦', true, 'vegetable', 34, 2.8, 6.6, 0.4, 0.9, [2.6, 89, 31, 0, 0, 63, 0.7, 47, 21, 316, 33, 0.4, 0.02], { density: 0.38, piece: 150 }],
  ['carrot', 'Carrot', '🥕', true, 'vegetable', 41, 0.9, 9.6, 0.2, 0.9, [2.8, 5.9, 835, 0, 0, 19, 0.3, 33, 12, 320, 69, 0.2, 0], { piece: 60, density: 0.55 }],
  ['sweet-potato', 'Sweet potato', '🍠', true, 'vegetable', 86, 1.6, 20, 0.1, 0.85, [3, 2.4, 709, 0, 0, 11, 0.6, 30, 25, 337, 55, 0.3, 0], { piece: 130 }],
  ['potato', 'Potato', '🥔', true, 'vegetable', 77, 2, 17, 0.1, 0.9, [2.2, 19.7, 0, 0, 0, 15, 0.8, 12, 23, 425, 6, 0.3, 0.01], { piece: 170 }],
  ['tomato', 'Tomato', '🍅', true, 'vegetable', 18, 0.9, 3.9, 0.2, 0.9, [1.2, 13.7, 42, 0, 0, 15, 0.3, 10, 11, 237, 5, 0.2, 0], { piece: 120 }],
  ['pepper', 'Red pepper', '🫑', true, 'vegetable', 31, 1, 6, 0.3, 0.9, [2.1, 128, 157, 0, 0, 46, 0.4, 7, 12, 211, 4, 0.3, 0.03], { piece: 120 }],
  ['onion', 'Onion', '🧅', true, 'vegetable', 40, 1.1, 9.3, 0.1, 0.8, [1.7, 7.4, 0, 0, 0, 19, 0.2, 23, 10, 146, 4, 0.2, 0], { piece: 110, density: 0.6 }],
  ['garlic', 'Garlic', '🧄', true, 'vegetable', 149, 6.4, 33, 0.5, 0.95, [2.1, 31, 0, 0, 0, 3, 1.7, 181, 25, 401, 17, 1.2, 0.02], { piece: 4 }],
  ['mushroom', 'Mushrooms', '🍄', true, 'vegetable', 22, 3.1, 3.3, 0.3, 0.6, [1, 2.1, 0, 0.2, 0.04, 17, 0.5, 3, 9, 318, 5, 0.5, 0], { density: 0.3 }],
  ['peas', 'Green peas', '🟢', true, 'vegetable', 81, 5.4, 14.5, 0.4, 1, [5.7, 40, 38, 0, 0, 65, 1.5, 25, 33, 244, 5, 1.2, 0.04], { density: 0.6 }],
  ['avocado', 'Avocado', '🥑', true, 'fruit', 160, 2, 8.5, 14.7, 1, [6.7, 10, 7, 0, 0, 81, 0.6, 12, 29, 485, 7, 0.6, 0.11], { piece: 150 }],
  ['banana', 'Banana', '🍌', true, 'fruit', 89, 1.1, 22.8, 0.3, 1, [2.6, 8.7, 3, 0, 0, 20, 0.3, 5, 27, 358, 1, 0.2, 0.03], { piece: 118 }],
  ['apple', 'Apple', '🍎', true, 'fruit', 52, 0.3, 13.8, 0.2, 1, [2.4, 4.6, 3, 0, 0, 3, 0.1, 6, 5, 107, 1, 0, 0.01], { piece: 182 }],
  ['orange', 'Orange', '🍊', true, 'fruit', 47, 0.9, 11.8, 0.1, 1, [2.4, 53, 11, 0, 0, 30, 0.1, 40, 10, 181, 0, 0.1, 0.01], { piece: 130 }],
  ['berries', 'Mixed berries', '🫐', true, 'fruit', 57, 0.7, 14.5, 0.3, 1, [2.4, 9.7, 3, 0, 0, 6, 0.3, 6, 6, 77, 1, 0.2, 0.06], { density: 0.6 }],
  ['kiwi', 'Kiwi', '🥝', true, 'fruit', 61, 1.1, 14.7, 0.5, 1, [3, 93, 4, 0, 0, 25, 0.3, 34, 17, 312, 3, 0.1, 0.04], { piece: 75 }],
  ['almonds', 'Almonds', '🌰', true, 'nut', 579, 21, 21.6, 49.9, 1, [12.5, 0, 0, 0, 0, 44, 3.7, 269, 270, 733, 1, 3.1, 0], { density: 0.6 }],
  ['walnuts', 'Walnuts', '🥜', true, 'nut', 654, 15.2, 13.7, 65.2, 1, [6.7, 1.3, 1, 0, 0, 98, 2.9, 98, 158, 441, 2, 3.1, 9.1], { density: 0.47 }],
  ['chia', 'Chia seeds', '⚪', true, 'nut', 486, 16.5, 42, 30.7, 1, [34.4, 1.6, 3, 0, 0, 49, 7.7, 631, 335, 407, 16, 4.6, 17.8], { density: 0.65 }],
  ['flax', 'Ground flaxseed', '🟤', true, 'nut', 534, 18.3, 28.9, 42.2, 1, [27.3, 0.6, 0, 0, 0, 87, 5.7, 255, 392, 813, 30, 4.3, 22.8], { density: 0.5 }],
  ['peanut-butter', 'Peanut butter', '🥜', true, 'nut', 588, 25, 20, 50, 1, [6, 0, 0, 0, 0, 87, 1.9, 43, 154, 649, 459, 2.9, 0.03], { density: 1.1 }],
  ['olive-oil', 'Olive oil', '🫒', true, 'fat', 884, 0, 0, 100, 1, [0, 0, 0, 0, 0, 0, 0.6, 1, 0, 1, 2, 0, 0.76], { density: 0.91 }],
  ['milk', 'Milk (semi-skimmed)', '🥛', false, 'dairy', 50, 3.3, 4.8, 2, 1, [0, 0, 46, 1.2, 0.5, 5, 0, 120, 11, 150, 44, 0.4, 0.01], { density: 1.03 }],
  ['yoghurt', 'Greek yoghurt', '🍶', false, 'dairy', 97, 9, 4, 5, 1, [0, 0, 26, 0, 0.8, 7, 0, 100, 11, 141, 35, 0.5, 0.02], { density: 1.05 }],
  ['cheese', 'Cheddar', '🧀', false, 'dairy', 403, 24.9, 1.3, 33.1, 1, [0, 0, 265, 0.6, 0.8, 18, 0.7, 721, 28, 98, 621, 3.1, 0.37], { density: 0.45 }],
  ['egg', 'Egg', '🥚', false, 'egg', 143, 12.6, 0.7, 9.5, 0.97, [0, 0, 160, 2, 0.9, 47, 1.8, 56, 12, 138, 142, 1.3, 0.07], { piece: 50 }],
  ['chicken', 'Chicken breast', '🍗', false, 'meat', 120, 22.5, 0, 2.6, 0.75, [0, 0, 9, 0.1, 0.2, 4, 0.4, 5, 28, 334, 45, 0.7, 0.02], { piece: 170 }],
  ['beef', 'Beef mince (10%)', '🥩', false, 'meat', 176, 20, 0, 10, 0.72, [0, 0, 0, 0.1, 2.3, 6, 2.2, 12, 20, 318, 66, 4.8, 0.04]],
  ['pork', 'Pork loin', '🥓', false, 'meat', 143, 21, 0, 5.9, 0.75, [0, 0.6, 2, 0.5, 0.5, 1, 0.8, 16, 24, 385, 50, 1.9, 0.02]],
  ['salmon', 'Salmon', '🐟', false, 'fish', 208, 20.4, 0, 13.4, 0.8, [0, 3.9, 58, 11, 3.2, 25, 0.3, 9, 27, 363, 59, 0.4, 2.3], { piece: 125 }],
  ['tuna', 'Tuna (canned)', '🐠', false, 'fish', 116, 25.5, 0, 0.8, 1, [0, 0, 17, 1.7, 2.5, 4, 1.5, 11, 27, 237, 247, 0.8, 0.27]],
  ['sardines', 'Sardines (canned)', '🐡', false, 'fish', 208, 24.6, 0, 11.5, 1, [0, 0, 32, 4.8, 8.9, 10, 2.9, 382, 39, 397, 307, 1.3, 1.5]],
  ['dark-chocolate', 'Dark chocolate', '🍫', true, 'other', 598, 7.8, 45.9, 42.6, 1, [10.9, 0, 2, 0, 0.3, 0, 11.9, 73, 228, 715, 20, 3.3, 0.04]],
  ['coffee', 'Coffee (brewed)', '☕', true, 'other', 1, 0.1, 0, 0, 1, [0, 0, 0, 0, 0, 2, 0, 2, 3, 49, 2, 0, 0], { density: 1 }],
]

const ids: NutrientId[] = ['fibre', 'vitC', 'vitA', 'vitD', 'b12', 'folate', 'iron', 'calcium', 'magnesium', 'potassium', 'sodium', 'zinc', 'omega3']

export const foods: FoodRow[] = seeds.map(([id, name, emoji, plant, group, kcal, protein, carbs, fat, y, n, extra]) => ({
  id,
  name,
  emoji,
  plant,
  group,
  kcal,
  protein,
  carbs,
  fat,
  yield: y,
  ...(extra ?? {}),
  ...(Object.fromEntries(ids.map((k, i) => [k, n[i]])) as Nutrients),
}))
export const nutrientIds = ids

export const emptyNutrients = (): Nutrients => Object.fromEntries(ids.map((k) => [k, 0])) as Nutrients

/** Nutrients in `grams` of a food, as weighed raw. */
export function scale(food: FoodRow, grams: number): Nutrients & { kcal: number; protein: number; carbs: number; fat: number } {
  const f = grams / 100
  const out = { kcal: food.kcal * f, protein: food.protein * f, carbs: food.carbs * f, fat: food.fat * f } as Nutrients & { kcal: number; protein: number; carbs: number; fat: number }
  for (const k of ids) out[k] = food[k] * f
  return out
}

/** Eight radar axes; a few group related nutrients (averaged % of target). */
export const radarAxes: { axis: string; parts: NutrientId[] }[] = [
  { axis: 'Fibre', parts: ['fibre'] },
  { axis: 'Vitamin C', parts: ['vitC'] },
  { axis: 'Vitamin A', parts: ['vitA'] },
  { axis: 'Vitamin D', parts: ['vitD'] },
  { axis: 'B12 & folate', parts: ['b12', 'folate'] },
  { axis: 'Iron & zinc', parts: ['iron', 'zinc'] },
  { axis: 'Calcium', parts: ['calcium'] },
  { axis: 'Electrolytes', parts: ['potassium', 'magnesium'] },
]

export const pct = (id: NutrientId, value: number) => Math.round((value / nutrientInfo[id].target) * 100)

export function radarData(totals: Nutrients) {
  return radarAxes.map(({ axis, parts }) => ({
    axis,
    consumed: Math.min(150, Math.round(parts.reduce((s, p) => s + pct(p, totals[p]), 0) / parts.length)),
    target: 100,
  }))
}

/** Electrolytes met = potassium, magnesium ≥ 100 % and sodium in 60–150 % of its adequate intake. */
export function electrolytesMet(totals: Nutrients) {
  return pct('potassium', totals.potassium) >= 100 && pct('magnesium', totals.magnesium) >= 100 && pct('sodium', totals.sodium) >= 60 && pct('sodium', totals.sodium) <= 150
}
