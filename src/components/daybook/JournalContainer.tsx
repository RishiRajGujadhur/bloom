import { useEffect, useState } from 'react'
import type { JournalEntry, JournalMode } from './types'
import { journalModes } from './mockData'
import { AdaptiveEditor } from './AdaptiveEditor'
import { JournalLibrary } from './JournalLibrary'

export const DAYBOOK_STORAGE_KEY = 'mindfulness-dashboard-daybook-v1'
export function JournalContainer() {
  const [selected, setSelected] = useState<JournalMode | null>(null)
  const [storageError, setStorageError] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>(() => { try { return JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as JournalEntry[] } catch { return [] } })
  const entry = selected ? entries.find(item => item.modeId === selected.id) : undefined
  useEffect(() => {
    try {
      localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(entries))
      setStorageError('')
    } catch {
      setStorageError('Daybook changes are currently in memory only. Export your dashboard data or free browser storage to keep new pages.')
    }
  }, [entries])
  const save = (next: JournalEntry) => { setEntries(current => [next, ...current.filter(item => item.id !== next.id)]); setSelected(null) }
  return <section className="card daybook" id="daybook"><div className="daybook-container">{storageError && <p className="daybook-storage-error" role="status">{storageError}</p>}{selected ? <AdaptiveEditor mode={selected} entry={entry} onBack={() => setSelected(null)} onSave={save}/> : <JournalLibrary modes={journalModes} onSelect={setSelected}/>}</div></section>
}
