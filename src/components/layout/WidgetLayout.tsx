import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import './widgetLayout.css'

export type WidgetSize = { width?: number; height?: number; collapsed?: boolean }
const storageKey = 'bloom-widget-layout-v1'
const eventName = 'bloom-widget-layout-change'
let fallback = '{}'
function snapshot() {
  try { return localStorage.getItem(storageKey) ?? '{}' } catch { return fallback }
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener('storage', listener) }
}
export function normalizeWidgetSize(value: unknown): WidgetSize {
  if (!value || typeof value !== 'object') return {}
  const size = value as WidgetSize
  return {
    ...(Number.isFinite(size.width) ? { width: Math.round(Math.max(280, Math.min(1800, size.width!))) } : {}),
    ...(Number.isFinite(size.height) ? { height: Math.round(Math.max(160, Math.min(1200, size.height!))) } : {}),
    ...(size.collapsed === true ? { collapsed: true } : {}),
  }
}
function readLayout(raw: string): Record<string, WidgetSize> {
  try { const value = JSON.parse(raw); return value && typeof value === 'object' && !Array.isArray(value) ? value : {} } catch { return {} }
}
function useWidgetSize(id: string) {
  const raw = useSyncExternalStore(subscribe, snapshot, () => '{}')
  const size = useMemo(() => normalizeWidgetSize(readLayout(raw)[id]), [raw, id])
  const setSize = (next: WidgetSize) => {
    const saved = readLayout(snapshot())
    saved[id] = normalizeWidgetSize(next)
    fallback = JSON.stringify(saved)
    try { localStorage.setItem(storageKey, fallback) } catch { /* retain changes for this session */ }
    window.dispatchEvent(new Event(eventName))
  }
  return { size, setSize }
}
const sizeStyle = (size: WidgetSize): CSSProperties => ({
  '--widget-width': size.width ? `${size.width}px` : undefined,
  '--widget-height': size.height ? `${size.height}px` : undefined,
} as CSSProperties)

function WidgetTools({ title, target, size, setSize, editing }: {
  title: string; target: () => HTMLElement | null; size: WidgetSize; setSize: (size: WidgetSize) => void; editing: boolean
}) {
  const drag = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const resize = (width: number, height: number) => {
    const element = target()
    const available = element?.parentElement?.clientWidth || window.innerWidth
    setSize({ width: Math.min(available, width), height, collapsed: false })
  }
  return <>
    {(editing || size.collapsed) && <div className="widget-layout-tools">
      <strong>{title}</strong>
      <button type="button" aria-label={`${size.collapsed ? 'Expand' : 'Collapse'} ${title}`} aria-expanded={!size.collapsed} onClick={() => setSize({ ...size, collapsed: !size.collapsed })}>{size.collapsed ? 'Expand' : 'Collapse'}</button>
      {editing && <details className="widget-size-menu">
        <summary aria-label={`Size ${title}`}>Size</summary>
        <div className="widget-size-options">
          <button type="button" onClick={() => setSize({ width: 320, height: 440 })}>Mobile size</button>
          <button type="button" onClick={() => setSize({ width: 480 })}>Comfortable</button>
          <button type="button" onClick={() => setSize({})}>Fill available space</button>
          <label>Width <input type="range" aria-label={`Width of ${title}`} min="280" max="1800" step="20" value={size.width ?? Math.round(target()?.getBoundingClientRect().width ?? 480)} onChange={event => setSize({ ...size, width: Number(event.target.value) })} /></label>
          <label>Height <input type="range" aria-label={`Height of ${title}`} min="160" max="1200" step="20" value={size.height ?? Math.round(target()?.getBoundingClientRect().height ?? 440)} onChange={event => setSize({ ...size, height: Number(event.target.value) })} /></label>
          <button type="button" onClick={() => setSize({ ...size, height: undefined })}>Fit content height</button>
        </div>
      </details>}
    </div>}
    {editing && !size.collapsed && <button type="button" className="widget-resize-handle" aria-label={`Resize ${title}`} title="Drag to resize. Arrow keys resize; Shift makes smaller changes. Home resets."
      onPointerDown={event => {
        if (event.button !== 0) return
        const bounds = target()?.getBoundingClientRect()
        if (!bounds) return
        drag.current = { x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
      }}
      onPointerMove={event => { const start = drag.current; if (start) resize(start.width + event.clientX - start.x, start.height + event.clientY - start.y) }}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onLostPointerCapture={() => { drag.current = null }}
      onKeyDown={event => {
        if (event.key === 'Home') { event.preventDefault(); setSize({}); return }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault()
        const bounds = target()?.getBoundingClientRect()
        if (!bounds) return
        const step = event.shiftKey ? 8 : 32
        resize(bounds.width + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), bounds.height + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0))
      }}>↘</button>}
  </>
}

