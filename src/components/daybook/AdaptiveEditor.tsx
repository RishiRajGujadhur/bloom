import { subOn } from '../../features/subFeatures'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Highlight from '@tiptap/extension-highlight'
import { Player } from '@lottiefiles/react-lottie-player'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Flame,
  GitCompare,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react'
import { journalText } from '../../search/db'
import { loadSettings } from '../../SettingsPage'
import { ThoughtDiffPanel } from './ThoughtDiff'

/** Pages about fears and shadows offer the Burn & release ritual. */
const releaseModes = new Set(['fear-setting', 'shadow-work'])
import { LottieIcon } from '../ui/LottieIcon'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { EditorToolbar } from './EditorToolbar'
import styles from './editor.module.css'
import type { JournalEntry, JournalMode } from './types'

type DocumentValue = Record<string, unknown>
type RichFieldProps = {
  value?: unknown
  placeholder: string
  ariaLabel?: string
  compact?: boolean
  focus?: boolean
  bujo?: boolean
  autoFocus?: boolean
  onChange: (json: DocumentValue) => void
}

const emptyDocument = { type: 'doc', content: [{ type: 'paragraph' }] }
const breathingLottie = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 90,
  w: 120,
  h: 120,
  nm: 'Breathing glow',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Glow',
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [30] },
            { t: 45, s: [100] },
            { t: 90, s: [30] },
          ],
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [65, 65, 100] },
            { t: 45, s: [100, 100, 100] },
            { t: 90, s: [65, 65, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'el',
          s: { a: 0, k: [80, 80] },
          p: { a: 0, k: [0, 0] },
          nm: 'Circle',
        },
        {
          ty: 'fl',
          c: { a: 0, k: [0.54, 0.32, 0.72, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          nm: 'Fill',
        },
      ],
      ip: 0,
      op: 90,
      st: 0,
      bm: 0,
    },
  ],
}
const celebrationLottie = { ...breathingLottie, nm: 'Journal complete' }

