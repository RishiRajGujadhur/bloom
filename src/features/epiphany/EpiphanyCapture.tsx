import './epiphanyCapture.css'
import { useEffect, useRef, useState } from 'react'
import { createEpiphany } from './epiphanyModel'
import { addEpiphany } from './epiphanyStore'

/**
 * Quick capture from anywhere: Ctrl/Cmd+Shift+E opens a small box (pre-filled
 * with any selected text) and saves it as an epiphany without leaving the page.
 */
export function EpiphanyCapture() {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  const input = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setText(window.getSelection()?.toString().trim().slice(0, 600) ?? '')
        setSaved(false)
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])
  if (!open) return null
  const save = () => {
    if (!text.trim()) return
    const today = new Date().toISOString().slice(0, 10)
    const page = document.getElementById('page-heading')?.textContent?.trim() || 'Quick capture'
    addEpiphany(createEpiphany(text, { kind: 'manual', title: page, date: today }, today))
    setSaved(true)
    setTimeout(() => setOpen(false), 900)
  }
  return (
    <div className="ep-capture" role="dialog" aria-label="Capture an epiphany" onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <strong>💡 Capture an epiphany</strong>
      {saved ? (
        <p>Saved. It'll come back just before you'd forget it.</p>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); save() }}>
          <textarea ref={input} rows={3} value={text} maxLength={600} placeholder="Something you never want to forget…" onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save() } }} />
          <div>
            <button type="button" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="ov-primary">Save</button>
          </div>
        </form>
      )}
    </div>
  )
}
