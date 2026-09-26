import type { Exercise, Pose } from '../exercise/exercises'

/**
 * Dojo: martial-arts techniques drawn with the exercise figure (side view,
 * facing right; L is the lead side). Each technique goes from a guard or
 * chamber (A) to the strike, block or stance (B). Every technique that works
 * from a chair also has a seated version.
 */
export type Style = 'karate' | 'kungfu' | 'taekwondo' | 'boxing' | 'muaythai'
export type Kind = 'stance' | 'strike' | 'block' | 'kick' | 'footwork'
export type Technique = Exercise & { style: Style[]; kind: Kind; call: string }

export const styleNames: Record<Style, string> = { karate: 'Karate', kungfu: 'Kung fu', taekwondo: 'Taekwondo', boxing: 'Boxing', muaythai: 'Muay Thai' }
export const kindNames: Record<Kind, string> = { stance: 'Stances', strike: 'Strikes', block: 'Blocks', kick: 'Kicks', footwork: 'Footwork' }

const guard: Pose = { shL: -60, elL: -110, shR: -30, elR: -130, wrL: -40, wrR: -40 }
const chamber: Pose = { shL: -20, elL: -120, shR: -20, elR: -120, wrL: -40, wrR: -40 }
const front: Pose = { drop: 12, hipL: -40, knL: 40, hipR: 28, knR: 6 }
const horse: Pose = { drop: 26, shift: -8, hipL: -62, knL: 72, hipR: -62, knR: 72 }
const sitting: Pose = { hipL: -90, knL: 90, hipR: -90, knR: 90 }

type Def = Omit<Technique, 'level' | 'equipment' | 'secondary' | 'mistakes' | 'cues'> & { cue: string; mistake: string; level?: Exercise['level']; seated?: boolean }