/** Shared frame for authored widgets, including the existing home widget library. */
export function WidgetFrame({ id, title, editing = false, children, className = '', ...props }: {
  id: string; title: string; editing?: boolean; children: ReactNode; className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'id' | 'title'>) {
  const ref = useRef<HTMLElement>(null)
  const { size, setSize } = useWidgetSize(id)
  return <article {...props} ref={ref} className={`resizable-widget ${className}`} data-managed-widget="true" data-resizable-widget={id} data-widget-editing={editing || undefined} data-widget-collapsed={size.collapsed || undefined} data-widget-sized={!!size.height || undefined} style={sizeStyle(size)} aria-label={title}>
    <div className="widget-frame-content">{children}</div>
    <WidgetTools title={title} target={() => ref.current} size={size} setSize={setSize} editing={editing} />
  </article>
}

type Section = { element: HTMLElement; id: string; title: string }
function SectionWidget({ section, editing, focused }: { section: Section; editing: boolean; focused: boolean }) {
  const { size, setSize } = useWidgetSize(section.id)
  useEffect(() => {
    const element = section.element
    element.dataset.resizableWidget = section.id
    element.toggleAttribute('data-widget-editing', editing)
    element.toggleAttribute('data-widget-collapsed', !!size.collapsed)
    element.toggleAttribute('data-widget-sized', !!size.height)
    element.toggleAttribute('data-widget-focused', focused)
    for (const [property, value] of Object.entries(sizeStyle(size))) {
      if (value) element.style.setProperty(property, String(value)); else element.style.removeProperty(property)
    }
    return () => {
      for (const name of ['data-resizable-widget', 'data-widget-editing', 'data-widget-collapsed', 'data-widget-sized', 'data-widget-focused']) element.removeAttribute(name)
      element.style.removeProperty('--widget-width'); element.style.removeProperty('--widget-height')
    }
  }, [section, size, editing, focused])
  return createPortal(<WidgetTools title={section.title} target={() => section.element} size={size} setSize={setSize} editing={editing} />, section.element)
}

/** Discover section boundaries centrally without reparenting React-owned content. */
export function PageLayout({ page, root }: { page: string; root: RefObject<HTMLDivElement | null> }) {
  const [editing, setEditing] = useState(false)
  const [sections, setSections] = useState<Section[]>([])
  const [focus, setFocus] = useState('')
  useEffect(() => {
    setEditing(false); setFocus('')
    const host = root.current
    if (!host) return
    host.dataset.compactLayout = 'true'
    let frame = 0
    const groups = new Set<HTMLElement>()
    const scan = () => {
      const candidates = [...host.querySelectorAll<HTMLElement>('section, .card, .studio-card, .task-workspace, .habit-calendar')].filter(element =>
        !element.closest('[data-managed-widget], .widget-board, dialog, [role="dialog"], .task-item, .habit-card, nav, .widget-layout-tools') &&
        (element.querySelector('h2, h3') || element.getAttribute('aria-label')),
      )
      const leaves = candidates.filter(element => !candidates.some(other => other !== element && element.contains(other)))
      if (!leaves.length) {
        const studio = host.querySelector<HTMLElement>('.studio')
        if (studio) leaves.push(studio)
      }
      const counts = new Map<string, number>()
      const next = leaves.map(element => {
        const identity = element.id || element.classList[0] || element.tagName.toLowerCase()
        const number = counts.get(identity) ?? 0
        counts.set(identity, number + 1)
        const title = element.getAttribute('aria-label') || element.querySelector('h2, h3')?.textContent?.trim() || 'Workspace'
        return { element, id: `${page}:${identity}:${number}`, title }
      })
      for (const element of groups) element.removeAttribute('data-widget-group')
      groups.clear()
      for (const item of next) {
        const parent = item.element.parentElement
        if (parent && next.filter(other => other.element.parentElement === parent).length > 1 && !parent.matches('.studio, .card, .studio-card')) {
          parent.dataset.widgetGroup = 'true'; groups.add(parent)
        }
      }
      setSections(previous => previous.length === next.length && previous.every((item, index) => item.element === next[index].element && item.title === next[index].title && item.id === next[index].id) ? previous : next)
    }
    const observer = new MutationObserver(records => {
      if (records.every(record => (record.target as Element).closest?.('.widget-layout-tools'))) return
      cancelAnimationFrame(frame); frame = requestAnimationFrame(scan)
    })
    observer.observe(host, { childList: true, subtree: true })
    scan()
    return () => { observer.disconnect(); cancelAnimationFrame(frame); delete host.dataset.compactLayout; for (const group of groups) delete group.dataset.widgetGroup }
  }, [page, root])
  const selected = sections.some(section => section.id === focus) ? focus : ''
  useEffect(() => {
    const host = root.current
    if (!host) return
    host.toggleAttribute('data-widget-focus-view', !!selected)
    return () => { host.removeAttribute('data-widget-focus-view') }
  }, [root, selected])
  return <>
    <div className="page-layout-controls">
      <button type="button" aria-pressed={editing} onClick={() => setEditing(value => !value)}>{editing ? 'Done arranging' : 'Arrange layout'}</button>
      {sections.length > 1 && <label>View <select aria-label="Visible section" value={selected} onChange={event => setFocus(event.target.value)}><option value="">All sections</option>{sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>}
      {editing && <span>Drag corners, use arrow keys, or choose a size. Changes save automatically.</span>}
    </div>
    {sections.map(section => <SectionWidget key={section.id} section={section} editing={editing} focused={selected === section.id} />)}
  </>
}
