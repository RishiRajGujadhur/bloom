export type CookingTechnique = {
  id: 'chop' | 'simmer' | 'saute' | 'bake' | 'mix' | 'wash'
  label: string
  guidance: string
  cue: string
}

const techniques: Array<CookingTechnique & { pattern: RegExp }> = [
  { id: 'chop', label: 'Knife skills', guidance: 'Use a stable cutting board. Curl fingertips away from the blade and cut slowly.', cue: 'A steady board and tucked fingers help each cut feel controlled.', pattern: /\b(chop|chopped|chopping|dice|diced|dicing|slice|sliced|slicing|mince|minced|mincing|cut|cutting)\b/i },
  { id: 'simmer', label: 'Gentle simmer', guidance: 'Look for small, steady bubbles. Lower the heat if the surface starts rolling hard.', cue: 'Small bubbles mean gentle heat.', pattern: /\b(simmer|simmered|simmering|boil|boiled|boiling|poach|poached|poaching)\b/i },
  { id: 'saute', label: 'Pan cooking', guidance: 'Warm the pan, then move the food so it cooks evenly. Keep the handle turned inward.', cue: 'Give ingredients room to move.', pattern: /\b(saute|sauteed|sauteing|fry|fried|frying|stir-fry|sear|seared|searing)\b/i },
  { id: 'bake', label: 'Oven care', guidance: 'Preheat before adding food. Use oven mitts when moving a hot tray.', cue: 'A ready oven and protected hands make the step easier.', pattern: /\b(bake|baked|baking|roast|roasted|roasting|oven)\b/i },
  { id: 'mix', label: 'Even mixing', guidance: 'Start gently, scrape the sides of the bowl, and stop when the mixture looks even.', cue: 'A few steady circles beat rushing.', pattern: /\b(mix|mixed|mixing|whisk|whisked|whisking|stir|stirred|stirring|fold|folded|folding)\b/i },
  { id: 'wash', label: 'Produce prep', guidance: 'Rinse produce under running water before preparing it.', cue: 'Start with clean ingredients and tools.', pattern: /\b(wash|washed|washing|rinse|rinsed|rinsing)\b/i },
]

export function techniqueFor(step: string): CookingTechnique | null {
  const plain = step.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const found = techniques.find(({ pattern }) => pattern.test(plain))
  if (!found) return null
  const { id, label, guidance, cue } = found
  return { id, label, guidance, cue }
}
