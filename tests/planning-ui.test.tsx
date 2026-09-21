import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { defaults, taskSchema } from '../src/model'
import { TodoPage } from '../src/features/ProductivityPages'
import { CalendarPage } from '../src/features/CalendarPage'
import App from '../src/App'

beforeEach(() => {
  localStorage.clear()
  window.location.hash = ''
})

function Tasks() {
  const [data, setData] = useState(defaults)
  return <TodoPage data={data} setData={setData} />
}
function Calendar() {
  const [data, setData] = useState(() => ({
    ...defaults(),
    todos: [
      taskSchema.parse({
        id: 'write',
        title: 'Write proposal',
        due: '2026-09-21',
        done: false,
        challengeId: null,
        planning: { minutes: 90, deepWork: true },
      }),
    ],
  }))
  return <CalendarPage data={data} setData={setData} />
}

test('projects, task metadata, and custom perspectives work together', () => {
  render(<Tasks />)
  fireEvent.click(screen.getByRole('button', { name: 'New project' }))
  fireEvent.change(screen.getByLabelText('Project name'), {
    target: { value: 'Launch' },
  })
  fireEvent.change(screen.getByLabelText('Action order'), {
    target: { value: 'sequential' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save project' }))
  fireEvent.change(screen.getByLabelText('New task'), {
    target: { value: 'Draft proposal' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Details/ }))
  const projectSelect = screen.getByLabelText('Project') as HTMLSelectElement
  fireEvent.change(projectSelect, {
    target: { value: projectSelect.options[1].value },
  })
  fireEvent.change(screen.getByLabelText('Context', { exact: true }), {
    target: { value: 'Office' },
  })
  fireEvent.change(screen.getByLabelText('Energy', { exact: true }), {
    target: { value: 'high' },
  })
  fireEvent.change(screen.getByLabelText('Time of day', { exact: true }), {
    target: { value: 'morning' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Add', exact: true }))
  fireEvent.change(screen.getByLabelText('Filter energy'), {
    target: { value: 'low' },
  })
  expect(screen.queryByText('Draft proposal')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Filter energy'), {
    target: { value: 'high' },
  })
  fireEvent.change(screen.getByLabelText('Filter time of day'), {
    target: { value: 'morning' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Save perspective' }))
  fireEvent.change(screen.getByLabelText('Perspective name'), {
    target: { value: 'Morning focus' },
  })
  fireEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', {
      name: 'Save perspective',
    }),
  )
  fireEvent.change(screen.getByLabelText('Perspective', { exact: true }), {
    target: { value: '' },
  })
  const perspectives = screen.getByLabelText('Perspective', {
    exact: true,
  }) as HTMLSelectElement
  fireEvent.change(perspectives, {
    target: { value: perspectives.options[1].value },
  })
  expect(screen.getByLabelText('Filter energy')).toHaveValue('high')
  expect(screen.getByLabelText('Filter time of day')).toHaveValue('morning')
  expect(screen.getByText('Draft proposal')).toBeVisible()
})

test('calendar schedules a task, counts deep work, edits duration, and unschedules without deleting the task', () => {
  render(<Calendar />)
  fireEvent.click(
    screen.getByRole('button', { name: 'Schedule Write proposal' }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Save block' }))
  expect(screen.getByRole('status')).toHaveTextContent('Time block saved')
  expect(screen.getAllByText('1.5h')).toHaveLength(2)
  expect(
    screen.queryByRole('button', { name: 'Schedule Write proposal' }),
  ).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Write proposal', exact: true }),
  )
  fireEvent.click(screen.getByRole('button', { name: 'Unschedule' }))
  expect(
    screen.getByRole('button', { name: 'Schedule Write proposal' }),
  ).toBeVisible()
})

test('calendar feature toggle persists and a disabled deep link cannot show the calendar', () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Settings', exact: true }))
  fireEvent.click(
    screen.getByRole('checkbox', { name: 'Enable Full calendar' }),
  )
  expect(
    screen.queryByRole('button', { name: 'Full calendar', exact: true }),
  ).not.toBeInTheDocument()
  view.unmount()
  window.location.hash = '#calendar'
  render(<App />)
  expect(
    screen.getByRole('heading', { name: 'This feature is turned off' }),
  ).toBeVisible()
})
