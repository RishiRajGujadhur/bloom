/** Open Food Facts product, trimmed to what Bloom shows. */
export type Product = {
  code: string
  name: string
  brand: string
  image?: string
  nutriscore?: string
  nova?: number
  ecoscore?: string
  per100: { kcal: number; protein: number; carbs: number; sugars: number; fat: number; satFat: number; fibre: number; salt: number }
  additives: string[]
  allergens: string[]
  serving?: string
}
export type ScanStore = { history: Product[]; allergens: string[]; compare: [string | null, string | null] }
export const SCAN_KEY = 'bloom-scan-v1'

export const allergenList = ['gluten', 'milk', 'eggs', 'nuts', 'peanuts', 'soybeans', 'fish', 'crustaceans', 'sesame-seeds', 'celery', 'mustard', 'sulphur-dioxide-and-sulphites'] as const
export const allergenName = (a: string) => a.replace(/-/g, ' ').replace('sulphur dioxide and sulphites', 'sulphites').replace('sesame seeds', 'sesame')

const clean = (tags: unknown) => (Array.isArray(tags) ? tags.map((t) => String(t).replace(/^[a-z]{2}:/, '')) : [])

/** Parse the OFF v2 API response. */
export function parseProduct(code: string, json: unknown): Product | null {
  const j = json as { status?: number; product?: Record<string, unknown> }
  if (!j || j.status !== 1 || !j.product) return null
  const p = j.product
  const n = (p.nutriments ?? {}) as Record<string, number>
  const num = (k: string) => (typeof n[k] === 'number' ? n[k] : 0)
  return {
    code,
    name: String(p.product_name || 'Unnamed product'),
    brand: String(p.brands || '').split(',')[0].trim(),
    image: typeof p.image_front_small_url === 'string' ? p.image_front_small_url : undefined,
    nutriscore: typeof p.nutriscore_grade === 'string' && /^[a-e]$/.test(p.nutriscore_grade) ? p.nutriscore_grade : undefined,
    nova: typeof p.nova_group === 'number' ? p.nova_group : undefined,
    ecoscore: typeof p.ecoscore_grade === 'string' && /^[a-e]$/.test(p.ecoscore_grade) ? p.ecoscore_grade : undefined,
    per100: {
      kcal: Math.round(num('energy-kcal_100g') || num('energy_100g') / 4.184),
      protein: num('proteins_100g'),
      carbs: num('carbohydrates_100g'),
      sugars: num('sugars_100g'),
      fat: num('fat_100g'),
      satFat: num('saturated-fat_100g'),
      fibre: num('fiber_100g'),
      salt: num('salt_100g'),
    },
    additives: clean(p.additives_tags).map((a) => a.toUpperCase()),
    allergens: clean(p.allergens_tags),
    serving: typeof p.serving_size === 'string' ? p.serving_size : undefined,
  }
}

export const apiUrl = (code: string) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,brands,image_front_small_url,nutriscore_grade,nova_group,ecoscore_grade,nutriments,additives_tags,allergens_tags,serving_size`

export const validCode = (s: string) => /^\d{8,14}$/.test(s.trim())

/** 1 sugar cube ≈ 4 g. */
export const sugarCubes = (sugars100: number, grams: number) => Math.round(((sugars100 * grams) / 100 / 4) * 2) / 2

export const forPortion = (p: Product, grams: number) => {
  const f = grams / 100
  return {
    kcal: Math.round(p.per100.kcal * f),
    protein: Math.round(p.per100.protein * f),
    carbs: Math.round(p.per100.carbs * f),
    fat: Math.round(p.per100.fat * f),
    sugars: Math.round(p.per100.sugars * f * 10) / 10,
  }
}

export const allergenHits = (p: Product, mine: string[]) => p.allergens.filter((a) => mine.includes(a))

/** Traffic light for a nutrient per 100 g (UK FSA thresholds). */
export function light(nutrient: 'sugars' | 'fat' | 'satFat' | 'salt', v: number) {
  const t = { sugars: [5, 22.5], fat: [3, 17.5], satFat: [1.5, 5], salt: [0.3, 1.5] }[nutrient]
  return v <= t[0] ? 'low' : v <= t[1] ? 'medium' : 'high'
}
