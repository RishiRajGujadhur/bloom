import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { SectionNavigator } from '../src/components/layout/SectionNavigator'

jest.mock('../src/utils/motion', () => ({ prefersReducedMotion: () => true }))

function Page({ bottom, decoration = false, clipped = false }: { bottom: number; decoration?: boolean; clipped?: boolean }) {
  const root = useRef<HTMLDivElement>(null)
  return <div ref={node => {
    root.current = node
    if (node) node.getBoundingClientRect = () => ({ left: 0, right: 1000, width: 1000, top: 0, bottom, height: bottom }) as DOMRect
  }}>
    {decoration && <div className="studio-scene"><svg ref={node => {
      if (!node) return
      node.getBoundingClientRect = () => ({ top: 0, bottom: 1800, height: 1800 }) as DOMRect
      node.getClientRects = () => [node.getBoundingClientRect()] as unknown as DOMRectList
    }} /></div>}
    <div style={clipped ? { overflowY: 'auto' } : undefined} ref={node => {
      if (!node || !clipped) return
      node.getBoundingClientRect = () => ({ top: 120, bottom: 760, height: 640 }) as DOMRect
      Object.defineProperty(node, 'clientHeight', { configurable: true, value: 640 })
    }}><img alt="Map workspace" ref={node => {
      if (!node) return
      node.getBoundingClientRect = () => ({ top: 120, bottom, left: 0, right: 1000, width: 1000, height: bottom - 120 }) as DOMRect
      node.getClientRects = () => [node.getBoundingClientRect()] as unknown as DOMRectList
    }} /></div>
    <SectionNavigator root={root} page="mindmaps" />
  </div>
}

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  Object.defineProperty(document, 'scrollingElement', { configurable: true, value: document.documentElement })
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1800 })
  Object.defineProperty(document.documentElement, 'scrollTop', { configurable: true, value: 0 })
  window.scrollTo = jest.fn()
})

test('empty trailing page space never produces More below', async () => {
  render(<Page bottom={760} />)
  await waitFor(() => expect(screen.getByAltText('Map workspace')).toBeInTheDocument())
  expect(screen.queryByRole('navigation', { name: 'Page sections' })).not.toBeInTheDocument()
})

test('page-down stops at the last real content, even when the document has empty space', async () => {
  render(<Page bottom={1200} />)
  const next = await screen.findByRole('button', { name: 'Next section: More below' })
  fireEvent.click(next)
  expect(window.scrollTo).toHaveBeenCalledWith({ top: 400, behavior: 'instant' })
})

test('decorative scene backgrounds never produce a scroll destination', async () => {
  render(<Page bottom={760} decoration />)
  await waitFor(() => expect(screen.getByAltText('Map workspace')).toBeInTheDocument())
  expect(screen.queryByRole('navigation', { name: 'Page sections' })).not.toBeInTheDocument()
})

test('content clipped inside a scrolling card does not extend page navigation', async () => {
  render(<Page bottom={1800} clipped />)
  await waitFor(() => expect(screen.getByAltText('Map workspace')).toBeInTheDocument())
  expect(screen.queryByRole('navigation', { name: 'Page sections' })).not.toBeInTheDocument()
})

test('scrolling into an empty tail does not expose an End of page control', async () => {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 20 })
  Object.defineProperty(document.documentElement, 'scrollTop', { configurable: true, value: 20 })
  render(<Page bottom={760} />)
  await waitFor(() => expect(screen.getByAltText('Map workspace')).toBeInTheDocument())
  expect(screen.queryByRole('navigation', { name: 'Page sections' })).not.toBeInTheDocument()
})
