import 'fake-indexeddb/auto'
import { serialize, deserialize } from 'node:v8'
import { render, screen } from '@testing-library/react'
import { db } from '../src/search/db'
import {
  defaultSettings,
  loadSettings,
  SETTINGS_STORAGE_KEY,
} from '../src/SettingsPage'
import { Sidebar } from '../src/components/layout/Sidebar'

beforeAll(() => {
  if (!global.structuredClone)
    global.structuredClone = (value) => deserialize(serialize(value))
})
afterEach(async () => {
  localStorage.clear()
  await db.vision_board_nodes.clear()
})

test('old settings retain disabled features when Vision Board is introduced', () => {
  const features: Record<string, boolean> = {
    ...defaultSettings.features,
    habitTracker: false,
    chatJournal: false,
  }
  delete features.visionBoard
  delete features.urgeTracker
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ features }))
  expect(loadSettings().features).toMatchObject({
    habitTracker: false,
    chatJournal: false,
    visionBoard: true,
    urgeTracker: true,
  })
})

test('disabling the board removes navigation without deleting its saved data', async () => {
  await db.vision_board_nodes.add({
    id: 'note',
    type: 'sticky',
    position: { x: -500, y: 720 },
    data: { text: 'Grow' },
  })
  const props = {
    active: 'overview',
    onNavigate: jest.fn(),
    flags: { ...defaultSettings.features },
  }
  const view = render(<Sidebar {...props} />)
  expect(
    screen.getByRole('button', { name: 'Vision Board' }),
  ).toBeInTheDocument()
  view.rerender(
    <Sidebar {...props} flags={{ ...props.flags, visionBoard: false }} />,
  )
  expect(
    screen.queryByRole('button', { name: 'Vision Board' }),
  ).not.toBeInTheDocument()
  expect(await db.vision_board_nodes.get('note')).toMatchObject({
    data: { text: 'Grow' },
  })
})

test('node edits, dimensions and references persist across database reopen', async () => {
  await db.vision_board_nodes.bulkAdd([
    {
      id: 'note',
      type: 'sticky',
      position: { x: 0, y: 0 },
      data: { text: 'Grow', color: 'mint' },
    },
    {
      id: 'journal',
      type: 'journal',
      position: { x: 100, y: 200 },
      data: { referenceId: 'original-entry' },
    },
  ])
  await db.vision_board_nodes.update('note', {
    position: { x: -800, y: 1200 },
    width: 340,
    height: 280,
  })
  db.close()
  await db.open()
  expect(await db.vision_board_nodes.get('note')).toMatchObject({
    position: { x: -800, y: 1200 },
    width: 340,
    height: 280,
    data: { text: 'Grow', color: 'mint' },
  })
  expect((await db.vision_board_nodes.get('journal'))?.data).toEqual({
    referenceId: 'original-entry',
  })
  await db.vision_board_nodes.delete('note')
  expect(await db.vision_board_nodes.get('note')).toBeUndefined()
})