const defs: Def[] = [
  // Stances
  { id: 'horse-stance', name: 'Horse stance (kiba-dachi / ma bu)', emoji: '🐎', style: ['karate', 'kungfu'], kind: 'stance', call: 'Horse stance', primary: ['quads', 'glutes'], a: { ...chamber }, b: { ...horse, ...chamber }, tempo: [2, 20, 2], hold: true, cue: 'Feet wide, knees out over toes, back straight, fists chambered at the hips.', mistake: 'Knees caving inward' },
  { id: 'front-stance', name: 'Front stance (zenkutsu-dachi)', emoji: '🦶', style: ['karate', 'taekwondo'], kind: 'stance', call: 'Front stance', primary: ['quads', 'glutes'], a: { ...chamber }, b: { ...front, ...chamber }, tempo: [1.5, 3, 1.5], cue: 'Long step, front knee over the foot, back leg straight, hips square.', mistake: 'Front knee past the toes' },
  { id: 'bow-stance', name: 'Bow stance (gong bu)', emoji: '🏹', style: ['kungfu'], kind: 'stance', call: 'Bow stance', primary: ['quads', 'glutes'], a: { ...chamber }, b: { drop: 18, hipL: -60, knL: 62, hipR: 34, knR: 4, shL: -85, elL: -10, wrL: 50, shR: -20, elR: -120, wrR: -40 }, tempo: [1.5, 3, 1.5], cue: 'Sink low, back heel down, push the palm forward.', mistake: 'Lifting the back heel' },
  { id: 'cat-stance', name: 'Cat stance (neko-ashi-dachi)', emoji: '🐈', style: ['karate', 'kungfu'], kind: 'stance', call: 'Cat stance', primary: ['quads', 'calves'], a: {}, b: { drop: 16, hipL: -22, knL: 36, hipR: -42, knR: 64, ...guard }, tempo: [1.5, 4, 1.5], cue: 'Weight on the back leg, front foot light on the ball.', mistake: 'Weight drifting forward' },
  { id: 'crane-stance', name: 'Crane stance', emoji: '🦩', style: ['kungfu', 'karate'], kind: 'stance', call: 'Crane', primary: ['quads', 'abs'], a: {}, b: { hipL: -85, knL: 110, shL: -150, elL: -20, wrL: 50, shR: -150, elR: -20, wrR: 50 }, tempo: [2, 10, 2], hold: true, level: 'intermediate', cue: 'Knee high, arms up like wings, stand tall on one leg.', mistake: 'Leaning back to balance' },
  { id: 'fighting-stance', name: 'Fighting stance & guard', emoji: '🛡️', style: ['boxing', 'muaythai', 'taekwondo'], kind: 'stance', call: 'Guard up', primary: ['shoulders', 'calves'], a: {}, b: { drop: 6, hipL: -18, knL: 14, hipR: 16, knR: 14, ...guard, neck: 8 }, tempo: [1, 3, 1], cue: 'Chin down, hands by the cheeks, elbows in, knees soft.', mistake: 'Dropping the rear hand' },
  // Strikes
  { id: 'reverse-punch', name: 'Reverse punch (gyaku-zuki)', emoji: '👊', style: ['karate'], kind: 'strike', call: 'Reverse punch', primary: ['chest', 'triceps', 'obliques'], a: { ...front, ...chamber }, b: { ...front, shL: -20, elL: -120, shR: -90, elR: 0, wrL: -40, wrR: -50, torso: 6 }, tempo: [0.3, 0.2, 0.6], seated: true, cue: 'Drive from the back hip, twist the fist over at the end, pull the other hand back.', mistake: 'Punching with the shoulder only' },
  { id: 'jab', name: 'Jab', emoji: '🥊', style: ['boxing', 'muaythai'], kind: 'strike', call: 'One', primary: ['shoulders', 'triceps'], a: { hipL: -18, knL: 14, hipR: 16, knR: 14, ...guard }, b: { hipL: -22, knL: 16, hipR: 16, knR: 14, ...guard, shL: -90, elL: 0 }, tempo: [0.2, 0.1, 0.3], seated: true, cue: 'Snap the lead hand straight out and straight back to the cheek.', mistake: 'Dropping the hand on the way back' },
  { id: 'cross', name: 'Cross', emoji: '💥', style: ['boxing', 'muaythai'], kind: 'strike', call: 'Two', primary: ['chest', 'triceps', 'obliques'], a: { hipL: -18, knL: 14, hipR: 16, knR: 14, ...guard }, b: { hipL: -24, knL: 20, hipR: 20, knR: 8, ...guard, shR: -92, elR: 0, torso: 10 }, tempo: [0.25, 0.1, 0.35], seated: true, cue: 'Pivot the back foot and turn the hip through.', mistake: 'Leaning past the front knee' },
  { id: 'uppercut', name: 'Uppercut', emoji: '⤴️', style: ['boxing', 'muaythai'], kind: 'strike', call: 'Uppercut', primary: ['biceps', 'shoulders'], a: { drop: 10, ...guard, shR: -10, elR: -90 }, b: { ...guard, shR: -120, elR: -80, torso: -4 }, tempo: [0.3, 0.1, 0.4], seated: true, cue: 'Dip slightly, then drive up from the legs, palm facing you.', mistake: 'Winding the arm back first' },
  { id: 'elbow-strike', name: 'Elbow strike', emoji: '💪', style: ['muaythai', 'karate'], kind: 'strike', call: 'Elbow', primary: ['shoulders', 'obliques'], a: { ...guard }, b: { ...guard, shR: -100, elR: -150, torso: 8 }, tempo: [0.3, 0.1, 0.4], seated: true, cue: 'Short and sharp; the point of the elbow leads.', mistake: 'Swinging wide' },
  { id: 'knife-hand', name: 'Knife-hand strike (shuto)', emoji: '🔪', style: ['karate', 'taekwondo'], kind: 'strike', call: 'Knife hand', primary: ['shoulders', 'forearms'], a: { shR: -160, elR: -110, wrR: 60, shL: -60, elL: -20, wrL: 60 }, b: { shR: -70, elR: -10, wrR: 60, shL: -20, elL: -120, wrL: -40 }, tempo: [0.4, 0.2, 0.6], seated: true, cue: 'Fingers together, strike with the edge of the hand.', mistake: 'Loose, bent fingers' },
  { id: 'palm-strike', name: 'Palm strike', emoji: '🖐️', style: ['kungfu', 'karate'], kind: 'strike', call: 'Palm', primary: ['chest', 'triceps'], a: { ...chamber, wrR: 50 }, b: { shL: -20, elL: -120, wrL: -40, shR: -88, elR: -6, wrR: 60 }, tempo: [0.3, 0.2, 0.5], seated: true, cue: 'Strike with the heel of the palm, fingers pulled back.', mistake: 'Bending the wrist on impact' },
  { id: 'tiger-claw', name: 'Tiger claw', emoji: '🐯', style: ['kungfu'], kind: 'strike', call: 'Tiger', primary: ['forearms', 'shoulders'], a: { ...horse, ...chamber, wrL: 30, wrR: 30 }, b: { ...horse, shL: -95, elL: -30, wrL: 30, shR: -40, elR: -100, wrR: 30 }, tempo: [0.5, 0.3, 0.7], seated: true, cue: 'Fingers curled like claws, rake forward and down.', mistake: 'Flat hands' },
  // Blocks
  { id: 'rising-block', name: 'Rising block (age-uke)', emoji: '⬆️', style: ['karate', 'taekwondo'], kind: 'block', call: 'Rising block', primary: ['shoulders', 'forearms'], a: { ...front, shL: -60, elL: -90 }, b: { ...front, shL: -150, elL: -80, shR: -20, elR: -120 }, tempo: [0.4, 0.3, 0.6], seated: true, cue: 'Forearm sweeps up and stops a fist above the forehead.', mistake: 'Block too low to protect the head' },
  { id: 'down-block', name: 'Downward block (gedan-barai)', emoji: '⬇️', style: ['karate', 'taekwondo'], kind: 'block', call: 'Down block', primary: ['shoulders', 'forearms'], a: { ...front, shL: -140, elL: -130 }, b: { ...front, shL: -30, elL: 0, shR: -20, elR: -120 }, tempo: [0.4, 0.3, 0.6], seated: true, cue: 'Start at the opposite ear, sweep down across the front leg.', mistake: 'Stopping short of the thigh' },
  { id: 'inside-block', name: 'Inside block (uchi-uke)', emoji: '↩️', style: ['karate', 'kungfu'], kind: 'block', call: 'Inside block', primary: ['shoulders', 'biceps'], a: { shL: -30, elL: -20 }, b: { shL: -70, elL: -100, shR: -20, elR: -120 }, tempo: [0.4, 0.3, 0.6], seated: true, cue: 'Elbow bent at 90°, forearm vertical, fist at shoulder height.', mistake: 'Elbow flaring out' },
  { id: 'slip', name: 'Slip & roll', emoji: '🌀', style: ['boxing', 'muaythai'], kind: 'footwork', call: 'Slip', primary: ['obliques', 'quads'], a: { hipL: -18, knL: 14, hipR: 16, knR: 14, ...guard }, b: { drop: 22, torso: 28, hipL: -50, knL: 56, hipR: -10, knR: 56, ...guard }, tempo: [0.4, 0.1, 0.4], seated: true, cue: 'Bend the knees and dip under the punch; eyes up.', mistake: 'Bending only at the waist' },
  { id: 'step-drag', name: 'Step and drag', emoji: '👣', style: ['boxing', 'taekwondo', 'muaythai'], kind: 'footwork', call: 'Step', primary: ['calves', 'quads'], a: { hipL: -18, knL: 14, hipR: 16, knR: 14, ...guard }, b: { shift: 14, hipL: -30, knL: 18, hipR: 24, knR: 10, ...guard }, tempo: [0.3, 0.1, 0.3], cue: 'Front foot steps, back foot follows the same distance.', mistake: 'Feet crossing or coming together' },
  // Kicks
  { id: 'front-kick', name: 'Front kick (mae-geri / ap chagi)', emoji: '🦵', style: ['karate', 'taekwondo', 'kungfu'], kind: 'kick', call: 'Front kick', primary: ['quads', 'abs'], a: { hipL: -90, knL: 110, ...guard }, b: { hipL: -92, knL: 0, ...guard, torso: -8 }, tempo: [0.3, 0.2, 0.5], cue: 'Chamber the knee high, snap the foot out, strike with the ball of the foot.', mistake: 'Kicking without chambering' },
  { id: 'side-kick', name: 'Side kick (yoko-geri / yeop chagi)', emoji: '➡️', style: ['karate', 'taekwondo'], kind: 'kick', call: 'Side kick', primary: ['glutes', 'obliques'], a: { hipL: -85, knL: 120, torso: -12, ...guard }, b: { hipL: -95, knL: 0, torso: -32, ...guard }, tempo: [0.4, 0.2, 0.6], level: 'intermediate', cue: 'Chamber, pivot the standing foot, drive the heel out in a line.', mistake: 'Leaning too far back' },
  { id: 'roundhouse', name: 'Roundhouse kick', emoji: '🔄', style: ['taekwondo', 'muaythai', 'karate'], kind: 'kick', call: 'Roundhouse', primary: ['quads', 'obliques'], a: { hipL: -60, knL: 120, torso: -10, ...guard }, b: { hipL: -80, knL: 10, torso: -24, ...guard, shR: -20, elR: -40 }, tempo: [0.35, 0.2, 0.55], level: 'intermediate', cue: 'Pivot on the standing foot and turn the hip over.', mistake: 'Standing foot stays pointed forward' },
  { id: 'back-kick', name: 'Back kick', emoji: '🐴', style: ['taekwondo', 'karate', 'kungfu'], kind: 'kick', call: 'Back kick', primary: ['glutes', 'hamstrings'], a: { hipR: -40, knR: 110, torso: 20, ...guard }, b: { hipR: 70, knR: 0, torso: 45, ...guard }, tempo: [0.4, 0.2, 0.6], level: 'intermediate', cue: 'Look over your shoulder, drive the heel straight back.', mistake: 'Kicking in an arc' },
  { id: 'knee-strike', name: 'Knee strike', emoji: '🦿', style: ['muaythai'], kind: 'kick', call: 'Knee', primary: ['quads', 'abs'], a: { ...guard, shL: -100, elL: -60, shR: -100, elR: -60 }, b: { hipR: -110, knR: 130, torso: -6, shL: -60, elL: -100, shR: -60, elR: -100 }, tempo: [0.3, 0.2, 0.5], seated: false, cue: 'Pull the hands down as the knee drives up and through.', mistake: 'Leaning back' },
  { id: 'teep', name: 'Push kick (teep)', emoji: '🦶', style: ['muaythai'], kind: 'kick', call: 'Teep', primary: ['quads', 'glutes'], a: { hipL: -85, knL: 105, ...guard }, b: { hipL: -88, knL: 0, torso: -18, ...guard }, tempo: [0.3, 0.2, 0.5], cue: 'Knee up, push through with the heel like opening a door.', mistake: 'Snapping instead of pushing' },
]

