import { act, fireEvent, render, screen, within } from '@testing-library/react'
import App from '../src/App'
import { JournalContainer } from '../src/components/daybook/JournalContainer'
import { STORAGE_KEY } from '../src/model'

beforeEach(() => {
  localStorage.clear()
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})
test('accepting a challenge creates visible tasks and a goal, which survive reload', () => {
  const view = render(<App />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Challenges', exact: true }),
  )
  const card = screen
    .getByRole('heading', { name: 'Small beginnings' })
    .closest('article')!
  fireEvent.click(
    within(card).getByRole('button', { name: /Accept challenge/ }),
  )
  expect(screen.getByRole('status')).toHaveTextContent('3 tasks added')
  fireEvent.click(within(card).getByRole('button', { name: /View tasks/ }))
  expect(screen.getByText('Choose one small habit')).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Complete Choose one small habit' }),
  )
  view.unmount()
  render(<App />)
  fireEvent.click(
    screen.getByRole('button', { name: /Completed/, exact: false }),
  )
  expect(screen.getByText('Choose one small habit')).toBeInTheDocument()
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).challenges,
  ).toHaveLength(1)
})
test('a task supports priorities, tags, recurrence, and an actionable checklist', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: 'Pro', exact: true }))
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: 'Prepare the presentation' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Details/ }))
  fireEvent.change(screen.getByLabelText('Priority'), {
    target: { value: 'P1' },
  })
  fireEvent.change(screen.getByLabelText('Repeat'), {
    target: { value: 'weekly' },
  })
  fireEvent.change(screen.getByLabelText('Tags'), {
    target: { value: '#deep-work, client' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
  expect(screen.getByText('P1')).toBeInTheDocument()
  expect(screen.getAllByText('#deep-work')).toHaveLength(2)
  expect(screen.getByText('weekly')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Add steps' }))
  fireEvent.change(
    screen.getByRole('textbox', {
      name: 'New step for Prepare the presentation',
    }),
    { target: { value: 'Draft the story' } },
  )
  fireEvent.click(screen.getByRole('button', { name: 'Add step' }))
  fireEvent.click(
    screen.getByRole('button', { name: 'Complete Draft the story' }),
  )
  expect(screen.getByText('Draft the story')).toHaveClass('completed-copy')
})
test('focus keeps running after navigation and awards its tree when the session ends', async () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Focus', exact: true }))
  fireEvent.click(screen.getByRole('button', { name: '5 min' }))
  fireEvent.click(screen.getByRole('button', { name: 'Start focus' }))
  fireEvent.click(screen.getByRole('button', { name: 'My dashboard' }))
  await act(async () => {
    jest.advanceTimersByTime(300000)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Focus', exact: true }))
  expect(screen.getByRole('status')).toHaveTextContent('Tree planted')
  expect(
    JSON.parse(localStorage.getItem(STORAGE_KEY)!).rpg.focusHistory,
  ).toHaveLength(1)
})
test('Daybook reveals one category and one prompt at a time', () => {
  render(<JournalContainer />)
  expect(screen.queryByPlaceholderText('Search modes')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Reflect', exact: true }))
  expect(
    screen.queryByRole('button', { name: /Bullet Journal/ }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Nightly Reflection/ }))
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  expect(screen.getByText(/Prompt 1 of/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next', exact: true }))
  expect(screen.getAllByRole('textbox')).toHaveLength(1)
  expect(screen.getByText(/Prompt 2 of/)).toBeInTheDocument()
})

test('todos default to simple and remember Pro without losing tasks', () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true }))
  expect(
    screen.getByRole('button', { name: 'Simple', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  expect(screen.queryByText('Planning workspace')).not.toBeInTheDocument()
  fireEvent.change(screen.getByRole('textbox', { name: 'New task' }), {
    target: { value: 'Take a walk' },
  })
  fireEvent.click(screen.getByRole('button', { name: /^Add$/ }))
  expect(
    screen.queryByRole('button', { name: 'Add steps' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Pro', exact: true }))
  expect(screen.getByText('Planning workspace')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Add steps' })).toBeInTheDocument()
  view.unmount()
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'To-dos', exact: true }))
  expect(
    screen.getByRole('button', { name: 'Pro', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  fireEvent.click(screen.getByRole('button', { name: 'Simple', exact: true }))
  expect(screen.getByText('Take a walk')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Add steps' }),
  ).not.toBeInTheDocument()
})
