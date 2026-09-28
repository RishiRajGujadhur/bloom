import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { keymap } from '@codemirror/view'
import { useMemo } from 'react'
import { useThemeId } from '../../components/ui/MatrixRain'

/** CodeMirror 6 JavaScript editor; Ctrl/Cmd+Enter runs the code. */
export function Editor({ value, onChange, onRun }: { value: string; onChange: (v: string) => void; onRun: () => void }) {
  const theme = useThemeId()
  const dark = /dark|matrix|glow|night|midnight/.test(theme)
  const extensions = useMemo(() => [javascript(), keymap.of([{ key: 'Mod-Enter', run: () => (onRun(), true) }])], [onRun])
  return (
    <CodeMirror
      className="cd-cm"
      value={value}
      onChange={onChange}
      extensions={extensions}
      theme={dark ? oneDark : 'light'}
      height="100%"
      basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true, autocompletion: true, bracketMatching: true, closeBrackets: true }}
      aria-label="Code editor"
    />
  )
}
