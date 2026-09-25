import { fireEvent, render, screen } from '@testing-library/react'
import {
  BloomHeading,
  CardRail,
  Disclosure,
} from '../src/components/BloomExperience'

test('rails offer keyboard navigation without intercepting keys inside cards', () => {
  render(
    <CardRail label="Practices">
      <button>First practice</button>
      <button>Second practice</button>
    </CardRail>,
  )
  const track = screen.getByLabelText('Practices, swipe or use arrow keys')
  const scrollBy = jest.fn()
  Object.defineProperty(track, 'clientWidth', { value: 400 })
  Object.defineProperty(track, 'scrollBy', { value: scrollBy })
  fireEvent.keyDown(track, { key: 'ArrowRight' })
  expect(scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 340 }))
  fireEvent.keyDown(screen.getByRole('button', { name: 'First practice' }), {
    key: 'ArrowRight',
  })
  expect(scrollBy).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Show all' }))
  expect(track).toHaveClass('is-expanded')
  expect(
    screen.queryByRole('button', { name: 'Next Practices' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'First practice' })).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Show slider' }))
  expect(track).not.toHaveClass('is-expanded')
})

test('decorative motion preference survives a new header and cleans up on unmount', () => {
  localStorage.removeItem('bloom-motion')
  const view = render(
    <BloomHeading title="Your daily space" page="overview">
      Guide
    </BloomHeading>,
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Pause decorative motion' }),
  )
  expect(document.documentElement).toHaveAttribute(
    'data-bloom-motion',
    'paused',
  )
  expect(localStorage.getItem('bloom-motion')).toBe('paused')
  view.unmount()
  expect(document.documentElement).not.toHaveAttribute('data-bloom-motion')
  render(
    <BloomHeading title="Focus" page="focus">
      Guide
    </BloomHeading>,
  )
  expect(
    screen.getByRole('button', { name: 'Resume decorative motion' }),
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(
    screen.getByRole('button', { name: 'Resume decorative motion' }),
  )
  expect(document.documentElement).toHaveAttribute(
    'data-bloom-motion',
    'running',
  )
  localStorage.removeItem('bloom-motion')
})

test('secondary content is collapsed by default and remains mounted', () => {
  render(
    <Disclosure title="More options">
      <input aria-label="Draft" defaultValue="Keep this" />
    </Disclosure>,
  )
  const draft = screen.getByLabelText('Draft')
  expect(draft.closest('details')).not.toHaveAttribute('open')
  expect(draft).toHaveValue('Keep this')
})
