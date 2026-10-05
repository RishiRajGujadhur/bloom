import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { Bookshelf } from '../src/components/daybook/Bookshelf'
import { JournalReader } from '../src/components/daybook/JournalReader'
import {
  JournalContainer,
  DAYBOOK_STORAGE_KEY,
} from '../src/components/daybook/JournalContainer'
import { journalModes } from '../src/components/daybook/mockData'
import { OPEN_DAYBOOK_EVENT } from '../src/components/layout/CommandPalette'
import { prefersReducedMotion } from '../src/utils/motion'
import type { JournalEntry } from '../src/components/daybook/types'
import { SETTINGS_STORAGE_KEY } from '../src/settingsKey'
import { currentPageActions } from '../src/components/ui/PageMenu'
import { journalPixelPatterns } from '../src/components/daybook/PixelArt'
import { subOn } from '../src/features/subFeatures'

jest.mock('../src/utils/motion', () => ({
  prefersReducedMotion: jest.fn(() => false),
}))
const page = (id: string, day: string, text: string): JournalEntry => ({
  id,
  modeId: 'bullet-journal',
  modeTitle: 'Bullet Journal (BuJo) Rapid Logging',
  createdAt: `${day}T12:00:00Z`,
  updatedAt: `${day}T12:00:00Z`,
  content: {
    body: {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    },
  },
})
const older = page(
  'older',
  '2026-10-04',
  `${'A long reflection. '.repeat(150)}The final sentence.`,
)
const newer = page('newer', '2026-10-05', 'A quiet moment worth keeping.')
const unknown = {
  ...page('unknown', '2026-10-05', 'A page from an earlier journal type.'),
  modeId: 'retired-mode',
  modeTitle: 'My old journal',
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  jest.useFakeTimers()
  ;(prefersReducedMotion as jest.Mock).mockReturnValue(false)
})
afterEach(() => jest.useRealTimers())

test('books group saved pages, keep private writing off the cover, and support old modes', () => {
  const onOpen = jest.fn()
  render(
    <Bookshelf
      pages={[newer, { ...older, private: true }, unknown]}
      modes={journalModes}
      onOpen={onOpen}
    />,
  )
  expect(
    screen.queryByText('A quiet moment worth keeping.'),
  ).not.toBeInTheDocument()
  expect(screen.queryByText(/The final sentence/)).not.toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: /Open Bullet Journal.*2 saved pages/ }),
  )
  expect(onOpen).toHaveBeenCalledWith(newer, expect.any(HTMLElement))
  expect(
    screen.getByRole('button', {
      name: 'Open My old journal journal, 1 saved page',
    }),
  ).toBeInTheDocument()
})

test('saved page selection, unfolding, long writing, and editing use the exact entry', () => {
  const onEdit = jest.fn()
  render(
    <JournalReader
      pages={[newer, older]}
      modes={journalModes}
      entryId="newer"
      language="en"
      onClose={jest.fn()}
      onEdit={onEdit}
    />,
  )
  const dialog = screen.getByRole('dialog')
  expect(
    screen.getByRole('button', { name: 'Newer saved page' }),
  ).toBeDisabled()
  expect(
    within(dialog).getByText('A quiet moment worth keeping.'),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Older saved page' }))
  expect(
    screen.getByRole('combobox', { name: 'Choose saved journal page' }),
  ).toHaveValue('older')
  expect(
    screen.getByRole('button', { name: 'Older saved page' }),
  ).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: /^Read / }))
  expect(dialog).toHaveClass('is-expanded')
  expect(screen.getByRole('region', { name: 'Journal writing' })).toHaveFocus()
  expect(screen.getByText(/The final sentence/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Edit this page' }))
  expect(onEdit).toHaveBeenCalledWith(older)
})

test('Escape returns to the book, then closes once, and unmount restores focus and scrolling', () => {
  render(<button>Launch journal</button>)
  const launch = screen.getByRole('button', { name: 'Launch journal' })
  launch.focus()
  const onClose = jest.fn()
  const view = render(
    <JournalReader
      pages={[newer]}
      modes={journalModes}
      entryId="newer"
      language="en"
      onClose={onClose}
      onEdit={jest.fn()}
    />,
  )
  expect(screen.getByRole('button', { name: 'Close journal' })).toHaveFocus()
  expect(document.body.style.overflow).toBe('hidden')
  fireEvent.click(screen.getByRole('button', { name: /^Read / }))
  fireEvent(
    screen.getByRole('dialog'),
    new Event('cancel', { bubbles: false, cancelable: true }),
  )
  expect(screen.getByRole('dialog')).not.toHaveClass('is-expanded')
  expect(screen.getByRole('button', { name: /^Read / })).toHaveFocus()
  fireEvent.click(screen.getByRole('button', { name: 'Close journal' }))
  fireEvent.click(screen.getByRole('button', { name: 'Close journal' }))
  act(() => jest.advanceTimersByTime(240))
  expect(onClose).toHaveBeenCalledTimes(1)
  view.unmount()
  expect(launch).toHaveFocus()
  expect(document.body.style.overflow).toBe('')
})

