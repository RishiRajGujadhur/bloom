import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { Player } from '@lottiefiles/react-lottie-player'
import { ArrowLeft, Check, Save, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { EditorToolbar } from './EditorToolbar'
import styles from './editor.module.css'
import type { JournalEntry, JournalMode } from './types'

type DocumentValue = Record<string, unknown>
type RichFieldProps = { value?: unknown; placeholder: string; ariaLabel?: string; compact?: boolean; focus?: boolean; bujo?: boolean; onChange: (json: DocumentValue) => void }

const emptyDocument = { type: 'doc', content: [{ type: 'paragraph' }] }
const breathingLottie = { v: '5.7.4', fr: 30, ip: 0, op: 90, w: 120, h: 120, nm: 'Breathing glow', ddd: 0, assets: [], layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'Glow', ks: { o: { a: 1, k: [{ t: 0, s: [30] }, { t: 45, s: [100] }, { t: 90, s: [30] }] }, r: { a: 0, k: 0 }, p: { a: 0, k: [60, 60, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ t: 0, s: [65, 65, 100] }, { t: 45, s: [100, 100, 100] }, { t: 90, s: [65, 65, 100] }] } }, shapes: [{ ty: 'el', s: { a: 0, k: [80, 80] }, p: { a: 0, k: [0, 0] }, nm: 'Circle' }, { ty: 'fl', c: { a: 0, k: [0.54, 0.32, 0.72, 1] }, o: { a: 0, k: 100 }, r: 1, nm: 'Fill' }], ip: 0, op: 90, st: 0, bm: 0 }] }
const celebrationLottie = { ...breathingLottie, nm: 'Journal complete' }

/** Headless TipTap setup shared by every Daybook writing field. */
function useJournalEditor({ value, placeholder, ariaLabel, bujo, onChange }: Omit<RichFieldProps, 'compact' | 'focus'>) {
  return useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder }), TaskList, TaskItem.configure({ nested: true })],
    // Accept legacy plain-text entries as well as new structured TipTap JSON.
    content: typeof value === 'string' || (value && typeof value === 'object') ? value : emptyDocument,
    editorProps: { attributes: { role: 'textbox', 'aria-label': ariaLabel ?? placeholder } },
    autofocus: bujo ? 'end' : false,
    onCreate: ({ editor }) => { if (bujo && editor.isEmpty) editor.chain().focus().toggleTaskList().run() },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  }, [placeholder])
}

function RichField({ value, placeholder, ariaLabel, compact, focus, bujo, onChange }: RichFieldProps) {
  const editor = useJournalEditor({ value, placeholder, ariaLabel, bujo, onChange })
  return <div className={`${styles.editorShell} ${compact ? styles.compact : ''} ${focus ? styles.focus : ''}`}>
    {!focus && <EditorToolbar editor={editor} />}
    <EditorContent editor={editor} className={styles.content} aria-label={placeholder} />
  </div>
}

const initialContent = (mode: JournalMode, entry?: JournalEntry): Record<string, unknown> => entry?.content ?? (mode.editorType === 'split-pane' ? { left: emptyDocument, right: emptyDocument } : mode.editorType === 'guided' ? Object.fromEntries((mode.prompts ?? []).map((_, index) => [`prompt-${index}`, emptyDocument])) : { body: emptyDocument })

export function AdaptiveEditor({ mode, entry, onBack, onSave }: { mode: JournalMode; entry?: JournalEntry; onBack: () => void; onSave: (entry: JournalEntry) => boolean | void }) {
  const { t } = useTranslation(undefined, { i18n })
  const [content, setContent] = useState<Record<string, unknown>>(() => initialContent(mode, entry))
  const [saved, setSaved] = useState(Boolean(entry))
  const [celebrating, setCelebrating] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(saveTimer.current), [])
  const placeholder = useMemo(() => mode.editorType === 'bujo' ? t('journal.startRapid') : mode.editorType === 'focus' ? t('journal.oneThing') : t('journal.holdThought'), [mode.editorType, t])
  const update = (key: string, value: DocumentValue) => { setSaved(false); setContent(current => ({ ...current, [key]: value })) }
  const save = () => { if (celebrating) return; setCelebrating(true); saveTimer.current = setTimeout(() => { if (onSave({ id: entry?.id ?? crypto.randomUUID(), modeId: mode.id, modeTitle: mode.title, createdAt: entry?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), content }) === false) setCelebrating(false) }, 900) }
  const ambient = mode.category === 'reflection'
  return <div className={`daybook-editor editor-${mode.editorType}`}>
    <header className="daybook-editor-header"><button className="daybook-back" onClick={onBack}><ArrowLeft size={16}/> {t('journal.allModes')}</button><div><span className="daybook-kicker">{t(`daybook.category.${mode.category}`)}</span><h2>{mode.title}</h2></div><button className="daybook-save daybook-complete" onClick={save} disabled={celebrating}><Save size={15}/> {celebrating ? 'Saving your page…' : 'Complete journal'}</button></header>
    <p className="daybook-editor-description">{mode.description}</p>
    {ambient && <aside className="daybook-ambient" aria-label="Calm breathing animation"><Player autoplay loop src={breathingLottie} /></aside>}
    {mode.editorType === 'focus' && <RichField value={content.body} onChange={json => update('body', json)} placeholder={placeholder} ariaLabel={t('daybook.focusAria')} focus />}
    {mode.editorType === 'guided' && <div className="guided-editor">{(mode.prompts ?? []).map((prompt, index) => <label key={prompt}><span>{index + 1}. {prompt}</span><RichField value={content[`prompt-${index}`]} onChange={json => update(`prompt-${index}`, json)} placeholder={prompt} compact /></label>)}</div>}
    {mode.editorType === 'bujo' && <div className="bujo-editor"><RichField value={content.body} onChange={json => update('body', json)} placeholder={placeholder} ariaLabel={t('daybook.rapidLogAria')} bujo /></div>}
    {mode.editorType === 'split-pane' && <div className="split-editor"><label><span>{t('journal.whatsInHead')}</span><RichField value={content.left} onChange={json => update('left', json)} placeholder={t('journal.whatsInHead')} compact /></label><label><span>{t('journal.whatToDo')}</span><RichField value={content.right} onChange={json => update('right', json)} placeholder={t('journal.whatToDo')} compact /></label></div>}
    {mode.editorType === 'freeform' && <label className="freeform-editor"><span className="sr-only">{t('journal.journalPage')}</span><RichField value={content.body} onChange={json => update('body', json)} placeholder={placeholder} ariaLabel={t('daybook.freeformAria', { title: mode.title })} /></label>}
    <footer className="daybook-editor-footer"><span>{saved ? <><Check size={14}/> {t('journal.savedPrivately')}</> : t('journal.unsaved')}</span><button className="text-button" onClick={onBack}><X size={14}/> {t('journal.closePage')}</button></footer>
    <AnimatePresence>{celebrating && <motion.div className="daybook-celebration" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Player autoplay src={celebrationLottie} /><motion.div initial={{ scale: .7, y: 12 }} animate={{ scale: 1, y: 0 }}><Sparkles size={25}/><strong>Beautifully done</strong><span>Your reflection is being saved privately.</span></motion.div></motion.div>}</AnimatePresence>
  </div>
}
