import { techniqueFor } from '../src/features/diet/cookingTechniques'

test('selects a technique for common recipe wording and accented sauté', () => {
  expect(techniqueFor('Chop the carrots')?.id).toBe('chop')
  expect(techniqueFor('Simmer until tender')?.id).toBe('simmer')
  expect(techniqueFor('Sauté the onions')?.id).toBe('saute')
  expect(techniqueFor('Bake for 20 minutes')?.id).toBe('bake')
  expect(techniqueFor('Whisk the eggs')?.id).toBe('mix')
  expect(techniqueFor('Rinse the apples')?.id).toBe('wash')
  expect(techniqueFor('Season to taste')).toBeNull()
})
