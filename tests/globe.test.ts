import world from 'world-atlas/countries-110m.json'
import { countries, question } from '../src/features/globe/globeModel'

test('every quiz country is on the map', () => {
  const names = new Set((world as unknown as { objects: { countries: { geometries: { properties: { name: string } }[] } } }).objects.countries.geometries.map((g) => g.properties.name))
  for (const c of countries) expect(names.has(c.atlas)).toBe(true)
})
test('capital questions include the answer', () => {
  const q = question('capital', 'Europe', 's')
  expect(q.options).toContain(q.country.capital)
  expect(q.country.continent).toMatch(/Europe/)
})
