import { Note } from 'tonal'

/** Frequency → nearest note and cents off (A4 = 440 Hz). */
export function readPitch(freq: number) {
  const midi = 69 + 12 * Math.log2(freq / 440)
  const nearest = Math.round(midi)
  return { note: Note.fromMidiSharps(nearest), cents: Math.round((midi - nearest) * 100), freq }
}
