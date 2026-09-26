import type { Pose } from '../exercise/exercises'

export type Area = 'neck' | 'shoulders' | 'upperBack' | 'lowerBack' | 'hips' | 'hamstrings' | 'quads' | 'calves' | 'wrists'
export const areaNames: Record<Area, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  upperBack: 'Upper back',
  lowerBack: 'Lower back',
  hips: 'Hips',
  hamstrings: 'Hamstrings',
  quads: 'Quads',
  calves: 'Calves',
  wrists: 'Wrists',
}

export type Stretch = { id: string; name: string; area: Area; seconds: number; sides: boolean; cue: string; pose: Pose; floor?: boolean }
export const stretches: Stretch[] = [
  { id: 'neckTilt', name: 'Neck side tilt', area: 'neck', seconds: 30, sides: true, cue: 'Ear toward shoulder, shoulders heavy', pose: { shL: -4, shR: 4 } },
  { id: 'chinTuck', name: 'Chin tucks', area: 'neck', seconds: 30, sides: false, cue: 'Glide the chin back, make a double chin', pose: { shL: -4, shR: 4 } },
  { id: 'crossArm', name: 'Cross-body shoulder', area: 'shoulders', seconds: 30, sides: true, cue: 'Pull the arm across, keep the shoulder low', pose: { shL: -90, elL: -10, shR: -80, elR: -90 } },
  { id: 'overhead', name: 'Overhead reach', area: 'shoulders', seconds: 30, sides: false, cue: 'Interlace fingers, reach up and slightly back', pose: { shL: -175, shR: -175, torso: -6 } },
  { id: 'catCow', name: 'Cat–cow', area: 'upperBack', seconds: 45, sides: false, cue: 'Round, then arch, with the breath', pose: { root: 63, shL: -63, shR: -63 }, floor: true },
  { id: 'doorway', name: 'Doorway chest opener', area: 'upperBack', seconds: 30, sides: false, cue: 'Forearms on the frame, lean gently forward', pose: { shL: -90, elL: -90, shR: -90, elR: -90, torso: 8 } },
  { id: 'fold', name: 'Standing forward fold', area: 'lowerBack', seconds: 45, sides: false, cue: 'Soft knees, let the spine hang', pose: { torso: 150, shL: -150, shR: -150, hipL: -4, knL: 8, hipR: -4, knR: 8, shift: -15 } },
  { id: 'sideBend', name: 'Standing side bend', area: 'lowerBack', seconds: 30, sides: true, cue: 'Reach up and over, both feet grounded', pose: { shL: -175, shR: -175, torso: -10 } },
  { id: 'lungeHip', name: 'Hip flexor lunge', area: 'hips', seconds: 40, sides: true, cue: 'Tuck the pelvis, sink forward', pose: { drop: 30, shift: -6, hipL: -80, knL: 80, hipR: 30, knR: 80 } },
  { id: 'figure4', name: 'Standing figure four', area: 'hips', seconds: 40, sides: true, cue: 'Ankle over knee, sit back', pose: { drop: 16, shift: -14, torso: 20, hipL: -45, knL: 55, hipR: -70, knR: 110 } },
  { id: 'hamstring', name: 'Hamstring hinge', area: 'hamstrings', seconds: 40, sides: false, cue: 'Hips back, flat back, legs long', pose: { torso: 78, shL: -78, shR: -78, shift: -18, drop: 4 } },
  { id: 'quad', name: 'Standing quad', area: 'quads', seconds: 30, sides: true, cue: 'Heel to glute, knees together', pose: { hipR: 5, knR: 160, shR: 30, elR: 0 } },
  { id: 'calfWall', name: 'Wall calf stretch', area: 'calves', seconds: 30, sides: true, cue: 'Back heel down, lean into the wall', pose: { drop: 6, torso: 18, hipL: -20, knL: 20, hipR: 25, shL: -80, shR: -80 } },
  { id: 'wristFlex', name: 'Wrist flexor', area: 'wrists', seconds: 25, sides: true, cue: 'Arm long, fingers back gently', pose: { shL: -90, shR: -4 } },
  { id: 'prayer', name: 'Prayer stretch', area: 'wrists', seconds: 25, sides: false, cue: 'Palms together, lower hands to waist', pose: { shL: -40, elL: -110, shR: -40, elR: -110 } },
]
export const stretchById = (id: string) => stretches.find((s) => s.id === id)!

export const routines: { id: string; name: string; emoji: string; ids: string[] }[] = [
  { id: 'desk', name: 'Desk reset', emoji: '💻', ids: ['chinTuck', 'neckTilt', 'crossArm', 'doorway', 'wristFlex', 'prayer'] },
  { id: 'morning', name: 'Morning mobility', emoji: '🌅', ids: ['overhead', 'sideBend', 'catCow', 'fold', 'lungeHip'] },
  { id: 'runner', name: 'Runner’s legs', emoji: '🏃', ids: ['quad', 'hamstring', 'calfWall', 'lungeHip', 'figure4'] },
  { id: 'lowback', name: 'Low back relief', emoji: '🌿', ids: ['catCow', 'fold', 'figure4', 'hamstring', 'sideBend'] },
  { id: 'full', name: 'Full body 10', emoji: '✨', ids: ['neckTilt', 'crossArm', 'catCow', 'fold', 'lungeHip', 'hamstring', 'quad', 'calfWall'] },
]

export type Step = { stretch: Stretch; side?: 'left' | 'right' }

/** Expands bilateral stretches into left and right steps. */
export function steps(ids: string[], sides = true): Step[] {
  return ids.flatMap((id) => {
    const st = stretchById(id)
    return st.sides && sides ? [{ stretch: st, side: 'left' as const }, { stretch: st, side: 'right' as const }] : [{ stretch: st }]
  })
}
export const totalSeconds = (list: Step[], scale = 1) => list.reduce((t, s) => t + Math.round(s.stretch.seconds * scale), 0)

/** Routine built from the areas you tap on the body map. */
export function forAreas(areas: Area[]) {
  return stretches.filter((s) => areas.includes(s.area)).map((s) => s.id)
}
