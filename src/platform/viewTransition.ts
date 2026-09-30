/**
 * View Transitions: the browser snapshots the old page, we update the DOM
 * synchronously, and it morphs to the new one on the compositor — the page
 * cross-fades, the title glides and the sidebar highlight slides between
 * items (see styles/viewTransitions.css). Skipped when unsupported, when
 * motion is reduced, or when the user turns page transitions off.
 */
type Doc = Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } }
export const VT_KEY = 'bloom-view-transitions'
export const viewTransitionsOn = () => { try { return localStorage.getItem(VT_KEY) !== 'off' } catch { return true } }

let busy = false
export function withViewTransition(update: () => void) {
  const d = document as Doc
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!d.startViewTransition || reduce || busy || !viewTransitionsOn()) { update(); return }
  busy = true
  try {
    const t = d.startViewTransition(update)
    void t.finished.finally(() => { busy = false })
  } catch {
    busy = false
    update()
  }
}
