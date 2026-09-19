import { useState } from 'react'
import i18n from '../../i18n'
import type { JournalEntry, JournalMode } from './types'
import { localizedJournalModes } from './mockData'
import { AdaptiveEditor } from './AdaptiveEditor'
import { JournalLibrary } from './JournalLibrary'
import { SemanticSearch } from './SemanticSearch'

export { DAYBOOK_STORAGE_KEY } from './useJournalEntries'
export function JournalContainer({ entries, onSave, storageError }: { entries: JournalEntry[]; onSave: (entry: JournalEntry) => boolean; storageError: string }) {
  const language = i18n.resolvedLanguage ?? 'en'
  const [selected, setSelected] = useState<JournalMode | null>(null)
  const entry = selected ? entries.find(item => item.modeId === selected.id) : undefined
  const save = (next: JournalEntry) => { if (!onSave(next)) return false; setSelected(null); return true }
  return <section className="card daybook" id="daybook"><div className="daybook-container">{storageError && <p className="daybook-storage-error" role="status">{storageError}</p>}<div hidden={Boolean(selected)}><SemanticSearch entries={entries} onOpen={modeId => setSelected(localizedJournalModes(language).find(mode => mode.id === modeId) ?? null)}/></div>{selected ? <AdaptiveEditor mode={selected} entry={entry} onBack={() => setSelected(null)} onSave={save}/> : <JournalLibrary modes={localizedJournalModes(language)} onSelect={setSelected}/>}</div></section>
}
