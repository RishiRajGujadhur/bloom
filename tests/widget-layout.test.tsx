import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { normalizeWidgetSize, PageLayout, WidgetFrame } from '../src/components/layout/WidgetLayout'

beforeEach(() => localStorage.clear())

test('invalid persisted sizes cannot force a widget outside its supported range', () => {
  expect(normalizeWidgetSize({ width: -10, height: 99999, collapsed: true })).toEqual({ width: 280, height: 1200, collapsed: true })
  expect(normalizeWidgetSize({ width: '900', height: NaN })).toEqual({})
})

test('sizing persists and collapsing keeps the existing draft mounted', () => {
  const view = render(<WidgetFrame id="task" title="Tasks" editing><input aria-label="Draft" defaultValue="" /></WidgetFrame>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep my draft' } })
  fireEvent.click(screen.getByText('Mobile size'))
  expect(screen.getByRole('article')).toHaveStyle('--widget-width: 320px')
  fireEvent.click(screen.getByRole('button', { name: 'Collapse Tasks' }))
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep my draft')
  fireEvent.click(screen.getByRole('button', { name: 'Expand Tasks' }))
  expect(screen.getByLabelText('Draft')).toHaveValue('Keep my draft')
  view.unmount()
  render(<WidgetFrame id="task" title="Tasks"><p>Restored</p></WidgetFrame>)
  expect(screen.getByRole('article')).toHaveStyle('--widget-width: 320px; --widget-height: 440px')
})

test('keyboard resize has a reset path without dragging', () => {
  render(<WidgetFrame id="task" title="Tasks" editing><p>Tasks</p></WidgetFrame>)
  const frame = screen.getByRole('article')
  jest.spyOn(frame, 'getBoundingClientRect').mockReturnValue({ width: 480, height: 360 } as DOMRect)
  const handle = screen.getByRole('button', { name: 'Resize Tasks' })
  fireEvent.keyDown(handle, { key: 'ArrowRight' })
  expect(frame).toHaveStyle('--widget-width: 512px')
  fireEvent.keyDown(handle, { key: 'Home' })
  expect(frame.style.getPropertyValue('--widget-width')).toBe('')
})

function Sections() {
  const root = useRef<HTMLDivElement>(null)
  return <div ref={root}><PageLayout page="test" root={root} />
    <section><h2>Tasks</h2><input aria-label="Section draft" defaultValue="Saved" /></section>
    <section><h2>Notes</h2><p>Second section</p></section>
  </div>
}
test('existing sections gain controls without replacing their inputs', async () => {
  render(<Sections />)
  const draft = screen.getByLabelText('Section draft')
  await waitFor(() => expect(screen.getByRole('combobox', { name: 'Visible section' })).toBeInTheDocument())
  fireEvent.click(screen.getByRole('button', { name: 'Arrange layout' }))
  fireEvent.click(screen.getByRole('button', { name: 'Collapse Tasks' }))
  fireEvent.click(screen.getByRole('button', { name: 'Expand Tasks' }))
  expect(screen.getByLabelText('Section draft')).toBe(draft)
  expect(draft).toHaveValue('Saved')
})
