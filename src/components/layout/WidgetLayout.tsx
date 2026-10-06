import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type HTMLAttributes, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import './widgetLayout.css'

export type WidgetSize = { width?: number; height?: number; collapsed?: boolean }
const storageKey = 'bloom-widget-layout-v1'
const eventName = 'bloom-widget-layout-change'
let fallback = '{}'
const layoutHostEvent = 'bloom-layout-host-change'
let layoutHost: HTMLDivElement | null = null
const setLayoutHost = (node: HTMLDivElement | null) => { layoutHost = node; window.dispatchEvent(new Event(layoutHostEvent)) }
function subscribeHost(listener: () => void) {
  window.addEventListener(layoutHostEvent, listener)
  return () => window.removeEventListener(layoutHostEvent, listener)
}
export function LayoutChatHost() { return <div ref={setLayoutHost} className="chat-layout-host" /> }

/** Reflow at the requested width before measuring intrinsic overflow and media. */
export function constrainWidgetResize(element: HTMLElement, width: number, height: number): WidgetSize {
  const available = Math.max(280, Math.min(1800, element.parentElement?.clientWidth || window.innerWidth))
  let safeWidth = Math.max(280, Math.min(available, width))
  let minimumHeight = 160
  const oldWidth = element.style.getPropertyValue('--widget-width')
  const oldHeight = element.style.getPropertyValue('--widget-height')
  try {
    element.style.setProperty('--widget-width', `${safeWidth}px`)
    element.style.setProperty('--widget-height', 'auto')
    // Horizontal scrollers retain their own overflow; only frame overflow raises the limit.
    safeWidth = Math.min(available, safeWidth + Math.max(0, element.scrollWidth - element.clientWidth))
    element.style.setProperty('--widget-width', `${safeWidth}px`)
    const media = [...element.querySelectorAll('img, svg, canvas, video')].some(node => node.getBoundingClientRect().height > 48 && getComputedStyle(node).position !== 'absolute')
    if (media) {
      const style = getComputedStyle(element)
      const borders = (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0)
      minimumHeight = Math.max(160, Math.min(1200, Math.ceil(element.scrollHeight + borders)))
    }
  } finally {
    if (oldWidth) element.style.setProperty('--widget-width', oldWidth); else element.style.removeProperty('--widget-width')
    if (oldHeight) element.style.setProperty('--widget-height', oldHeight); else element.style.removeProperty('--widget-height')
  }
  return { width: Math.round(safeWidth), height: Math.round(Math.max(minimumHeight, Math.min(1200, height))), collapsed: false }
}
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
  useEffect(() => {
    if (size.collapsed || (!size.width && !size.height)) return
    const frame = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')))
    return () => cancelAnimationFrame(frame)
  }, [size.width, size.height, size.collapsed])
  const setSize = useCallback((next: WidgetSize) => {
    const saved = readLayout(snapshot())
    saved[id] = normalizeWidgetSize(next)
    fallback = JSON.stringify(saved)
    try { localStorage.setItem(storageKey, fallback) } catch { /* retain changes for this session */ }
    window.dispatchEvent(new Event(eventName))
  }, [id])
  return { size, setSize }
}
const sizeStyle = (size: WidgetSize): CSSProperties => ({
  '--widget-width': size.width ? `${size.width}px` : undefined,
  '--widget-height': size.height ? `${size.height}px` : undefined,
} as CSSProperties)

function useWidgetBounds(size: WidgetSize, setSize: (next: WidgetSize) => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current
    if (!element || size.collapsed || (!size.width && !size.height)) return
    let frame = 0
    const check = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const bounds = element.getBoundingClientRect()
        const safe = constrainWidgetResize(element, size.width ?? bounds.width, size.height ?? bounds.height)
        const next = { ...size, ...(size.width ? { width: safe.width } : {}), ...(size.height ? { height: safe.height } : {}) }
        if (next.width !== size.width || next.height !== size.height) setSize(next)
      })
    }
    const observer = new MutationObserver(check)
    observer.observe(element, { childList: true, subtree: true })
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check)
    resize?.observe(element)
    if (element.parentElement) resize?.observe(element.parentElement)
    for (const child of element.children) if (!child.classList.contains('widget-layout-tools')) resize?.observe(child)
    window.addEventListener('resize', check)
    check()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resize?.disconnect(); window.removeEventListener('resize', check) }
  }, [size, setSize, ref])
}

