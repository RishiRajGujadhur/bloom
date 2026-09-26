import { createContext, useContext } from 'react'
import type { Node } from '@xyflow/react'
import type { JournalEntry } from '../daybook/types'

export type CanvasNode = Node<
  Record<string, unknown>,
  'sticky' | 'journal' | 'badge' | 'image' | 'goal' | 'habit'
>
export const BoardContext = createContext<{
  journals: JournalEntry[]
  update: (id: string, data: Record<string, unknown>) => void
  remove: (id: string) => void
  habits?: { id: string; title: string; dates: string[] }[]
}>({ journals: [], update: () => {}, remove: () => {} })
export const useBoard = () => useContext(BoardContext)
