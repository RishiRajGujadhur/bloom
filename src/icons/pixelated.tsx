import { forwardRef, useSyncExternalStore, type ComponentType } from 'react'
import type { LucideProps } from 'lucide-react/dist/esm/lucide-react.mjs'

/**
 * Pixel icon mode (Settings → Look & feel): Lucide icons are swapped for
 * pixelarticons. Animated icons (page emblems) pass `data-animated` and keep
 * their Lucide drawing so their stroke animations still work.
 */
const KEY = 'bloom-pixel-icons'
const EVENT = 'bloom:pixel-icons'
export const pixelIconsOn = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
export function setPixelIcons(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    /* optional */
  }
  document.documentElement.toggleAttribute('data-pixel-icons', on)
  window.dispatchEvent(new Event(EVENT))
}
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(listener => listener())
const onStorage = (event: StorageEvent) => { if (event.key === KEY || event.key === null) notify() }
const subscribe = (listener: () => void) => {
  if (!listeners.size) {
    window.addEventListener(EVENT, notify)
    window.addEventListener('storage', onStorage)
  }
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      window.removeEventListener(EVENT, notify)
      window.removeEventListener('storage', onStorage)
    }
  }
}
const usePixel = () => useSyncExternalStore(subscribe, pixelIconsOn, () => false)

export function pixelated(Original: ComponentType<LucideProps>, raw: string, name: string) {
  const viewBox = /viewBox="([^"]+)"/.exec(raw)?.[1] ?? '0 0 24 24'
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const Icon = forwardRef<SVGSVGElement, LucideProps & { 'data-animated'?: boolean }>(function PixelIcon(props, ref) {
    const pixel = usePixel()
    if (!pixel || props['data-animated']) return <Original ref={ref} {...props} />
    const { size = 24, className, color, strokeWidth: _sw, absoluteStrokeWidth: _a, ...rest } = props
    void _sw
    void _a
    return (
      <svg
        ref={ref}
        {...(rest as object)}
        width={size}
        height={size}
        viewBox={viewBox}
        fill={color ?? 'currentColor'}
        className={`pixel-icon lucide ${className ?? ''}`}
        shapeRendering="crispEdges"
        dangerouslySetInnerHTML={{ __html: inner }}
      />
    )
  })
  Icon.displayName = name
  return Icon
}
