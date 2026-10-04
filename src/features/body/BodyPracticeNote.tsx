import { useState } from 'react'
export function BodyPracticeNote({ page, title }: { page: string; title: string }) {
  const key = `bloom-body-note-${page}`
  const [note, setNote] = useState(() => { try { const value = localStorage.getItem(key); return value?.slice(0, 2000) ?? '' } catch { return '' } })
  const [status, setStatus] = useState('Private · stored on this device')
  const update = (value: string) => { setNote(value); try { localStorage.setItem(key, value); setStatus('Saved on this device') } catch { setStatus('Could not save: device storage is unavailable. Copy your note before leaving.') } }
  return <details className="body-practice-note"><summary>Practice note</summary><label>{title} note<textarea aria-label={`${title} practice note`} maxLength={2000} rows={3} value={note} onChange={event => update(event.target.value)} placeholder="How did it feel? What would you like to change next time?" /></label><p role="status">{status}</p></details>
}
