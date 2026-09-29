import nlp from 'compromise'
import seedrandom from 'seedrandom'

/**
 * Speed Reader model — RSVP tokens with the optimal recognition point (ORP),
 * pacing (longer pauses at punctuation and long words), and comprehension
 * questions generated from the nouns in the text (compromise).
 */
export const texts = [
  { id: 'octopus', title: 'The clever octopus', body: 'An octopus has three hearts and blue blood. Two hearts move blood through the gills, while the third pumps it around the body. Most of its neurons live in its arms, so each arm can taste, touch and even solve small problems on its own. Octopuses change colour in a fraction of a second using special skin cells, and some species copy the shape of other animals to fool predators. In aquariums they are famous escape artists, squeezing through gaps no wider than a coin. Scientists study them to understand how intelligence can grow along a completely different path from ours.' },
  { id: 'sleep', title: 'Why we sleep', body: 'Sleep is not simply rest. During deep sleep the brain clears away waste that builds up while we are awake, and it sorts the memories of the day, keeping what matters. Dreaming sleep helps us process emotions and connect ideas in new ways. Adults who regularly sleep less than seven hours tend to have weaker immune systems and find it harder to concentrate. A steady bedtime, a cool dark room and morning daylight are three of the simplest ways to improve sleep. Even a short afternoon nap of twenty minutes can sharpen attention without leaving you groggy.' },
  { id: 'bridges', title: 'How bridges stand up', body: 'Every bridge is a conversation between two forces: compression, which squeezes, and tension, which pulls. Stone arches work because their curved shape turns the weight above into compression, which stone handles very well. Suspension bridges hang their deck from steel cables in tension, carrying the load to tall towers and deep anchors in the ground. Engineers also worry about wind and footsteps, because regular rhythms can make a structure sway. When the Millennium Bridge in London opened, walkers fell into step with its gentle wobble, and dampers had to be added to calm it.' },
]

export type Token = { word: string; orp: number; delay: number }
/** Split into words with their focal letter and a pacing multiplier. */
export function tokenize(text: string): Token[] {
  return text.split(/\s+/).filter(Boolean).map((word) => {
    const core = word.replace(/[^\p{L}\p{N}'’-]/gu, '')
    const n = core.length
    const orp = n <= 1 ? 0 : n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : 4
    let delay = 1
    if (/[.!?]["”’)]?$/.test(word)) delay = 2.2
    else if (/[,;:—–]$/.test(word)) delay = 1.5
    if (n > 8) delay += 0.3
    return { word, orp: word.indexOf(core[0] ?? word[0]) + orp, delay }
  })
}
/** Milliseconds for a token at a given WPM. */
export const msFor = (t: Token, wpm: number) => (60000 / wpm) * t.delay

export type Q = { q: string; options: string[]; answer: string }
/** “Which word appeared?” questions from the text's nouns, with decoys. */
export function questions(text: string, n = 3, seed = 'r'): Q[] {
  const rng = seedrandom(seed)
  // Real nouns only: compromise counts pronouns (“them”, “it”) as nouns too.
  const nouns = [...new Set((nlp(text).match('#Noun').not('#Pronoun').out('array') as string[]).map((w) => w.toLowerCase().replace(/[^a-z ]/g, '').trim()).filter((w) => w.length > 3 && !w.includes(' ')))]
  const decoys = ['volcano', 'orchestra', 'glacier', 'library', 'telescope', 'desert', 'lantern', 'harbour', 'meadow', 'rocket', 'violin', 'canyon', 'pyramid', 'carousel']
  const pool = decoys.filter((d) => !text.toLowerCase().includes(d))
  const out: Q[] = []
  const shuffled = [...nouns].sort(() => rng() - 0.5)
  for (let i = 0; i < Math.min(n, shuffled.length); i++) {
    const answer = shuffled[i]
    const opts = [answer, ...pool.sort(() => rng() - 0.5).slice(0, 3)].sort(() => rng() - 0.5)
    out.push({ q: 'Which of these words was in the text?', options: opts, answer })
  }
  return out
}
