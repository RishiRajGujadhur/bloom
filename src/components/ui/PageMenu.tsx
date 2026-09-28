import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import * as CM from '@radix-ui/react-context-menu'
import gsap from 'gsap'
import { subOn } from '../../features/subFeatures'
import './pageMenu.css'

/**
 * Right-click menu that changes with the page. Pages add their own actions
 * with `usePageActions`; built-in per-page shortcuts and text-selection
 * actions are always there. Shift + right-click opens the browser's menu.
 */
export type PageAction = { id: string; label: string; icon?: string; run: () => void; hint?: string }

let registered: PageAction[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/** Actions the current page has registered (used by the Bloom guide too). */
export const currentPageActions = () => registered

/** Register actions for the current page while it is mounted. */
export function usePageActions(actions: PageAction[]) {
  const ref = useRef(actions)
  ref.current = actions
  const key = actions.map((a) => a.id).join('|')
  useEffect(() => {
    const live = ref.current.map((a) => ({ ...a, run: () => ref.current.find((x) => x.id === a.id)?.run() }))
    registered = [...registered.filter((r) => !live.some((l) => l.id === r.id)), ...live]
    emit()
    return () => {
      registered = registered.filter((r) => !live.some((l) => l.id === r.id))
      emit()
    }
  }, [key])
}

const go = (page: string) => () => {
  window.location.hash = page
}
const fire = (name: string, detail?: unknown) => () => window.dispatchEvent(new CustomEvent(name, { detail }))

/** Built-in shortcuts per page: jump to the things that page links with. */
export const pageShortcuts: Record<string, PageAction[]> = {
  overview: [
    { id: 'go-todos', label: 'Open to-dos', icon: '✅', run: go('todos') },
    { id: 'go-focus', label: 'Start focusing', icon: '⏱️', run: go('focus') },
    { id: 'go-mood', label: 'Check in my mood', icon: '💗', run: go('mood') },
  ],
  daybook: [
    { id: 'go-epiphanies', label: 'Review epiphanies', icon: '💡', run: go('epiphanies') },
    { id: 'go-journal', label: 'Guided journal chat', icon: '💬', run: go('journal') },
  ],
  habits: [
    { id: 'go-growth', label: 'See my seedling grow', icon: '🌱', run: go('growth') },
    { id: 'go-urges', label: 'Urge tracker', icon: '🌊', run: go('urges') },
  ],
  todos: [
    { id: 'go-focus', label: 'Focus on a task', icon: '⏱️', run: go('focus') },
    { id: 'go-calendar', label: 'Plan in the calendar', icon: '📅', run: go('calendar') },
  ],
  focus: [
    { id: 'go-sounds', label: 'Focus sounds', icon: '🎧', run: go('sounds') },
    { id: 'go-todos', label: 'Pick from to-dos', icon: '✅', run: go('todos') },
  ],
  mood: [
    { id: 'go-breathe', label: 'Breathe for a minute', icon: '🌬️', run: go('breathe') },
    { id: 'go-gratitude', label: 'Gratitude jar', icon: '🫙', run: go('gratitude') },
  ],
  exercises: [
    { id: 'go-dojo', label: 'Train in the dojo', icon: '🥋', run: go('dojo') },
    { id: 'go-workouts', label: 'Log a workout', icon: '🏋️', run: go('workouts') },
  ],
  dojo: [
    { id: 'go-exercises', label: 'Exercise library', icon: '💪', run: go('exercises') },
    { id: 'go-taichi', label: 'Tai chi', icon: '☯️', run: go('taichi') },
  ],
  sleep: [
    { id: 'go-daylight', label: 'Daylight & caffeine', icon: '☀️', run: go('daylight') },
    { id: 'go-meditate', label: 'Sleep meditation', icon: '🌙', run: go('meditate') },
  ],
  shop: [{ id: 'go-world', label: 'Visit Bloom World', icon: '🌍', run: go('world') }],
}

function selectionText() {
  return window.getSelection?.()?.toString().trim() ?? ''
}

export function PageMenu({ page, children, common }: { page: string; children: ReactNode; common: PageAction[] }) {
  const pageActions = useSyncExternalStore(subscribe, () => registered)
  const [selected, setSelected] = useState('')
  const content = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    // Shift + right-click, and right-click in text fields, keep the browser's
    // own menu (spellcheck, paste): stop the event before React sees it.
    const pass = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (e.shiftKey || t?.closest('input, textarea, [contenteditable="true"]')) e.stopPropagation()
    }
    window.addEventListener('contextmenu', pass, true)
    return () => window.removeEventListener('contextmenu', pass, true)
  }, [])
  useLayoutEffect(() => {
    if (!open || !content.current || !subOn('pointerFx', 'menuMotion') || prefersReducedMotion()) return
    const tw = gsap.from(content.current.querySelectorAll('.pm-item, .pm-label'), { x: -8, opacity: 0, stagger: 0.02, duration: 0.18, ease: 'power2.out' })
    return () => void tw.progress(1)
  }, [open])
  if (!subOn('pointerFx', 'contextMenu')) return <>{children}</>
  const shortcuts = subOn('pointerFx', 'pageShortcuts') ? (pageShortcuts[page] ?? []) : []
  const item = (a: PageAction) => (
    <CM.Item key={a.id} className="pm-item" onSelect={a.run}>
      <span className="pm-icon" aria-hidden="true">{a.icon ?? '•'}</span>
      {a.label}
      {a.hint && <span className="pm-hint">{a.hint}</span>}
    </CM.Item>
  )
  return (
    <CM.Root onOpenChange={setOpen}>
      <CM.Trigger
        asChild
        onContextMenu={() => setSelected(selectionText())}
      >
        {children}
      </CM.Trigger>
      <CM.Portal>
        <CM.Content ref={content} className="pm-content" collisionPadding={8}>
          {selected && subOn('pointerFx', 'selectionActions') && (
            <>
              <CM.Label className="pm-label">“{selected.length > 28 ? `${selected.slice(0, 28)}…` : selected}”</CM.Label>
              {item({ id: 'sel-copy', label: 'Copy', icon: '📋', run: () => void navigator.clipboard?.writeText(selected) })}
              {item({ id: 'sel-epiphany', label: 'Save as epiphany', icon: '💡', run: fire('bloom:save-epiphany', selected) })}
              {item({ id: 'sel-todo', label: 'Make it a to-do', icon: '✅', run: fire('bloom:quick-todo', selected) })}
              {item({ id: 'sel-search', label: 'Search Bloom for this', icon: '🔎', run: fire('bloom:search', selected) })}
              <CM.Separator className="pm-sep" />
            </>
          )}
          {pageActions.length > 0 && (
            <>
              <CM.Label className="pm-label">On this page</CM.Label>
              {pageActions.map(item)}
              <CM.Separator className="pm-sep" />
            </>
          )}
          {shortcuts.length > 0 && (
            <>
              <CM.Label className="pm-label">Goes well with</CM.Label>
              {shortcuts.map(item)}
              <CM.Separator className="pm-sep" />
            </>
          )}
          {common.map(item)}
          <CM.Label className="pm-foot">Shift + right-click for the browser menu</CM.Label>
        </CM.Content>
      </CM.Portal>
    </CM.Root>
  )
}
