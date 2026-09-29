export type ReducedMotionSettings = { durationMs: number; repeats: boolean; keepsResult: boolean }
export const REDUCED_MOTION_START: ReducedMotionSettings = { durationMs: 900, repeats: true, keepsResult: false }

export function checkReducedMotion(settings: ReducedMotionSettings) {
  return [
    { label: 'Movement is instant or brief', pass: settings.durationMs <= 100, hint: 'Choose an instant change or a very short transition for the reduced version.' },
    { label: 'Animation does not repeat', pass: !settings.repeats, hint: 'Turn off the loop so the interface settles.' },
    { label: 'Completion remains visible', pass: settings.keepsResult, hint: 'Keep a static success state so the user still receives the result.' },
  ]
}
