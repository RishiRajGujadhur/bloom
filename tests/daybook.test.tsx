import { fireEvent, render, screen } from '@testing-library/react'
import { journalModes } from '../src/components/daybook/mockData'
import { JournalLibrary } from '../src/components/daybook/JournalLibrary'
import { AdaptiveEditor } from '../src/components/daybook/AdaptiveEditor'

test('daybook contains exactly the requested twenty modes across four categories', () => {
  expect(journalModes).toHaveLength(20)
  expect(new Set(journalModes.map(mode => mode.category)).size).toBe(4)
  expect(journalModes.map(mode => mode.title)).toEqual(expect.arrayContaining(['Morning Intentionality (The One Thing)', 'Bullet Journal (BuJo) Rapid Logging', 'Decision Matrix Journal']))
})

test('library filters modes and passes the selected mode to its parent', () => {
  const onSelect = jest.fn()
  render(<JournalLibrary modes={journalModes} onSelect={onSelect} />)
  fireEvent.change(screen.getByPlaceholderText('Search modes'), { target: { value: 'fear' } })
  expect(screen.getByRole('button', { name: /Fear Setting/ })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Fear Setting/ }))
  expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'fear-setting' }))
})

test('adaptive editors expose the appropriate accessible controls', () => {
  const onSave = jest.fn()
  const onBack = jest.fn()
  render(<AdaptiveEditor mode={journalModes.find(mode => mode.id === 'bullet-journal')!} onBack={onBack} onSave={onSave} />)
  expect(screen.getByRole('textbox', { name: 'Bullet journal rapid log' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /Task/ }))
  expect(screen.getByRole('textbox', { name: 'Bullet journal rapid log' })).toHaveValue('Task [•] ')
  fireEvent.click(screen.getByRole('button', { name: /All modes/ }))
  expect(onBack).toHaveBeenCalled()
})
