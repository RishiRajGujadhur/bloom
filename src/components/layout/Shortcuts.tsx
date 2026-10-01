import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { currentPageActions } from '../ui/PageMenu'
import type { NavKey } from './Sidebar'

/**
 * App-wide keyboard layer (Linear/Gmail style):
 *   g then a letter  → jump to a page
 *   ?                → this cheat sheet
 *   n                → the page's "new/add/log" action
 *   Space            → the page's play/pause action
 *   t                → light/dark theme
 *   1–9              → tabs (handled by Studio)
 * Never fires while you're typing in a field.
 */
export const GO: Record<string, { key: NavKey; label: string }> = {
  d: { key: 'overview', label: 'Dashboard' },
  h: { key: 'habits', label: 'Habits' },
  t: { key: 'todos', label: 'To-dos' },
  c: { key: 'calendar', label: 'Calendar' },
  f: { key: 'focus', label: 'Focus' },
  j: { key: 'journal', label: 'Journal' },
  b: { key: 'daybook', label: 'Daybook' },
  m: { key: 'money', label: 'Money' },
  e: { key: 'english', label: 'English' },
  w: { key: 'workouts', label: 'Workouts' },
  r: { key: 'run', label: 'Run' },
  p: { key: 'people', label: 'People' },
  l: { key: 'places', label: 'Places (life map)' },
  v: { key: 'voice', label: 'Voice memos' },
  x: { key: 'mixer', label: 'Mixer' },
  s: { key: 'settings', label: 'Settings' },
}

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  return !!t?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
}

function CheatSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (ref.current && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(ref.current.firstElementChild, { y: 24, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(1.6)' })
  }, [])
  const row = (k: string, label: string) => <li key={k + label}><span>{label}</span><kbd>{k}</kbd></li>
  return createPortal(
    <div ref={ref} className="kb-backdrop" onClick={onClose}>
      <div className="kb-sheet" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(e) => e.stopPropagation()}>
        <header><h3>Keyboard shortcuts</h3><button type="button" onClick={onClose} aria-label="Close">✕</button></header>
        <div className="kb-cols">
          <section><h4>Go to</h4><ul>{Object.entries(GO).map(([k, v]) => row(`g ${k}`, v.label))}</ul></section>
          <section><h4>Anywhere</h4><ul>
            {row('Ctrl K', 'Command palette')}
            {row('/', 'Search')}
            {row('?', 'This cheat sheet')}
            {row('n', 'New item on this page')}
            {row('Space', 'Play / pause on this page')}
            {row('1 – 9', 'Switch tabs')}
            {row('t', 'Light / dark theme')}
            {row('[', 'Collapse sidebar')}
            {row('Alt ← / →', 'Back / forward')}
            {row('Esc', 'Close menus and drawers')}
            {row('Ctrl S', 'Save (boards, editors)')}
            {row('Ctrl Shift E', 'Capture an epiphany')}
            {row('Ctrl Shift L', 'Hide / show everything (privacy)')}
            {row('Ctrl /', 'Search within this page')}
            {row('Ctrl Shift F', 'Filter the sidebar')}
            {row('Alt 1 – 9', 'Open a pinned page')}
            {row('Hold Alt', 'Show shortcut hints on buttons')}
            {row('Home / End', 'First / last item in a list')}
            {row('Shift ↑ / ↓', 'Number fields step by 10')}
            {row('Esc', 'Cancel an inline form')}
            {row('Alt 1–9', 'Open a pinned page')}
            {row('m then 1–5', 'Log your mood')}
            {row('Ctrl Shift D', 'Insert date (while writing)')}
          </ul></section>
          {currentPageActions().length > 0 && (
            <section><h4>On this page</h4><ul>{currentPageActions().slice(0, 10).map((a) => <li key={a.id}><span>{a.icon} {a.label}</span><kbd>Ctrl K</kbd></li>)}</ul></section>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function Shortcuts({ onNavigate, onToggleTheme }: { onNavigate: (k: NavKey) => void; onToggleTheme: () => void }) {
  const [sheet, setSheet] = useState(false)
  const [pending, setPending] = useState(false)
  useEffect(() => {
    let gAt = 0
    let timer = 0
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || typing(e)) return
      const k = e.key
      if (k === 'Escape') {
        setSheet(false)
        window.dispatchEvent(new Event('bloom:close-nav'))
        return
      }
      if (Date.now() - gAt < 1200 && GO[k.toLowerCase()]) {
        e.preventDefault()
        gAt = 0
        setPending(false)
        onNavigate(GO[k.toLowerCase()].key)
        return
      }
      if (k === 'g') { gAt = Date.now(); setPending(true); clearTimeout(timer); timer = window.setTimeout(() => setPending(false), 1200); return }
      if (k === '?') { e.preventDefault(); setSheet((s) => !s); return }
      if (k === 't') { e.preventDefault(); onToggleTheme(); return }
      const actions = currentPageActions()
      if (k === 'n') {
        const a = actions.find((x) => /^(add|new|log|create|plant|record)\b/i.test(x.label) || /^(new|add)-/.test(x.id))
        if (a) { e.preventDefault(); a.run() }
        return
      }
      if (k === ' ') {
        const a = actions.find((x) => /toggle|play|pause/i.test(x.id) || /^(play|pause|start|stop)\b/i.test(x.label))
        if (a && !(e.target as HTMLElement | null)?.closest('button')) { e.preventDefault(); a.run() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(timer) }
  }, [onNavigate, onToggleTheme])
  return (
    <>
      {pending && <div className="kb-go" role="status">g → <span>{Object.entries(GO).slice(0, 8).map(([k, v]) => `${k} ${v.label}`).join(' · ')} …</span></div>}
      {sheet && <CheatSheet onClose={() => setSheet(false)} />}
    </>
  )
}
