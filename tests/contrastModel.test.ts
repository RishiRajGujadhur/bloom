import { checkContrast, CONTRAST_TASKS, contrastRatio, relativeLuminance } from '../src/features/code/contrastModel'

test('calculates WCAG sRGB contrast ratios', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
})

test('distinguishes normal and large text thresholds', () => {
  expect(CONTRAST_TASKS.every((task) => !checkContrast(task, task.start).pass)).toBe(true)
  expect(CONTRAST_TASKS.every((task) => checkContrast(task, { foreground: '#000000', background: '#ffffff' }).pass)).toBe(true)
})
