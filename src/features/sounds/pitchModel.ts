export type PitchAnswer = 'higher' | 'lower'
export type PitchRound = { firstMidi: number; secondMidi: number; answer: PitchAnswer; semitones: number }

export function midiFrequency(note: number): number {
  return 440 * 2 ** ((note - 69) / 12)
}

export function midiName(note: number): string {
  const names = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B']
  return `${names[((note % 12) + 12) % 12]}${Math.floor(note / 12) - 1}`
}

export function makePitchRound(level: 'gentle' | 'close', random = Math.random): PitchRound {
  const firstMidi = 57 + Math.floor(random() * 13)
  const semitones = level === 'gentle' ? 4 + Math.floor(random() * 4) : 1 + Math.floor(random() * 3)
  const answer = random() < .5 ? 'higher' : 'lower'
  return { firstMidi, secondMidi: firstMidi + (answer === 'higher' ? semitones : -semitones), answer, semitones }
}
