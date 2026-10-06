import { fireEvent, render, screen } from '@testing-library/react'
import { ExercisePage } from '../src/features/exercise/ExercisePage'

test('bounds illustrated cards while paging and searching the full library', () => {
  localStorage.clear()
  const view = render(<ExercisePage />)
  const cards = () => [...view.container.querySelectorAll('.ex-card-main strong')].map(node => node.textContent)
  const first = cards()
  expect(first).toHaveLength(12)
  fireEvent.click(screen.getByRole('button', { name: 'Next movements' }))
  expect(cards()).toHaveLength(12)
  expect(cards()).not.toEqual(first)
  fireEvent.click(screen.getByRole('button', { name: 'Previous movements' }))
  expect(cards()).toEqual(first)
  fireEvent.click(screen.getByRole('button', { name: 'Next movements' }))
  const laterName = cards()[0]!
  fireEvent.change(screen.getByPlaceholderText('Try seated, elbow, or shoulder'), { target: { value: laterName } })
  expect(cards()).toContain(laterName)
  expect(cards().length).toBeLessThanOrEqual(12)
  view.unmount()
})
