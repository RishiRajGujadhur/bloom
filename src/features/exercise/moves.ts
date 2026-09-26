import type { Area, Exercise, Muscle, Pose, Position } from './exercises'
import { exercises } from './exercises'
import { seatedExercises } from './seated'

/**
 * Small-joint and upper-body movements (neck, face, shoulders, arms, hands).
 * Each is offered standing and seated (wheelchair-friendly), so the same
 * library serves everyone. Poses use the figure's extra joints: `neck`,
 * `jaw` (mouth opening %) and `wrL`/`wrR` (hand openness %).
 */
type Move = { id: string; name: string; emoji: string; area: Area; primary: Muscle[]; a: Pose; b: Pose; tempo?: [number, number, number]; hold?: boolean; cue: string; mistake: string }

const moves: Move[] = [
  { id: 'neck-nod', name: 'Gentle neck nod', emoji: '🙂', area: 'neck', primary: ['shoulders'], a: { neck: -10 }, b: { neck: 22 }, tempo: [2, 0.5, 2], cue: 'Lower your chin toward your chest, then lift to look ahead.', mistake: 'Dropping the head quickly' },
  { id: 'chin-tuck', name: 'Chin tuck', emoji: '🐢', area: 'neck', primary: ['back'], a: { neck: 0 }, b: { neck: 12 }, tempo: [1.5, 2, 1.5], cue: 'Glide your chin straight back, making a gentle double chin. Hold.', mistake: 'Tipping the head down instead of back' },
  { id: 'neck-look-up', name: 'Look up and breathe', emoji: '☁️', area: 'neck', primary: ['back'], a: { neck: 0 }, b: { neck: -24 }, tempo: [2, 1, 2], cue: 'Lift your gaze slowly to the ceiling, lips closed, then return.', mistake: 'Cranking the neck back' },
  { id: 'jaw-open', name: 'Jaw opening', emoji: '😮', area: 'face', primary: ['shoulders'], a: { jaw: 0 }, b: { jaw: 110 }, tempo: [2, 1, 2], cue: 'Tongue on the roof of your mouth, open slowly as far as is comfortable.', mistake: 'Jaw sliding to one side' },
  { id: 'vowel-stretch', name: 'Vowel stretch (A-E-O)', emoji: '🗣️', area: 'face', primary: ['shoulders'], a: { jaw: 20 }, b: { jaw: 90 }, tempo: [0.8, 0.4, 0.8], cue: 'Say A… E… O… with big, exaggerated mouth shapes.', mistake: 'Tensing the neck' },
  { id: 'lion-breath', name: 'Lion breath', emoji: '🦁', area: 'face', primary: ['abs'], a: { jaw: 10, neck: 0 }, b: { jaw: 130, neck: -8 }, tempo: [2, 1, 1.5], cue: 'Inhale, then open wide and breathe out with a “haaa”.', mistake: 'Forcing the breath' },
  { id: 'shoulder-roll', name: 'Shoulder rolls', emoji: '🔄', area: 'shoulders', primary: ['shoulders'], a: { shL: 12, shR: 12 }, b: { shL: -22, shR: -22 }, tempo: [1, 0.2, 1], cue: 'Roll the shoulders up, back and down in slow circles.', mistake: 'Shrugging up to the ears and holding' },
  { id: 'arm-raise-front', name: 'Front arm raise', emoji: '🙋', area: 'shoulders', primary: ['shoulders'], a: { shL: -6, shR: -6 }, b: { shL: -95, shR: -95 }, tempo: [2, 0.5, 2], cue: 'Lift straight arms to shoulder height, thumbs up.', mistake: 'Swinging the arms' },
  { id: 'overhead-reach', name: 'Overhead reach', emoji: '🙌', area: 'shoulders', primary: ['shoulders', 'back'], a: { shL: -20, shR: -20, elL: -40, elR: -40 }, b: { shL: -170, shR: -170 }, tempo: [2, 1, 2], cue: 'Reach both hands up high, long through the fingers.', mistake: 'Arching the lower back' },
  { id: 'arm-circles', name: 'Arm circles', emoji: '🌀', area: 'arms', primary: ['shoulders', 'triceps'], a: { shL: -80, shR: -80 }, b: { shL: -110, shR: -110 }, tempo: [0.5, 0, 0.5], cue: 'Arms out, draw small circles; switch direction halfway.', mistake: 'Circles too large too soon' },
  { id: 'punches', name: 'Front punches', emoji: '🥊', area: 'arms', primary: ['triceps', 'shoulders'], a: { shL: -30, elL: -120, shR: -60, elR: -10 }, b: { shL: -80, elL: -5, shR: -30, elR: -120 }, tempo: [0.35, 0, 0.35], cue: 'Alternate quick punches forward, fists relaxed.', mistake: 'Locking the elbows' },
  { id: 'hammer-curl', name: 'Hammer curl', emoji: '🔨', area: 'arms', primary: ['biceps', 'forearms'], a: { shL: -8, shR: -8 }, b: { shL: -14, elL: -130, shR: -14, elR: -130 }, tempo: [2, 0.5, 1], cue: 'Palms facing in, curl up without swinging.', mistake: 'Elbows drifting forward' },
  { id: 'triceps-press', name: 'Overhead triceps press', emoji: '💪', area: 'arms', primary: ['triceps'], a: { shL: -170, elL: -120, shR: -170, elR: -120 }, b: { shL: -172, elL: -5, shR: -172, elR: -5 }, tempo: [2, 0.5, 1.5], cue: 'Elbows by your ears, straighten the arms upward.', mistake: 'Elbows flaring wide' },
  { id: 'fist-spread', name: 'Fist to spread', emoji: '✋', area: 'hands', primary: ['forearms'], a: { shL: -80, shR: -80, wrL: -45, wrR: -45 }, b: { shL: -80, shR: -80, wrL: 50, wrR: 50 }, tempo: [0.8, 0.5, 0.8], cue: 'Make a soft fist, then spread your fingers wide.', mistake: 'Squeezing too hard' },
  { id: 'finger-taps', name: 'Finger taps', emoji: '🎹', area: 'hands', primary: ['forearms'], a: { shL: -60, elL: -60, shR: -60, elR: -60, wrL: 10, wrR: -10 }, b: { shL: -60, elL: -60, shR: -60, elR: -60, wrL: -10, wrR: 10 }, tempo: [0.25, 0, 0.25], cue: 'Tap each fingertip to your thumb in turn, like playing a piano.', mistake: 'Rushing and tensing' },
  { id: 'wrist-waves', name: 'Wrist waves', emoji: '🌊', area: 'hands', primary: ['forearms'], a: { shL: -85, elL: -10, shR: -85, elR: -10, wrL: -20, wrR: -20 }, b: { shL: -85, elL: -35, shR: -85, elR: -35, wrL: 30, wrR: 30 }, tempo: [0.8, 0, 0.8], cue: 'Arms forward, make slow waves from the wrists.', mistake: 'Moving the whole arm instead of the wrist' },
  { id: 'prayer-press', name: 'Palm press', emoji: '🙏', area: 'hands', primary: ['chest', 'forearms'], a: { shL: -40, elL: -110, shR: -40, elR: -110, wrL: 0, wrR: 0 }, b: { shL: -40, elL: -110, shR: -40, elR: -110, wrL: 30, wrR: 30 }, tempo: [1, 3, 1], cue: 'Press palms together in front of the chest and squeeze gently.', mistake: 'Holding your breath' },
  { id: 'trunk-twist', name: 'Seated trunk turn', emoji: '↪️', area: 'core', primary: ['obliques', 'abs'], a: { torso: 0, shL: -40, elL: -90, shR: -40, elR: -90 }, b: { torso: 14, shL: -50, elL: -90, shR: -30, elR: -90 }, tempo: [2, 1, 2], cue: 'Sit tall and turn gently from the middle back.', mistake: 'Twisting only from the neck' },
]

