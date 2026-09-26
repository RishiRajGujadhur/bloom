import type { Exercise, Pose } from './exercises'
const sitting: Pose = { hipL: -90, knL: 90, hipR: -90, knR: 90 }
const baseCues = [
  'Use your usual stable seated position and supports. Secure the chair as appropriate for your equipment.',
  'Choose a small comfortable range. Keep your trunk supported and breathe normally.',
  'Pause for pain, dizziness, unusual fatigue, or loss of support. Skip movements that do not suit your mobility.',
]
const variations: {
  id: string
  name: string
  b: Pose
  cue: string
  primary: Exercise['primary']
}[] = [
  {
    id: 'seated-curl-left',
    name: 'Seated elbow bend · left',
    b: { elL: -70 },
    cue: 'With the upper arm resting near your side, bend and straighten the left elbow slowly.',
    primary: ['biceps'],
  },
  {
    id: 'seated-curl-right',
    name: 'Seated elbow bend · right',
    b: { elR: -70 },
    cue: 'With the upper arm resting near your side, bend and straighten the right elbow slowly.',
    primary: ['biceps'],
  },
  {
    id: 'seated-curl-both',
    name: 'Seated elbow bends · both',
    b: { elL: -70, elR: -70 },
    cue: 'Bend both elbows together only if comfortable; no weights are needed.',
    primary: ['biceps'],
  },
  {
    id: 'seated-reach-left',
    name: 'Low forward reach · left',
    b: { shL: -35, elL: -15 },
    cue: 'Reach the left hand a short distance forward, below shoulder height. Keep your trunk supported.',
    primary: ['shoulders'],
  },
  {
    id: 'seated-reach-right',
    name: 'Low forward reach · right',
    b: { shR: -35, elR: -15 },
    cue: 'Reach the right hand a short distance forward, below shoulder height. Keep your trunk supported.',
    primary: ['shoulders'],
  },
  {
    id: 'seated-reach-both',
    name: 'Low forward reach · both',
    b: { shL: -25, shR: -25, elL: -15, elR: -15 },
    cue: 'Move both hands a small distance forward. Reduce the range or use one arm at a time.',
    primary: ['shoulders'],
  },
  {
    id: 'seated-extension-left',
    name: 'Seated elbow return · left',
    b: { elL: -15 },
    cue: 'Start with the left elbow bent and slowly let it straighten, without locking it.',
    primary: ['triceps'],
  },
  {
    id: 'seated-extension-right',
    name: 'Seated elbow return · right',
    b: { elR: -15 },
    cue: 'Start with the right elbow bent and slowly let it straighten, without locking it.',
    primary: ['triceps'],
  },
]
export const seatedExercises: Exercise[] = variations.map((v) => ({
  id: v.id,
  name: v.name,
  emoji: '♿',
  wheelchair: true,
  level: 'beginner',
  equipment: 'none',
  primary: v.primary,
  secondary: [],
  a: {
    ...sitting,
    ...(v.id.includes('extension')
      ? { [v.id.endsWith('left') ? 'elL' : 'elR']: -70 }
      : {}),
  },
  b: { ...sitting, ...v.b },
  tempo: [3, 1, 3],
  cues: [v.cue, ...baseCues],
  mistakes: [
    'Reaching beyond a comfortable range',
    'Holding your breath',
    'Losing your usual seated support',
  ],
}))
