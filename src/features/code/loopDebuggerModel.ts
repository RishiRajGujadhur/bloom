export type LoopSettings = { start: 0 | 1; comparison: '<' | '<=' | '>'; step: 1 | 2 }
export type LoopFrame = { phase: 'check' | 'visit' | 'done'; i: number; visited: number[]; condition: boolean; message: string }
export const LOOP_START: LoopSettings = { start: 0, comparison: '<=', step: 1 }
export const LOOP_TARGET = [0, 1, 2]

export function buildLoopFrames(settings: LoopSettings): LoopFrame[] {
  const frames: LoopFrame[] = []
  const visited: number[] = []
  let i = settings.start
  for (let iteration = 0; iteration < 8; iteration++) {
    const condition = settings.comparison === '<' ? i < 3 : settings.comparison === '<=' ? i <= 3 : i > 3
    frames.push({ phase: 'check', i, visited: [...visited], condition, message: `Check ${i} ${settings.comparison} 3: ${condition ? 'true' : 'false'}.` })
    if (!condition) {
      frames.push({ phase: 'done', i, visited: [...visited], condition: false, message: 'The condition is false, so the loop stops.' })
      return frames
    }
    visited.push(i)
    frames.push({ phase: 'visit', i, visited: [...visited], condition: true, message: `Visit plot ${i}, then add ${settings.step} to i.` })
    i += settings.step
  }
  frames.push({ phase: 'done', i, visited: [...visited], condition: true, message: 'Stopped the simulator after eight visits.' })
  return frames
}

export function checkLoop(settings: LoopSettings) {
  const frames = buildLoopFrames(settings)
  const actual = frames[frames.length - 1].visited
  const pass = actual.length === LOOP_TARGET.length && actual.every((value, index) => value === LOOP_TARGET[index])
  const missed = LOOP_TARGET.filter((value) => !actual.includes(value))
  const extra = actual.filter((value) => !LOOP_TARGET.includes(value))
  return { actual, pass, feedback: pass ? 'Exactly plots 0, 1, and 2 were visited.' : `${missed.length ? `Missing plot${missed.length > 1 ? 's' : ''} ${missed.join(', ')}. ` : ''}${extra.length ? `Extra plot${extra.length > 1 ? 's' : ''} ${extra.join(', ')}. ` : ''}${!missed.length && !extra.length ? 'Check the visit order.' : ''}`.trim() }
}
