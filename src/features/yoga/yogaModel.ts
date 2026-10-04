import type { Pose } from '../exercise/exercises'

export type YogaPose = { id: string; name: string; sanskrit: string; pose: Pose; benefit: string; cue: string; floor?: boolean }

export const poses: YogaPose[] = [
  { id: 'mountain', name: 'Mountain', sanskrit: 'Tadasana', pose: { shL: -4, shR: 4 }, benefit: 'Grounding and posture', cue: 'Feet rooted, crown lifting' },
  { id: 'upSalute', name: 'Upward salute', sanskrit: 'Urdhva Hastasana', pose: { shL: -175, shR: -175, torso: -8 }, benefit: 'Opens the side body', cue: 'Reach up, shoulders soft' },
  { id: 'forwardFold', name: 'Forward fold', sanskrit: 'Uttanasana', pose: { torso: 150, shL: -150, shR: -150, hipL: -4, knL: 8, hipR: -4, knR: 8, shift: -15 }, benefit: 'Releases hamstrings and back', cue: 'Bend the knees, let the head hang' },
  { id: 'halfLift', name: 'Half lift', sanskrit: 'Ardha Uttanasana', pose: { torso: 90, shL: -90, shR: -90, shift: -12 }, benefit: 'Lengthens the spine', cue: 'Flat back, hands to shins' },
  { id: 'plank', name: 'Plank', sanskrit: 'Phalakasana', pose: { root: 63, shL: -63, shR: -63 }, benefit: 'Core and shoulder strength', cue: 'One long line, belly engaged', floor: true },
  { id: 'chaturanga', name: 'Low plank', sanskrit: 'Chaturanga', pose: { root: 81, shL: 19, elL: -100, shR: 19, elR: -100 }, benefit: 'Arm and core strength', cue: 'Elbows hug the ribs', floor: true },
  { id: 'upDog', name: 'Upward dog', sanskrit: 'Urdhva Mukha Svanasana', pose: { root: 84, torso: -45, shL: -39, shR: -39 }, benefit: 'Opens chest and front body', cue: 'Chest forward, shoulders down', floor: true },
  { id: 'downDog', name: 'Downward dog', sanskrit: 'Adho Mukha Svanasana', pose: { root: 40, torso: 85, shL: -180, shR: -180 }, benefit: 'Full-body stretch, calms the mind', cue: 'Hips high, heels reaching down', floor: true },
  { id: 'warrior1', name: 'Warrior I', sanskrit: 'Virabhadrasana I', pose: { drop: 26, shift: -6, hipL: -80, knL: 80, hipR: 40, shL: -175, shR: -175 }, benefit: 'Strength and focus', cue: 'Front knee over ankle, arms reach' },
  { id: 'chair', name: 'Chair', sanskrit: 'Utkatasana', pose: { drop: 24, shift: -22, torso: 30, hipL: -60, knL: 70, hipR: -60, knR: 70, shL: -180, shR: -180 }, benefit: 'Warms legs, builds heat', cue: 'Sit back, weight in the heels' },
  { id: 'tree', name: 'Tree', sanskrit: 'Vrksasana', pose: { hipR: -45, knR: 130, shL: -175, shR: -175 }, benefit: 'Balance and calm focus', cue: 'Fix your gaze, grow tall' },
  { id: 'warrior3', name: 'Warrior III', sanskrit: 'Virabhadrasana III', pose: { torso: 90, hipR: 90, shL: -180, shR: -180 }, benefit: 'Balance and posterior strength', cue: 'Reach long through fingers and heel' },
]
export const poseById = (id: string) => poses.find((p) => p.id === id)!
export function searchYogaPoses(query: string) {
  const text = query.trim().toLocaleLowerCase()
  return poses.filter(pose => `${pose.name} ${pose.sanskrit}`.toLocaleLowerCase().includes(text))
}

export type Step = { key: string; poseId: string; breaths: number }
export type Flow = { id: string; name: string; emoji: string; steps: Step[] }

const s = (poseId: string, breaths = 1, i = 0): Step => ({ key: `${poseId}-${i}-${Math.random().toString(36).slice(2, 7)}`, poseId, breaths })
const flow = (id: string, name: string, emoji: string, list: [string, number][]): Flow => ({ id, name, emoji, steps: list.map(([p, b], i) => s(p, b, i)) })

export const presetFlows: Flow[] = [
  flow('sunA', 'Sun Salutation A', '🌅', [['mountain', 2], ['upSalute', 1], ['forwardFold', 1], ['halfLift', 1], ['plank', 1], ['chaturanga', 1], ['upDog', 1], ['downDog', 5], ['halfLift', 1], ['forwardFold', 1], ['upSalute', 1], ['mountain', 1]]),
  flow('energise', 'Morning energiser', '☀️', [['mountain', 2], ['upSalute', 2], ['chair', 3], ['forwardFold', 2], ['warrior1', 3], ['downDog', 3], ['mountain', 2]]),
  flow('balance', 'Balance', '🌳', [['mountain', 2], ['tree', 5], ['warrior3', 3], ['mountain', 2], ['tree', 5]]),
  flow('winddown', 'Wind-down', '🌙', [['mountain', 3], ['forwardFold', 5], ['halfLift', 2], ['downDog', 5], ['mountain', 3]]),
]

export const newStep = (poseId: string, breaths = 2): Step => s(poseId, breaths)
export const flowSeconds = (f: Flow, breath: number) => f.steps.reduce((t, x) => t + x.breaths * breath, 0)

/** Which step is live after `elapsed` seconds. */
export function stepAt(f: Flow, breath: number, elapsed: number) {
  let t = 0
  for (let i = 0; i < f.steps.length; i++) {
    const d = f.steps[i].breaths * breath
    if (elapsed < t + d) return { index: i, into: elapsed - t, left: t + d - elapsed }
    t += d
  }
  return null
}
