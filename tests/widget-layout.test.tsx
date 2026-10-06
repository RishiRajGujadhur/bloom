import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { constrainWidgetResize, LayoutChatHost, normalizeWidgetSize, PageLayout, WidgetFrame } from '../src/components/layout/WidgetLayout'

beforeEach(() => localStorage.clear())

test('invalid persisted sizes cannot force a widget outside its supported range', () => {
  expect(normalizeWidgetSize({ width: -10, height: 99999, collapsed: true })).toEqual({ width: 280, height: 1200, collapsed: true })
  expect(normalizeWidgetSize({ width: '900', height: NaN })).toEqual({})
})

test('sizing persists and collapsing keeps the existing draft mounted', () => {
  const view = render(<WidgetFrame id="task" title="Tasks" editing><input aria-label="Draft" defaultValue="" /></WidgetFrame>)
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Keep my draft' } })
  jest.spyOn(screen.getByRole('article'), 'getBoundingClientRect').mockReturnValue({ width: 352, height: 440 } as DOMRect)
  fireEvent.keyDown(screen.getByRole('button', { name: 'Resize Tasks' }), { key: 'ArrowLeft' })
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
  return <div ref={root}><LayoutChatHost /><PageLayout page="test" root={root} />
    <section><h2>Tasks</h2><input aria-label="Section draft" defaultValue="Saved" /></section>
    <section><h2>Notes</h2><p>Second section</p></section>
  </div>
}
test('existing sections gain controls without replacing their inputs', async () => {
  render(<Sections />)
  const draft = screen.getByLabelText('Section draft')
  await waitFor(() => expect(screen.getByText('Arrange layout')).toBeInTheDocument())
  fireEvent.click(screen.getByText('Arrange layout'))
  fireEvent.click(screen.getByRole('button', { name: 'Collapse Tasks' }))
  fireEvent.click(screen.getByRole('button', { name: 'Expand Tasks' }))
  expect(screen.getByLabelText('Section draft')).toBe(draft)
  expect(draft).toHaveValue('Saved')
})

function InteractiveSection() {
  const root = useRef<HTMLDivElement>(null)
  return <div ref={root}><PageLayout page="mala" root={root} />
    <div className="studio" data-studio="Mala"><section className="studio-card" role="button" tabIndex={0} aria-label="Tap a bead"><h2>Beads</h2></section></div>
  </div>
}
test('resize controls never become nested inside an interactive card', async () => {
  render(<InteractiveSection />)
  const handle = await screen.findByRole('button', { name: 'Resize Mala' })
  expect(handle.closest('[role="button"]')).toBeNull()
  expect(screen.getByRole('button', { name: 'Tap a bead' }).querySelector('button')).toBeNull()
})


test('resize limits grow with visible media and intrinsic overflow', () => {
  const frame = document.createElement('section')
  const image = document.createElement('img')
  frame.append(image)
  document.body.append(frame)
  Object.defineProperties(frame, { clientWidth: { value: 280 }, scrollWidth: { value: 400 }, scrollHeight: { value: 560 } })
  jest.spyOn(image, 'getBoundingClientRect').mockReturnValue({ width: 300, height: 240 } as DOMRect)
  frame.style.setProperty('--widget-width', '480px')
  frame.style.setProperty('--widget-height', '600px')
  frame.style.border = '1px solid black'
  expect(constrainWidgetResize(frame, 280, 160)).toMatchObject({ width: 400, height: 562 })
  expect(frame.style.getPropertyValue('--widget-width')).toBe('480px')
  expect(frame.style.getPropertyValue('--widget-height')).toBe('600px')
  frame.remove()
})