function WidgetTools({ title, target, size, setSize, editing, controlsInChat = false }: {
  title: string; target: () => HTMLElement | null; size: WidgetSize; setSize: (size: WidgetSize) => void; editing: boolean; controlsInChat?: boolean
}) {
  const drag = useRef<{ x: number; y: number; width: number; height: number; edge: string } | null>(null)
  const resize = (width: number, height: number) => {
    const element = target()
    if (element) setSize(constrainWidgetResize(element, width, height))
  }
  const startDrag = (event: ReactPointerEvent<HTMLElement>, edge: string) => {
    if (event.button !== 0) return
    const bounds = target()?.getBoundingClientRect()
    if (!bounds) return
    drag.current = { x: event.clientX, y: event.clientY, width: bounds.width, height: bounds.height, edge }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }
  const moveDrag = (event: ReactPointerEvent<HTMLElement>) => {
    const start = drag.current
    if (!start) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    resize(start.width + (start.edge.includes('e') ? dx : start.edge.includes('w') ? -dx : 0), start.height + (start.edge.includes('s') ? dy : start.edge.includes('n') ? -dy : 0))
  }
  const endDrag = () => { drag.current = null }
  return <>
    {(editing || size.collapsed) && <div className="widget-layout-tools">
      <strong>{title}</strong>
      {!controlsInChat && <button type="button" aria-label={`${size.collapsed ? 'Expand' : 'Collapse'} ${title}`} aria-expanded={!size.collapsed} onClick={() => setSize({ ...size, collapsed: !size.collapsed })}>{size.collapsed ? 'Expand' : 'Collapse'}</button>}
      {editing && <button type="button" aria-label={`Reset size of ${title}`} onClick={() => setSize({})}>Reset size</button>}
    </div>}
    {!size.collapsed && <>
    {['n', 's', 'e', 'w', 'ne', 'nw', 'sw'].map(edge => <div key={edge} className="widget-resize-edge" data-edge={edge} aria-hidden="true" onPointerDown={event => startDrag(event, edge)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag} />)}
    <button type="button" className="widget-resize-handle" aria-label={`Resize ${title}`} title="Drag this corner or any edge to resize. Double-click or Home resets. Arrow keys resize; Shift makes smaller changes."
      onDoubleClick={() => setSize({})}
      onPointerDown={event => startDrag(event, 'se')}
      onPointerMove={moveDrag}
      onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
      onKeyDown={event => {
        if (event.key === 'Home') { event.preventDefault(); setSize({}); return }
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
        event.preventDefault()
        const bounds = target()?.getBoundingClientRect()
        if (!bounds) return
        const step = event.shiftKey ? 8 : 32
        resize(bounds.width + (event.key === 'ArrowRight' ? step : event.key === 'ArrowLeft' ? -step : 0), bounds.height + (event.key === 'ArrowDown' ? step : event.key === 'ArrowUp' ? -step : 0))
      }}>↘</button></>}
  </>
}

/** Shared frame for authored widgets, including the existing home widget library. */
export function WidgetFrame({ id, title, editing = false, children, className = '', ...props }: {
  id: string; title: string; editing?: boolean; children: ReactNode; className?: string
} & Omit<HTMLAttributes<HTMLElement>, 'id' | 'title'>) {
  const ref = useRef<HTMLElement>(null)
  const { size, setSize } = useWidgetSize(id)
  useWidgetBounds(size, setSize, ref)
  return <article {...props} ref={ref} className={`resizable-widget ${className}`} data-managed-widget="true" data-resizable-widget={id} data-widget-editing={editing || undefined} data-widget-collapsed={size.collapsed || undefined} data-widget-sized={!!size.height || undefined} style={sizeStyle(size)} aria-label={title}>
    <div className="widget-frame-content">{children}</div>
    <WidgetTools title={title} target={() => ref.current} size={size} setSize={setSize} editing={editing} />
  </article>
}

type Section = { element: HTMLElement; id: string; title: string }
function SectionWidget({ section, editing, focused }: { section: Section; editing: boolean; focused: boolean }) {
  const { size, setSize } = useWidgetSize(section.id)
  const ref = useRef<HTMLElement | null>(section.element)
  ref.current = section.element
  useWidgetBounds(size, setSize, ref)
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
  return createPortal(<WidgetTools title={section.title} target={() => section.element} size={size} setSize={setSize} editing={editing} controlsInChat />, section.element)
}

