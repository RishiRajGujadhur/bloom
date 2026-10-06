import mono from '@fontsource/fira-code/files/fira-code-latin-400-normal.woff2?url'
import handwritten from '@fontsource/caveat/files/caveat-latin-400-normal.woff2?url'
import readable from '@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2?url'
import pixel from '@fontsource/vt323/files/vt323-latin-400-normal.woff2?url'
import pixelHeading from '@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2?url'
import galaxy from '@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2?url'
import galaxyHeading from '@fontsource/manrope/files/manrope-latin-700-normal.woff2?url'

const loaders = {
  mono: () => import('../styles/fonts/mono.css'),
  handwritten: () => import('../styles/fonts/handwritten.css'),
  readable: () => import('../styles/fonts/readable.css'),
  pixel: () => import('../styles/fonts/pixel.css'),
  galaxy: () => import('../styles/fonts/galaxy.css'),
}
type Family = keyof typeof loaders
const preloads: Record<Family, string[]> = {
  mono: [mono],
  handwritten: [handwritten],
  readable: [readable],
  pixel: [pixel, pixelHeading],
  galaxy: [galaxy, galaxyHeading],
}
const pending = new Map<Family, Promise<unknown>>()
const hinted = new Set<string>()

/** Load only selected typography, retaining Fontsource's language subsets and swap. */
export function loadThemeFonts(fontId: string, themeId: string) {
  const family =
    themeId === 'galaxy' && fontId !== 'local'
      ? 'galaxy'
      : themeId === 'matrix' && fontId === 'system'
        ? 'mono'
        : fontId
  if (!(family in loaders) || typeof document === 'undefined') return
  const key = family as Family
  if (pending.has(key)) return
  for (const href of preloads[key]) {
    if (hinted.has(href)) continue
    hinted.add(href)
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'font'
    link.type = 'font/woff2'
    link.crossOrigin = 'anonymous'
    link.href = href
    document.head.append(link)
  }
  pending.set(
    key,
    loaders[key]().catch(() => {
      pending.delete(key)
    }),
  )
}
