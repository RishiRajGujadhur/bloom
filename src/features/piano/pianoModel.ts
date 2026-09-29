import { Chord, Interval, Note } from 'tonal'
import seedrandom from 'seedrandom'

/**
 * Piano & Ear Trainer model — two octaves (C3–B4), computer-keyboard mapping,
 * simple songs, intervals with song mnemonics, and chord qualities (tonal).
 */
export const keys: string[] = Array.from({ length: 24 }, (_, i) => Note.fromMidi(48 + i)) // C3 … B4
export const isBlack = (n: string) => Note.get(n).acc !== ''
/** Computer keys: bottom rows play C3–B3, top rows C4–B4. */
const lower = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm']
const upper = ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u']
export const keyFor: Record<string, string> = {}
export const noteForKey: Record<string, string> = {}
keys.forEach((n, i) => {
  const k = i < 12 ? lower[i] : upper[i - 12]
  keyFor[n] = k
  noteForKey[k] = n
})
/** Sharps are written as flats by fromMidi; normalise any spelling to the key list. */
export const norm = (n: string) => Note.fromMidi(Note.midi(n) ?? 60)

export const songs: { id: string; title: string; notes: string[] }[] = [
  { id: 'twinkle', title: 'Twinkle, Twinkle', notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'] },
  { id: 'ode', title: 'Ode to Joy', notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'] },
  { id: 'birthday', title: 'Happy Birthday', notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4'] },
  { id: 'elise', title: 'Für Elise (opening)', notes: ['E4', 'Eb4', 'E4', 'Eb4', 'E4', 'B3', 'D4', 'C4', 'A3'] },
  { id: 'mary', title: 'Mary Had a Little Lamb', notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4'] },
]

export const intervals: { semis: number; name: string; song: string }[] = [
  { semis: 1, name: 'minor 2nd', song: 'Jaws' },
  { semis: 2, name: 'major 2nd', song: 'Happy Birthday' },
  { semis: 3, name: 'minor 3rd', song: 'Greensleeves' },
  { semis: 4, name: 'major 3rd', song: 'When the Saints' },
  { semis: 5, name: 'perfect 4th', song: 'Here Comes the Bride' },
  { semis: 7, name: 'perfect 5th', song: 'Star Wars' },
  { semis: 9, name: 'major 6th', song: 'My Bonnie' },
  { semis: 12, name: 'octave', song: 'Somewhere Over the Rainbow' },
]
export const chordTypes = [
  { type: 'M', name: 'major', mood: 'bright, happy' },
  { type: 'm', name: 'minor', mood: 'sad, gentle' },
  { type: 'dim', name: 'diminished', mood: 'tense, spooky' },
  { type: 'aug', name: 'augmented', mood: 'dreamy, unresolved' },
  { type: '7', name: 'dominant 7th', mood: 'bluesy, wants to move' },
  { type: 'maj7', name: 'major 7th', mood: 'jazzy, soft' },
]

export type EarQ = { kind: 'interval' | 'chord'; notes: string[]; answer: string; options: string[]; hint: string }
export function earQuestion(kind: 'interval' | 'chord', seed = String(Date.now())): EarQ {
  const rng = seedrandom(seed)
  if (kind === 'interval') {
    const iv = intervals[Math.floor(rng() * intervals.length)]
    const root = 48 + Math.floor(rng() * 10)
    const notes = [Note.fromMidi(root), Note.fromMidi(root + iv.semis)]
    const others = intervals.filter((x) => x !== iv).sort(() => rng() - 0.5).slice(0, 3)
    return { kind, notes, answer: iv.name, options: [iv, ...others].sort(() => rng() - 0.5).map((x) => x.name), hint: `Think of “${iv.song}” (${Interval.fromSemitones(iv.semis)}).` }
  }
  const c = chordTypes[Math.floor(rng() * chordTypes.length)]
  const root = ['C4', 'D4', 'F3', 'G3', 'A3'][Math.floor(rng() * 5)]
  const notes = Chord.getChord(c.type, root).notes.map(norm).filter((n) => keys.includes(n))
  const others = chordTypes.filter((x) => x !== c).sort(() => rng() - 0.5).slice(0, 3)
  return { kind, notes, answer: c.name, options: [c, ...others].sort(() => rng() - 0.5).map((x) => x.name), hint: `It sounds ${c.mood}.` }
}

/* ---------- Audio (Tone.js, loaded on first use) ---------- */
type Synth = { triggerAttackRelease: (n: string | string[], d: string | number, t?: number) => void }
let synth: Synth | null = null
let toneNow: (() => number) | null = null
export async function audio() {
  if (synth) return synth
  const Tone = await import('tone')
  await Tone.start()
  const reverb = new Tone.Reverb({ decay: 2.4, wet: 0.25 }).toDestination()
  const s = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'triangle' }, envelope: { attack: 0.005, decay: 0.3, sustain: 0.25, release: 1.2 }, volume: -8 }).connect(reverb)
  synth = s as unknown as Synth
  toneNow = () => Tone.now()
  return synth
}
export async function play(notes: string | string[], dur: number | string = '8n') {
  const s = await audio()
  s.triggerAttackRelease(notes, dur)
}
export async function playSeq(notes: string[], gap = 0.55) {
  const s = await audio()
  const t0 = toneNow!()
  notes.forEach((n, i) => s.triggerAttackRelease(n, 0.45, t0 + i * gap))
}
