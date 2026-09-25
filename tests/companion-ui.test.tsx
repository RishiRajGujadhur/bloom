import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BloomCompanion } from '../src/companion/BloomCompanion'
import { defaults, taskSchema } from '../src/model'

const mockLoad = jest.fn()
const mockInterpret = jest.fn()
const mockDispose = jest.fn()
jest.mock('../src/companion/localAI', () => ({
  LocalCompanion: class {
    load = mockLoad
    interpret = mockInterpret
    dispose = mockDispose
  },
}))

beforeEach(() => {
  mockLoad.mockReset()
  mockInterpret.mockReset()
  mockDispose.mockReset()
})
function mount() {
  const data = defaults()
  data.todos = [
    taskSchema.parse({
      id: 'task',
      title: 'Write one paragraph',
      due: '',
      done: false,
      challengeId: null,
      planning: { minutes: 15 },
    }),
  ]
  return render(
    <BloomCompanion
      data={data}
      setData={jest.fn()}
      navigate={jest.fn()}
      blocked={false}
      open
      onOpen={jest.fn()}
      onClose={jest.fn()}
    />,
  )
}

test('local AI is opt-in and a valid interpretation produces a reviewable plan', async () => {
  mockLoad.mockResolvedValue(undefined)
  mockInterpret.mockResolvedValue({
    intent: 'plan',
    minutes: 25,
    energy: 'low',
    message: 'One small step is enough.',
  })
  mount()
  expect(mockLoad).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText('Try private, local AI'))
  fireEvent.click(
    screen.getByRole('button', { name: 'Download & enable local AI' }),
  )
  await screen.findByText('Local AI · running on this device')
  fireEvent.change(screen.getByLabelText('Message Bloom'), {
    target: { value: 'Help me get started' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Send to Bloom' }))
  await screen.findByText('One small step is enough.')
  expect(screen.getByText('Write one paragraph')).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'Add to today’s intentions' }),
  ).toBeEnabled()
  expect(mockInterpret).toHaveBeenCalledTimes(1)
})

test('failed generation frees the model and falls back to a useful plan', async () => {
  mockLoad.mockResolvedValue(undefined)
  mockInterpret.mockRejectedValue(new Error('Model failed'))
  mount()
  fireEvent.click(screen.getByText('Try private, local AI'))
  fireEvent.click(
    screen.getByRole('button', { name: 'Download & enable local AI' }),
  )
  await screen.findByText('Local AI · running on this device')
  fireEvent.click(screen.getByRole('button', { name: 'I have 40 minutes' }))
  await screen.findByText(/Local AI could not finish/)
  expect(mockDispose).toHaveBeenCalledTimes(1)
  expect(screen.getByText('Your next small steps')).toBeVisible()
  expect(
    screen.getByText('Lightweight planner · no model needed'),
  ).toBeVisible()
  expect(
    screen.getByRole('button', { name: 'I have 40 minutes' }),
  ).toBeEnabled()
})

test('shows generation activity until the local response finishes', async () => {
  let finish!: (value: unknown) => void
  mockLoad.mockResolvedValue(undefined)
  mockInterpret.mockImplementation((_text, _context, _history, onActivity) => {
    onActivity(1)
    return new Promise((resolve) => {
      finish = resolve
    })
  })
  mount()
  fireEvent.click(screen.getByText('Try private, local AI'))
  fireEvent.click(
    screen.getByRole('button', { name: 'Download & enable local AI' }),
  )
  await screen.findByText('Local AI · running on this device')
  fireEvent.click(screen.getByRole('button', { name: 'I have 40 minutes' }))
  await screen.findByText('Bloom is writing…')
  finish({
    intent: 'chat',
    minutes: 40,
    energy: 'medium',
    message: 'Hello there.',
  })
  await screen.findByText('Hello there.')
  expect(screen.queryByText('Bloom is writing…')).not.toBeInTheDocument()
})

test('cancelling a download ignores a late model completion', async () => {
  let resolveLoad!: () => void
  mockLoad.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        resolveLoad = resolve
      }),
  )
  mount()
  fireEvent.click(screen.getByText('Try private, local AI'))
  fireEvent.click(
    screen.getByRole('button', { name: 'Download & enable local AI' }),
  )
  await waitFor(() => expect(mockLoad).toHaveBeenCalledTimes(1))
  fireEvent.click(screen.getByRole('button', { name: 'Cancel download' }))
  resolveLoad()
  await waitFor(() =>
    expect(
      screen.queryByText('Local AI · running on this device'),
    ).not.toBeInTheDocument(),
  )
  expect(mockDispose).toHaveBeenCalledTimes(1)
})
