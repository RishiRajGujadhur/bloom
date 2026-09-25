import type { Editor } from '@tiptap/react'
import { useEditorState } from '@tiptap/react'
import {
  Bold,
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import styles from './editor.module.css'

type Props = { editor: Editor | null }
type Action = {
  label: string
  icon: LucideIcon
  keys?: string
  active?: boolean
  disabled?: boolean
  run: () => void
}

const mod =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
    ? '⌘'
    : 'Ctrl+'

/** Notion/OneNote-style formatting bar, grouped by purpose. */
export function EditorToolbar({ editor }: Props) {
  // Re-render when the selection's formatting changes.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive('bold'),
            italic: e.isActive('italic'),
            underline: e.isActive('underline'),
            strike: e.isActive('strike'),
            highlight: e.isActive('highlight'),
            h1: e.isActive('heading', { level: 1 }),
            h2: e.isActive('heading', { level: 2 }),
            h3: e.isActive('heading', { level: 3 }),
            bullet: e.isActive('bulletList'),
            ordered: e.isActive('orderedList'),
            task: e.isActive('taskList'),
            quote: e.isActive('blockquote'),
            code: e.isActive('codeBlock'),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  })
  if (!editor || !state) return null
  const chain = () => editor.chain().focus()
  const groups: Action[][] = [
    [
      { label: 'Undo', icon: Undo2, keys: `${mod}Z`, disabled: !state.canUndo, run: () => chain().undo().run() },
      { label: 'Redo', icon: Redo2, keys: `${mod}Shift+Z`, disabled: !state.canRedo, run: () => chain().redo().run() },
    ],
    [
      { label: 'Heading 1', icon: Heading1, active: state.h1, run: () => chain().toggleHeading({ level: 1 }).run() },
      { label: 'Heading 2', icon: Heading2, active: state.h2, run: () => chain().toggleHeading({ level: 2 }).run() },
      { label: 'Heading 3', icon: Heading3, active: state.h3, run: () => chain().toggleHeading({ level: 3 }).run() },
    ],
    [
      { label: 'Bold', icon: Bold, keys: `${mod}B`, active: state.bold, run: () => chain().toggleBold().run() },
      { label: 'Italic', icon: Italic, keys: `${mod}I`, active: state.italic, run: () => chain().toggleItalic().run() },
      { label: 'Underline', icon: Underline, keys: `${mod}U`, active: state.underline, run: () => chain().toggleUnderline().run() },
      { label: 'Strikethrough', icon: Strikethrough, active: state.strike, run: () => chain().toggleStrike().run() },
      { label: 'Highlight', icon: Highlighter, active: state.highlight, run: () => chain().toggleHighlight().run() },
    ],
    [
      { label: 'Bullet list', icon: List, active: state.bullet, run: () => chain().toggleBulletList().run() },
      { label: 'Numbered list', icon: ListOrdered, active: state.ordered, run: () => chain().toggleOrderedList().run() },
      { label: 'Checklist', icon: CheckSquare, active: state.task, run: () => chain().toggleTaskList().run() },
      { label: 'Quote', icon: Quote, active: state.quote, run: () => chain().toggleBlockquote().run() },
      { label: 'Code block', icon: Code, active: state.code, run: () => chain().toggleCodeBlock().run() },
      { label: 'Divider', icon: Minus, run: () => chain().setHorizontalRule().run() },
    ],
  ]
  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Formatting tools">
      {groups.map((group, i) => (
        <div className={styles.group} key={i}>
          {group.map(({ label, icon: Icon, keys, active, disabled, run }) => (
            <button
              key={label}
              type="button"
              onClick={run}
              disabled={disabled}
              aria-label={label}
              aria-pressed={active === undefined ? undefined : active}
              title={keys ? `${label} (${keys})` : label}
            >
              <Icon size={17} />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
