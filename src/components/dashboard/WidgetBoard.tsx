import { useEffect, useState } from 'react'
import { pageDetails } from '../layout/FeatureGuide'
import type { NavKey } from '../layout/Sidebar'
import type { AppData } from '../../model'
import type { Dispatch, SetStateAction } from 'react'
import { WidgetPreview } from './WidgetPreview'
import './widgetBoard.css'
import { WidgetFrame } from '../layout/WidgetLayout'

export type Widget = { page: NavKey; size: 1 | 2 }
export const WIDGET_KEY = 'bloom-home-widgets-v1'
export const WIDGET_EVENT = 'bloom-widgets-changed'
const choices = (Object.keys(pageDetails) as NavKey[]).filter(
  (key) => key !== 'overview' && key !== 'settings',
)
export const DEFAULT_WIDGETS: Widget[] = [
  'habits',
  'planning',
  'journal',
  'breathe',
  'sleep',
  'focus',
].map((page) => ({ page: page as NavKey, size: 1 }))

export function validWidgets(value: unknown): Widget[] | null {
  if (!Array.isArray(value) || value.length > 60) return null
  const seen = new Set<NavKey>()
  const result: Widget[] = []
  for (const item of value) {
    if (
      !item ||
      typeof item !== 'object' ||
      !choices.includes(item.page) ||
      ![1, 2].includes(item.size) ||
      seen.has(item.page)
    )
      return null
    seen.add(item.page)
    result.push({ page: item.page, size: item.size })
  }
  return result
}

function read(): Widget[] {
  try {
    return (
      validWidgets(JSON.parse(localStorage.getItem(WIDGET_KEY) || 'null')) ??
      DEFAULT_WIDGETS
    )
  } catch {
    return DEFAULT_WIDGETS
  }
}

export function WidgetBoard({
  onNavigate,
  enabled,
  data,
  today,
  setData,
}: {
  onNavigate: (page: NavKey) => void
  enabled: (page: NavKey) => boolean
  data: AppData
  today: string
  setData: Dispatch<SetStateAction<AppData>>
}) {
  const [widgets, setWidgets] = useState(read)
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [dragging, setDragging] = useState<NavKey | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  useEffect(() => {
    try {
      localStorage.setItem(WIDGET_KEY, JSON.stringify(widgets))
    } catch {
      /* private browsing */
    }
  }, [widgets])
  useEffect(() => {
    const sync = () => setWidgets(read())
    window.addEventListener(WIDGET_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(WIDGET_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const visible = widgets.filter((widget) => enabled(widget.page))
  const hiddenCount = widgets.length - visible.length
  const pageCount = Math.max(1, Math.ceil(visible.length / 6))
  const currentPage = Math.min(pageIndex, pageCount - 1)
  const displayed = editing ? visible : visible.slice(currentPage * 6, currentPage * 6 + 6)
  const available = choices.filter(
    (page) =>
      enabled(page) &&
      !widgets.some((widget) => widget.page === page) &&
      `${pageDetails[page].title} ${pageDetails[page].description}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  )
  const move = (page: NavKey, direction: number) =>
    setWidgets((current) => {
      const index = current.findIndex((widget) => widget.page === page)
      const neighbor =
        visible[visible.findIndex((item) => item.page === page) + direction]
      const target = current.findIndex(
        (widget) => widget.page === neighbor?.page,
      )
      if (index < 0 || target < 0) return current
      const next = [...current]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  const drop = (target: NavKey) => {
    if (!dragging || dragging === target) return
    setWidgets((current) => {
      const next = [...current]
      const from = next.findIndex((item) => item.page === dragging)
      const to = next.findIndex((item) => item.page === target)
      if (from < 0 || to < 0) return current
      next.splice(to, 0, next.splice(from, 1)[0])
      return next
    })
    setDragging(null)
  }
  return (
    <section className="widget-board" aria-label="Home widgets">
      <div className="widget-board-heading">
        <div>
          <h2>Your widgets</h2>
          <p>Keep favorite Bloom features within reach.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          aria-expanded={editing}
        >
          {editing ? 'Done' : 'Customize widgets'}
        </button>
      </div>
      {editing && (
        <div className="widget-editor">
          <label htmlFor="widget-search">Find a widget</label>
          <input
            id="widget-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search features"
          />
          <div className="widget-library bloom-wrap">
            {available.slice(0, 20).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => {
                  setWidgets((current) => [...current, { page, size: 1 }])
                  setQuery('')
                }}
              >
                + {pageDetails[page].title}
              </button>
            ))}
            {!available.length && <span>No matching features to add.</span>}
          </div>
          <small>
            {available.length} available · {hiddenCount} hidden because the
            feature is off
          </small>
          <div className="widget-editor-actions bloom-wrap">
            <button type="button" onClick={() => setWidgets(DEFAULT_WIDGETS)}>
              Restore starter layout
            </button>
            <button type="button" onClick={() => setWidgets([])}>
              Clear dashboard widgets
            </button>
          </div>
        </div>
      )}
      <div className="widget-grid">
        {displayed.map((widget, index) => (
          <WidgetFrame
            id={`home:${widget.page}`}
            title={pageDetails[widget.page].title}
            editing={editing}
            className={`widget-card widget-size-${widget.size}`}
            key={widget.page}
            draggable={editing}
            onDragStart={(event) => {
              if (!editing) {
                event.preventDefault()
                return
              }
              setDragging(widget.page)
              event.dataTransfer.effectAllowed = 'move'
            }}
            onDragOver={(event) => {
              if (editing) event.preventDefault()
            }}
            onDrop={() => drop(widget.page)}
            onDragEnd={() => setDragging(null)}
          >
            <button
              type="button"
              className="widget-open"
              onClick={() => onNavigate(widget.page)}
            >
              <strong>{pageDetails[widget.page].title}</strong>
              <span>{pageDetails[widget.page].description}</span>
              <small>Open feature →</small>
            </button>
            <WidgetPreview page={widget.page} data={data} today={today} setData={setData} />
            {editing && (
              <div className="widget-actions">
                <button
                  type="button"
                  aria-label={`Move ${pageDetails[widget.page].title} earlier`}
                  disabled={index === 0}
                  onClick={() => move(widget.page, -1)}
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label={`Move ${pageDetails[widget.page].title} later`}
                  disabled={index === visible.length - 1}
                  onClick={() => move(widget.page, 1)}
                >
                  →
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setWidgets((current) =>
                      current.map((item) =>
                        item.page === widget.page
                          ? { ...item, size: item.size === 1 ? 2 : 1 }
                          : item,
                      ),
                    )
                  }
                >
                  {widget.size === 1 ? 'Widen' : 'Shrink'}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${pageDetails[widget.page].title}`}
                  onClick={() =>
                    setWidgets((current) =>
                      current.filter((item) => item.page !== widget.page),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            )}
          </WidgetFrame>
        ))}
      </div>
      {!editing && pageCount > 1 && <nav className="widget-pager" aria-label="Widget pages">
        <button type="button" disabled={currentPage === 0} onClick={() => setPageIndex(currentPage - 1)}>Previous widgets</button>
        <span>Page {currentPage + 1} of {pageCount}</span>
        <button type="button" disabled={currentPage === pageCount - 1} onClick={() => setPageIndex(currentPage + 1)}>Next widgets</button>
      </nav>}
      {!visible.length && (
        <p className="widget-empty">
          Your dashboard has no visible widgets. Choose Customize widgets to add
          one.
        </p>
      )}
    </section>
  )
}
