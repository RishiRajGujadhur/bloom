import { act, fireEvent, render, screen } from '@testing-library/react'
import { BloomGuide } from '../src/companion/BloomGuide'
import { setQuiz } from '../src/companion/quizContext'

jest.useFakeTimers()
beforeEach(() => { sessionStorage.clear(); setQuiz(null) })
const names = (p: string) => ({ games: 'Brain games', focus: 'Focus', todos: 'To-dos' })[p] ?? p

test('the guide offers page-specific choices and can navigate', () => {
  const navigate = jest.fn()
  render(<BloomGuide page="games" names={names} enabled={() => true} navigate={navigate} onPlan={jest.fn()} />)
  expect(screen.getByText(/brain gym/)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Take the IQ-style test' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Which game should I play?' }))
  act(() => void jest.advanceTimersByTime(700))
  expect(screen.getByRole('button', { name: 'Empathy (EQ)' })).toBeInTheDocument()
  fireEvent.change(screen.getByPlaceholderText(/Ask Bloom/), { target: { value: 'focus' } })
  fireEvent.click(screen.getByRole('button', { name: 'Focus Today' }))
  act(() => void jest.advanceTimersByTime(700))
  expect(navigate).toHaveBeenCalledWith('focus')
})

test('other pages get their own choices', () => {
  render(<BloomGuide page="focus" names={names} enabled={() => true} navigate={jest.fn()} onPlan={jest.fn()} />)
  expect(screen.getByRole('button', { name: 'Start 25 minutes' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Take the IQ-style test' })).toBeNull()
})

test('guide action paging keeps only three suggestions in the focus order', () => {
  render(<BloomGuide page="games" names={names} enabled={() => true} navigate={jest.fn()} onPlan={jest.fn()} />)
  const choices = screen.getByRole('group', { name: 'Choices' })
  expect(choices.querySelectorAll('button')).toHaveLength(3)
  expect(screen.queryByRole('button', { name: 'Show my leaderboard' })).toBeNull()
  fireEvent.change(screen.getByRole('slider', { name: 'Browse choices' }), { target: { value: '1' } })
  expect(screen.getByRole('button', { name: 'Show my leaderboard' })).toBeVisible()
  expect(choices.querySelectorAll('button')).toHaveLength(3)
})

test('guide ignores Enter while an IME composition is active', () => {
  const navigate = jest.fn()
  render(<BloomGuide page="focus" names={names} enabled={() => true} navigate={navigate} onPlan={jest.fn()} />)
  const input = screen.getByRole('searchbox')
  fireEvent.change(input, { target: { value: 'games' } })
  fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
  act(() => void jest.advanceTimersByTime(700))
  expect(navigate).not.toHaveBeenCalled()
  expect(input).toHaveValue('games')
})

test('quiz help shares the capped slider with normal choices', () => {
  setQuiz({ source: 'lesson', question: 'A greeting?', answer: 'hello' })
  render(<BloomGuide page="games" names={names} enabled={() => true} navigate={jest.fn()} onPlan={jest.fn()} />)
  const choices = screen.getByRole('group', { name: 'Choices' })
  expect(choices.querySelectorAll('button')).toHaveLength(3)
  expect(screen.getByRole('button', { name: 'Hint', exact: true })).toBeVisible()
  expect(screen.queryByRole('button', { name: 'Take the IQ-style test' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Hint', exact: true }))
  act(() => void jest.advanceTimersByTime(700))
  expect(screen.getByText(/It has 5 letters/)).toBeInTheDocument()
})

test('guide shows restored text literally without executing markup', () => {
  sessionStorage.setItem('bloom-guide-lines', JSON.stringify([{ from: 'you', text: '<img src=x onerror=alert(1)>' }]))
  render(<BloomGuide page="focus" names={names} enabled={() => true} navigate={jest.fn()} onPlan={jest.fn()} />)
  expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
  expect(document.querySelector('.bg-guide-chat img')).toBeNull()
})
