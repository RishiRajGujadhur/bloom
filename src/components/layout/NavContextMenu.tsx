import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'

/**
 * Right-click menu for a sidebar page: open it, pin it as a favourite, or
 * disable it. Disabling asks for confirmation in a small dialog; it can be
 * undone from the toast or turned back on in Settings.
 */
export type NavMenuState = { key: string; title: string; x: number; y: number; canDisable: boolean; pinned: boolean }

export function NavContextMenu({ menu, onClose, onOpen, onPin, onAskDisable }: { menu: NavMenuState; onClose: () => void; onOpen: () => void; onPin: () => void; onAskDisable: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const close = (e: Event) => { if (!ref.current?.contains(e.target as Node)) onClose() }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', close, true)
    window.addEventListener('keydown', esc)
    window.addEventListener('blur', onClose)
    ref.current?.querySelector('button')?.focus()
    return () => { window.removeEventListener('pointerdown', close, true); window.removeEventListener('keydown', esc); window.removeEventListener('blur', onClose) }
  }, [onClose])
  useLayoutEffect(() => {
    if (ref.current && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(ref.current, { opacity: 0, scale: 0.92, y: -4 }, { opacity: 1, scale: 1, y: 0, duration: 0.16, ease: 'power2.out' })
  }, [])
  const left = Math.min(menu.x, window.innerWidth - 230)
  const top = Math.min(menu.y, window.innerHeight - 170)
  // Portalled to <body>: the sidebar drawer's transform would otherwise trap position: fixed.
  return createPortal(
    <div ref={ref} className="nav-ctx" role="menu" aria-label={`${menu.title} options`} style={{ left, top }}
      onKeyDown={(e) => {
        const items = [...(ref.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])]
        const i = items.indexOf(document.activeElement as HTMLButtonElement)
        if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length]?.focus() }
        if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length]?.focus() }
      }}>
      <p className="nav-ctx-title">{menu.title}</p>
      <button type="button" role="menuitem" onClick={() => { onOpen(); onClose() }}>↗ Open</button>
      <button type="button" role="menuitem" onClick={() => { onPin(); onClose() }}>{menu.pinned ? '☆ Unpin from top' : '★ Pin to top'}</button>
      <button type="button" role="menuitem" className="danger" disabled={!menu.canDisable} title={menu.canDisable ? undefined : 'This page can’t be turned off'} onClick={() => { onAskDisable(); onClose() }}>⊘ Disable page…</button>
    </div>,
    document.body,
  )
}

export function ConfirmDisable({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('.nav-confirm-cancel')?.focus()
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onCancel])
  useLayoutEffect(() => {
    if (ref.current && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(ref.current.querySelector('.nav-confirm'), { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: 'back.out(1.8)' })
  }, [])
  return createPortal(
    <div ref={ref} className="nav-confirm-backdrop" onClick={onCancel}>
      <div className="nav-confirm" role="alertdialog" aria-modal="true" aria-labelledby="nav-confirm-h" onClick={(e) => e.stopPropagation()}>
        <h3 id="nav-confirm-h">Disable “{title}”?</h3>
        <p>It disappears from the sidebar and search. Your data stays safe, and you can turn it back on any time in Settings → Features.</p>
        <div className="nav-confirm-actions">
          <button type="button" className="nav-confirm-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="nav-confirm-ok" onClick={onConfirm}>Disable feature</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