test('reduced motion closes immediately and a single saved page has no navigation', () => {
  ;(prefersReducedMotion as jest.Mock).mockReturnValue(true)
  const onClose = jest.fn()
  render(
    <JournalReader
      pages={[newer]}
      modes={journalModes}
      entryId="newer"
      language="en"
      onClose={onClose}
      onEdit={jest.fn()}
    />,
  )
  expect(
    screen.getByRole('button', { name: 'Newer saved page' }),
  ).toBeDisabled()
  expect(
    screen.getByRole('button', { name: 'Older saved page' }),
  ).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Close journal' }))
  expect(onClose).toHaveBeenCalledTimes(1)
})

test('reading saved writing does not autosave; Edit reopens its original document', () => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ sub: { 'daybookModes.savedJournals': true } }),
  )
  localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify([newer]))
  const original = localStorage.getItem(DAYBOOK_STORAGE_KEY)
  render(<JournalContainer />)
  fireEvent.click(
    screen.getByRole('button', { name: /Open Bullet Journal.*1 saved page/ }),
  )
  fireEvent.click(screen.getByRole('button', { name: /^Read / }))
  expect(
    screen.queryByRole('textbox', { name: 'Bullet journal rapid log' }),
  ).not.toBeInTheDocument()
  act(() => jest.advanceTimersByTime(10000))
  expect(localStorage.getItem(DAYBOOK_STORAGE_KEY)).toBe(original)
  fireEvent.click(screen.getByRole('button', { name: 'Edit this page' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(
    screen.getByRole('textbox', { name: 'Bullet journal rapid log' }),
  ).toHaveTextContent('A quiet moment worth keeping.')
})

test('private cards require reveal before opening the reader', () => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ sub: { 'daybookModes.savedJournals': true } }),
  )
  localStorage.setItem(
    DAYBOOK_STORAGE_KEY,
    JSON.stringify([{ ...newer, private: true }]),
  )
  const { container } = render(<JournalContainer />)
  const card = container.querySelector<HTMLButtonElement>('.daybook-page-card')!
  expect(card).toHaveClass('is-private')
  fireEvent.click(card)
  expect(card).not.toHaveClass('is-private')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  fireEvent.click(card)
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('saved home collections are unmounted by default without deleting writing', () => {
  const original = JSON.stringify([newer])
  localStorage.setItem(DAYBOOK_STORAGE_KEY, original)
  const { container, unmount } = render(<JournalContainer />)
  expect(subOn('daybookModes', 'savedJournals')).toBe(false)
  expect(container.querySelector('.journal-shelf')).toBeNull()
  expect(container.querySelector('.daybook-page-card')).toBeNull()
  expect(localStorage.getItem(DAYBOOK_STORAGE_KEY)).toBe(original)
  unmount()
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({ sub: { 'daybookModes.savedJournals': true } }),
  )
  render(<JournalContainer />)
  expect(
    screen.getByRole('button', { name: /Open Bullet Journal.*1 saved page/ }),
  ).toBeInTheDocument()
})

test('Bloom opens the hidden writing suggestions with their contents expanded', () => {
  render(<JournalContainer />)
  expect(
    screen.queryByRole('button', { name: 'Not sure what to write?' }),
  ).not.toBeInTheDocument()
  act(() =>
    currentPageActions()
      .find((action) => action.id === 'daybook-suggest')!
      .run(),
  )
  expect(
    screen.getByRole('button', { name: 'Not sure what to write?' }),
  ).toHaveAttribute('aria-expanded', 'true')
  expect(
    screen.getByText("How are you? We'll suggest a page."),
  ).toBeInTheDocument()
  fireEvent.click(
    screen.getByRole('button', { name: 'Not sure what to write?' }),
  )
  expect(
    screen.getByRole('button', { name: 'Not sure what to write?' }),
  ).toHaveAttribute('aria-expanded', 'false')
  act(() =>
    currentPageActions()
      .find((action) => action.id === 'daybook-suggest')!
      .run(),
  )
  expect(
    screen.getByRole('button', { name: 'Not sure what to write?' }),
  ).toHaveAttribute('aria-expanded', 'true')
})

test('every journal has a distinct pixel icon', () => {
  const icons = journalModes.map((mode) =>
    journalPixelPatterns[mode.id]?.join('/'),
  )
  expect(icons.every(Boolean)).toBe(true)
  expect(new Set(icons).size).toBe(journalModes.length)
})

test('command search opens the saved reader, including entries from old modes', () => {
  localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify([unknown]))
  render(<JournalContainer />)
  act(() =>
    window.dispatchEvent(
      new CustomEvent(OPEN_DAYBOOK_EVENT, { detail: 'unknown' }),
    ),
  )
  expect(
    screen.getByRole('dialog', { name: 'My old journal journal' }),
  ).toBeInTheDocument()
  expect(
    within(screen.getByRole('dialog')).getByText(
      'A page from an earlier journal type.',
    ),
  ).toBeInTheDocument()
})
