import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useRef } from 'react'
import { SectionNavigator } from '../src/components/layout/SectionNavigator'

jest.mock('../src/utils/motion', () => ({ prefersReducedMotion: () => true }))

function Page({ bottom }: { bottom: number }) {
  const root = useRef<HTMLDivElement>(null)
  return <div ref={node => {
    root.current = node
    if (node) node.getBoundingClientRect = () => ({ left: 0, right: 1000, width: 1000, top: 0, bottom, height: bottom }) as DOMRect
  }}>
    <img alt="Map workspace" ref={node => {
      if (!node) return
      node.getBoundingClientRect = () => ({ top: 120, bottom, left: 0, right: 1000, width: 1000, height: bottom - 120 }) as DOMRect
      node.getClientRects = () => [node.getBoundingClientRect()] as unknown as DOMRectList
    }} />
    <SectionNavigator root={root} page="mindmaps" />
  </div>
}

beforeEach(() => {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  Object.defineProperty(document, 'scrollingElement', { configurable: true, value: document.documentElement })
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 1800 })
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
