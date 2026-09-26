import { byId, filterLibrary, library, programExercises, programMinutes, programs } from '../src/features/exercise/moves'

test('new small-joint moves come standing and seated', () => {
  for (const id of ['neck-nod', 'jaw-open', 'shoulder-roll', 'arm-circles', 'fist-spread', 'finger-taps']) {
    expect(byId(id)?.position).toBe('standing')
    expect(byId(`${id}-seated`)?.wheelchair).toBe(true)
  }
  expect(new Set(library.map((e) => e.id)).size).toBe(library.length)
  expect(library.every((e) => e.area && e.position)).toBe(true)
})

test('filters by area and position', () => {
  const hands = filterLibrary(library, { area: 'hands', position: 'seated' })
  expect(hands.length).toBeGreaterThan(2)
  expect(hands.every((e) => e.area === 'hands' && e.position === 'seated')).toBe(true)
})

test('goal programs resolve to real exercises', () => {
  for (const p of programs) {
    expect(programExercises(p).length).toBe(p.ids.length)
    expect(programMinutes(p)).toBeGreaterThan(0)
  }
  const seated = programs.find((p) => p.id === 'desk')!
  expect(programExercises(seated, true).every((e) => e.position === 'seated')).toBe(true)
})
