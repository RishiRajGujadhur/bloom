import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { renderApp } from './helpers/renderApp'
import { JournalContainer } from '../src/components/daybook/JournalContainer'
import { STORAGE_KEY } from '../src/model'

beforeEach(() => {
  localStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})
test('accepting a challenge creates visible tasks and a goal, which survive reload', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: 'Challenges', exact: true }),
  ) })
  const card = screen
    .getByRole('heading', { name: 'Small beginnings' })
    .closest('article')!
  await act(async () => { fireEvent.click(
    within(card).getByRole('button', { name: /Accept challenge/ }),
  ) })
  expect(screen.getByRole('status')).toHaveTextContent('3 tasks added')
  await act(async () => { fireEvent.click(within(card).getByRole('button', { name: /View tasks/ })) })
  expect(screen.getByText('Choose one small habit')).toBeInTheDocument()
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: 'Complete Choose one small habit' }),
  ) })
  view.unmount()
  await renderApp()
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: /Completed/, exact: false }),
  ) })
  expect(screen.getByText('Choose one small habit')).toBeInTheDocument()
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).challenges,
  ).toHaveLength(1)
})
test('a task supports priorities, tags, recurrence, and an actionable checklist', async () => {
  await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true })) })
  await act(async () => { localStorage.setItem('bloom-page-mode:todos', 'advanced'); window.dispatchEvent(new Event('bloom-page-mode-change')) })
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: 'Prepare the presentation' },
  })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Details/ })) })
  fireEvent.change(screen.getByLabelText('Priority'), {
    target: { value: 'P1' },
  })
  fireEvent.change(screen.getByLabelText('Repeat'), {
    target: { value: 'weekly' },
  })
  fireEvent.change(screen.getByLabelText('Tags'), {
    target: { value: '#deep-work, client' },
  })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Add$/ })) })
  expect(screen.getByText('P1')).toBeInTheDocument()
  expect(screen.getAllByText('#deep-work')).toHaveLength(2)
  expect(screen.getByText('weekly')).toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Add steps' })) })
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'New step for Prepare the presentation',
    }),
    { target: { value: 'Draft the story' } },
  )
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Add step' })) })
  await act(async () => { fireEvent.click(
    screen.getByRole('button', { name: 'Complete Draft the story' }),
  ) })
  expect(screen.getByText('Draft the story')).toHaveClass('completed-copy')
})
test('focus keeps running after navigation and awards its tree when the session ends', async () => {
  await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Focus', exact: true })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: '5 min' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Start focus' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'My dashboard' })) })
  await act(async () => {
    jest.advanceTimersByTime(300000)
  })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Focus', exact: true })) })
  expect(screen.getByRole('status')).toHaveTextContent('Tree planted')
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).rpg.focusHistory,
  ).toHaveLength(1)
})
test('Daybook reveals one category and one prompt at a time', async () => {
  render(<JournalContainer />)
  expect(screen.queryByPlaceholderText('Search modes')).not.toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reflect', exact: true })) })
  expect(
    screen.queryByRole('button', { name: /Bullet Journal/ }),
  ).not.toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Nightly Reflection/ })) })
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  expect(screen.getByText(/Prompt 1 of/)).toBeInTheDocument()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true })) })
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  expect(screen.getByText(/Prompt 2 of/)).toBeInTheDocument()
})

test('todos default to simple and remember Pro without losing tasks', async () => {
  const view = await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true })) })
  expect(screen.queryByRole('group', { name: 'Page mode' })).not.toBeInTheDocument()
  expect(screen.queryByText('Planning workspace')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: 'Take a walk' },
  })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /^Add$/ })) })
  expect(
    screen.queryByRole('button', { name: 'Add steps' }),
  ).not.toBeInTheDocument()
  await act(async () => { localStorage.setItem('bloom-page-mode:todos', 'advanced'); window.dispatchEvent(new Event('bloom-page-mode-change')) })
  expect(screen.getByText('Planning workspace')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add steps' })).toBeInTheDocument()
  view.unmount()
  await renderApp()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true })) })
  expect(screen.getByText('Planning workspace')).toBeInTheDocument()
  await act(async () => { localStorage.setItem('bloom-page-mode:todos', 'basic'); window.dispatchEvent(new Event('bloom-page-mode-change')) })
  expect(screen.getByText('Take a walk')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Add steps' }),
  ).not.toBeInTheDocument()
})
