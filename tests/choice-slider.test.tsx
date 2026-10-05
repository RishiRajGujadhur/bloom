import { fireEvent, render, screen, within } from '@testing-library/react'
import { ChoiceSlider } from '../src/companion/ChoiceSlider'

test('renders only three choices, pages using the slider, and runs the selected action', () => {
  const run = jest.fn()
  render(<ChoiceSlider actions={Array.from({ length: 8 }, (_, i) => ({ id: String(i), label: `Action ${i + 1}`, run }))} />)
  const group = screen.getByRole('group', { name: 'Choices' })
  expect(within(group).getAllByRole('button')).toHaveLength(3)
  expect(screen.queryByRole('button', { name: 'Action 4' })).toBeNull()
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } })
  expect(within(group).getAllByRole('button')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: 'Action 8' }))
  expect(run).toHaveBeenCalledTimes(1)
})

test('clamps the page when fewer choices become available', () => {
  const actions = Array.from({ length: 7 }, (_, i) => ({ id: String(i), label: `Action ${i}`, run: jest.fn() }))
  const view = render(<ChoiceSlider actions={actions} />)
  fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } })
  view.rerender(<ChoiceSlider actions={actions.slice(0, 2)} />)
  expect(screen.getAllByRole('button')).toHaveLength(2)
  expect(screen.queryByRole('slider')).toBeNull()
})

test('horizontal swipes page choices and disabled choices cannot be swiped', () => {
  const actions = Array.from({ length: 7 }, (_, i) => ({ id: String(i), label: `Action ${i}`, run: jest.fn() }))
  const view = render(<ChoiceSlider actions={actions} />)
  const items = view.container.querySelector('.choice-slider-items')!
  fireEvent.touchStart(items, { touches: [{ clientX: 200, clientY: 20 }] })
  fireEvent.touchEnd(items, { changedTouches: [{ clientX: 100, clientY: 22 }] })
  expect(screen.getByRole('slider')).toHaveValue('1')
  view.rerender(<ChoiceSlider actions={actions.map((action) => ({ ...action, disabled: true }))} />)
  fireEvent.touchStart(items, { touches: [{ clientX: 200, clientY: 20 }] })
  fireEvent.touchEnd(items, { changedTouches: [{ clientX: 100, clientY: 22 }] })
  expect(screen.getByRole('slider')).toHaveValue('1')
})
