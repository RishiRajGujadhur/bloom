import { useEffect, useState } from 'react'
import gsap from 'gsap'

/**
 * Small app-wide conveniences (QoL list items 18, 31, 32, 44, 52, 97, 98, 110, 488):
 * - GSAP pauses while the tab is hidden (saves battery, no catch-up bursts)
 * - click the page title to scroll to the top; a back-to-top button after two screens
 * - Esc clears a search box; Ctrl/Cmd+Enter submits the form you're in
 * - Ctrl+Backspace returns to the previous page; Ctrl+. toggles focus mode
 * - a skip-to-content link for keyboard users
 * - the favicon shows how many habits are left today
 */
/** Last submitted value per text field (this visit only), for Up-arrow recall. */
const lastEntries = new Map<string, string>()
const fieldKey = (el: HTMLInputElement) => `${location.hash.split('/')[0]}|${el.getAttribute('aria-label') ?? el.placeholder ?? el.name}`

export function GlobalQoL({ habitsLeft }: { habitsLeft: number }) {
  const [showTop, setShowTop] = useState(false)
  // Character counter near any length-limited field once you're past 80% of it.
  const [counter, setCounter] = useState<{ x: number; y: number; text: string; full: boolean } | null>(null)
  useEffect(() => {
    const show = (e: Event) => {
      const el = e.target
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || el.maxLength <= 0) return setCounter(null)
      const n = el.value.length
      if (n < el.maxLength * 0.8) return setCounter(null)
      const r = el.getBoundingClientRect()
      setCounter({ x: r.right, y: r.bottom, text: `${n}/${el.maxLength}`, full: n >= el.maxLength })
    }
    const hide = () => setCounter(null)
    document.addEventListener('input', show, true)
    document.addEventListener('focusout', hide, true)
    return () => {
      document.removeEventListener('input', show, true)
      document.removeEventListener('focusout', hide, true)
    }
  }, [])
  // Click an image that's shown smaller than it really is to see it full size.
  const [zoomImg, setZoomImg] = useState<string | null>(null)
  useEffect(() => {
    const onImg = (e: MouseEvent) => {
      const img = e.target
      if (!(img instanceof HTMLImageElement) || !img.closest('main') || img.closest('a, button, [role="button"], label')) return
      if (img.naturalWidth < img.clientWidth * 1.4 || img.naturalWidth < 200) return
      setZoomImg(img.currentSrc || img.src)
    }
    document.addEventListener('click', onImg)
    return () => document.removeEventListener('click', onImg)
  }, [])
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => {
    const vis = () => (document.hidden ? gsap.globalTimeline.pause() : gsap.globalTimeline.resume())
    document.addEventListener('visibilitychange', vis)
    const onScroll = () => setShowTop(window.scrollY > window.innerHeight * 2)
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      if (t?.closest('#page-heading')) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    document.addEventListener('click', onClick)
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (e.key === 'Escape' && t instanceof HTMLInputElement && t.value && (t.type === 'search' || /search|find|filter/i.test(t.placeholder + (t.getAttribute('aria-label') ?? '')))) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        setter?.call(t, '')
        t.dispatchEvent(new Event('input', { bubbles: true }))
        e.stopPropagation()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = t?.closest('form')
        if (form) { e.preventDefault(); form.requestSubmit() }
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace' && !t?.closest('input, textarea, [contenteditable="true"]')) {
        e.preventDefault()
        history.back()
        return
      }
      // Up-arrow in an empty text field brings back what you last submitted there.
      if (e.key === 'ArrowUp' && t instanceof HTMLInputElement && t.type === 'text' && !t.value) {
        const last = lastEntries.get(fieldKey(t))
        if (last) {
          e.preventDefault()
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(t, last)
          t.dispatchEvent(new Event('input', { bubbles: true }))
        }
        return
      }
      // Ctrl+/ jumps to this page's own search box.
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        const box = [...document.querySelectorAll<HTMLInputElement>('main input[type="search"], main input[placeholder*="earch"], main input[placeholder^="Find"]')].find((el) => el.offsetParent !== null)
        if (box) {
          e.preventDefault()
          box.focus()
          box.select()
        }
        return
      }
      // Privacy panic key: blur everything instantly (again to reveal).
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        document.documentElement.toggleAttribute('data-privacy-blur')
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '.') {
        e.preventDefault()
        const root = document.documentElement
        root.dataset.focusMode = root.dataset.focusMode === 'on' ? 'off' : 'on'
      }
    }
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement
      for (const el of form.querySelectorAll<HTMLInputElement>('input[type="text"], input:not([type])')) if (el.value.trim()) lastEntries.set(fieldKey(el), el.value)
    }
    document.addEventListener('submit', onSubmit, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('visibilitychange', vis)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('submit', onSubmit, true)
    }
  }, [])

  // Favicon badge: habits still to do today.
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel~="icon"]')
    if (!link) return
    const original = link.dataset.original ?? link.href
    link.dataset.original = original
    if (!habitsLeft) { link.href = original; return }
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = c.height = 64
      const g = c.getContext('2d')!
      g.drawImage(img, 0, 0, 64, 64)
      g.fillStyle = '#e2553f'
      g.beginPath(); g.arc(46, 18, 17, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#fff'
      g.font = 'bold 22px sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(habitsLeft > 9 ? '9+' : String(habitsLeft), 46, 19)
      link.href = c.toDataURL('image/png')
    }
    img.src = original
  }, [habitsLeft])

  return (
    <>
      <a href="#page-heading" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('page-heading')?.focus() }}>Skip to content</a>
      {counter && <div className="char-counter" data-full={counter.full} style={{ left: counter.x, top: counter.y }} aria-live="polite">{counter.text}</div>}
      {zoomImg && (
        <div className="img-lightbox" role="dialog" aria-label="Image, full size" onClick={() => setZoomImg(null)} onKeyDown={(e) => e.key === 'Escape' && setZoomImg(null)} tabIndex={-1} ref={(el) => el?.focus()}>
          <img src={zoomImg} alt="" />
        </div>
      )}
      {offline && <div className="offline-pill" role="status">Offline · everything still saves on this device</div>}
      {showTop && <button type="button" className="to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}
    </>
  )
}
