import { beltFor, formTechniques, forms, randomCombo, techniques } from '../src/features/dojo/dojoMoves'

test('techniques cover every style and come seated too', () => {
  expect(new Set(techniques.map((t) => t.id)).size).toBe(techniques.length)
  for (const s of ['karate', 'kungfu', 'taekwondo', 'boxing', 'muaythai'])
    expect(techniques.some((t) => t.style.includes(s as never))).toBe(true)
  expect(techniques.filter((t) => t.wheelchair).length).toBeGreaterThan(8)
})

test('forms resolve, belts progress, combos respect seated mode', () => {
  for (const f of forms) expect(formTechniques(f).length).toBe(f.ids.length)
  expect(beltFor(0).belt.id).toBe('white')
  expect(beltFor(650).belt.id).toBe('green')
  expect(beltFor(5000).next).toBeUndefined()
  const combo = randomCombo(['boxing'], 4, true, () => 0.3)
  expect(combo).toHaveLength(4)
  expect(combo.every((t) => t.position === 'seated' && t.kind !== 'stance')).toBe(true)
})
