import { ArrowRight, Clock3, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalMode, JournalCategory } from './types'

const categories: JournalCategory[] = ['planning', 'reflection', 'vision', 'gamified']

export function JournalLibrary({ modes, onSelect }: { modes: JournalMode[]; onSelect: (mode: JournalMode) => void }) {
  const { t } = useTranslation(undefined, { i18n })
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => modes.filter(mode => {
    const category = t(`daybook.category.${mode.category}`)
    return `${mode.title} ${mode.description} ${category}`.toLowerCase().includes(query.trim().toLowerCase())
  }), [modes, query, t])
  return <div className="daybook-library">
    <div className="daybook-heading"><div><span className="daybook-kicker">{t('journal.daybook')}</span><h2>{t('journal.choosePage')}</h2><p>{t('journal.differentDays')}</p></div><label className="daybook-search"><Search size={16}/><span className="sr-only">{t('journal.searchLabel')}</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('journal.searchModes')} /></label></div>
    {categories.map(category => <section className="daybook-category" key={category} aria-labelledby={`category-${category}`}><h3 id={`category-${category}`}>{t(`daybook.category.${category}`)}</h3><div className="daybook-grid">{filtered.filter(mode => mode.category === category).map(mode => <button className="daybook-mode" key={mode.id} onClick={() => onSelect(mode)}><span className="daybook-mode-icon" aria-hidden="true">{mode.icon}</span><span className="daybook-mode-copy"><strong>{mode.title}</strong><small>{mode.description}</small><em><Clock3 size={12}/> {mode.metadata?.time}</em></span><ArrowRight size={16} aria-hidden="true"/></button>)}</div></section>)}
    {filtered.length === 0 && <p className="daybook-empty">{t('journal.noPages', { query })}</p>}
  </div>
}