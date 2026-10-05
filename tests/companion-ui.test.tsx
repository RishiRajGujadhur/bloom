import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BloomCompanion } from '../src/companion/BloomCompanion'
import { ChatAppearanceSettings } from '../src/companion/chatAppearance'
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
  sessionStorage.clear()
  localStorage.removeItem('bloom-chat-avatar')
  localStorage.removeItem('bloom-chat-follow-theme')
  mockLoad.mockReset()
  mockInterpret.mockReset()
  mockDispose.mockReset()
})

test('planning suggestions stay capped at three and can be paged', () => {
  mount()
  const slider = screen.getByRole('group', { name: 'Planning prompts' })
  expect(slider.querySelectorAll('button')).toHaveLength(3)
})

test('mode controls have valid tab semantics and resize values follow keyboard changes', () => {
  mount()
  const panel = screen.getByRole('region', { name: 'Talk to Bloom' })
  for (const tab of screen.getAllByRole('tab')) {
    expect(tab).not.toHaveAttribute('aria-pressed')
    expect(document.getElementById(tab.getAttribute('aria-controls')!)).not.toBeNull()
  }
  jest.spyOn(panel, 'getBoundingClientRect').mockReturnValue({ width: 380 } as DOMRect)
  const resize = screen.getByRole('separator')
  fireEvent.keyDown(resize, { key: 'ArrowRight' })
  expect(resize).toHaveAttribute('aria-valuenow', '404')
  expect(resize).toHaveAttribute('aria-valuetext', '404 pixels wide')
  fireEvent.keyDown(resize, { key: 'Home' })
  expect(document.documentElement.style.getPropertyValue('--bc-width')).toBe('')
})

test('draft and conversation recover after remount, and clear can be undone', () => {
  const view = mount()
  fireEvent.click(screen.getByRole('button', { name: 'I have 40 minutes' }))
  fireEvent.change(screen.getByLabelText('Message Bloom'), { target: { value: 'An unsent thought' } })
  view.unmount()
  mount()
  expect(screen.getByLabelText('Message Bloom')).toHaveValue('An unsent thought')
  expect(screen.getByRole('log')).toHaveTextContent('I have 40 minutes')
  fireEvent.click(screen.getByRole('button', { name: 'Clear conversation' }))
  expect(screen.getByRole('log')).not.toHaveTextContent('I have 40 minutes')
  fireEvent.click(screen.getByRole('button', { name: 'Undo clear conversation' }))
  expect(screen.getByRole('log')).toHaveTextContent('I have 40 minutes')
})

test('copy failure offers a manual recovery path', async () => {
  mount()
  fireEvent.click(screen.getByRole('button', { name: 'I have 40 minutes' }))
  fireEvent.click(screen.getByRole('button', { name: /Copy Bloom reply/ }))
  await screen.findByText('Could not copy. Select the reply text and copy it manually.')
})

test('stopping generation preserves a newly typed draft and ignores the late reply', async () => {
  let finish!: (value: unknown) => void
  mockLoad.mockResolvedValue(undefined)
  mockInterpret.mockImplementation(() => new Promise((resolve) => { finish = resolve }))
  mount()
  fireEvent.click(screen.getByText('Try private, local AI'))
  fireEvent.click(screen.getByRole('button', { name: 'Download & enable local AI' }))
  await screen.findByText('Local AI · running on this device')
  fireEvent.click(screen.getByRole('button', { name: 'I have 40 minutes' }))
  fireEvent.change(screen.getByLabelText('Message Bloom'), { target: { value: 'My next question' } })
  fireEvent.click(screen.getByRole('button', { name: 'Stop generating' }))
  expect(screen.getByLabelText('Message Bloom')).toHaveValue('My next question')
  finish({ intent: 'chat', minutes: 40, energy: 'medium', message: 'Late reply' })
  await waitFor(() => expect(screen.queryByText('Late reply')).toBeNull())
})

test('chat appearance changes the avatar and follows the app theme persistently', () => {
  const view = mount()
  const settings = render(<ChatAppearanceSettings />)
  expect(screen.queryByText('Chat appearance')).not.toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Chat avatar'), { target: { value: 'robot' } })
  expect(screen.getByRole('img', { name: 'Bloom, your chat avatar' })).toBeVisible()
  expect(localStorage.getItem('bloom-chat-avatar')).toBe('robot')
  fireEvent.click(screen.getByLabelText('Use my app theme for Bloom chat'))
  expect(screen.getByRole('region', { name: 'Talk to Bloom' })).toHaveClass('uses-app-theme')
  settings.unmount()
  view.unmount()
  render(<ChatAppearanceSettings />)
  mount()
  expect(screen.getByLabelText('Chat avatar')).toHaveValue('robot')
  expect(screen.getByLabelText('Use my app theme for Bloom chat')).toBeChecked()
  expect(screen.getByRole('region', { name: 'Talk to Bloom' })).toHaveClass('uses-app-theme')
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
      initialMode="plan"
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