function ChatSectionTools({ section }: { section: Section }) {
  const { size, setSize } = useWidgetSize(section.id)
  return <div className="chat-section-tools">
    <strong>{section.title}</strong>
    <button type="button" aria-label={`${size.collapsed ? 'Expand' : 'Collapse'} ${section.title}`} aria-expanded={!size.collapsed} onClick={() => setSize({ ...size, collapsed: !size.collapsed })}>{size.collapsed ? 'Expand' : 'Collapse'}</button>
    <button type="button" aria-label={`Reset size of ${section.title}`} onClick={() => setSize({})}>Reset size</button>
  </div>
}

/** Discover section boundaries centrally without reparenting React-owned content. */
export function PageLayout({ page, root }: { page: string; root: RefObject<HTMLDivElement | null> }) {
  const host = useSyncExternalStore(subscribeHost, () => layoutHost, () => null)
  const [sections, setSections] = useState<Section[]>([])
  const [focus, setFocus] = useState('')
  useEffect(() => {
    setFocus('')
    const host = root.current
    if (!host) return
    host.dataset.compactLayout = 'true'
    let frame = 0
    const groups = new Set<HTMLElement>()
    const selector = 'section, .card, .studio-card, .task-workspace, .habit-calendar'
    const scan = () => {
      let interactiveSection = false
      const candidates = [...host.querySelectorAll<HTMLElement>(selector)].filter(element => {
        if (element.closest('[data-managed-widget], .widget-board, dialog, [role="dialog"], .task-item, .habit-card, nav, .widget-layout-tools')) return false
        // Controls belong on a frame, never inside an existing control or a
        // structured ARIA container whose children have prescribed roles.
        if (element.closest('button, a[href], input, textarea, select, ul, ol, table, [role="button"], [role="link"], [role="slider"], [role="checkbox"], [role="switch"], [role="list"], [role="grid"], [role="table"], [role="tablist"], [role="listbox"], [role="tree"], [role="meter"], [role="progressbar"]')) {
          interactiveSection = true
          return false
        }
        return !!(element.querySelector('h2, h3') || element.getAttribute('aria-label'))
      })
      const leaves = candidates.filter(element => !candidates.some(other => other !== element && element.contains(other)))
      if (interactiveSection) {
        const studio = host.querySelector<HTMLElement>('.studio')
        if (studio && !leaves.includes(studio)) leaves.push(studio)
      }
      if (!leaves.length) {
        const feature = host.querySelector<HTMLElement>('.studio') ?? [...host.children].find(element =>
          element instanceof HTMLElement && !element.matches('.bloom-heading, .overview-bar, .page-mode-bar, .page-layout-controls, .widget-board, nav, [role="status"], [hidden]') &&
          !!element.querySelector('button, input, canvas, [role="grid"]'),
        ) as HTMLElement | undefined
        if (feature) leaves.push(feature)
      }
      const counts = new Map<string, number>()
      const next = leaves.map(element => {
        const identity = element.id || element.classList[0] || element.tagName.toLowerCase()
        const number = counts.get(identity) ?? 0
        counts.set(identity, number + 1)
        const title = element.dataset.studio || element.getAttribute('aria-label') || element.querySelector('h2, h3')?.textContent?.trim() || host.querySelector('#page-heading')?.textContent?.trim() || 'Workspace'
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
      // Animated SVGs and task text change frequently. Only rediscover when
      // section boundaries or a top-level lazy page are added or removed.
      if (!records.some(record => record.target === host || [...record.addedNodes, ...record.removedNodes].some(node =>
        node instanceof Element && !node.closest('.widget-layout-tools') &&
        (node.matches(`${selector}, .studio`) || node.querySelector(`${selector}, .studio`)),
      ))) return
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
    {host && createPortal(<details className="chat-layout-options">
      <summary>Arrange layout</summary>
      <div className="page-layout-controls">
      {sections.length > 1 && <label>View <select aria-label="Visible section" value={selected} onChange={event => setFocus(event.target.value)}><option value="">All sections</option>{sections.map(section => <option key={section.id} value={section.id}>{section.title}</option>)}</select></label>}
      <span>Drag any edge or corner to resize. Changes save automatically.</span>
      </div>
      <div className="chat-layout-section-list">{sections.map(section => <ChatSectionTools key={section.id} section={section} />)}</div>
    </details>, host)}
    {sections.map(section => <SectionWidget key={section.id} section={section} editing={false} focused={selected === section.id} />)}
  </>
}
