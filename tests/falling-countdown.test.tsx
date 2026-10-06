import { render, screen } from '@testing-library/react'
import { FallingCountdown } from '../src/features/interval/FallingCountdown'

test('a one-second change moves only its changed digit', () => {
  const view = render(<FallingCountdown value="1:12" />)
  const initial = [...view.container.querySelectorAll('.iv-digit')]
  view.rerender(<FallingCountdown value="1:11" />)
  expect([...view.container.querySelectorAll('.iv-number-previous')].map(node => node.textContent)).toEqual(['2'])
  expect(view.container.querySelectorAll('.is-changing')).toHaveLength(1)
  expect([...view.container.querySelectorAll('.iv-digit')].slice(0, 3)).toEqual(initial.slice(0, 3))
  expect(screen.getByText('1:11')).toHaveClass('sr-only')
})

test('a minute rollover moves changed digits and leaves the colon still', () => {
  const view = render(<FallingCountdown value="1:00" />)
  view.rerender(<FallingCountdown value="0:59" />)
  expect(view.container.querySelectorAll('.is-changing')).toHaveLength(3)
  expect(view.container.querySelectorAll('.iv-digit')[1].textContent).toBe(':')
  expect(view.container.querySelectorAll('.iv-digit')[1].querySelector('.is-changing')).toBeNull()
})

test('changing minute length preserves the colon and unchanged seconds', () => {
  const view = render(<FallingCountdown value="10:00" />)
  const colon = view.container.querySelectorAll('.iv-digit')[2]
  view.rerender(<FallingCountdown value="9:00" />)
  expect(view.container.querySelectorAll('.iv-digit')[1]).toBe(colon)
  expect(view.container.querySelectorAll('.is-changing')).toHaveLength(1)
})
