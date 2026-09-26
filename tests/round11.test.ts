import { foods, electrolytesMet, radarData, scale } from '../src/features/diet/nutrients'
import { kcalPer100, parseAmount, parseQuantity, perServing, recipeTotals } from '../src/features/diet/recipeModel'
import { dayNutrients, plantDiversity, foodLibrary } from '../src/features/diet/dietModel'
import { initialBreath, pacer, stepBreath } from '../src/features/taichi/breathSignal'
import { angle, bassFor, measureStance, type Pt } from '../src/features/taichi/stanceModel'
import { chest, sprites } from '../src/features/juice/sprites'

const food = (id: string) => foods.find((f) => f.id === id)!

test('mathjs parses kitchen quantities into grams', () => {
  expect(parseAmount('1 1/2')).toBe(1.5)
  expect(parseAmount('3/4')).toBe(0.75)
  expect(parseAmount('abc')).toBeNull()
  expect(parseQuantity('150g', food('chicken'))).toBe(150)
  expect(parseQuantity('4 oz', food('chicken'))).toBe(113)
  expect(parseQuantity('1 1/2 tbsp', food('olive-oil'))).toBe(20) // 22.2 ml × 0.91
  expect(parseQuantity('1 cup', food('oats'))).toBe(97)
  expect(parseQuantity('2', food('egg'))).toBe(100)
  expect(parseQuantity('2 cups', food('chicken'))).toBeNull() // no density
})

test('cook loss concentrates calories per gram; servings divide the dish', () => {
  const recipe = { ingredients: [{ foodId: 'chicken', grams: 200 }], cooked: true }
  const t = recipeTotals(recipe)
  expect(t.rawWeight).toBe(200)
  expect(t.cookedWeight).toBe(150)
  expect(Math.round(kcalPer100(t))).toBe(160) // 120 raw → 160 cooked
  expect(recipeTotals({ ...recipe, cookedWeight: 140 }).cookedWeight).toBe(140)
  expect(perServing(recipeTotals({ ingredients: [{ foodId: 'rice', grams: 100 }], cooked: true }), 2).cookedWeight).toBe(140)
})

test('micronutrients, diversity and electrolytes', () => {
  expect(scale(food('orange'), 200).vitC).toBeCloseTo(106)
  const meals = foodLibrary
    .filter((f) => f.ingredients)
    .map((f, i) => ({ id: String(i), at: 0, date: '2026-09-26', kind: 'lunch' as const, ...f }))
  const n = dayNutrients(meals, '2026-09-26')
  expect(n.potassium).toBeGreaterThan(3400)
  expect(radarData(n)).toHaveLength(8)
  const d = plantDiversity(meals, '2026-09-26')
  expect(d.count).toBeGreaterThan(15)
  expect(d.ids).not.toContain('olive-oil')
  expect(d.ids).not.toContain('chicken')
  expect(electrolytesMet({ ...n, potassium: 3500, magnesium: 420, sodium: 1500 })).toBe(true)
  expect(electrolytesMet({ ...n, potassium: 3500, magnesium: 420, sodium: 4000 })).toBe(false)
})

test('breath noise bursts alternate inhale and exhale', () => {
  let s = initialBreath()
  const run = (breathy: boolean, seconds: number) => {
    for (let t = 0; t < seconds; t += 0.05) s = stepBreath(s, { rms: breathy ? 0.06 : 0.003, flatness: breathy ? 0.5 : 0.05, dt: 0.05 })
  }
  run(false, 1)
  const start = s.value
  run(true, 2)
  const afterFirst = s.value
  run(false, 0.6)
  run(true, 2)
  expect(Math.sign(afterFirst - start)).not.toBe(0)
  expect(Math.sign(s.value - afterFirst)).toBe(-Math.sign(afterFirst - start))
  expect(pacer(0)).toBeCloseTo(0)
  expect(pacer(4)).toBeCloseTo(1)
  expect(pacer(10)).toBeCloseTo(0)
})

test('stance: wide, bent knees read as a grounded horse stance', () => {
  const pose = (ankleSpread: number, kneeBend: number): Pt[] => {
    const p: Pt[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5 }))
    p[11] = { x: 0.45, y: 0.3 }
    p[12] = { x: 0.55, y: 0.3 }
    p[23] = { x: 0.46, y: 0.55 }
    p[24] = { x: 0.54, y: 0.55 }
    p[25] = { x: 0.5 - ankleSpread / 2 - kneeBend, y: 0.7 }
    p[26] = { x: 0.5 + ankleSpread / 2 + kneeBend, y: 0.7 }
    p[27] = { x: 0.5 - ankleSpread / 2, y: 0.88 }
    p[28] = { x: 0.5 + ankleSpread / 2, y: 0.88 }
    return p
  }
  const tall = measureStance(pose(0.1, 0))!
  const horse = measureStance(pose(0.22, 0.06))!
  expect(tall.name).toBe('Standing')
  expect(horse.name).toBe('Horse stance')
  expect(horse.grounding).toBeGreaterThan(tall.grounding + 0.4)
  expect(angle({ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 })).toBeCloseTo(180)
  const low = bassFor(0, 261.63)
  const deep = bassFor(1, 261.63)
  expect(deep.frequency).toBeCloseTo(low.frequency / 2)
  expect(deep.volumeDb).toBeGreaterThan(low.volumeDb)
})

test('pixel sprites are rectangular and use only their palette', () => {
  for (const s of [...sprites, chest]) {
    const w = s.rows[0].length
    for (const row of s.rows) {
      expect(row.length).toBe(w)
      for (const c of row) if (c !== '.') expect(s.palette[c]).toBeDefined()
    }
  }
})
