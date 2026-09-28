import { makePitchRound, midiFrequency, midiName } from '../src/features/sounds/pitchModel'

describe('pitch practice model', () => {
  it('maps A4 to 440 Hz and names notes', () => {
    expect(midiFrequency(69)).toBe(440)
    expect(midiName(60)).toBe('C4')
    expect(midiName(63)).toBe('E♭4')
  })

  it('generates a gentle upward comparison', () => {
    const picks = [0, 0, 0]
    const round = makePitchRound('gentle', () => picks.shift() ?? 0)
    expect(round).toEqual({ firstMidi: 57, secondMidi: 61, answer: 'higher', semitones: 4 })
  })

  it('generates close downward comparisons', () => {
    const picks = [.5, .99, .99]
    const round = makePitchRound('close', () => picks.shift() ?? 0)
    expect(round.answer).toBe('lower')
    expect(round.semitones).toBe(3)
    expect(round.secondMidi).toBe(round.firstMidi - 3)
  })
})
