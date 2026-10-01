import { useTabTitle } from '../../utils/useTabTitle'
import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { Brain, Eye, Lightbulb, Plus, Sparkles, Trash2 } from 'lucide-react'
import { subOn } from '../subFeatures'
import { burst } from '../../components/ui/celebrate'
import { createEpiphany, dueToday, grades, retention, review, type Epiphany } from './epiphanyModel'
import { addEpiphany, useEpiphanies } from './epiphanyStore'
import { EpiphaniesQuick } from '../quick/EpiphaniesQuick'
import { BulbGarland } from '../showcase/BulbGarland'
import { ShowMore } from '../../components/ui/Flow'
import './epiphany.css'
import { pathLength } from '../../utils/svgLength'

/** The forgetting curve for an insight, drawn on with GSAP. */
export function ForgettingCurve({ item, width = 260, height = 70 }: { item: Pick<Epiphany, 'interval' | 'efactor'>; width?: number; height?: number }) {
  const path = useRef<SVGPathElement>(null)
  const days = Math.max(8, Math.round((item.interval || 1) * 2.2))
  const points = Array.from({ length: 41 }, (_, i) => {
    const t = (i / 40) * days
    return [8 + (i / 40) * (width - 16), 6 + (1 - retention(item, t)) * (height - 16)]
  })
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const reviewX = 8 + Math.min(1, (item.interval || 1) / days) * (width - 16)
  useLayoutEffect(() => {
    const el = path.current
    if (!el || prefersReducedMotion()) return
    const length = pathLength(el, 300)
    const tween = gsap.fromTo(el, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.out' })
    return () => {
      tween.kill()
    }
  }, [d])
  return (
    <svg className="forget-curve" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Recall fades over about ${days} days; next review in ${item.interval || 1} days`}>
      <line x1="8" x2={width - 8} y1={height - 10} y2={height - 10} className="fc-axis" />
      <line x1={reviewX} x2={reviewX} y1="4" y2={height - 10} className="fc-review" />
      <path ref={path} d={d} className="fc-line" />
      <text x={reviewX + 4} y="12" className="fc-label">
        review
      </text>
    </svg>
  )
}

/** "Extract epiphany" — saves the selected text (or a typed insight). */
export function ExtractEpiphany({ source, today, fallbackText }: { source: Epiphany['source']; today: string; fallbackText: () => string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)
  return (
    <div className="extract-epiphany">
      <button
        type="button"
        className="quiet-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const selected = window.getSelection()?.toString().trim() ?? ''
          setText(selected || fallbackText().split(/(?<=[.!?])\s/)[0] || '')
          setOpen(true)
          setSaved(false)
        }}
      >
        <Lightbulb size={16} aria-hidden="true" /> Extract epiphany
      </button>
      {open && (
        <form
          className="extract-form"
          onSubmit={(e) => {
            e.preventDefault()
            if (!text.trim()) return
            addEpiphany(createEpiphany(text, source, today))
            setSaved(true)
            setOpen(false)
            burst(e.currentTarget, 'stars')
          }}
        >
          <label htmlFor="epiphany-text">The insight worth remembering</label>
          <textarea id="epiphany-text" rows={3} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} />
          <div>
            <button className="ov-primary" type="submit">
              <Sparkles size={15} aria-hidden="true" /> Save — remind me tomorrow
            </button>
            <button type="button" className="ov-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {saved && <span className="extract-saved" role="status">Saved. It will come back just before you forget it.</span>}
    </div>
  )
}

/**
 * The morning gate: due epiphanies cover the habits card until you've
 * recalled and graded each one.
 */
export function EpiphanyGate({ today, children, enabled = true }: { today: string; children: ReactNode; enabled?: boolean }) {
  const [list, update] = useEpiphanies()
  const due = dueToday(list, today)
  const [revealed, setRevealed] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const current = due[0]
  const currentId = current?.id
  useEffect(() => {
    if (!card.current || !currentId) return
    const tween = gsap.from(card.current, { y: 24, opacity: 0, scale: 0.97, duration: 0.5, ease: 'back.out(1.6)' })
    return () => {
      tween.revert()
    }
  }, [currentId])
  if (!enabled || !current || !subOn('epiphanies', 'obstruct')) return <>{children}</>
  const recallFirst = subOn('epiphanies', 'recallFirst')
  const show = revealed || !recallFirst
  return (
    <div className="epiphany-gate">
      <div className="epiphany-gate-under" aria-hidden="true" inert>
        {children}
      </div>
      <div className="epiphany-card" ref={card} role="dialog" aria-label="Epiphany review">
        <span className="epiphany-kicker">
          <Brain size={15} aria-hidden="true" /> Before your habits · {due.length} to review
        </span>
        <p className="epiphany-source">
          From “{current.source.title}”, {new Date(`${current.source.date}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </p>
        {show ? (
          <blockquote className="epiphany-text">{current.text}</blockquote>
        ) : (
          <button className="epiphany-hidden" onClick={() => setRevealed(true)}>
            <Eye size={18} aria-hidden="true" /> Try to recall it, then reveal
          </button>
        )}
        {subOn('epiphanies', 'curve') && <ForgettingCurve item={current} />}
        {show && (
          <div className="epiphany-grades" role="group" aria-label="How well did you remember it?">
            {grades.map((g) => (
              <button
                key={g.grade}
                className={g.grade >= 4 ? 'ov-primary' : 'ov-secondary'}
                title={g.hint}
                onClick={(e) => {
                  if (g.grade >= 4) burst(e.currentTarget, 'stars')
                  update(list.map((item) => (item.id === current.id ? review(item, g.grade, today) : item)))
                  setRevealed(false)
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EpiphaniesPage({ today }: { today: string }) {
  const [list, update] = useEpiphanies()
  const [text, setText] = useState('')
  const [onlyStarred, setOnlyStarred] = useState(false)
  const dueCount = list.filter((e) => e.due <= today).length
  useTabTitle(dueCount ? `${dueCount} to review` : '', 'Epiphanies')
  const sorted = [...list]
    .filter((e) => !onlyStarred || e.starred)
    .sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)) || a.due.localeCompare(b.due))
  return (
    <section className="epiphanies-page" aria-label="Epiphanies">
      <EpiphaniesQuick today={today} />
      <BulbGarland list={list} />
      <form
        className="epiphany-add"
        onSubmit={(e) => {
          e.preventDefault()
          if (!text.trim()) return
          addEpiphany(createEpiphany(text, { kind: 'manual', title: 'Added by hand', date: today }, today))
          setText('')
        }}
      >
        <input aria-label="New epiphany" placeholder="Something you never want to forget…" value={text} maxLength={600} onChange={(e) => setText(e.target.value)} />
        <button className="ov-primary" type="submit">
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </form>
      {!list.length && (
        <p className="wb-muted">
          Highlight a sentence in a Daybook page and press <strong>Extract epiphany</strong>. It will come back just before
          you’d forget it.
        </p>
      )}
      {list.length > 0 && (
        <button
          type="button"
          className="quiet-button"
          onClick={() => {
            const body = [...list].sort((a, b) => a.createdAt - b.createdAt).map((e) => `${e.starred ? '★ ' : ''}${e.text}\n   — ${e.source.title}, ${e.source.date}`).join('\n\n')
            const a = document.createElement('a')
            a.href = URL.createObjectURL(new Blob([`My epiphanies\n\n${body}\n`], { type: 'text/plain' }))
            a.download = 'bloom-epiphanies.txt'
            a.click()
            setTimeout(() => URL.revokeObjectURL(a.href), 1000)
          }}
        >
          ⬇ Export all
        </button>
      )}
      {list.some((e) => e.reviews.some((r) => Date.now() - r.at < 7 * 864e5)) && (
        <p className="wb-muted">{list.reduce((a, e) => a + e.reviews.filter((r) => Date.now() - r.at < 7 * 864e5).length, 0)} reviews this week · {list.filter((e) => e.due <= today).length} due now</p>
      )}
      {list.some((e) => e.starred) && (
        <div className="filter-chips" role="group" aria-label="Filter">
          <button type="button" aria-pressed={!onlyStarred} onClick={() => setOnlyStarred(false)}>All · {list.length}</button>
          <button type="button" aria-pressed={onlyStarred} onClick={() => setOnlyStarred(true)}>★ Starred · {list.filter((e) => e.starred).length}</button>
        </div>
      )}
      <ShowMore as="ul" className="epiphany-list" initial={5} label="insights">
        {sorted.map((item) => (
          <li key={item.id} data-due={item.due <= today}>
            <blockquote>{item.text}</blockquote>
            <div className="epiphany-meta">
              <span>{item.due <= today ? 'Due today' : `Next: ${new Date(`${item.due}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}</span>
              <span>Reviewed {item.reviews.length}×</span>
              <span>Ease {item.efactor.toFixed(2)}</span>
            </div>
            {subOn('epiphanies', 'curve') && <ForgettingCurve item={item} width={300} height={60} />}
            <button
              className="icon-button epiphany-star"
              aria-label={item.starred ? 'Unstar' : 'Star as a favourite'}
              aria-pressed={Boolean(item.starred)}
              onClick={() => update(list.map((e) => (e.id === item.id ? { ...e, starred: !e.starred } : e)))}
            >
              {item.starred ? '★' : '☆'}
            </button>
            <button className="icon-button" aria-label="Delete epiphany" onClick={() => update(list.filter((e) => e.id !== item.id))}>
              <Trash2 size={15} />
            </button>
          </li>
        ))}
      </ShowMore>
    </section>
  )
}
