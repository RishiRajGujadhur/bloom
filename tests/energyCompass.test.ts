import { energyAction } from '../src/features/innovation/EnergyCompass'

describe('energy compass', () => {
  it('provides a fitting action at each energy range', () => {
    expect(energyAction(0).title).toBe('Recover first')
    expect(energyAction(25).title).toBe('Recover first')
    expect(energyAction(50).title).toBe('Start small')
    expect(energyAction(75).title).toBe('Find your flow')
    expect(energyAction(100).title).toBe('Use the momentum')
  })
})
