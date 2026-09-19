export type JournalCategory = 'planning' | 'reflection' | 'vision' | 'gamified'

export type JournalEditorType =
  | 'guided'
  | 'bujo'
  | 'freeform'
  | 'split-pane'
  | 'focus'

export interface JournalMode {
  id: string
  title: string
  category: JournalCategory
  description: string
  icon: string
  editorType: JournalEditorType
  prompts?: string[]
  metadata?: { time: string; bestFor: string }
}

export interface JournalEntry {
  /** One durable completion per local day; saved with the page, not its search index. */
  activity?: { day: string; at: number }[]
  id: string
  modeId: string
  modeTitle: string
  createdAt: string
  updatedAt: string
  /** TipTap document JSON, keyed by field for guided and split-pane pages. */
  content: Record<string, unknown>
}
