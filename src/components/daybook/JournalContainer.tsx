import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalEntry, JournalMode } from './types'
import { localizedJournalModes } from './mockData'
import { AdaptiveEditor } from './AdaptiveEditor'
import { JournalLibrary } from './JournalLibrary'
import { SemanticSearch } from './SemanticSearch'

export const DAYBOOK_STORAGE_KEY = 'mindfulness-dashboard-daybook-v1'
export function JournalContainer() {
  const { t } = useTranslation(undefined, { i18n })
  const language = i18n.resolvedLanguage ?? 'en'
  const [selected, setSelected] = useState<JournalMode | null>(null)
  const [storageError, setStorageError] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>(() => { try { return JSON.parse(localStorage.getItem(DAYBOOK_STORAGE_KEY) ?? '[]') as JournalEntry[] } catch { return [] } })
  const entry = selected ? entries.find(item => item.modeId === selected.id) : undefined
  useEffect(() => {
    try {
      localStorage.setItem(DAYBOOK_STORAGE_KEY, JSON.stringify(entries))
      setStorageError('')
    } catch {
      setStorageError(t('daybook.storageError'))
    }
  }, [entries, t])
  const save = (next: JournalEntry) => { setEntries(current => [next, ...current.filter(item => item.id !== next.id)]); setSelected(null) }
  return <section className="card daybook" id="daybook"><div className="daybook-container">{storageError && <p className="daybook-storage-error" role="status">{storageError}</p>}<div hidden={Boolean(selected)}><SemanticSearch entries={entries} onOpen={modeId => setSelected(localizedJournalModes(language).find(mode => mode.id === modeId) ?? null)}/></div>{selected ? <AdaptiveEditor mode={selected} entry={entry} onBack={() => setSelected(null)} onSave={save}/> : <JournalLibrary modes={localizedJournalModes(language)} onSelect={setSelected}/>}</div></section>
}
