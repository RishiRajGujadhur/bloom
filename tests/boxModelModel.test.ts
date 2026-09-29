import { BOX_START, checkBoxModel, measureBox } from '../src/features/code/boxModelModel'

test('measures content-box layers and checks the target', () => {
  const settings = { ...BOX_START, padding: 20, border: 10, margin: 20 }
  expect(measureBox(settings)).toEqual({ contentWidth: 180, contentHeight: 80, borderWidth: 240, borderHeight: 140, outerWidth: 280, outerHeight: 180 })
  expect(checkBoxModel(settings).every((item) => item.pass)).toBe(true)
})

test('border-box dimensions include padding and border', () => {
  const settings = { ...BOX_START, sizing: 'border-box' as const, width: 240, height: 140, padding: 20, border: 10, margin: 20 }
  expect(measureBox(settings)).toEqual({ contentWidth: 180, contentHeight: 80, borderWidth: 240, borderHeight: 140, outerWidth: 280, outerHeight: 180 })
  expect(checkBoxModel(settings).every((item) => item.pass)).toBe(true)
})
