export const MODULE_FILES = ['main.js', 'cart.js', 'receipt.js'] as const
export type ModuleFile = typeof MODULE_FILES[number]

export type ModuleCard = { id: string; code: string; file: ModuleFile; reason: string; imports?: ModuleFile }
export const MODULE_CARDS: ModuleCard[] = [
  { id: 'total', code: 'export function total(prices) {\n  return prices.reduce((sum, price) => sum + price, 0)\n}', file: 'cart.js', reason: 'The reusable calculation belongs in cart.js and is exported for other modules.' },
  { id: 'tax', code: 'export const TAX_RATE = 0.08', file: 'cart.js', reason: 'The cart calculation owns the reusable tax constant.' },
  { id: 'receipt', code: 'export function renderReceipt(amount) {\n  return `Total: $${amount.toFixed(2)}`\n}', file: 'receipt.js', reason: 'The display function belongs in receipt.js and is exported.' },
  { id: 'import-cart', code: "import { total } from './cart.js'", file: 'main.js', imports: 'cart.js', reason: 'main.js uses total, so it imports the named export from cart.js.' },
  { id: 'import-receipt', code: "import { renderReceipt } from './receipt.js'", file: 'main.js', imports: 'receipt.js', reason: 'main.js uses renderReceipt, so it imports the named export from receipt.js.' },
  { id: 'start', code: 'const amount = total([12, 8])\nconsole.log(renderReceipt(amount))', file: 'main.js', reason: 'The entry point combines the imported functions to run the kiosk.' },
]

export type ModulePlacements = Record<string, ModuleFile>
export const MODULE_START: ModulePlacements = Object.fromEntries(MODULE_CARDS.map((card) => [card.id, 'main.js'])) as ModulePlacements

export function checkModules(placements: ModulePlacements) {
  const cards = MODULE_CARDS.map((card) => ({ ...card, actual: placements[card.id] ?? 'main.js', pass: placements[card.id] === card.file }))
  const passed = cards.filter((card) => card.pass).length
  const firstMiss = cards.find((card) => !card.pass)
  return { cards, passed, pass: passed === MODULE_CARDS.length, feedback: firstMiss ? `${firstMiss.id} is in ${firstMiss.actual}. ${firstMiss.reason}` : 'All modules connect. main.js imports functions from the two focused modules.' }
}

export function moduleEdges(placements: ModulePlacements) {
  return MODULE_CARDS.filter((card) => card.imports).map((card) => ({ from: card.imports!, to: placements[card.id] ?? 'main.js', valid: placements[card.id] === card.file }))
}
