import { scoreTap } from '../src/features/sounds/rhythmModel'

describe('rhythm tap timing', () => {
  it('scores an exact beat at full accuracy', () => {
    expect(scoreTap(1500, 1000, 120)).toEqual({ offsetMs: 0, accuracy: 100, hint: 'On beat' })
  })

  it('explains early and late taps against the nearest beat', () => {
    expect(scoreTap(1380, 1000, 120).hint).toBe('A little early')
    expect(scoreTap(1620, 1000, 120).hint).toBe('A little late')
    expect(scoreTap(1380, 1000, 120).accuracy).toBe(52)
  })

  it('never reports an accuracy outside zero to 100', () => {
    expect(scoreTap(1250, 1000, 120).accuracy).toBe(0)
    expect(scoreTap(1000, 1000, 120).accuracy).toBe(100)
  })
})
