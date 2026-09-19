import { act, fireEvent, render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import {
  AudioMixerProvider,
  useAudioMixer,
} from '../src/contexts/AudioMixerContext'
import { AudioMixer } from '../src/components/AudioMixer'
import { audioTracks } from '../src/types/audio'

const mockSounds: any[] = []
jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation((options: any) => {
    let volume = 0,
      playing = false
    const sound: any = {
      options,
      state: jest.fn(() => 'loaded'),
      volume: jest.fn((value?: number) => {
        if (value !== undefined) volume = value
        return volume
      }),
      playing: jest.fn(() => playing),
      play: jest.fn(() => {
        playing = true
        return 1
      }),
      pause: jest.fn(() => {
        playing = false
      }),
      fade: jest.fn((_from: number, to: number) => {
        volume = to
      }),
      unload: jest.fn(),
      load: jest.fn(),
    }
    mockSounds.push(sound)
    return sound
  }),
}))

beforeEach(() => {
  mockSounds.length = 0
  jest.useFakeTimers()
})
afterEach(() => {
  jest.useRealTimers()
})

test('presets stay silent until play, crossfade, and cancel stale pauses', () => {
  const { unmount } = render(
    <AudioMixerProvider>
      <AudioMixer />
    </AudioMixerProvider>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Soundscape' }))
  fireEvent.click(screen.getByRole('button', { name: 'Nightly Reflection' }))
  expect(mockSounds).toHaveLength(audioTracks.length)
  for (const sound of mockSounds) {
    expect(sound.options).toEqual(
      expect.objectContaining({ loop: true, preload: true }),
    )
    expect(sound.play).not.toHaveBeenCalled()
  }
  fireEvent.click(screen.getByRole('button', { name: 'Play soundscape' }))
  const piano =
    mockSounds[audioTracks.findIndex((track) => track.id === 'piano')]
  expect(piano.play).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Deep Work Focus' }))
  expect(piano.fade).toHaveBeenLastCalledWith(0.5, 0, 1000)
  fireEvent.click(screen.getByRole('button', { name: 'Nightly Reflection' }))
  act(() => jest.advanceTimersByTime(1100))
  expect(piano.pause).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Mute Classical Piano' }))
  act(() => jest.advanceTimersByTime(110))
  expect(piano.pause).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('slider', { name: /Classical Piano/ })).toHaveValue(
    '0.5',
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Unmute Classical Piano' }),
  )
  expect(piano.play).toHaveBeenCalledTimes(2)
  fireEvent.click(screen.getByRole('button', { name: 'Close sound mixer' }))
  expect(piano.unload).not.toHaveBeenCalled()
  unmount()
  for (const sound of mockSounds) expect(sound.unload).toHaveBeenCalledTimes(1)
  expect(jest.getTimerCount()).toBe(0)
})

test('delayed loading does not start playback after the user pauses', () => {
  function Controls() {
    const mixer = useAudioMixer()
    return <button onClick={mixer.toggleMasterPlay}>Toggle audio</button>
  }
  const view = render(
    <AudioMixerProvider>
      <Controls />
    </AudioMixerProvider>,
  )
  mockSounds.forEach((sound) => sound.state.mockReturnValue('loading'))
  fireEvent.click(screen.getByRole('button', { name: 'Toggle audio' }))
  fireEvent.click(screen.getByRole('button', { name: 'Toggle audio' }))
  act(() =>
    mockSounds.forEach((sound) => {
      sound.state.mockReturnValue('loaded')
      sound.options.onload()
    }),
  )
  for (const sound of mockSounds) expect(sound.play).not.toHaveBeenCalled()
  view.unmount()
})

test('volume clamps input, ignores unknown tracks and unloads on strict remount', () => {
  function Controls() {
    const mixer = useAudioMixer()
    return (
      <>
        <button
          onClick={() => {
            mixer.setTrackVolume('rain', 4)
            mixer.setTrackVolume('missing', 1)
            mixer.setTrackVolume('rain', NaN)
          }}
        >
          Change
        </button>
        <output data-testid="level">{mixer.volumes.rain}</output>
      </>
    )
  }
  const view = render(
    <StrictMode>
      <AudioMixerProvider>
        <Controls />
      </AudioMixerProvider>
    </StrictMode>,
  )
  expect(mockSounds).toHaveLength(audioTracks.length * 2)
  fireEvent.click(screen.getByRole('button', { name: 'Change' }))
  expect(screen.getByTestId('level')).toHaveTextContent('1')
  view.unmount()
  for (const sound of mockSounds) expect(sound.unload).toHaveBeenCalledTimes(1)
})
