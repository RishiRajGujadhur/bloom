import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { TodoPage } from '../src/features/ProductivityPages'
import {
  DELETE_HOLD_MS,
  HoldToDelete,
} from '../src/features/todos/HoldToDelete'
import { defaults } from '../src/model'

jest.mock('../src/utils/motion', () => ({ prefersReducedMotion: () => false }))
jest.mock('../src/features/impact/ImpactLayer', () => ({
  launchImpact: () => false,
}))

beforeAll(() => {
  class TestPointerEvent extends MouseEvent {
    pointerId: number
    isPrimary: boolean
    constructor(type: string, options: PointerEventInit = {}) {
      super(type, options)
      this.pointerId = options.pointerId ?? 1
      this.isPrimary = options.isPrimary ?? true
    }
  }
  Object.defineProperty(window, 'PointerEvent', {
    configurable: true,
    value: TestPointerEvent,
  })
})
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

function Harness() {
  const [data, setData] = useState(defaults)
  return <TodoPage data={data} setData={setData} />
}
function add(title: string) {
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: title },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add', exact: true }))
}
const titles = (container: HTMLElement) =>
  [...container.querySelectorAll('.todo-task-title')].map(
    (node) => node.textContent,
  )

test('completion draws in place, moves below open tasks, and Undo restores it', () => {
  const { container } = render(<Harness />)
  add('First task')
  add('Second task')
  fireEvent.click(screen.getByRole('button', { name: 'Complete First task' }))
  expect(titles(container)).toEqual(['First task', 'Second task'])
  expect(screen.getByText('First task').closest('li')).toHaveClass(
    'is-completing',
  )
  act(() => jest.advanceTimersByTime(550))
  expect(titles(container)).toEqual(['Second task', 'First task'])
  expect(
    screen.getByRole('button', { name: 'Reopen First task' }),
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(
    within(screen.getByRole('status')).getByRole('button', { name: 'Undo' }),
  )
  expect(titles(container)).toEqual(['First task', 'Second task'])
  expect(
    screen.getByRole('button', { name: 'Complete First task' }),
  ).toBeInTheDocument()
})

test('Pro sorting keeps completed tasks last and search still finds them', () => {
  const { container } = render(<Harness />)
  add('First task')
  add('Second task')
  fireEvent.click(screen.getByRole('button', { name: 'Complete First task' }))
  act(() => jest.advanceTimersByTime(550))
  fireEvent.click(screen.getByRole('button', { name: 'Advanced', exact: true }))
  fireEvent.change(screen.getByLabelText('Sort tasks'), {
    target: { value: 'due' },
  })
  expect(titles(container)).toEqual(['Second task', 'First task'])
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search tasks' }), {
    target: { value: 'First' },
  })
  expect(
    screen.getByRole('button', { name: 'Reopen First task' }),
  ).toBeInTheDocument()
})

test('holding deletes a task and Undo restores the full task', () => {
  render(<Harness />)
  add('Keep my task')
  const button = screen.getByRole('button', {
    name: 'Hold to delete Keep my task',
  })
  fireEvent.click(button)
  expect(screen.getByText('Keep my task')).toBeInTheDocument()
  fireEvent.pointerDown(button, { button: 0, isPrimary: true, pointerId: 1 })
  act(() => jest.advanceTimersByTime(DELETE_HOLD_MS + 220))
  expect(screen.queryByText('Keep my task')).not.toBeInTheDocument()
  fireEvent.click(
    within(screen.getByRole('status')).getByRole('button', { name: 'Undo' }),
  )
  expect(
    screen.getByRole('button', { name: 'Complete Keep my task' }),
  ).toBeInTheDocument()
})

test('short holds, pointer cancellation, focus loss, and unmount never delete', () => {
  const onDelete = jest.fn()
  const view = render(<HoldToDelete title="Task" onDelete={onDelete} />)
  const button = screen.getByRole('button', { name: 'Hold to delete Task' })
  for (const cancel of ['pointerUp', 'pointerCancel', 'blur'] as const) {
    fireEvent.pointerDown(button, { button: 0, isPrimary: true })
    act(() => jest.advanceTimersByTime(DELETE_HOLD_MS - 1))
    fireEvent[cancel](button)
    act(() => jest.advanceTimersByTime(3000))
    expect(onDelete).not.toHaveBeenCalled()
    expect(button).toHaveClass('is-idle')
  }
  fireEvent.pointerDown(button, { button: 0, isPrimary: true })
  view.unmount()
  act(() => jest.advanceTimersByTime(3000))
  expect(onDelete).not.toHaveBeenCalled()
})

test('Space and Enter require a continuous hold and ignore key repeats', () => {
  const onDelete = jest.fn()
  render(<HoldToDelete title="Task" onDelete={onDelete} />)
  const button = screen.getByRole('button', { name: 'Hold to delete Task' })
  fireEvent.keyDown(button, { key: ' ' })
  act(() => jest.advanceTimersByTime(800))
  fireEvent.keyUp(button, { key: ' ' })
  act(() => jest.advanceTimersByTime(3000))
  expect(onDelete).not.toHaveBeenCalled()
  fireEvent.keyDown(button, { key: 'Enter' })
  act(() => jest.advanceTimersByTime(800))
  fireEvent.keyDown(button, { key: 'Enter', repeat: true })
  act(() => jest.advanceTimersByTime(800 + 220))
  fireEvent.keyUp(button, { key: 'Enter' })
  expect(onDelete).toHaveBeenCalledTimes(1)
})
