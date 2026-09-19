import { createContext, useContext } from 'react'
import type { Node } from '@xyflow/react'
import type { JournalEntry } from '../daybook/types'

export type CanvasNode = Node<
  Record<string, unknown>,
  'sticky' | 'journal' | 'badge'
>
export const BoardContext = createContext<{
  journals: JournalEntry[]
  update: (id: string, data: Record<string, unknown>) => void
  remove: (id: string) => void
}>({ journals: [], update: () => {}, remove: () => {} })
export const useBoard = () => useContext(BoardContext)
