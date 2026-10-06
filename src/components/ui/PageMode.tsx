import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import './pageMode.css'

export type PageMode = 'basic' | 'advanced'
type ModeState = { page: string; mode: PageMode; setMode: (mode: PageMode) => void }
const memory = new Map<string, PageMode>()
const eventName = 'bloom-page-mode-change'

function readMode(page: string): PageMode {
  if (memory.has(page)) return memory.get(page)!
  try {
    const saved = localStorage.getItem(`bloom-page-mode:${page}`)
    if (saved === 'basic' || saved === 'advanced') return saved
    if (page === 'todos' && localStorage.getItem('bloom-todo-mode') === 'pro') return 'advanced'
  } catch { /* storage unavailable */ }
  return 'basic'
}
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener('storage', listener) }
}
export function usePageModeState(page: string): ModeState {
  const mode = useSyncExternalStore(subscribe, () => readMode(page), () => 'basic' as PageMode)
  return { page, mode, setMode: next => {
    try {
      localStorage.setItem(`bloom-page-mode:${page}`, next)
      memory.delete(page)
      if (page === 'todos') localStorage.setItem('bloom-todo-mode', next === 'advanced' ? 'pro' : 'simple')
    } catch { memory.set(page, next) }
    window.dispatchEvent(new Event(eventName))
  } }
}
// Standalone features retain their complete interface. The app shell supplies
// a Basic-by-default preference for every actual page.
export const PageModeContext = createContext<ModeState>({ page: '', mode: 'advanced', setMode: () => {} })
export const usePageMode = () => useContext(PageModeContext)
export function PageModeSwitch() {
  const { mode, setMode } = usePageMode()
  return <div className="page-mode-bar">
    <div className="page-mode-switch" role="group" aria-label="Page mode">
      <button type="button" aria-pressed={mode === 'basic'} onClick={() => setMode('basic')}>Basic</button>
      <button type="button" aria-pressed={mode === 'advanced'} onClick={() => setMode('advanced')}>Advanced</button>
    </div>
    <span>{mode === 'basic' ? 'Essentials first. Advanced has more tools.' : 'All tools and options.'}</span>
  </div>
}
export function AdvancedSection({ children }: { children: ReactNode }) {
  return usePageMode().mode === 'advanced' ? children : null
}
