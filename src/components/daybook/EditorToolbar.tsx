import type { Editor } from '@tiptap/react'
import { Bold, CheckSquare, Heading1, Heading2, Italic, List } from 'lucide-react'
import styles from './editor.module.css'

type Props = { editor: Editor | null }

export function EditorToolbar({ editor }: Props) {
  if (!editor) return null
  const actions = [
    { label: 'Bold', icon: Bold, active: editor.isActive('bold'), run: () => editor.chain().focus().toggleBold().run() },
    { label: 'Italic', icon: Italic, active: editor.isActive('italic'), run: () => editor.chain().focus().toggleItalic().run() },
    { label: 'Heading 1', icon: Heading1, active: editor.isActive('heading', { level: 1 }), run: () => editor.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'Heading 2', icon: Heading2, active: editor.isActive('heading', { level: 2 }), run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'Bullet list', icon: List, active: editor.isActive('bulletList'), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: 'Checklist', icon: CheckSquare, active: editor.isActive('taskList'), run: () => editor.chain().focus().toggleTaskList().run() },
  ]
  return <div className={styles.toolbar} aria-label="Formatting tools">
    {actions.map(({ label, icon: Icon, active, run }) => <button key={label} type="button" onClick={run} aria-label={label} aria-pressed={active} title={label}><Icon size={16} /></button>)}
  </div>
}
