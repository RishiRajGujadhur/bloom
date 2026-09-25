import { render, screen, fireEvent } from '@testing-library/react'
import { GrowthRewards } from '../src/rpg/GrowthRewards'
import { defaults } from '../src/model'
import { defaultSettings } from '../src/SettingsPage'

test('weekly goals navigate, respect disabled features, and feedback survives page changes', () => {
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
