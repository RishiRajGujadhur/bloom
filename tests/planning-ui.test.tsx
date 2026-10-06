import { changeField, dropdownValues } from './helpers/dropdown'
import { useState } from 'react'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { defaults, taskSchema } from '../src/model'
import { TodoPage } from '../src/features/ProductivityPages'
import { CalendarPage } from '../src/features/CalendarPage'
import { renderApp } from './helpers/renderApp'

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

test('projects, task metadata, and custom perspectives work together', async () => {
  render(<Tasks />)
  await act(async () => {
    localStorage.setItem('bloom-page-mode:todos', 'advanced')
    window.dispatchEvent(new Event('bloom-page-mode-change'))
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'New project' }))
  })
  changeField(screen.getByLabelText('Project name'), {
    target: { value: 'Launch' },
  })
  changeField(screen.getByLabelText('Action order'), {
    target: { value: 'sequential' },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save project' }))
  })
  changeField(screen.getByLabelText('New task'), {
    target: { value: 'Draft proposal' },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /Details/ }))
  })
  const projectSelect = screen.getByLabelText('Project') as HTMLSelectElement
  changeField(projectSelect, {
    target: { value: dropdownValues(projectSelect)[1] },
  })
  changeField(screen.getByLabelText('Context', { exact: true }), {
    target: { value: 'Office' },
  })
  changeField(screen.getByLabelText('Energy', { exact: true }), {
    target: { value: 'high' },
  })
  changeField(screen.getByLabelText('Time of day', { exact: true }), {
    target: { value: 'morning' },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add', exact: true }))
  })
  changeField(screen.getByLabelText('Filter energy'), {
    target: { value: 'low' },
  })
  expect(screen.queryByText('Draft proposal')).not.toBeInTheDocument()
  changeField(screen.getByLabelText('Filter energy'), {
    target: { value: 'high' },
  })
  changeField(screen.getByLabelText('Filter time of day'), {
    target: { value: 'morning' },
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save perspective' }))
  })
  changeField(screen.getByLabelText('Perspective name'), {
    target: { value: 'Morning focus' },
  })
  await act(async () => {
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Save perspective',
      }),
    )
  })
  changeField(screen.getByLabelText('Perspective', { exact: true }), {
    target: { value: '' },
  })
  const perspectives = screen.getByLabelText('Perspective', {
    exact: true,
  }) as HTMLSelectElement
  changeField(perspectives, {
    target: { value: dropdownValues(perspectives)[1] },
  })
  expect(screen.getByLabelText('Filter energy')).toHaveAttribute(
    'data-value',
    'high',
  )
  expect(screen.getByLabelText('Filter time of day')).toHaveAttribute(
    'data-value',
    'morning',
  )
  expect(screen.getByText('Draft proposal')).toBeVisible()
})

test('calendar schedules a task, counts deep work, edits duration, and unschedules without deleting the task', async () => {
  render(<Calendar />)
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Schedule Write proposal' }),
    )
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Save block' }))
  })
  expect(screen.getByRole('status')).toHaveTextContent('Time block saved')
  expect(screen.getAllByText('1.5h')).toHaveLength(2)
  expect(
    screen.queryByRole('button', { name: 'Schedule Write proposal' }),
  ).not.toBeInTheDocument()
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Write proposal', exact: true }),
    )
  })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Unschedule' }))
  })
  expect(
    screen.getByRole('button', { name: 'Schedule Write proposal' }),
  ).toBeVisible()
})

test('calendar feature toggle persists and a disabled deep link cannot show the calendar', async () => {
  const view = await renderApp()
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Settings', exact: true }),
    )
  })
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: 'Advanced', exact: true }),
    )
  })
  await act(async () => {
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'Enable Full calendar' }),
    )
  })
  expect(
    screen.queryByRole('button', { name: 'Full calendar', exact: true }),
  ).not.toBeInTheDocument()
  view.unmount()
  window.location.hash = '#calendar'
  await renderApp()
  expect(
    screen.getByRole('heading', { name: 'This feature is turned off' }),
  ).toBeVisible()
})
