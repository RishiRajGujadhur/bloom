import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { HabitCalendar } from '../src/features/habits/HabitCalendar'
import { defaults } from '../src/model'

function Harness() {
  const [data, setData] = useState(() => ({
    ...defaults(),
    habits: [{ id: 'read', title: 'Read a page', detail: 'Wind down with a book', dates: [], stat: 'spirit' as const, color: '#16866b' }],
  }))
  return <HabitCalendar data={data} setData={setData} today="2026-10-01" />
}

test('selecting a calendar item shows its details and a real habit can be checked in', () => {
  render(<Harness />)
  fireEvent.click(screen.getByRole('button', { name: /Read a page, 2026-10-01/ }))
  expect(screen.getByRole('complementary', { name: 'Calendar item details' })).toHaveTextContent('Wind down with a book')
  fireEvent.click(screen.getByRole('button', { name: 'Check in' }))
  expect(screen.getByRole('complementary', { name: 'Calendar item details' })).toHaveTextContent('Checked in on this day')
  fireEvent.click(screen.getByRole('button', { name: /Book Hotel.*preview/ }))
  expect(screen.getByRole('complementary', { name: 'Calendar item details' })).toHaveTextContent('Feature preview')
  expect(screen.getByRole('button', { name: 'Confirm · soon' })).toBeDisabled()
})
