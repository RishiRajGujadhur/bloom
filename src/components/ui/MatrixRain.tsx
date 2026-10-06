import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { mountScene } from '../../platform/offscreen'
import MatrixWorker from './matrixWorker?worker'

/** The active theme id, live (reads html[data-theme]). */
const themeListeners = new Set<() => void>()
let themeObserver: MutationObserver | null = null
const subscribe = (listener: () => void) => {
  themeListeners.add(listener)
  if (!themeObserver) {
    themeObserver = new MutationObserver(() => themeListeners.forEach(notify => notify()))
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  }
  return () => {
    themeListeners.delete(listener)
    if (!themeListeners.size) { themeObserver?.disconnect(); themeObserver = null }
  }
}
export const useThemeId = () => useSyncExternalStore(subscribe, () => document.documentElement.dataset.theme ?? '', () => '')
export const useMatrix = () => useThemeId() === 'matrix'

/**
 * Matrix theme backdrop: slow falling glyph rain behind the app. It renders in
 * a worker on an OffscreenCanvas (main-thread fallback), ~20 fps, paused when
 * the tab is hidden, and off when motion is reduced.
 */
export function MatrixRain() {
  const on = useMatrix()
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current
    if (!on || !el || prefersReducedMotion()) return
    const scene = mountScene<null>(el, {
      data: null,
      makeWorker: () => new MatrixWorker(),
      loadFactory: () => import('./matrixScene').then((m) => m.createMatrixScene),
    })
    const vis = () => scene.send('visible', !document.hidden)
    document.addEventListener('visibilitychange', vis)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      scene.dispose()
    }
  }, [on])
  if (!on) return null
  return <div ref={host} className="matrix-rain" aria-hidden="true" />
}
