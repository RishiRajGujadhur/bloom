import { distance } from 'fastest-levenshtein'

/**
 * Sign Alphabet model — ten ASL fingerspelling letters that can be told apart
 * from which fingers are extended (MediaPipe hand landmarks), their finger
 * poses for the SVG hand guide, practice words, and scoring.
 */
export type Pt = { x: number; y: number; z?: number }
/** [thumb, index, middle, ring, pinky] extended, plus whether index/middle are spread. */
export type Pose = { fingers: [boolean, boolean, boolean, boolean, boolean]; spread?: boolean; tip: string }
export const letters: Record<string, Pose> = {
  A: { fingers: [true, false, false, false, false], tip: 'Make a fist with your thumb resting against the side of your index finger.' },
  B: { fingers: [false, true, true, true, true], tip: 'Flat hand, fingers together, thumb folded across your palm.' },
  D: { fingers: [false, true, false, false, false], tip: 'Point your index finger up; the other fingers touch your thumb in a circle.' },
  F: { fingers: [false, false, true, true, true], tip: 'Touch your index finger to your thumb (an “OK”), other fingers up.' },
  I: { fingers: [false, false, false, false, true], tip: 'Make a fist and raise only your little finger.' },
  L: { fingers: [true, true, false, false, false], tip: 'Index up and thumb out — an L shape.' },
  U: { fingers: [false, true, true, false, false], spread: false, tip: 'Index and middle fingers up and pressed together.' },
  V: { fingers: [false, true, true, false, false], spread: true, tip: 'Index and middle fingers up and apart — a peace sign.' },
  W: { fingers: [false, true, true, true, false], tip: 'Index, middle and ring fingers up and spread.' },
  Y: { fingers: [true, false, false, false, true], tip: 'Thumb and little finger out, the others curled — “hang loose”.' },
}
export const alphabet = Object.keys(letters)
export const words = ['BUY', 'FLY', 'BAD', 'WILD', 'DAY', 'IVY', 'BUD', 'DULL', 'WAVY', 'LADY', 'BABY', 'FULL', 'WALL', 'LAW', 'AVID']

const d = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y)
/** Which fingers are extended, from the 21 MediaPipe hand landmarks. */
export function fingerStates(lm: Pt[]) {
  const palm = d(lm[0], lm[9])
  const ext = (tip: number, pip: number) => d(lm[0], lm[tip]) > d(lm[0], lm[pip]) * 1.12
  const thumb = d(lm[4], lm[9]) > palm * 0.78 && d(lm[4], lm[5]) > palm * 0.42
  const fingers: Pose['fingers'] = [thumb, ext(8, 6), ext(12, 10), ext(16, 14), ext(20, 18)]
  const spread = d(lm[8], lm[12]) > palm * 0.34
  return { fingers, spread }
}
/** Best-matching letter for a hand, or null. */
export function classify(lm: Pt[]): string | null {
  if (lm.length < 21) return null
  const { fingers, spread } = fingerStates(lm)
  const key = fingers.map(Number).join('')
  for (const [l, p] of Object.entries(letters)) {
    if (p.fingers.map(Number).join('') !== key) continue
    if (p.spread !== undefined && p.spread !== spread) continue
    return l
  }
  return null
}
/** Letters right, via Levenshtein distance between what you signed and the word. */
export function score(signed: string, word: string) {
  const dist = distance(signed, word)
  return { dist, right: Math.max(0, word.length - dist), total: word.length }
}
