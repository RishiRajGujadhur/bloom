import { changeDaybookView } from '../src/components/daybook/transition'
import { prefersReducedMotion } from '../src/utils/motion'

jest.mock('../src/utils/motion', () => ({
  prefersReducedMotion: jest.fn(() => false),
}))

afterEach(() => {
  jest.restoreAllMocks()
  delete (document as Partial<Document>).startViewTransition
  jest.mocked(prefersReducedMotion).mockReturnValue(false)
})

test('changes pages through the browser fade when available', () => {
  const update = jest.fn()
  const transition = jest.fn((callback: () => void) => callback())
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: transition,
  })
  changeDaybookView(update)
  expect(transition).toHaveBeenCalledTimes(1)
  expect(update).toHaveBeenCalledTimes(1)
})

test('opens immediately for reduced motion and browsers without transitions', () => {
  const update = jest.fn()
  changeDaybookView(update)
  expect(update).toHaveBeenCalledTimes(1)
  const transition = jest.fn()
  Object.defineProperty(document, 'startViewTransition', {
    configurable: true,
    value: transition,
  })
  jest.mocked(prefersReducedMotion).mockReturnValue(true)
  changeDaybookView(update)
  expect(transition).not.toHaveBeenCalled()
  expect(update).toHaveBeenCalledTimes(2)
})
