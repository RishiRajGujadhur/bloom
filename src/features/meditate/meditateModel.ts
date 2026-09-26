/**
 * Guided meditations as timed scripts. Each line is spoken (Web Speech) and
 * captioned at `at` seconds, scaled to the chosen length; silence fills the
 * rest so you have room to practise.
 */
export type Line = { at: number; text: string }
export type Session = { id: string; title: string; kind: 'breath' | 'body' | 'kindness' | 'sos' | 'sleep' | 'focus'; minutes: number; scene: SceneId; script: Line[] }
export type SceneId = 'stars' | 'fireflies' | 'snow' | 'bubbles'
export type Course = { id: string; title: string; emoji: string; blurb: string; sessions: string[] }

const s = (at: number, text: string): Line => ({ at, text })

export const sessions: Session[] = [
  {
    id: 'breath1', title: 'Arriving', kind: 'breath', minutes: 5, scene: 'stars',
    script: [s(0, 'Welcome. Find a comfortable position and let your eyes close, or rest your gaze softly.'), s(0.12, 'Notice the breath, just as it is. No need to change it.'), s(0.3, 'Feel the air cool as it enters, warm as it leaves.'), s(0.5, 'When the mind wanders, and it will, gently return to the next breath.'), s(0.75, 'Rest here. Breathing in. Breathing out.'), s(0.94, 'Slowly let the world back in. Well done.')],
  },
  {
    id: 'breath2', title: 'Counting breaths', kind: 'breath', minutes: 8, scene: 'stars',
    script: [s(0, 'Settle in and take three deeper breaths.'), s(0.1, 'Now count each out-breath, one to ten, then begin again.'), s(0.35, 'If you lose count, simply start at one. That is the practice.'), s(0.65, 'Let the counting soften. Just breathe.'), s(0.93, 'Open your eyes when you are ready.')],
  },
  {
    id: 'body', title: 'Body scan', kind: 'body', minutes: 10, scene: 'fireflies',
    script: [s(0, 'Lie or sit comfortably. We will move attention slowly through the body.'), s(0.08, 'Start at the top of your head. Notice any sensation, or none.'), s(0.2, 'Soften the forehead, the jaw, the tongue.'), s(0.32, 'Move down to the shoulders. Let them drop.'), s(0.44, 'Feel your arms, your hands, your fingertips.'), s(0.56, 'Notice the chest rise and fall, the belly soften.'), s(0.68, 'Down through the hips, the legs, the knees.'), s(0.8, 'Feel your feet. Grounded, heavy, supported.'), s(0.9, 'Now sense the whole body at once, breathing.'), s(0.96, 'Gently return. Wiggle your fingers and toes.')],
  },
  {
    id: 'kindness', title: 'Loving-kindness', kind: 'kindness', minutes: 10, scene: 'bubbles',
    script: [s(0, 'Bring to mind someone who makes you smile.'), s(0.1, 'Silently offer: may you be happy. May you be well. May you be at ease.'), s(0.3, 'Now turn these wishes toward yourself. May I be happy. May I be well.'), s(0.5, 'Think of someone neutral, a stranger you passed today. May you be happy.'), s(0.7, 'If you can, include someone difficult. May you be at ease.'), s(0.85, 'Finally, all beings everywhere. May all beings be well.'), s(0.96, 'Rest in this warmth for a moment.')],
  },
  {
    id: 'sos', title: 'SOS: calm now', kind: 'sos', minutes: 3, scene: 'bubbles',
    script: [s(0, 'You are safe right now. Let’s slow things down together.'), s(0.08, 'Breathe in for four. Hold for four. Out for six.'), s(0.3, 'Name five things you can see.'), s(0.45, 'Four things you can feel against your skin.'), s(0.6, 'Three things you can hear.'), s(0.75, 'Keep breathing slowly. This feeling will pass.'), s(0.93, 'You did it. Take your time.')],
  },
  {
    id: 'sleep', title: 'Drifting off', kind: 'sleep', minutes: 15, scene: 'snow',
    script: [s(0, 'Get comfortable in bed. There is nothing left to do today.'), s(0.1, 'Let your breath become slow and heavy.'), s(0.25, 'Imagine soft snow falling, each flake a thought settling.'), s(0.45, 'Your body is heavy, sinking into the mattress.'), s(0.7, 'Let go.'), s(0.9, 'Sleep well.')],
  },
  {
    id: 'focus', title: 'Before deep work', kind: 'focus', minutes: 5, scene: 'stars',
    script: [s(0, 'Sit upright, alert and relaxed.'), s(0.15, 'Choose the one thing you will work on next.'), s(0.35, 'Picture yourself starting it, calm and absorbed.'), s(0.6, 'Breathe in energy. Breathe out distraction.'), s(0.9, 'Begin.')],
  },
]
export const sessionById = (id: string) => sessions.find((x) => x.id === id)!

export const courses: Course[] = [
  { id: 'basics', title: 'Basics', emoji: '🌱', blurb: 'Learn to sit with your breath.', sessions: ['breath1', 'breath2', 'body'] },
  { id: 'kind', title: 'Kindness', emoji: '💗', blurb: 'Soften toward yourself and others.', sessions: ['breath1', 'kindness'] },
  { id: 'rest', title: 'Better sleep', emoji: '🌙', blurb: 'Unwind body and mind.', sessions: ['body', 'sleep'] },
  { id: 'work', title: 'Calm focus', emoji: '🎯', blurb: 'Arrive clear before work.', sessions: ['focus', 'breath2'] },
]

/** Script lines placed in seconds for a chosen length. */
export const timed = (x: Session, minutes: number) => x.script.map((l) => ({ at: Math.round(l.at * minutes * 60), text: l.text }))
export const currentLine = (lines: Line[], t: number) => [...lines].reverse().find((l) => t >= l.at) ?? null

/** Seconds of the interval bells for unguided sits. */
export const bells = (minutes: number, every: number) => (every <= 0 ? [] : Array.from({ length: Math.floor((minutes - 0.01) / every) }, (_, i) => (i + 1) * every * 60))

export type MedLog = { at: number; id: string; minutes: number; before?: number; after?: number }
export const MED_KEY = 'bloom-meditate-v1'

export function streakDays(logs: MedLog[], now = Date.now()) {
  const days = new Set(logs.map((l) => new Date(l.at).toDateString()))
  let n = 0
  const d = new Date(now)
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.has(d.toDateString())) {
    n++
    d.setDate(d.getDate() - 1)
  }
  return n
}
