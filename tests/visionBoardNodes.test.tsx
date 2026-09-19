import { fireEvent, render, screen } from '@testing-library/react'
import type { NodeProps } from '@xyflow/react'
import { BoardContext, type CanvasNode } from '../src/components/VisionBoard/BoardContext'
import { StickyNode } from '../src/components/VisionBoard/nodes/StickyNode'
import { JournalNode } from '../src/components/VisionBoard/nodes/JournalNode'

jest.mock('@xyflow/react', () => ({ Handle: () => null, NodeResizer: () => null, Position: { Top: 'top' } }))

const props = (data: Record<string, unknown>) => ({ id: 'pin', data, selected: true }) as NodeProps<CanvasNode>

test('editing a sticky updates its text and color, and removal targets only that pin', () => {
  const update = jest.fn()
  const remove = jest.fn()
  render(<BoardContext.Provider value={{ journals: [], update, remove }}><StickyNode {...props({ text: 'One small step', color: 'gold' })} /></BoardContext.Provider>)
  fireEvent.change(screen.getByLabelText('Sticky note text'), { target: { value: 'Make space to rest' } })
  expect(update).toHaveBeenCalledWith('pin', { text: 'Make space to rest' })
  fireEvent.change(screen.getByLabelText('Sticky note color'), { target: { value: 'mint' } })
  expect(update).toHaveBeenCalledWith('pin', { color: 'mint' })
  fireEvent.click(screen.getByRole('button', { name: 'Remove sticky note' }))
  expect(remove).toHaveBeenCalledWith('pin')
})

test('journal pins resolve the original TipTap text and handle missing entries', () => {
  const context = { update: jest.fn(), remove: jest.fn(), journals: [{ id: 'entry', modeId: 'mental-health', modeTitle: 'Mental Health Check-in', createdAt: '2026-09-19', updatedAt: '2026-09-19', content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'I feel grounded today.' }] }] } }] }
  const view = render(<BoardContext.Provider value={context}><JournalNode {...props({ referenceId: 'entry' })} /></BoardContext.Provider>)
  expect(screen.getByText('Mental Health Check-in')).toBeInTheDocument()
  expect(screen.getByText('I feel grounded today.')).toBeInTheDocument()
  view.rerender(<BoardContext.Provider value={{ ...context, journals: [] }}><JournalNode {...props({ referenceId: 'entry' })} /></BoardContext.Provider>)
  expect(screen.getByText('Reflection unavailable')).toBeInTheDocument()
  expect(screen.queryByText('I feel grounded today.')).not.toBeInTheDocument()
})
