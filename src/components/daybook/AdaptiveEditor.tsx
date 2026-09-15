import { ArrowLeft, Check, Circle, Minus, Save, Square, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import type { JournalEntry, JournalMode } from './types'

type Props = { mode: JournalMode; entry?: JournalEntry; onBack: () => void; onSave: (entry: JournalEntry) => void }
const initialContent = (mode: JournalMode, entry?: JournalEntry) => entry?.content ?? (mode.editorType === 'split-pane' ? { left: '', right: '' } : mode.editorType === 'bujo' ? { log: '' } : mode.editorType === 'guided' ? Object.fromEntries((mode.prompts ?? []).map((_, index) => [`prompt-${index}`, ''])) : { body: '' })

export function AdaptiveEditor({ mode, entry, onBack, onSave }: Props) {
  const { t } = useTranslation(undefined, { i18n })
  const [content, setContent] = useState<Record<string, string>>(() => initialContent(mode, entry))
  const [saved, setSaved] = useState(Boolean(entry))
  useEffect(() => { setSaved(false); const timer = window.setTimeout(() => setSaved(true), 700); return () => window.clearTimeout(timer) }, [content])
  const update = (key: string, value: string) => setContent(current => ({ ...current, [key]: value }))
  const save = () => { onSave({ id: entry?.id ?? crypto.randomUUID(), modeId: mode.id, modeTitle: mode.title, createdAt: entry?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), content }); setSaved(true) }
  return <div className={`daybook-editor editor-${mode.editorType}`}><header className="daybook-editor-header"><button className="daybook-back" onClick={onBack}><ArrowLeft size={16}/> {t('journal.allModes')}</button><div><span className="daybook-kicker">{mode.category}</span><h2>{mode.title}</h2></div><button className="daybook-save" onClick={save}><Save size={15}/> {saved ? t('journal.saved') : t('journal.savePage')}</button></header><p className="daybook-editor-description">{mode.description}</p>
    {mode.editorType === 'focus' && <label className="focus-editor"><span>My one thing today is…</span><input autoFocus value={content.body ?? ''} onChange={event => update('body', event.target.value)} aria-label="My one thing today" /></label>}
    {mode.editorType === 'guided' && <div className="guided-editor">{(mode.prompts ?? []).map((prompt, index) => <label key={prompt}><span>{index + 1}. {prompt}</span><textarea rows={4} value={content[`prompt-${index}`] ?? ''} onChange={event => update(`prompt-${index}`, event.target.value)} aria-label={prompt}/></label>)}</div>}
    {mode.editorType === 'bujo' && <div className="bujo-editor"><div className="bujo-toolbar" aria-label="Rapid logging toolbar">{[['task', Circle, 'Task [•]'], ['completed', Check, 'Completed [X]'], ['event', Square, 'Event [O]'], ['note', Minus, 'Note [-]']].map(([key, Icon, label]) => <button key={key as string} onClick={() => update('log', `${content.log ?? ''}${content.log ? '\\n' : ''}${label as string} `)}><Icon size={15}/> {label as string}</button>)}</div><textarea rows={12} value={content.log ?? ''} onChange={event => update('log', event.target.value)} aria-label="Bullet journal rapid log" placeholder="Start rapid logging here…" /></div>}
    {mode.editorType === 'split-pane' && <div className="split-editor"><label><span>What’s in my head</span><textarea rows={14} value={content.left ?? ''} onChange={event => update('left', event.target.value)} aria-label="What’s in my head"/></label><label><span>What I want to do with it</span><textarea rows={14} value={content.right ?? ''} onChange={event => update('right', event.target.value)} aria-label="What I want to do with it"/></label></div>}
    {mode.editorType === 'freeform' && <label className="freeform-editor"><span className="sr-only">Journal page</span><textarea autoFocus rows={18} value={content.body ?? ''} onChange={event => update('body', event.target.value)} aria-label={`${mode.title} journal page`} placeholder="Let the page hold the first thought…" /></label>}
    <footer className="daybook-editor-footer"><span>{saved ? <><Check size={14}/> {t('journal.savedPrivately')}</> : t('journal.unsaved')}</span><button className="text-button" onClick={onBack}><X size={14}/> {t('journal.closePage')}</button></footer>
  </div>
}
