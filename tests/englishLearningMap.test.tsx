import { render, screen, fireEvent } from '@testing-library/react'
import { LearningMap } from '../src/features/english/LearningMap'
import { emptyEnglish } from '../src/features/english/englishModel'
jest.mock('../src/features/english/englishNlp', () => ({ pick: jest.fn(), seeded: jest.fn(), shuffle: jest.fn() }))

test('locked topics and future topics never start a lesson', () => {
  const start = jest.fn()
  render(<LearningMap store={emptyEnglish} onStart={start} />)
  fireEvent.click(screen.getByRole('button', { name: 'Food: locked' }))
  expect(screen.getByRole('status')).toHaveTextContent('Complete Hello! to unlock it')
  fireEvent.click(screen.getByRole('button', { name: 'Family: coming soon' }))
  expect(screen.getByRole('status')).toHaveTextContent('Family is coming soon')
  expect(start).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Start Hello! lesson 1' }))
  expect(start).toHaveBeenCalledWith(0)
})

test('saved progress selects the next unit and completed units remain available for review', () => {
  const start = jest.fn()
  render(<LearningMap store={{ ...emptyEnglish, done: { hello: 4, food: 2 } }} onStart={start} />)
  fireEvent.click(screen.getByRole('button', { name: 'Start Food & drink lesson 3' }))
  expect(start).toHaveBeenLastCalledWith(1)
  fireEvent.change(screen.getByRole('combobox', { name: 'Choose a unit' }), { target: { value: '0' } })
  fireEvent.click(screen.getByRole('button', { name: 'Start Hello! lesson 1' }))
  expect(start).toHaveBeenLastCalledWith(0)
})
