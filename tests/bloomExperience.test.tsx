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

test('decorative motion always runs and cleans up on unmount', () => {
  localStorage.setItem('bloom-motion', 'paused')
  const view = render(
    <BloomHeading title="Your daily space" page="overview">
      Guide
    </BloomHeading>,
  )
  expect(screen.queryByRole('button', { name: /decorative motion/ })).not.toBeInTheDocument()
  expect(document.documentElement).toHaveAttribute('data-bloom-motion', 'running')
  view.unmount()
  expect(document.documentElement).not.toHaveAttribute('data-bloom-motion')
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
