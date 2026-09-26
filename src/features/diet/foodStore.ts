import { db } from '../../search/db'
import { foods, type FoodRow } from './nutrients'

let seeded: Promise<void> | null = null

/** Copies the bundled USDA subset into Dexie once (and when it grows). */
export function ensureFoods() {
  if (!seeded)
    seeded = db.foods
      .count()
      .then((n) => (n < foods.length ? db.foods.bulkPut(foods).then(() => undefined) : undefined))
      .catch(() => {
        seeded = null
      })
  return seeded
}

export async function searchFoods(query: string, limit = 60): Promise<FoodRow[]> {
  const q = query.trim().toLowerCase()
  try {
    await ensureFoods()
    const all = await db.foods.toArray()
    const list = all.length ? all : foods
    return (q ? list.filter((f) => f.name.toLowerCase().includes(q) || f.group.includes(q)) : list).slice(0, limit)
  } catch {
    // IndexedDB unavailable: the bundled table still works.
    return (q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : foods).slice(0, limit)
  }
}
