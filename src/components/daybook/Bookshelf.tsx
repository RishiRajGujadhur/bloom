import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { PageFlip } from 'page-flip'
import { X, ChevronLeft, ChevronRight, Pencil } from 'lucide-react'
import { journalText } from '../../search/db'
import { subOn } from '../../features/subFeatures'
import type { JournalEntry, JournalMode } from './types'
import './bookshelf.css'

/**
 * Daybook bookshelf: every journal type becomes a chunky 3D storybook that
 * floats and tilts toward the pointer (GSAP). Opening one shows its entries as
 * a real page-turning book (StPageFlip).
 */
const palette: Record<string, [string, string]> = {
  planning: ['#ff8a3d', '#e2641c'],
  reflection: ['#f06ba8', '#c94384'],
  vision: ['#4d9de0', '#2f74b5'],
  gamified: ['#63c132', '#3f9a1a'],
}
const reduced = () =>
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

type Book = { mode: JournalMode; pages: JournalEntry[] }

function Face({ blinkDelay }: { blinkDelay: number }) {
  const eyes = useRef<SVGGElement>(null)
  useEffect(() => {
    if (!eyes.current || reduced() || !subOn('daybookModes', 'bookFaces'))
      return
    const tl = gsap.timeline({
      repeat: -1,
      repeatDelay: 2.5 + blinkDelay,
      delay: blinkDelay,
    })
    tl.to(eyes.current, {
      scaleY: 0.1,
      transformOrigin: '50% 50%',
      duration: 0.08,
    }).to(eyes.current, { scaleY: 1, duration: 0.12 })
    return () => void tl.kill()
  }, [blinkDelay])
  if (!subOn('daybookModes', 'bookFaces')) return null
  return (
    <svg className="bk-face" viewBox="0 0 60 34" aria-hidden="true">
      <g ref={eyes}>
        <ellipse cx="18" cy="14" rx="7" ry="8" fill="#fff" />
        <ellipse cx="42" cy="14" rx="7" ry="8" fill="#fff" />
        <circle cx="19.5" cy="15" r="4" fill="#222" />
        <circle cx="43.5" cy="15" r="4" fill="#222" />
        <circle cx="21" cy="13" r="1.4" fill="#fff" />
        <circle cx="45" cy="13" r="1.4" fill="#fff" />
      </g>
      <path
        d="M26 26 q4 5 8 0"
        stroke="#222"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BookCover({
  book,
  index,
  onOpen,
}: {
  book: Book
  index: number
  onOpen: () => void
}) {
  const el = useRef<HTMLButtonElement>(null)
  const [front, spine] = palette[book.mode.category] ?? palette.planning
  useLayoutEffect(() => {
    const b = el.current
    if (!b || reduced()) return
    const float = subOn('daybookModes', 'bookFloat')
      ? gsap.to(b, {
          y: -10 - (index % 3) * 4,
          rotate: index % 2 ? 3 : -3,
          duration: 2.4 + (index % 4) * 0.3,
          yoyo: true,
          repeat: -1,
          ease: 'sine.inOut',
          delay: index * 0.15,
        })
      : null
    const rx = gsap.quickTo(b, 'rotationX', { duration: 0.4, ease: 'power3' })
    const ry = gsap.quickTo(b, 'rotationY', { duration: 0.4, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = b.getBoundingClientRect()
      ry(((e.clientX - r.left) / r.width - 0.5) * 30)
      rx(-((e.clientY - r.top) / r.height - 0.5) * 20)
    }
    const leave = () => {
      rx(0)
      ry(-18)
    }
    gsap.set(b, { rotationY: -18, transformPerspective: 700 })
    b.addEventListener('pointermove', move)
    b.addEventListener('pointerleave', leave)
    return () => {
      float?.kill()
      b.removeEventListener('pointermove', move)
      b.removeEventListener('pointerleave', leave)
    }
  }, [index])
  return (
    <button
      ref={el}
      type="button"
      className="bk-book"
      style={{ ['--front' as string]: front, ['--spine' as string]: spine }}
      onClick={onOpen}
      data-cursor-text="Open"
    >
      <span className="bk-spine" aria-hidden="true" />
      <span className="bk-edge" aria-hidden="true" />
      <span className="bk-front">
        <span className="bk-icon" aria-hidden="true">
          {book.mode.icon}
        </span>
        <Face blinkDelay={(index % 5) * 0.7} />
        <strong>{book.mode.title}</strong>
        <small>
          {book.pages.length} {book.pages.length === 1 ? 'page' : 'pages'}
        </small>
      </span>
      <span className="bk-ribbon" aria-hidden="true" />
    </button>
  )
}

/** Split long entries so each fits on a book page. */
export function paginate(text: string, per = 700) {
  const out: string[] = []
  let rest = text.trim()
  while (rest.length > per) {
    const cut = rest.lastIndexOf(' ', per)
    out.push(rest.slice(0, cut > 200 ? cut : per))
    rest = rest.slice(cut > 200 ? cut + 1 : per)
  }
  out.push(rest)
  return out
}

function Reader({
  book,
  onClose,
  onEdit,
  language,
}: {
  book: Book
  onClose: () => void
  onEdit: (p: JournalEntry) => void
  language: string
}) {
  const host = useRef<HTMLDivElement>(null)
  const template = useRef<HTMLDivElement>(null)
  const flip = useRef<PageFlip | null>(null)
  const [page, setPage] = useState(0)
  const sheets = useMemo(
    () =>
      [...book.pages]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .flatMap((p) =>
          paginate(
            journalText(p.content) || 'An empty page, waiting for you.',
          ).map((text, i) => ({ entry: p, text, cont: i > 0 })),
        ),
    [book],
  )
  useEffect(() => {
    const wrap = host.current
    const tpl = template.current
    if (!wrap || !tpl) return
    // StPageFlip owns (and on destroy removes) its element, so give it a
    // node React does not manage, filled with clones of the template pages.
    const el = document.createElement('div')
    el.className = 'bk-flip'
    const nodes = [...tpl.querySelectorAll<HTMLElement>('.bk-page')].map(
      (n) => n.cloneNode(true) as HTMLElement,
    )
    el.append(...nodes)
    wrap.append(el)
    const pf = new PageFlip(el, {
      width: 340,
      height: 460,
      size: 'stretch',
      minWidth: 240,
      maxWidth: 520,
      minHeight: 320,
      maxHeight: 700,
      showCover: true,
      maxShadowOpacity: 0.4,
      mobileScrollSupport: false,
      flippingTime: reduced() ? 1 : 800,
    })
    pf.loadFromHTML(nodes)
    pf.on('flip', (e) => setPage(Number(e.data)))
    flip.current = pf
    return () => {
      try {
        pf.destroy()
      } catch {
        /* already gone */
      }
      el.remove()
      flip.current = null
    }
  }, [sheets])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') flip.current?.flipNext()
      if (e.key === 'ArrowLeft') flip.current?.flipPrev()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  const current = sheets[Math.max(0, page - 1)]
  return (
    <div
      className="bk-reader"
      role="dialog"
      aria-modal="true"
      aria-label={`${book.mode.title} book`}
    >
      <div className="bk-reader-bar">
        <strong>
          {book.mode.icon} {book.mode.title}
        </strong>
        {current && (
          <button
            type="button"
            className="quiet-button"
            onClick={() => onEdit(current.entry)}
          >
            <Pencil size={15} /> Edit this page
          </button>
        )}
        <button
          type="button"
          className="icon-button"
          aria-label="Close book"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <div ref={host} className="bk-flip-wrap" />
      <div className="bk-template" hidden>
        <div ref={template}>
          <div
            className="bk-page bk-cover"
            data-density="hard"
            data-cat={book.mode.category}
          >
            <span className="bk-cover-icon">{book.mode.icon}</span>
            <h2>{book.mode.title}</h2>
            <p>{book.pages.length} pages of your story</p>
          </div>
          {sheets.map((s, i) => (
            <div key={`${s.entry.id}-${i}`} className="bk-page">
              <div className="bk-page-inner">
                {!s.cont && (
                  <header>
                    <small>
                      {new Date(s.entry.createdAt).toLocaleDateString(
                        language,
                        {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        },
                      )}
                    </small>
                  </header>
                )}
                <p>{s.text}</p>
                <footer>{i + 1}</footer>
              </div>
            </div>
          ))}
          <div
            className="bk-page bk-cover"
            data-density="hard"
            data-cat={book.mode.category}
          >
            <h2>To be continued…</h2>
            <p>Every page you write adds to this book.</p>
          </div>
        </div>
      </div>
      <div className="bk-reader-nav">
        <button
          type="button"
          className="studio-btn"
          onClick={() => flip.current?.flipPrev()}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <span>
          {page + 1} / {sheets.length + 2}
        </span>
        <button
          type="button"
          className="studio-btn"
          onClick={() => flip.current?.flipNext()}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}

export function Bookshelf({
  pages,
  modes,
  onEdit,
  language,
}: {
  pages: JournalEntry[]
  modes: JournalMode[]
  onEdit: (p: JournalEntry) => void
  language: string
}) {
  const [open, setOpen] = useState<Book | null>(null)
  const shelf = useRef<HTMLDivElement>(null)
  const books = useMemo(() => {
    const by = new Map<string, JournalEntry[]>()
    for (const p of pages) by.set(p.modeId, [...(by.get(p.modeId) ?? []), p])
    return [...by.entries()]
      .map(([id, list]) => ({
        mode: modes.find((m) => m.id === id),
        pages: list,
      }))
      .filter((b): b is Book => !!b.mode)
      .sort((a, b) => b.pages.length - a.pages.length)
  }, [pages, modes])
  useLayoutEffect(() => {
    if (!shelf.current || reduced()) return
    const tw = gsap.from(shelf.current.querySelectorAll('.bk-book'), {
      y: 60,
      opacity: 0,
      rotate: () => gsap.utils.random(-20, 20),
      stagger: 0.07,
      duration: 0.7,
      ease: 'back.out(1.8)',
    })
    return () => void tw.progress(1)
  }, [books.length])
  if (!books.length) return null
  return (
    <section className="bk-shelf-wrap" aria-label="Your journal books">
      <h3>Your books</h3>
      <div ref={shelf} className="bk-shelf">
        {books.map((b, i) => (
          <BookCover
            key={b.mode.id}
            book={b}
            index={i}
            onOpen={() => setOpen(b)}
          />
        ))}
      </div>
      {open &&
        createPortal(
          <Reader
            book={open}
            language={language}
            onClose={() => setOpen(null)}
            onEdit={(p) => {
              setOpen(null)
              onEdit(p)
            }}
          />,
          document.body,
        )}
    </section>
  )
}