const sitting: Pose = { hipL: -90, knL: 90, hipR: -90, knR: 90 }

function build(m: Move, position: Position): Exercise {
  const seated = position === 'seated'
  return {
    id: seated ? `${m.id}-seated` : m.id,
    name: seated ? `${m.name} · seated` : m.name,
    emoji: m.emoji,
    wheelchair: seated,
    area: m.area,
    position,
    level: 'beginner',
    equipment: 'none',
    primary: m.primary,
    secondary: [],
    a: seated ? { ...sitting, ...m.a } : m.a,
    b: seated ? { ...sitting, ...m.b } : m.b,
    tempo: m.tempo ?? [1.5, 0.5, 1.5],
    hold: m.hold,
    cues: [m.cue, ...(seated ? ['Keep your usual seated support; move in a comfortable range.'] : ['Stand tall with soft knees.'])],
    mistakes: [m.mistake, 'Holding your breath'],
  }
}

const areaFromMuscle = (e: Exercise): Area =>
  e.primary.some((m) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(m))
    ? e.primary.some((m) => ['chest', 'shoulders', 'abs'].includes(m))
      ? 'full'
      : 'legs'
    : e.primary.some((m) => ['abs', 'obliques'].includes(m))
      ? 'core'
      : e.primary.some((m) => ['biceps', 'triceps', 'forearms'].includes(m))
        ? 'arms'
        : e.primary.includes('chest')
          ? 'full'
          : 'shoulders'