/** Headless TipTap setup shared by every Daybook writing field. */
function useJournalEditor({
  value,
  placeholder,
  ariaLabel,
  bujo,
  autoFocus,
  onChange,
}: Omit<RichFieldProps, 'compact' | 'focus'>) {
  return useEditor(
    {
      extensions: [
        StarterKit,
        Highlight,
        Placeholder.configure({ placeholder }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ],
      // Accept legacy plain-text entries as well as new structured TipTap JSON.
      content:
        typeof value === 'string' || (value && typeof value === 'object')
          ? value
          : emptyDocument,
      editorProps: {
        attributes: { role: 'textbox', 'aria-label': ariaLabel ?? placeholder },
      },
      // Focus once the editor exists, so the first keystrokes are never lost.
      autofocus: bujo || autoFocus ? 'end' : false,
      onCreate: ({ editor }) => {
        if (bujo && editor.isEmpty)
          editor.chain().focus().toggleTaskList().run()
      },
      onUpdate: ({ editor }) => onChange(editor.getJSON()),
    },
    [placeholder],
  )
}

function RichField({
  value,
  placeholder,
  ariaLabel,
  compact,
  focus,
  bujo,
  autoFocus = true,
  onChange,
}: RichFieldProps) {
  const editor = useJournalEditor({
    value,
    placeholder,
    ariaLabel,
    bujo,
    autoFocus,
    onChange,
  })
  return (
    <div
      className={`${styles.editorShell} ${compact ? styles.compact : ''} ${focus ? styles.focus : ''}`}
    >
      {!focus && <EditorToolbar editor={editor} />}
      <EditorContent
        editor={editor}
        className={styles.content}
        aria-label={placeholder}
      />
    </div>
  )
}

const initialContent = (
  mode: JournalMode,
  entry?: JournalEntry,
): Record<string, unknown> =>
  entry?.content ??
  (mode.editorType === 'split-pane'
    ? { left: emptyDocument, right: emptyDocument }
    : mode.editorType === 'guided'
      ? Object.fromEntries(
          (mode.prompts ?? []).map((_, index) => [
            `prompt-${index}`,
            emptyDocument,
          ]),
        )
      : { body: emptyDocument })

export function AdaptiveEditor({
  mode,
  entry,
  onBack,
  onSave,
  onAutosave,
  previous,
}: {
  mode: JournalMode
  entry?: JournalEntry
  /** The last page of the same mode, for Thought diffing. */
  previous?: JournalEntry
  onBack: () => void
  /** "Complete journal": save and close. */
  onSave: (entry: JournalEntry) => void
  /** Quiet background save while writing; keeps the page open. */
  onAutosave?: (entry: JournalEntry) => void
}) {
  const { t } = useTranslation(undefined, { i18n })
  const [content, setContent] = useState<Record<string, unknown>>(() =>
    initialContent(mode, entry),
  )
  const [saved, setSaved] = useState(Boolean(entry))
  const [celebrating, setCelebrating] = useState(false)
  const [promptStep, setPromptStep] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const editorRoot = useRef<HTMLDivElement>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(saveTimer.current), [])
  const leave = () => (dirty ? setLeaving(true) : onBack())
  // Focus writing hides the app chrome (sidebar, topbar, floating buttons).
  const [immersive, setImmersive] = useState(false)
  useEffect(() => {
    if (!immersive) return
    document.documentElement.dataset.writing = 'focus'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setImmersive(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      delete document.documentElement.dataset.writing
      window.removeEventListener('keydown', onKey)
    }
  }, [immersive])
  const [comparing, setComparing] = useState(() => subOn('thoughtDiff', 'autoOpen'))
  const canCompare = Boolean(previous) && loadSettings().features.thoughtDiff
  const words = useMemo(() => {
    const text = journalText(content).trim()
    return text ? text.split(/\s+/).length : 0
  }, [content])
  const steps =
    mode.editorType === 'guided'
      ? (mode.prompts?.length ?? 1)
      : mode.editorType === 'split-pane'
        ? 2
        : 1
  const placeholder = useMemo(
    () =>
      mode.editorType === 'bujo'
        ? t('journal.startRapid')
        : mode.editorType === 'focus'
          ? t('journal.oneThing')
          : t('journal.holdThought'),
    [mode.editorType, t],
  )
  const update = (key: string, value: DocumentValue) => {
    setDirty(true)
    setSaved(false)
    setContent((current) => ({ ...current, [key]: value }))
  }
  // One id for the life of this page, so autosaves update rather than duplicate.
  const pageId = useRef(entry?.id ?? crypto.randomUUID())
  const createdAt = useRef(entry?.createdAt ?? new Date().toISOString())
  const snapshot = (): JournalEntry => ({
    id: pageId.current,
    modeId: mode.id,
    modeTitle: mode.title,
    createdAt: createdAt.current,
    updatedAt: new Date().toISOString(),
    content,
  })
  // Autosave shortly after typing stops; empty pages are never stored.
  useEffect(() => {
    if (!dirty || !onAutosave || !subOn('daybookModes', 'autosave')) return
    const timer = setTimeout(() => {
      if (!journalText(content).trim()) return
      onAutosave(snapshot())
      setSaved(true)
      setDirty(false)
    }, 900)
    return () => clearTimeout(timer)
    // snapshot reads the latest content; re-run only when content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content, dirty])
  const save = () => {
    if (celebrating) return
    setCelebrating(true)
    saveTimer.current = window.setTimeout(() => {
      onSave(snapshot())
      setCelebrating(false)
    }, 500)
  }
  const ambient = mode.category === 'reflection'
  return (
    <div
      ref={editorRoot}
      className={`daybook-editor editor-${mode.editorType}`}
    >
      <nav className="daybook-crumbs" aria-label="Breadcrumb">
        <button className="daybook-back" onClick={leave}>
          <ArrowLeft size={16} aria-hidden="true" /> {t('journal.allModes')}
        </button>
        <ChevronRight size={14} aria-hidden="true" />
        <span>{t(`daybook.category.${mode.category}`)}</span>
      </nav>
      <header className="daybook-editor-header">
        <div className="daybook-title">
          <h2>{mode.title}</h2>
          <p>{mode.description}</p>
          <div className="daybook-meta" aria-live="polite">
            <span>
              {new Date(entry?.createdAt ?? Date.now()).toLocaleDateString(
                i18n.resolvedLanguage ?? 'en',
                { weekday: 'long', month: 'long', day: 'numeric' },
              )}
            </span>
            <span>
              {words} {words === 1 ? 'word' : 'words'}
            </span>
            <span className={saved ? 'is-saved' : 'is-unsaved'}>
              {saved ? (
                <>
                  <Check size={13} aria-hidden="true" />{' '}
                  {t('journal.savedPrivately')}
                </>
              ) : (
                t('journal.unsaved')
              )}
            </span>
          </div>
        </div>
        <div className="daybook-actions">
          {canCompare && (
            <button
              type="button"
              className="quiet-button"
              aria-pressed={comparing}
              onClick={() => setComparing((v) => !v)}
            >
              <GitCompare size={16} aria-hidden="true" /> Compare with last time
            </button>
          )}
          {releaseModes.has(mode.id) && loadSettings().features.burnRelease && subOn('burnRelease', 'daybookShortcut') && (
            <a className="quiet-button" href="#release">
              <Flame size={16} aria-hidden="true" /> Burn & release
            </a>
          )}
          {subOn('daybookModes', 'focusWriting') && (
          <button
            type="button"
            className="quiet-button"
            aria-pressed={immersive}
            onClick={() => setImmersive((value) => !value)}
            title={immersive ? 'Exit focus writing (Esc)' : 'Focus writing'}
          >
            {immersive ? (
              <Minimize2 size={16} aria-hidden="true" />
            ) : (
              <Maximize2 size={16} aria-hidden="true" />
            )}
            {immersive ? 'Exit focus' : 'Focus writing'}
          </button>
          )}
          <button
            className="daybook-save daybook-complete"
            onClick={save}
            disabled={celebrating}
          >
            <LottieIcon name="check" size={17} />{' '}
            {celebrating ? 'Saving your page…' : 'Complete journal'}
          </button>
        </div>
      </header>
      {comparing && previous && <ThoughtDiffPanel previous={previous} content={content} />}
      {ambient && (
        <aside
          className="daybook-ambient"
          aria-label="Calm breathing animation"
        >
          <Player autoplay loop src={breathingLottie} />
        </aside>
      )}
      {mode.editorType === 'focus' && (
        <RichField
          value={content.body}
          onChange={(json) => update('body', json)}
          placeholder={placeholder}
          ariaLabel={t('daybook.focusAria')}
          focus
        />
      )}
      {mode.editorType === 'guided' && (
        <div className="guided-editor">
          {(mode.prompts ?? []).map((prompt, index) =>
            index === promptStep ? (
              <label key={prompt} className="daybook-prompt">
                <span>{prompt}</span>
                <RichField
                  value={content[`prompt-${index}`]}
                  onChange={(json) => update(`prompt-${index}`, json)}
                  placeholder={prompt}
                  compact
                />
              </label>
            ) : null,
          )}
        </div>
      )}
      {mode.editorType === 'bujo' && (
        <div className="bujo-editor">
          <RichField
            value={content.body}
            onChange={(json) => update('body', json)}
            placeholder={placeholder}
            ariaLabel={t('daybook.rapidLogAria')}
            bujo
          />
        </div>
      )}
      {mode.editorType === 'split-pane' && (
        <div className="split-editor">
          {promptStep === 0 ? (
            <label>
              <span>{t('journal.whatsInHead')}</span>
              <RichField
                key="left"
                value={content.left}
                onChange={(json) => update('left', json)}
                placeholder={t('journal.whatsInHead')}
                compact
              />
            </label>
          ) : (
            <label>
              <span>{t('journal.whatToDo')}</span>
              <RichField
                key="right"
                value={content.right}
                onChange={(json) => update('right', json)}
                placeholder={t('journal.whatToDo')}
                compact
              />
            </label>
          )}
        </div>
      )}
      {mode.editorType === 'freeform' && (
        <label className="freeform-editor">
          <span className="sr-only">{t('journal.journalPage')}</span>
          <RichField
            value={content.body}
            onChange={(json) => update('body', json)}
            placeholder={placeholder}
            ariaLabel={t('daybook.freeformAria', { title: mode.title })}
          />
        </label>
      )}
      {steps > 1 && (
        <div className="prompt-navigation">
          <button
            className="quiet-button"
            disabled={promptStep === 0}
            onClick={() => setPromptStep((value) => value - 1)}
          >
            Back
          </button>
          <span className="prompt-dots">
            {Array.from({ length: steps }, (_, i) => (
              <i key={i} aria-hidden="true" data-on={i === promptStep} />
            ))}
            <small aria-hidden="true">
              {promptStep + 1} / {steps}
            </small>
            <span className="sr-only">
              Prompt {promptStep + 1} of {steps}
            </span>
          </span>
          {promptStep < steps - 1 ? (
            <button
              className="primary"
              onClick={() => setPromptStep((value) => value + 1)}
            >
              Next
            </button>
          ) : (
            <button className="primary" onClick={save} disabled={celebrating}>
              Save page
            </button>
          )}
        </div>
      )}
      {leaving && (
        <div className="leave-draft" role="alert">
          <p>Save this page before leaving?</p>
          <button className="primary" onClick={save} disabled={celebrating}>
            Save page
          </button>
          <button className="quiet-button" onClick={() => setLeaving(false)}>
            Keep writing
          </button>
          <button className="quiet-button" onClick={onBack}>
            Discard changes
          </button>
        </div>
      )}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            className="daybook-celebration"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Player autoplay src={celebrationLottie} />
            <motion.div
              initial={{ scale: 0.7, y: 12 }}
              animate={{ scale: 1, y: 0 }}
            >
              <Sparkles size={25} />
              <strong>Beautifully done</strong>
              <span>Your reflection is being saved privately.</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