export const techniques: Technique[] = defs.flatMap((d) => {
  const { cue, mistake, seated, level, ...rest } = d
  const base: Technique = { ...rest, level: level ?? 'beginner', equipment: 'none', secondary: [], cues: [cue], mistakes: [mistake], area: d.kind === 'kick' || d.kind === 'stance' ? 'legs' : 'arms', position: 'standing' }
  if (!seated) return [base]
  const up = (p: Pose) => ({ ...p, ...sitting, drop: 0, shift: 0 })
  return [
    base,
    {
      ...base,
      id: `${d.id}-seated`,
      name: `${d.name} · seated`,
      wheelchair: true,
      position: 'seated' as const,
      a: up(d.a),
      b: up(d.b),
      cues: [cue, 'Sit tall and brace your core; strike from the trunk, not just the arm.'],
    },
  ]
})
export const techniqueById = (id: string) => techniques.find((t) => t.id === id)

/** Forms and combos: kata-style sequences, each a list of technique ids. */
export type Form = { id: string; name: string; style: Style; emoji: string; about: string; ids: string[] }
export const forms: Form[] = [
  { id: 'basics-karate', name: 'Karate basics line', style: 'karate', emoji: '🥋', about: 'Down block, reverse punch, rising block, reverse punch — the backbone of the first kata.', ids: ['front-stance', 'down-block', 'reverse-punch', 'rising-block', 'reverse-punch', 'inside-block', 'front-kick'] },
  { id: 'five-animals', name: 'Five animals flow', style: 'kungfu', emoji: '🐉', about: 'Tiger, crane and cat — shapes from southern kung fu.', ids: ['horse-stance', 'tiger-claw', 'bow-stance', 'palm-strike', 'crane-stance', 'cat-stance'] },
  { id: 'tkd-kicks', name: 'Kicking ladder', style: 'taekwondo', emoji: '🦵', about: 'Front, roundhouse, side and back kicks from a fighting stance.', ids: ['fighting-stance', 'front-kick', 'roundhouse', 'side-kick', 'back-kick', 'knife-hand'] },
  { id: 'boxing-123', name: '1-2-3 and move', style: 'boxing', emoji: '🥊', about: 'Jab, cross, uppercut, slip and step — classic shadow boxing.', ids: ['fighting-stance', 'jab', 'cross', 'uppercut', 'slip', 'step-drag'] },
  { id: 'muaythai-eight', name: 'Art of eight limbs', style: 'muaythai', emoji: '🇹🇭', about: 'Fists, elbows, knees and shins: jab, cross, elbow, knee, teep, roundhouse.', ids: ['fighting-stance', 'jab', 'cross', 'elbow-strike', 'knee-strike', 'teep', 'roundhouse'] },
  { id: 'seated-dojo', name: 'Seated dojo', style: 'karate', emoji: '♿', about: 'Punches, blocks and strikes from a chair or wheelchair.', ids: ['jab-seated', 'cross-seated', 'rising-block-seated', 'down-block-seated', 'knife-hand-seated', 'palm-strike-seated', 'uppercut-seated', 'elbow-strike-seated'] },
]
export const formTechniques = (f: Form) => f.ids.map(techniqueById).filter((t): t is Technique => !!t)

