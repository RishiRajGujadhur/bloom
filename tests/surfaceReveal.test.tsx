import { useRef } from 'react'
import { render } from '@testing-library/react'
import gsap from 'gsap'
import { useSurfaceReveal } from '../src/utils/useSurfaceReveal'

jest.mock('gsap', () => ({
  __esModule: true,
  default: { fromTo: jest.fn(), context: jest.fn() },
}))

function Panel({ open, revision = 0 }: { open: boolean; revision?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useSurfaceReveal(ref, open, revision)
  return <div ref={ref}><button>Practice</button></div>
}

beforeEach(() => {
  const matchMedia = window.matchMedia
  jest.spyOn(window, 'matchMedia').mockImplementation(query => ({
    ...matchMedia(query),
    matches: query === '(prefers-reduced-motion: reduce)' ? false : matchMedia(query).matches,
  }))
})

afterEach(() => {
  jest.restoreAllMocks()
  delete document.documentElement.dataset.reduceMotion
  delete document.documentElement.dataset.bloomMotion
})

test('reveals clean up on revision changes and unmount', () => {
  const revert = jest.fn()
  jest.mocked(gsap.context).mockImplementation((callback) => {
    ;(callback as () => void)()
    return { revert } as unknown as ReturnType<typeof gsap.context>
  })
  const view = render(<Panel open />)
  expect(gsap.fromTo).toHaveBeenCalledTimes(1)
  view.rerender(<Panel open revision={1} />)
  expect(revert).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(revert).toHaveBeenCalledTimes(2)
})

test('closed panels and reduced or paused motion skip animations', () => {
  const view = render(<Panel open={false} />)
  expect(gsap.context).not.toHaveBeenCalled()
  document.documentElement.dataset.reduceMotion = 'true'
  view.rerender(<Panel open />)
  expect(gsap.context).not.toHaveBeenCalled()
  delete document.documentElement.dataset.reduceMotion
  document.documentElement.dataset.bloomMotion = 'paused'
  view.rerender(<Panel open revision={1} />)
  expect(gsap.context).not.toHaveBeenCalled()
})
