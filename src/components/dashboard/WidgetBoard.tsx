import { useEffect, useState } from 'react'
import { pageDetails } from '../layout/FeatureGuide'
import type { NavKey } from '../layout/Sidebar'
import './widgetBoard.css'

type Widget = { page: NavKey; size: 1 | 2 }
const KEY = 'bloom-home-widgets-v1'
const choices = (Object.keys(pageDetails) as NavKey[]).filter((key) => key !== 'overview' && key !== 'settings')
const defaults: Widget[] = ['habits', 'planning', 'journal', 'breathe', 'sleep', 'focus'].map((page) => ({ page: page as NavKey, size: 1 }))

function read(): Widget[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (Array.isArray(value)) return value.filter((item): item is Widget => !!item && choices.includes(item.page) && (item.size === 1 || item.size === 2)).slice(0, 60)
  } catch { /* use defaults */ }
  return defaults
}

export function WidgetBoard({ onNavigate, enabled }: { onNavigate: (page: NavKey) => void; enabled: (page: NavKey) => boolean }) {
  const [widgets, setWidgets] = useState(read)
  const [editing, setEditing] = useState(false)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(widgets)) } catch { /* private browsing */ } }, [widgets])
  const available = choices.filter((page) => enabled(page) && !widgets.some((widget) => widget.page === page))
  const move = (index: number, direction: number) => setWidgets((current) => {
    const next = [...current]; const target = index + direction
    if (target < 0 || target >= next.length) return current
    ;[next[index], next[target]] = [next[target], next[index]]
    return next
  })
  return <section className="widget-board" aria-label="Home widgets">
    <div className="widget-board-heading"><div><h2>Your widgets</h2><p>Keep favorite Bloom features within reach.</p></div><button type="button" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? 'Done' : 'Customize widgets'}</button></div>
    {editing && <div className="widget-add"><label htmlFor="widget-choice">Add a feature</label><select id="widget-choice" value="" onChange={(event) => { const page = event.target.value as NavKey; if (page) setWidgets((current) => [...current, { page, size: 1 }]) }}><option value="">Choose a feature…</option>{available.map((page) => <option key={page} value={page}>{pageDetails[page].title}</option>)}</select><span>{choices.length} features available</span></div>}
    <div className="widget-grid">{widgets.filter((widget) => enabled(widget.page)).map((widget, index) => <article className={`widget-card widget-size-${widget.size}`} key={widget.page}><button type="button" className="widget-open" onClick={() => onNavigate(widget.page)}><strong>{pageDetails[widget.page].title}</strong><span>{pageDetails[widget.page].description}</span><small>Open feature →</small></button>{editing && <div className="widget-actions"><button type="button" aria-label={`Move ${pageDetails[widget.page].title} left`} disabled={index === 0} onClick={() => move(index, -1)}>←</button><button type="button" aria-label={`Move ${pageDetails[widget.page].title} right`} disabled={index === widgets.length - 1} onClick={() => move(index, 1)}>→</button><button type="button" onClick={() => setWidgets((current) => current.map((item) => item.page === widget.page ? { ...item, size: item.size === 1 ? 2 : 1 } : item))}>{widget.size === 1 ? 'Widen' : 'Shrink'}</button><button type="button" aria-label={`Remove ${pageDetails[widget.page].title}`} onClick={() => setWidgets((current) => current.filter((item) => item.page !== widget.page))}>Remove</button></div>}</article>)}</div>
  </section>
}