const tag = (e: Exercise): Exercise => ({
  ...e,
  area: e.area ?? areaFromMuscle(e),
  position: e.position ?? (e.wheelchair ? 'seated' : (e.a.root ?? 0) > 45 || (e.b.root ?? 0) > 45 ? 'floor' : 'standing'),
})

/** Everything, tagged with area and position. */
export const library: Exercise[] = [
  ...exercises.map(tag),
  ...seatedExercises.map(tag),
  ...moves.map((m) => build(m, 'standing')),
  ...moves.map((m) => build(m, 'seated')),
]
export const byId = (id: string) => library.find((e) => e.id === id)

export const areaNames: Record<Area, string> = { neck: 'Neck', face: 'Face & jaw', shoulders: 'Shoulders', arms: 'Arms', hands: 'Hands & fingers', core: 'Core', legs: 'Legs', full: 'Full body' }
export const positionNames: Record<Position, string> = { standing: 'Standing', seated: 'Seated', floor: 'Floor' }

export function filterLibrary(list: Exercise[], f: { area?: Area | 'all'; position?: Position | 'all' }) {
  return list.filter((e) => (!f.area || f.area === 'all' || e.area === f.area) && (!f.position || f.position === 'all' || e.position === f.position))
}

/** Goal programs: combinations of exercises aimed at a body goal. */
export type Program = { id: string; name: string; emoji: string; goal: string; ids: string[]; reps: number; seatedIds?: string[] }
export const programs: Program[] = [
  { id: 'desk', name: 'Desk relief', emoji: '💻', goal: 'Loosen neck, shoulders and hands after screen time', ids: ['chin-tuck', 'neck-nod', 'shoulder-roll', 'overhead-reach', 'fist-spread', 'wrist-waves'], reps: 8 },
  { id: 'posture', name: 'Better posture', emoji: '🧍', goal: 'Open the chest and strengthen the upper back', ids: ['chin-tuck', 'shoulder-roll', 'overhead-reach', 'plank', 'deadlift'], reps: 10 },
  { id: 'arms', name: 'Toned arms', emoji: '💪', goal: 'Biceps, triceps and shoulders', ids: ['curl', 'hammer-curl', 'triceps-press', 'press', 'arm-circles', 'punches'], reps: 12 },
  { id: 'legs', name: 'Strong legs', emoji: '🦵', goal: 'Quads, glutes and calves', ids: ['squat', 'lunge', 'wallsit', 'calf', 'deadlift'], reps: 12 },
  { id: 'core', name: 'Solid core', emoji: '🧱', goal: 'Abs and obliques for a stable middle', ids: ['plank', 'climbers', 'trunk-twist', 'highknees'], reps: 12 },
  { id: 'athletic', name: 'Athletic build', emoji: '🏃', goal: 'Full body power and conditioning', ids: ['jacks', 'squat', 'pushup', 'lunge', 'punches', 'climbers'], reps: 12 },
  { id: 'face', name: 'Face & jaw release', emoji: '😌', goal: 'Relax jaw tension and the muscles of expression', ids: ['jaw-open', 'vowel-stretch', 'lion-breath', 'neck-look-up'], reps: 6 },
  { id: 'hands', name: 'Nimble hands', emoji: '🤲', goal: 'Finger dexterity and wrist mobility', ids: ['fist-spread', 'finger-taps', 'wrist-waves', 'prayer-press'], reps: 10 },
  { id: 'seated', name: 'Seated strength', emoji: '♿', goal: 'Upper-body strength from your chair or wheelchair', ids: ['neck-nod-seated', 'shoulder-roll-seated', 'arm-raise-front-seated', 'hammer-curl-seated', 'triceps-press-seated', 'punches-seated', 'trunk-twist-seated', 'fist-spread-seated'], reps: 10 },
]

export const programExercises = (p: Program, seatedOnly = false) =>
  p.ids
    .map((id) => (seatedOnly ? (byId(`${id}-seated`) ?? byId(id)) : byId(id)))
    .filter((e): e is Exercise => !!e && (!seatedOnly || e.position === 'seated'))

/** Rough minutes for a program: reps × seconds per rep + rest. */
export const programMinutes = (p: Program, rest = 20) =>
  Math.round(programExercises(p).reduce((t, e) => t + (e.hold ? 30 : p.reps * (e.tempo[0] + e.tempo[1] + e.tempo[2])) + rest, 0) / 60)