/** Belts, earned by total techniques practised. */
export const belts = [
  { id: 'white', name: 'White', color: '#f5f5f5', at: 0 },
  { id: 'yellow', name: 'Yellow', color: '#fdd835', at: 100 },
  { id: 'orange', name: 'Orange', color: '#fb8c00', at: 300 },
  { id: 'green', name: 'Green', color: '#43a047', at: 600 },
  { id: 'blue', name: 'Blue', color: '#1e88e5', at: 1000 },
  { id: 'purple', name: 'Purple', color: '#8e24aa', at: 1500 },
  { id: 'brown', name: 'Brown', color: '#6d4c41', at: 2200 },
  { id: 'black', name: 'Black', color: '#212121', at: 3000 },
]
export function beltFor(reps: number) {
  const i = belts.reduce((best, b, idx) => (reps >= b.at ? idx : best), 0)
  const next = belts[i + 1]
  return { belt: belts[i], next, progress: next ? (reps - belts[i].at) / (next.at - belts[i].at) : 1 }
}

/** Random combo for the caller: 2–5 calls from the chosen styles. */
export function randomCombo(styles: Style[], length: number, seated: boolean, rand = Math.random) {
  const pool = techniques.filter((t) => t.kind !== 'stance' && (!seated || t.position === 'seated') && (seated || t.position === 'standing') && t.style.some((s) => styles.includes(s)))
  return Array.from({ length }, () => pool[Math.floor(rand() * pool.length)]).filter(Boolean)
}
