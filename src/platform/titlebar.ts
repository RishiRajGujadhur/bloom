/**
 * The OS window frame follows Bloom. Every theme sets the window's
 * theme-color (the title bar colour on installed apps and mobile browsers),
 * and when the installed app runs with Window Controls Overlay, Bloom's own
 * top bar moves into the title-bar area — search, streak and page name drawn
 * right next to the minimise/maximise/close buttons, draggable like a native
 * window. `data-wco` on <html> tells CSS when the overlay is active.
 */
type WCO = EventTarget & { visible: boolean; getTitlebarAreaRect: () => DOMRect }

export function syncThemeColor() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-surface').trim() || getComputedStyle(document.body).backgroundColor
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  if (bg) meta.content = bg
}

export function watchTitlebar() {
  const wco = (navigator as unknown as { windowControlsOverlay?: WCO }).windowControlsOverlay
  const root = document.documentElement
  const apply = () => { root.dataset.wco = wco?.visible ? 'on' : 'off' }
  apply()
  wco?.addEventListener('geometrychange', apply)
  // Re-colour the frame whenever the theme changes.
  const mo = new MutationObserver(() => requestAnimationFrame(syncThemeColor))
  mo.observe(root, { attributes: true, attributeFilter: ['data-theme', 'style'] })
  syncThemeColor()
  return () => { wco?.removeEventListener('geometrychange', apply); mo.disconnect() }
}

/** "Page · Bloom" in the window title (and the task switcher). */
export function setPageTitle(page: string, app = 'Bloom') {
  document.title = page ? `${page} · ${app}` : app
}
