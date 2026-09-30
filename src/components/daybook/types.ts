import type { FlowFingerprint } from '../../features/flow/flowModel'
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
  id: string
  modeId: string
  modeTitle: string
  createdAt: string
  updatedAt: string
  /** TipTap document JSON, keyed by field for guided and split-pane pages. */
  content: Record<string, unknown>
  /** Keystroke-rhythm fingerprint of the last writing session (Flow topography). */
  flow?: FlowFingerprint
  /** Blurred on the home screen until clicked. */
  private?: boolean
  /** How the writer felt, picked in the editor header. */
  mood?: string
  /** Shown first on the home screen. */
  pinned?: boolean
}
