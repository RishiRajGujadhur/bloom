/**
 * Exercise library. Each movement is two poses (A = start, B = end) given as
 * joint angles for a side-view figure; the guide animates between them at the
 * exercise's tempo. Angles are degrees, clockwise positive; knees and elbows
 * are relative to the thigh / upper arm.
 */
export type Joint = 'root' | 'drop' | 'shift' | 'torso' | 'shL' | 'elL' | 'shR' | 'elR' | 'hipL' | 'knL' | 'hipR' | 'knR'
export type Pose = Partial<Record<Joint, number>>
export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'

export type Exercise = {
  id: string
  name: string
  emoji: string
  level: 'beginner' | 'intermediate'
  equipment: 'none' | 'dumbbells' | 'wall'
  primary: Muscle[]
  secondary: Muscle[]
  a: Pose
  b: Pose
  /** Seconds: lowering, pause, lifting. */
  tempo: [number, number, number]
  /** Static holds count seconds instead of reps. */
  hold?: boolean
  cues: string[]
  mistakes: string[]
}

export const exercises: Exercise[] = [
  {
    id: 'squat',
    name: 'Bodyweight squat',
    emoji: '🦵',
    level: 'beginner',
    equipment: 'none',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'abs'],
    a: {},
    b: { drop: 36, shift: -30, torso: 35, hipL: -85, knL: 95, hipR: -85, knR: 95, shL: -80, shR: -80 },
    tempo: [2, 0.5, 1.5],
    cues: ['Feet shoulder-width, toes slightly out', 'Sit back and down, chest proud', 'Knees track over toes', 'Drive up through the whole foot'],
    mistakes: ['Knees caving inward', 'Heels lifting off the floor', 'Rounding the lower back'],
  },
  {
    id: 'lunge',
    name: 'Forward lunge',
    emoji: '🚶',
    level: 'beginner',
    equipment: 'none',
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'calves'],
    a: { hipL: -18, hipR: 18 },
    b: { drop: 30, shift: -6, hipL: -80, knL: 80, hipR: 30, knR: 80 },
    tempo: [1.5, 0.5, 1.5],
    cues: ['Long stride, torso tall', 'Both knees bend to about 90°', 'Push through the front heel'],
    mistakes: ['Front knee shooting past the toes', 'Leaning the torso forward', 'Back knee slamming the floor'],
  },
  {
    id: 'pushup',
    name: 'Push-up',
    emoji: '💪',
    level: 'intermediate',
    equipment: 'none',
    primary: ['chest', 'triceps'],
    secondary: ['shoulders', 'abs'],
    a: { root: 63, shL: -63, shR: -63 },
    b: { root: 81, shL: 19, elL: -100, shR: 19, elR: -100 },
    tempo: [2, 0.5, 1],
    cues: ['Hands under shoulders', 'One straight line from head to heels', 'Elbows at about 45°', 'Chest to just above the floor'],
    mistakes: ['Hips sagging', 'Elbows flared to 90°', 'Half reps'],
  },
  {
    id: 'plank',
    name: 'Plank',
    emoji: '🪵',
    level: 'beginner',
    equipment: 'none',
    primary: ['abs'],
    secondary: ['shoulders', 'glutes'],
    a: { root: 63, shL: -63, shR: -63 },
    b: { root: 64, shL: -64, shR: -64 },
    tempo: [1.5, 0, 1.5],
    hold: true,
    cues: ['Squeeze glutes and brace your belly', 'Shoulders stacked over wrists', 'Breathe slowly'],
    mistakes: ['Hips too high or too low', 'Holding your breath', 'Looking up'],
  },
  {
    id: 'deadlift',
    name: 'Romanian deadlift',
    emoji: '🏋️',
    level: 'intermediate',
    equipment: 'dumbbells',
    primary: ['hamstrings', 'glutes'],
    secondary: ['back', 'forearms'],
    a: {},
    b: { torso: 78, hipL: -12, knL: 18, hipR: -12, knR: 18, shL: -78, shR: -78, drop: 6, shift: -18 },
    tempo: [2.5, 0.5, 1.5],
    cues: ['Soft knees, push hips back', 'Weights slide close to the legs', 'Flat back, neck long', 'Stand tall by squeezing glutes'],
    mistakes: ['Rounding the spine', 'Turning it into a squat', 'Weights drifting forward'],
  },
  {
    id: 'press',
    name: 'Overhead press',
    emoji: '🙌',
    level: 'intermediate',
    equipment: 'dumbbells',
    primary: ['shoulders', 'triceps'],
    secondary: ['abs'],
    a: { shL: -40, elL: -140, shR: -40, elR: -140 },
    b: { shL: -175, elL: 0, shR: -175, elR: 0 },
    tempo: [2, 0, 1],
    cues: ['Ribs down, glutes tight', 'Press straight up, biceps by ears', 'Lower with control to shoulders'],
    mistakes: ['Arching the lower back', 'Pressing forward instead of up', 'Shrugging the shoulders'],
  },
  {
    id: 'curl',
    name: 'Biceps curl',
    emoji: '💪',
    level: 'beginner',
    equipment: 'dumbbells',
    primary: ['biceps'],
    secondary: ['forearms'],
    a: { shL: -6, shR: -6 },
    b: { shL: -12, elL: -140, shR: -12, elR: -140 },
    tempo: [2, 0.5, 1],
    cues: ['Elbows pinned to your sides', 'Palms up, wrists neutral', 'Squeeze at the top'],
    mistakes: ['Swinging the body', 'Elbows drifting forward', 'Dropping the weight fast'],
  },
  {
    id: 'calf',
    name: 'Calf raise',
    emoji: '🦶',
    level: 'beginner',
    equipment: 'none',
    primary: ['calves'],
    secondary: [],
    a: {},
    b: { drop: -12 },
    tempo: [1.5, 1, 1],
    cues: ['Rise onto the balls of the feet', 'Pause at the top', 'Lower slowly all the way'],
    mistakes: ['Bouncing', 'Rolling onto the outer foot', 'Rushing the lowering'],
  },
  {
    id: 'highknees',
    name: 'High knees',
    emoji: '🏃',
    level: 'beginner',
    equipment: 'none',
    primary: ['quads', 'calves'],
    secondary: ['abs'],
    a: { hipL: -90, knL: 90, shL: 30, shR: -45, elR: -60 },
    b: { hipR: -90, knR: 90, shR: 30, shL: -45, elL: -60 },
    tempo: [0.3, 0, 0.3],
    cues: ['Knees to hip height', 'Light on the balls of the feet', 'Drive with the arms'],
    mistakes: ['Leaning back', 'Landing on the heels', 'Arms still'],
  },
  {
    id: 'climbers',
    name: 'Mountain climbers',
    emoji: '⛰️',
    level: 'intermediate',
    equipment: 'none',
    primary: ['abs', 'shoulders'],
    secondary: ['quads'],
    a: { root: 63, shL: -63, shR: -63, hipL: -80, knL: 90 },
    b: { root: 63, shL: -63, shR: -63, hipR: -80, knR: 90 },
    tempo: [0.35, 0, 0.35],
    cues: ['Hands under shoulders', 'Drive knees toward the chest', 'Hips level with shoulders'],
    mistakes: ['Hips piking up', 'Bouncing the hips', 'Short range'],
  },
  {
    id: 'jacks',
    name: 'Jumping jacks',
    emoji: '⭐',
    level: 'beginner',
    equipment: 'none',
    primary: ['calves', 'shoulders'],
    secondary: ['glutes'],
    a: {},
    b: { shL: -170, shR: -170, hipL: 14, hipR: -14, drop: -6 },
    tempo: [0.4, 0, 0.4],
    cues: ['Soft landings', 'Arms reach overhead', 'Keep a steady rhythm'],
    mistakes: ['Stiff knees on landing', 'Holding your breath', 'Half arm swings'],
  },
  {
    id: 'wallsit',
    name: 'Wall sit',
    emoji: '🧱',
    level: 'beginner',
    equipment: 'wall',
    primary: ['quads'],
    secondary: ['glutes', 'calves'],
    a: { drop: 38, shift: -38, hipL: -88, knL: 90, hipR: -88, knR: 90, shL: -8, shR: -8 },
    b: { drop: 39, shift: -38, hipL: -88, knL: 90, hipR: -88, knR: 90, shL: -8, shR: -8 },
    tempo: [1.5, 0, 1.5],
    hold: true,
    cues: ['Back flat against the wall', 'Thighs parallel to the floor', 'Knees over ankles'],
    mistakes: ['Hands pushing on the thighs', 'Knees past the toes', 'Sliding up as you tire'],
  },
]

export const muscleNames: Record<Muscle, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  back: 'Back',
  glutes: 'Glutes',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  calves: 'Calves',
}

/** Seconds per rep at a given speed multiplier. */
export const repSeconds = (e: Exercise, speed = 1) => (e.tempo[0] + e.tempo[1] + e.tempo[2]) / speed

export function filterExercises(list: Exercise[], f: { muscle?: Muscle | 'all'; equipment?: Exercise['equipment'] | 'all'; level?: Exercise['level'] | 'all'; favourites?: string[] | null }) {
  return list.filter(
    (e) =>
      (!f.muscle || f.muscle === 'all' || e.primary.includes(f.muscle) || e.secondary.includes(f.muscle)) &&
      (!f.equipment || f.equipment === 'all' || e.equipment === f.equipment) &&
      (!f.level || f.level === 'all' || e.level === f.level) &&
      (!f.favourites || f.favourites.includes(e.id)),
  )
}
