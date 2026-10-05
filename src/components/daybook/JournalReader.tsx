import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Minimize2,
  Pencil,
  X,
} from 'lucide-react'
import { prefersReducedMotion } from '../../utils/motion'
import { journalText } from '../../search/db'
import { JournalCover, journalColors } from './Bookshelf'
import type { JournalEntry, JournalMode } from './types'

export function JournalReader({
  pages,
  modes,
  entryId,
  language,
  source,
  onClose,
  onEdit,
}: {
  pages: JournalEntry[]
  modes: JournalMode[]
  entryId: string
  language: string
  source?: DOMRect
  onClose: () => void
  onEdit: (page: JournalEntry) => void
}) {
  const first = pages.find((page) => page.id === entryId)
  const entries = pages
    .filter((page) => page.modeId === first?.modeId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const [selectedId, setSelectedId] = useState(entryId)
  const [expanded, setExpanded] = useState(false)
  const [closing, setClosing] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const scene = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLElement>(null)
  const wasExpanded = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selected = entries.find((page) => page.id === selectedId) ?? first
  const mode = modes.find((item) => item.id === selected?.modeId)
  const index = entries.findIndex((page) => page.id === selected?.id)
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(language, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  useLayoutEffect(() => {
    const node = dialog.current
    if (!node) return
    const previous = document.activeElement as HTMLElement | null
    node.showModal()
    const target = scene.current?.getBoundingClientRect()
    if (source && target && !prefersReducedMotion()) {
      node.style.setProperty(
        '--journal-from-x',
        `${source.left + source.width / 2 - target.left - target.width / 2}px`,
      )
      node.style.setProperty(
        '--journal-from-y',
        `${source.top + source.height / 2 - target.top - target.height / 2}px`,
      )
      node.style.setProperty(
        '--journal-from-scale',
        String(Math.max(0.25, Math.min(0.8, source.width / 320))),
      )
    }
    node.querySelector<HTMLButtonElement>('.journal-reader-close')?.focus()
    const scroll = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      node.close()
      document.body.style.overflow = scroll
      previous?.focus({ preventScroll: true })
    }
  }, [source])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  useEffect(() => {
    if (expanded)
      paper.current
        ?.querySelector<HTMLElement>('.journal-paper-writing')
        ?.focus()
    else if (wasExpanded.current)
      paper.current
        ?.querySelector<HTMLButtonElement>('.journal-paper-open')
        ?.focus()
    wasExpanded.current = expanded
  }, [expanded])
  if (!selected) return null
  const close = () => {
    if (closing) return
    if (prefersReducedMotion()) {
      onClose()
      return
    }
    setClosing(true)
    timer.current = setTimeout(onClose, 240)
  }
  const choose = (id: string) => {
    setSelectedId(id)
    setExpanded(false)
  }
  const sections = Object.entries(selected.content)
    .map(([key, content]) => ({
      key,
      heading: key.startsWith('prompt-')
        ? mode?.prompts?.[Number(key.slice(7))]
        : key === 'left'
          ? (mode?.prompts?.[0] ?? 'First perspective')
          : key === 'right'
            ? (mode?.prompts?.[1] ?? 'Second perspective')
            : undefined,
      text: journalText(content).trim(),
    }))
    .filter((section) => section.text)

  return createPortal(
    <dialog
      ref={dialog}
      className={`journal-reader${expanded ? ' is-expanded' : ''}${closing ? ' is-closing' : ''}`}
      aria-label={`${selected.modeTitle} journal`}
      onCancel={(event) => {
        event.preventDefault()
        if (expanded) setExpanded(false)
        else close()
      }}
      style={
        {
          '--journal-cover':
            journalColors[mode?.category ?? 'reflection'] ?? '#597153',
        } as CSSProperties
      }
    >
      <header className="journal-reader-header">
        <div>
          <span className="journal-eyebrow">YOUR DAYBOOK</span>
          <h2>{selected.modeTitle}</h2>
        </div>
        <button
          type="button"
          className="journal-reader-close"
          aria-label="Close journal"
          onClick={close}
        >
          <X size={20} />
        </button>
      </header>
      <div ref={scene} className="journal-reader-stage">
        <div className="journal-reader-book" aria-hidden="true">
          <span className="journal-reader-back" />
          <span className="journal-reader-leaf leaf-one" />
          <span className="journal-reader-leaf leaf-two" />
          <span className="journal-reader-cover">
            <JournalCover
              title={selected.modeTitle}
              category={mode?.category ?? 'reflection'}
              count={entries.length}
            />
          </span>
        </div>
        <article
          ref={paper}
          key={selected.id}
          className="journal-reader-paper"
          aria-label="Saved journal page"
        >
          <svg
            className="journal-paper-fold"
            viewBox="0 0 400 500"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M0 250H400" stroke="currentColor" strokeOpacity=".14" />
            <path d="M0 248H400" stroke="white" strokeOpacity=".5" />
          </svg>
          <div className="journal-paper-content">
            <header>
              <span>
                {selected.mood && (
                  <span aria-label="Mood">{selected.mood} </span>
                )}
                <time dateTime={selected.createdAt}>
                  {formatDate(selected.createdAt)}
                </time>
              </span>
              <small>{selected.modeTitle}</small>
            </header>
            <div
              className="journal-paper-writing"
              role="region"
              aria-label="Journal writing"
              tabIndex={expanded ? 0 : -1}
            >
              {sections.length ? (
                sections.map((section) => (
                  <section key={section.key}>
                    {section.heading && <h3>{section.heading}</h3>}
                    <p>{section.text}</p>
                  </section>
                ))
              ) : (
                <p>An empty page, waiting for you.</p>
              )}
            </div>
            <footer>
              {expanded
                ? 'Your words. Your own pace.'
                : 'Tap to unfold this page'}
              <span>
                {index + 1} / {entries.length}
              </span>
            </footer>
          </div>
          {!expanded && (
            <button
              type="button"
              className="journal-paper-open"
              aria-label={`Read ${selected.modeTitle} from ${formatDate(selected.createdAt)}`}
              onClick={() => setExpanded(true)}
            >
              <span>
                <BookOpen size={16} /> Open page
              </span>
            </button>
          )}
        </article>
      </div>
      <footer className="journal-reader-controls">
        {expanded ? (
          <>
            <button type="button" onClick={() => setExpanded(false)}>
              <Minimize2 size={16} /> Back to book
            </button>
            <button type="button" onClick={() => onEdit(selected)}>
              <Pencil size={16} /> Edit this page
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              aria-label="Newer saved page"
              disabled={index <= 0}
              onClick={() => choose(entries[index - 1].id)}
            >
              <ArrowLeft size={18} />
            </button>
            <label>
              Saved page
              <select
                aria-label="Choose saved journal page"
                value={selected.id}
                onChange={(event) => choose(event.target.value)}
              >
                {entries.map((page, pageIndex) => (
                  <option key={page.id} value={page.id}>
                    {pageIndex + 1} ·{' '}
                    {new Date(page.createdAt).toLocaleString(language, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              aria-label="Older saved page"
              disabled={index >= entries.length - 1}
              onClick={() => choose(entries[index + 1].id)}
            >
              <ArrowRight size={18} />
            </button>
          </>
        )}
      </footer>
    </dialog>,
    document.body,
  )
}
