import { act, fireEvent, render, screen } from '@testing-library/react'
import App from '../src/App'
import { FeatureGuide } from '../src/components/layout/FeatureGuide'

const drive = jest.fn()
const destroy = jest.fn()
const mockConfigure = jest.fn(() => ({ drive, destroy }))
jest.mock('driver.js', () => ({
  driver: (...args: unknown[]) => mockConfigure(...args),
}))

beforeEach(() => {
  localStorage.clear()
  jest.clearAllMocks()
})

test('daybook has a dedicated page and hash navigation restores destinations', () => {
  render(<App />)
  expect(
    screen.queryByRole('textbox', { name: /Search journal modes/ }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getAllByRole('button', { name: 'Daybook modes' })[0])
  expect(window.location.hash).toBe('#daybook')
  expect(
    screen.getByRole('heading', { name: 'Daybook', level: 1 }),
  ).toHaveFocus()
  expect(screen.getByPlaceholderText('Search modes')).toBeVisible()
  expect(
    screen.queryByRole('button', { name: /Move with intention/ }),
  ).not.toBeInTheDocument()
  act(() => {
    window.location.hash = '#planning'
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
  expect(
    screen.getByRole('heading', { name: 'Intentions', level: 1 }),
  ).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: /Move with intention/ }),
  ).not.toBeInTheDocument()
})

test('every destination offers one guide button, including settings', () => {
  render(<App />)
  expect(screen.getAllByRole('button', { name: 'Guide me' })).toHaveLength(1)
  fireEvent.click(screen.getByRole('button', { name: 'Settings', exact: true }))
  expect(screen.getAllByRole('button', { name: 'Guide me' })).toHaveLength(1)
})

test('guide highlights only the current feature and cleans up on navigation', () => {
  const view = render(
    <>
      <div id="planning">
        <div className="card-heading">Intention</div>
        <button className="add-line">Add</button>
      </div>
      <FeatureGuide page="planning" />
    </>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Guide me' }))
  expect(drive).toHaveBeenCalledTimes(1)
  const options = mockConfigure.mock.calls[0][0] as {
    steps: { element: string }[]
  }
  expect(options.steps.map((item) => item.element)).toEqual([
    '#planning .card-heading',
    '#planning .add-line',
  ])
  view.unmount()
  expect(destroy).toHaveBeenCalled()
})

test('collapsed sidebar preference survives remount', () => {
  const view = render(<App />)
  fireEvent.click(screen.getByRole('button', { name: 'Collapse menu' }))
  view.unmount()
  render(<App />)
  expect(screen.getByRole('button', { name: 'Expand menu' })).toHaveAttribute(
    'aria-expanded',
    'false',
  )
})
