export type JournalCategory =
  | 'Daily Planning & Productivity'
  | 'Mental Health & Reflection'
  | 'Vision & Future Self'
  | 'Gamified & Habit Analysis'

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
  id: string
  modeId: string
  modeTitle: string
  createdAt: string
  updatedAt: string
  content: Record<string, string>
}
