import { act, fireEvent, render, screen } from '@testing-library/react'
import { LottieIcon } from '../src/components/ui/LottieIcon'
import lottie from 'lottie-web/build/player/lottie_light'

jest.mock('lottie-web/build/player/lottie_light', () => ({
  __esModule: true,
  default: {
    loadAnimation: jest.fn(() => ({
      playSegments: jest.fn(),
      destroy: jest.fn(),
    })),
  },
}))

beforeEach(() => {
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(false)
  jest
    .spyOn(window, 'matchMedia')
    .mockReturnValue({ matches: false } as MediaQueryList)
})
afterEach(() => {
  jest.restoreAllMocks()
})

test('renders immediately and initializes the decorative player only on intent', async () => {
  delete document.documentElement.dataset.reduceMotion
  const view = render(
    <button>
      Complete
      <LottieIcon name="check" />
    </button>,
  )
  expect(lottie.loadAnimation).not.toHaveBeenCalled()
  expect(view.container.querySelector('.lottie-fallback')).toBeInTheDocument()
  await act(async () => {
    fireEvent.pointerEnter(screen.getByRole('button'))
  })
  expect(lottie.loadAnimation).toHaveBeenCalledTimes(1)
  await act(async () => {
    fireEvent.click(screen.getByRole('button'))
  })
  expect(lottie.loadAnimation).toHaveBeenCalledTimes(1)
  const player = (lottie.loadAnimation as jest.Mock).mock.results[0].value
  view.unmount()
  expect(player.destroy).toHaveBeenCalledTimes(1)
})

test('keeps its static icon when motion is reduced', async () => {
  document.documentElement.dataset.reduceMotion = 'true'
  const view = render(
    <button>
      Complete
      <LottieIcon name="check" />
    </button>,
  )
  await act(async () => {
    fireEvent.pointerEnter(screen.getByRole('button'))
  })
  expect(lottie.loadAnimation).not.toHaveBeenCalled()
  view.unmount()
  delete document.documentElement.dataset.reduceMotion
})
