import { fireEvent, render, screen } from '@testing-library/react'
import { WelcomeFlow } from '../src/features/welcome/WelcomeFlow'
import { configure, configureSubs, questions, themeFor } from '../src/features/welcome/welcomeModel'
import { defaultSettings, featureKeys } from '../src/SettingsPage'

test('answers configure features, options and theme', () => {
  const f = configure({ goals: ['focus', 'mind'], style: ['minimal'], celebrate: ['quiet'], time: ['2'] }, featureKeys, defaultSettings.features)
  expect(f.brainGames).toBe(true)
  expect(f.focusRoom).toBe(true)
  expect(f.celebrations).toBe(false)
  expect(f.compactMode).toBe(true)
  const everything = configure({ style: ['explorer'] }, featureKeys, defaultSettings.features)
  expect(featureKeys.every((k) => everything[k])).toBe(true)
  expect(configureSubs({ celebrate: ['quiet'] })['pointerFx.effects']).toBe(false)
  expect(themeFor({ theme: ['nord'] })).toBe('nord')
})

test('the flow asks every question and finishes with the answers', () => {
  const done = jest.fn()
  render(<WelcomeFlow onFinish={done} onSkip={() => undefined} preview={() => ({ names: ['Focus'], features: null })} />)
  expect(screen.getByText('Hi, I’m Bloom!')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  for (const q of questions) {
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled()
    fireEvent.click(screen.getAllByRole(q.multi ? 'checkbox' : 'radio')[0])
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
  }
  return new Promise<void>((resolve) =>
    setTimeout(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Let’s bloom' }))
      expect(done).toHaveBeenCalledWith(expect.objectContaining({ goals: ['focus'], theme: ['bloom-light'] }))
      resolve()
    }, 900),
  )
})
