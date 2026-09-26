import { render, screen, fireEvent } from '@testing-library/react'
import { GrowthRewards } from '../src/rpg/GrowthRewards'
import { defaults } from '../src/model'
import { defaultSettings } from '../src/SettingsPage'
import { SETTINGS_STORAGE_KEY } from '../src/settingsKey'

afterEach(() => localStorage.clear())

test('weekly goals navigate, respect disabled features, and feedback survives page changes', () => {
  // With Bloom Core off, ordinary progress still gets the classic XP toast.
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ features: { ...defaultSettings.features, bloomCore: false } }))
  const data = defaults()
  const onNavigate = jest.fn()
  const props = {
    data,
    setData: jest.fn(),
    today: '2026-09-25',
    active: 'overview' as const,
    flags: defaultSettings.features,
    onNavigate,
  }
  const { rerender } = render(<GrowthRewards {...props} />)
  fireEvent.click(
    screen.getByRole('button', { name: /Make room for reflection/ }),
  )
  expect(onNavigate).toHaveBeenCalledWith('journal')
  const updated = {
    ...data,
    rpg: {
      ...data.rpg,
      ledger: {
        ...data.rpg.ledger,
        test: {
          day: '2026-09-25',
          at: 1,
          exp: 20,
          stat: null,
          points: 0,
          gold: 0,
          active: true,
          kind: 'journal' as const,
          sourceId: 'test',
        },
      },
    },
  }
  rerender(<GrowthRewards {...props} data={updated} active="journal" />)
  expect(screen.getByText('+20 XP · A little more growth')).toBeInTheDocument()
  rerender(
    <GrowthRewards
      {...props}
      data={updated}
      flags={{ ...props.flags, chatJournal: false }}
    />,
  )
  expect(
    screen.queryByRole('button', { name: /Make room for reflection/ }),
  ).not.toBeInTheDocument()
})

test('with Bloom Core on, ordinary XP defers to human recognition', () => {
  const data = defaults()
  const props = { data, setData: jest.fn(), today: '2026-09-25', active: 'overview' as const, flags: defaultSettings.features, onNavigate: jest.fn() }
  const { rerender } = render(<GrowthRewards {...props} />)
  const updated = {
    ...data,
    rpg: {
      ...data.rpg,
      ledger: { 'journal:test': { day: '2026-09-25', at: Date.now(), exp: 20, stat: 'spirit' as const, points: 0, gold: 0, active: true, kind: 'journal' as const, sourceId: 'test' } },
    },
  }
  rerender(<GrowthRewards {...props} data={updated} />)
  expect(screen.queryByText('+20 XP · A little more growth')).not.toBeInTheDocument()
})
