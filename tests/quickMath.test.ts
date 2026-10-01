import { quickCalc, quickConvert } from '../src/components/layout/quickMath'

test('calculates simple arithmetic', () => {
  expect(quickCalc('=12*7')).toBe('12*7 = 84')
  expect(quickCalc('(2+3)/4')).toBe('(2+3)/4 = 1.25')
  expect(quickCalc('2^10')).toBe('2^10 = 1024')
  expect(quickCalc('hello')).toBeNull()
  expect(quickCalc('42')).toBeNull()
  expect(quickCalc('alert(1)+1')).toBeNull()
})

test('converts common units', () => {
  expect(quickConvert('5 km')).toBe('5 km = 3.11 mi')
  expect(quickConvert('70kg')).toBe('70 kg = 154.32 lb')
  expect(quickConvert('20c')).toBe('20 c = 68 °F')
  expect(quickConvert('5 apples')).toBeNull()
})
