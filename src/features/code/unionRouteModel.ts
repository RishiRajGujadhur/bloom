export type UnionRoute = {
  id: string
  title: string
  story: string
  candidates: string[]
  required: string[]
  examples: { value: string; accepted: boolean }[]
  explanation: string
}

export const UNION_ROUTES: UnionRoute[] = [
  { id: 'ticket', title: 'Ticket lookup', story: 'A guest can find a seat with a printed number or a name. A yes/no flag must never open the gate.', candidates: ['string', 'number', 'boolean'], required: ['string', 'number'], examples: [{ value: '"Mira"', accepted: true }, { value: '42', accepted: true }, { value: 'true', accepted: false }], explanation: 'string | number admits both identifiers while excluding boolean.' },
  { id: 'weather', title: 'Weather reading', story: 'The sensor sends a numeric temperature, or null when it has no reading. A text error belongs elsewhere.', candidates: ['number', 'null', 'string'], required: ['number', 'null'], examples: [{ value: '23', accepted: true }, { value: 'null', accepted: true }, { value: '"offline"', accepted: false }], explanation: 'number | null models a reading that can be missing without pretending null is a number.' },
  { id: 'scene', title: 'Scene status', story: 'The story engine knows exactly three scenes. Any other text is an invalid status.', candidates: ['"idle"', '"loading"', '"done"', 'string'], required: ['"idle"', '"loading"', '"done"'], examples: [{ value: '"idle"', accepted: true }, { value: '"done"', accepted: true }, { value: '"broken"', accepted: false }], explanation: 'A union of string literals keeps the allowed states precise. Adding string would admit every word.' },
  { id: 'palette', title: 'Palette switch', story: 'A theme can be the named light or dark mode, or a custom numeric palette ID. Other names should fail.', candidates: ['"light"', '"dark"', 'number', 'string'], required: ['"light"', '"dark"', 'number'], examples: [{ value: '"light"', accepted: true }, { value: '7', accepted: true }, { value: '"neon"', accepted: false }], explanation: 'Literal members describe the named modes; number covers custom IDs. Broad string would allow neon too.' },
]

export function checkUnionRoute(route: UnionRoute, selected: string[]) {
  const missing = route.required.filter((part) => !selected.includes(part))
  const extra = selected.filter((part) => !route.required.includes(part))
  if (!missing.length && !extra.length) return { pass: true, feedback: `Route open. ${route.explanation}` }
  if (!selected.length) return { pass: false, feedback: 'Select the types that should travel through this route.' }
  if (extra.length) return { pass: false, feedback: `${extra.join(' | ')} lets an unwanted value through. Remove the overly broad member.` }
  return { pass: false, feedback: `The route still rejects a valid value. Add ${missing.join(' | ')}.` }
}

export function acceptsExample(route: UnionRoute, selected: string[], value: string) {
  if (selected.includes('string') && /^"/.test(value)) return true
  if (selected.includes('number') && /^-?\d/.test(value)) return true
  if (selected.includes('null') && value === 'null') return true
  if (selected.includes('boolean') && /^(true|false)$/.test(value)) return true
  return route.candidates.some((part) => part === value && selected.includes(part))
}
