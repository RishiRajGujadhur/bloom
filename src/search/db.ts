import Dexie, { type Table } from 'dexie'

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

class JournalDatabase extends Dexie {
  entries!: Table<SearchEntry, string>
  constructor() {
    super('JournalDB')
    // Vectors are stored, not indexed: similarity is calculated in memory.
    this.version(1).stores({ entries: 'id, timestamp, category' })
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
