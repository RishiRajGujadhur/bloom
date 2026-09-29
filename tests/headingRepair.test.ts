import { checkHeadingHierarchy, HEADING_STARTER } from '../src/features/code/headingRepairModel'

test('detects skipped heading levels and accepts a repaired outline', () => {
  expect(checkHeadingHierarchy(HEADING_STARTER).find((item) => item.label === 'Move down one level at a time')?.pass).toBe(false)
  const repaired = HEADING_STARTER.replace('<h3>Getting started</h3>', '<h2>Getting started</h2>')
    .replace('<h5>Choose a plot</h5>', '<h3>Choose a plot</h3>')
    .replace('<h4>Bring your tools</h4>', '<h3>Bring your tools</h3>')
    .replace('<h4>Weekend planting</h4>', '<h3>Weekend planting</h3>')
  expect(checkHeadingHierarchy(repaired).every((item) => item.pass)).toBe(true)
  expect(checkHeadingHierarchy(repaired.replace('Weekend planting', '')).every((item) => item.pass)).toBe(false)
})
