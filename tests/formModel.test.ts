import { angle, J, read, RepCounter, squatPose, type P } from '../src/features/workout/formModel'

describe('Form coach', () => {
  it('measures joint angles', () => {
    expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 })).toBeCloseTo(90)
    expect(angle({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 })).toBeCloseTo(180)
  })

  it('the synthetic squat bends the knees as it goes down', () => {
    expect(read('squat', squatPose(0)).metric).toBeGreaterThan(165)
    expect(read('squat', squatPose(1)).metric).toBeLessThan(95)
  })

  it('counts one rep per full down-and-up, ignoring jitter near the top', () => {
    const c = new RepCounter('squat')
    let t = 0
    const frames = (from: number, to: number, n: number) => Array.from({ length: n }, (_, i) => from + ((to - from) * i) / (n - 1))
    for (let rep = 0; rep < 3; rep++) {
      for (const d of [...frames(0, 1, 15), ...frames(1, 0, 15)]) c.push(read('squat', squatPose(d)), (t += 33))
      // Jitter at the top must not count.
      for (const d of [0, 0.1, 0.05, 0.15, 0]) c.push(read('squat', squatPose(d)), (t += 33))
    }
    expect(c.reps).toHaveLength(3)
    expect(c.reps.every((r) => r.score >= 70)).toBe(true)
  })

  it('flags a collapsing chest and scores that rep lower', () => {
    const c = new RepCounter('squat')
    let t = 0
    for (const d of [0, 0.4, 0.8, 1, 0.8, 0.4, 0]) c.push(read('squat', squatPose(d, d)), (t += 33))
    expect(c.reps).toHaveLength(1)
    expect(c.reps[0].faults).toContain('Chest up')
    expect(c.reps[0].score).toBeLessThan(80)
  })

  it('push-up body line: sagging hips are called out', () => {
    const lm: P[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 1 }))
    lm[J.lSh] = { x: 0.2, y: 0.5 }; lm[J.lEl] = { x: 0.2, y: 0.62 }; lm[J.lWr] = { x: 0.2, y: 0.75 }
    lm[J.lHip] = { x: 0.5, y: 0.66 }; lm[J.lAn] = { x: 0.8, y: 0.6 }
    lm[J.rSh] = { x: 0, y: 0, visibility: 0 }
    expect(read('pushup', lm).faults).toContain('Hips sagging')
  })
})
