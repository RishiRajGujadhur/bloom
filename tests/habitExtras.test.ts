import { move, ordered, strength } from '../src/features/habits/habitExtras'

describe('habit extras', () => {
  it('orders and moves', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
    expect(ordered(items, ['c', 'a']).map((x) => x.id)).toEqual(['c', 'a', 'b'])
    expect(move(['a', 'b', 'c'], 'b', -1)).toEqual(['b', 'a', 'c'])
    expect(move(['a', 'b'], 'a', -1)).toEqual(['a', 'b'])
  })
  it('scores strength', () => {
    expect(strength([], '2026-09-30')).toBe(0)
    const all = Array.from({ length: 60 }, (_, i) => new Date(Date.UTC(2026, 8, 30 - i, 12)).toISOString().slice(0, 10))
    expect(strength(all, '2026-09-30')).toBe(100)
    expect(strength(all.slice(1), '2026-09-30')).toBeLessThan(100)
  })
})
