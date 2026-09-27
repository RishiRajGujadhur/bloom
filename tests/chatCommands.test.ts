import { runCommand } from '../src/companion/chatCommands'
import { setQuiz } from '../src/companion/quizContext'
import { MONEY_KEY } from '../src/features/money/moneyModel'

const ctx = () => ({ navigate: jest.fn(), clear: jest.fn(), setData: jest.fn() })

beforeEach(() => localStorage.clear())

test('logs an expense from chat', () => {
  const r = runCommand('spent 12.50 on lunch', ctx())
  expect(r?.reply).toMatch(/Added/)
  const store = JSON.parse(localStorage.getItem(MONEY_KEY) ?? '{}')
  expect(store.txns[0]).toMatchObject({ amount: 1250, place: 'Lunch' })
})

test('understands "coffee 4.20"', () => {
  expect(runCommand('coffee 4.20', ctx())?.reply).toMatch(/Added/)
})

test('adds a todo', () => {
  const c = ctx()
  expect(runCommand('add todo call mum', c)?.reply).toMatch(/call mum/)
  expect(c.setData).toHaveBeenCalled()
})

test('gives progressive quiz hints', () => {
  expect(runCommand('hint', ctx())?.reply).toMatch(/no question/i)
  setQuiz({ source: 't', question: 'Which is apple?', answer: 'apple', options: ['apple', 'bread', 'rice'] })
  expect(runCommand('hint', ctx())?.reply).toMatch(/5 letters/)
  expect(runCommand('hint', ctx())?.reply).toMatch(/not/)
  expect(runCommand('answer', ctx())?.reply).toMatch(/apple/)
})

test('unknown text falls through', () => {
  expect(runCommand('journal', ctx())).toBeNull()
})

test('logs mood and gratitude', () => {
  expect(runCommand('mood 4', ctx())?.reply).toMatch(/Good/)
  expect(runCommand('I feel awful', ctx())?.reply).toMatch(/breathing/)
  expect(runCommand('grateful for sunshine', ctx())?.reply).toMatch(/sunshine/)
})
