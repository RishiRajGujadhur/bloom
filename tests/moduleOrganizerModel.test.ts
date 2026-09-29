import { checkModules, MODULE_CARDS, MODULE_START, moduleEdges, type ModulePlacements } from '../src/features/code/moduleOrganizerModel'

describe('JavaScript module organizer', () => {
  const solved: ModulePlacements = Object.fromEntries(MODULE_CARDS.map((card) => [card.id, card.file])) as ModulePlacements

  it('starts with misplaced exports and explains the first repair', () => {
    const result = checkModules(MODULE_START)
    expect(result.pass).toBe(false)
    expect(result.feedback).toContain('cart.js')
    expect(result.passed).toBeLessThan(MODULE_CARDS.length)
  })

  it('accepts all six placements and draws dependencies into main.js', () => {
    expect(checkModules(solved).pass).toBe(true)
    expect(moduleEdges(solved)).toEqual([
      { from: 'cart.js', to: 'main.js', valid: true },
      { from: 'receipt.js', to: 'main.js', valid: true },
    ])
  })

  it('flags an import placed in its own source module', () => {
    const broken = { ...solved, 'import-cart': 'cart.js' as const }
    expect(checkModules(broken).pass).toBe(false)
    expect(moduleEdges(broken)[0]).toEqual({ from: 'cart.js', to: 'cart.js', valid: false })
  })
})
