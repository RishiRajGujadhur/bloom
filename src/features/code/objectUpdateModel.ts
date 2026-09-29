import type { Check } from './codeCourse'

export const OBJECT_STARTER = `function adjustStock(stock, crop, delta) {
  // Return a new stock object with the crop count changed.
}
`

export const OBJECT_SOLUTION = `function adjustStock(stock, crop, delta) {
  return { ...stock, [crop]: (stock[crop] ?? 0) + delta }
}`

export const OBJECT_CHECKS: Check[] = [
  { label: 'Updates an existing crop', probe: "adjustStock({ kale: 3, mint: 2 }, 'kale', 2)", equals: { kale: 5, mint: 2 } },
  { label: 'Looks up another key dynamically', probe: "adjustStock({ kale: 3, mint: 2 }, 'mint', -1)", equals: { kale: 3, mint: 1 } },
  { label: 'Creates a missing crop from zero', probe: "adjustStock({ kale: 3 }, 'basil', 4)", equals: { kale: 3, basil: 4 } },
  { label: 'Leaves the original unchanged', probe: "(() => { const stock = { kale: 3, mint: 2 }; adjustStock(stock, 'kale', 2); return stock })()", equals: { kale: 3, mint: 2 } },
  { label: 'Returns a new object', probe: "(() => { const stock = { kale: 3 }; return adjustStock(stock, 'kale', 2) !== stock })()", equals: true },
]
