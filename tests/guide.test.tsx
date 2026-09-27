import { act, fireEvent, render, screen } from '@testing-library/react'
import { BloomGuide } from '../src/companion/BloomGuide'

jest.useFakeTimers()
const names = (p: string) => ({ games: 'Brain games', focus: 'Focus', todos: 'To-dos' })[p] ?? p

test('the guide offers page-specific choices and can navigate', () => {
  const navigate = jest.fn()
  render(<BloomGuide page="games" names={names} enabled={() => true} navigate={navigate} onPlan={jest.fn()} />)
  expect(screen.getByText(/brain gym/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Take the IQ-style test' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Which game should I play?' }))
  act(() => void jest.advanceTimersByTime(700))
  expect(screen.getByRole('button', { name: 'Empathy (EQ)' })).toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText(/type where you want to go/), { target: { value: 'focus' } })
  fireEvent.click(screen.getByRole('button', { name: 'Focus Today' }))
  act(() => void jest.advanceTimersByTime(700))
  expect(navigate).toHaveBeenCalledWith('focus')
})

test('other pages get their own choices', () => {
  render(<BloomGuide page="focus" names={names} enabled={() => true} navigate={jest.fn()} onPlan={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Start 25 minutes' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Take the IQ-style test' })).toBeNull()
})
