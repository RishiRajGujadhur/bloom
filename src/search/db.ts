import Dexie, { type Table } from 'dexie'
import type { FoodRow } from '../features/diet/nutrients'
import type { Recipe } from '../features/diet/recipeModel'

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export interface SearchEntry {
  id: string
  text: string
  timestamp: number
  category: string
  title: string
  modeId: string
  embedding?: Float32Array
  model?: string
}

export interface BoardNode {
  id: string
  type: 'sticky' | 'journal' | 'badge' | 'image' | 'goal' | 'habit'
  position: { x: number; y: number }
  data: Record<string, unknown>
  width?: number
  height?: number
}

export interface BoardEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface JournalAttachment {
  id: string
  sessionId: string
  kind: 'photo' | 'audio'
  name: string
  mimeType: string
  duration: number | null
  createdAt: number
  blob: Blob
}

export interface VoiceMemo {
  id: string
  createdAt: number
  duration: number
  mimeType: string
  blob: Blob
  title: string
  transcript?: string
  /** Whisper chunks with [start, end] seconds, linked to waveform playback. */
  chunks?: { text: string; start: number; end: number | null }[]
}

class JournalDatabase extends Dexie {
  voice_memos!: Table<VoiceMemo, string>
  foods!: Table<FoodRow, string>
  recipes!: Table<Recipe, string>
  board_edges!: Table<BoardEdge, string>
  entries!: Table<SearchEntry, string>
  vision_board_nodes!: Table<BoardNode, string>
  journal_attachments!: Table<JournalAttachment, string>
  constructor() {
    super('JournalDB')
    // Vectors are stored, not indexed: similarity is calculated in memory.
    this.version(1).stores({ entries: 'id, timestamp, category' })
    this.version(2).stores({
      entries: 'id, timestamp, category',
      vision_board_nodes: 'id, type',
    })
    this.version(3).stores({
      entries: 'id, timestamp, category',
      vision_board_nodes: 'id, type',
      journal_attachments: 'id, sessionId, kind, createdAt',
    })
    this.version(4).stores({
      entries: 'id, timestamp, category',
      vision_board_nodes: 'id, type',
      journal_attachments: 'id, sessionId, kind, createdAt',
      voice_memos: 'id, createdAt',
    })
    this.version(5).stores({
      entries: 'id, timestamp, category',
      vision_board_nodes: 'id, type',
      journal_attachments: 'id, sessionId, kind, createdAt',
      voice_memos: 'id, createdAt',
      foods: 'id, group, plant, name',
      recipes: 'id, createdAt',
      board_edges: 'id, source, target',
    })
  }
}
export const db = new JournalDatabase()

/** Extract only written text, never TipTap marks, attributes or JSON keys. */
export function journalText(value: unknown): string {
  if (typeof value === 'string') return value
  if (Array.isArray(value))
    return value.map(journalText).filter(Boolean).join('\n')
  if (!value || typeof value !== 'object') return ''
  const node = value as Record<string, unknown>
  if (node.type === 'text')
    return typeof node.text === 'string' ? node.text : ''
  if (typeof node.type === 'string') {
    if (node.type === 'hardBreak') return '\n'
    const content = Array.isArray(node.content) ? node.content : []
    return content
      .map(journalText)
      .join(node.type === 'paragraph' || node.type === 'heading' ? '' : '\n')
  }
  return Object.values(node).map(journalText).filter(Boolean).join('\n')
}
