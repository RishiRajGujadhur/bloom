import { useState } from 'react'
import { Trash2 } from 'lucide-react'

/** Wipe everything Bloom stores on this device: local storage, IndexedDB and caches. */
export async function clearAllData() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    /* storage blocked */
  }
  try {
    const dbs = (await indexedDB.databases?.()) ?? []
    await Promise.all(dbs.map((d) => d.name && new Promise((res) => {
      const r = indexedDB.deleteDatabase(d.name!)
      r.onsuccess = r.onerror = r.onblocked = () => res(null)
    })))
  } catch {
    /* IndexedDB unavailable */
  }
  try {
    if ('caches' in window) await Promise.all((await caches.keys()).map((k) => caches.delete(k)))
  } catch {
    /* no caches */
  }
}

/** Settings card: a guarded "delete all my data" (type DELETE to confirm). */
export function DataReset({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <section className={`data-reset bloom-stack ${className ?? ''}`} aria-labelledby="data-reset-heading">
      <h2 id="data-reset-heading"><Trash2 size={18} aria-hidden="true" /> Clear my data</h2>
      <p>Delete everything Bloom has stored on this device — journal, habits, money, English progress, settings and caches. Export a backup first if you might want it back. This can’t be undone.</p>
      {!open ? (
        <button type="button" className="studio-btn data-reset-btn" onClick={() => setOpen(true)}>Clear all my data…</button>
      ) : (
        <form className="data-reset-confirm bloom-stack" onSubmit={async (e) => {
          e.preventDefault()
          if (word !== 'DELETE') return
          setBusy(true)
          await clearAllData()
          window.location.reload()
        }}>
          <label>
            Type <strong>DELETE</strong> to confirm
            <input className="studio-input" value={word} autoFocus aria-label="Type DELETE to confirm" onChange={(e) => setWord(e.target.value)} />
          </label>
          <div>
            <button type="submit" className="studio-btn data-reset-btn" disabled={word !== 'DELETE' || busy}>{busy ? 'Clearing…' : 'Delete everything'}</button>
            <button type="button" className="studio-btn" onClick={() => { setOpen(false); setWord('') }}>Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
