import { changeField } from './helpers/dropdown'
import { fireEvent, render, screen } from '@testing-library/react'
import { GridPuzzle } from '../src/features/code/GridPuzzle'
import { HeadingRepair } from '../src/features/code/HeadingRepair'

jest.mock('gsap', () => ({
  __esModule: true,
  default: { set: jest.fn(), to: jest.fn(() => ({ kill: jest.fn() })) },
}))

beforeEach(() => localStorage.clear())

test('the shared grid frame preserves draft editing, feedback, reset and back navigation', () => {
  const onClose = jest.fn()
  const { unmount } = render(<GridPuzzle onClose={onClose} />)
  expect(
    screen.getByRole('region', { name: 'Grid layout puzzle' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('heading', { name: 'Fit the page into a grid' }),
  ).toBeInTheDocument()
  const column = screen.getByRole('combobox', { name: 'Hero column' })
  const initial = column.getAttribute('data-value')!
  const changed = initial === '1' ? '2' : '1'
  changeField(column, { target: { value: changed } })
  unmount()
  render(<GridPuzzle onClose={onClose} />)
  expect(screen.getByRole('combobox', { name: 'Hero column' })).toHaveAttribute(
    'data-value',
    changed,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Check layout' }))
  expect(screen.getByRole('status')).toHaveTextContent(
    /checks pass|Grid solved/,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByRole('combobox', { name: 'Hero column' })).toHaveAttribute(
    'data-value',
    initial,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Back to learning path' }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('heading repair keeps its accessible editor inside the shared frame', () => {
  const onClose = jest.fn()
  render(<HeadingRepair onClose={onClose} />)
  expect(
    screen.getByRole('button', { name: 'Back to learning path' }),
  ).toBeEnabled()
  expect(screen.getByRole('textbox')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Back to learning path' }))
  expect(onClose).toHaveBeenCalledTimes(1)
})
