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
  // Home/End jump to the first/last button of the list holding focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key !== 'Home' && e.key !== 'End') || e.ctrlKey || e.altKey || e.metaKey) return
      const t = e.target as HTMLElement | null
      if (!t || t.closest('input, textarea, select, [contenteditable="true"]')) return
      const list = t.closest('[role="list"], ul, ol')
      if (!list) return
      const items = [...list.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')].filter((el) => el.offsetParent)
      const pick = e.key === 'Home' ? items[0] : items[items.length - 1]
      if (!pick || pick === t) return
      e.preventDefault()
      pick.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  // Hold Alt for a moment to reveal shortcut hints written in button titles, e.g. "Restart (R)".
  useEffect(() => {
    let timer = 0
    const clear = () => {
      window.clearTimeout(timer)
      document.querySelectorAll('[data-kbd-hint]').forEach((el) => el.removeAttribute('data-kbd-hint'))
    }
    const down = (e: KeyboardEvent) => {
      if (e.key !== 'Alt' || e.repeat) return
      timer = window.setTimeout(() => {
        document.querySelectorAll<HTMLElement>('button[title]').forEach((b) => {
          const m = /\(([^()]{1,14})\)\s*$/.exec(b.title)
          if (m && b.offsetParent) b.setAttribute('data-kbd-hint', m[1])
        })
      }, 400)
    }
    const up = (e: KeyboardEvent) => { if (e.key === 'Alt') clear() }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', clear)
    return () => { clear(); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', clear) }
  }, [])
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
  // Coming back to a page restores where you'd scrolled to (this visit only).
  useEffect(() => {
    const positions = new Map<string, number>()
    const route = (url: string) => (url.split('#')[1] ?? '').split('/')[0] || 'overview'
    let current = route(location.href)
    let lastY = window.scrollY
    const track = () => {
      lastY = window.scrollY
      positions.set(current, lastY)
    }
    // Scroll events can lag behind a quick click; sample too.
    const sampler = window.setInterval(() => {
      if (route(location.href) === current) track()
    }, 700)
    const onHash = (e: HashChangeEvent) => {
      const from = route(e.oldURL)
      const to = route(e.newURL)
      if (from === to) return
      positions.set(from, lastY)
      current = to
      const y = positions.get(to)
      if (y) setTimeout(() => window.scrollTo({ top: y, behavior: 'instant' }), 350)
    }
    window.addEventListener('scroll', track, { passive: true })
    window.addEventListener('hashchange', onHash)
    return () => {
      window.clearInterval(sampler)
      window.removeEventListener('scroll', track)
      window.removeEventListener('hashchange', onHash)
    }
  }, [])
  // Battery saver: below 20% and unplugged, decorative motion pauses (html[data-low-battery]).
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean; addEventListener: (t: string, f: () => void) => void; removeEventListener: (t: string, f: () => void) => void }> }
    if (!nav.getBattery) return
    let battery: Awaited<ReturnType<NonNullable<typeof nav.getBattery>>> | null = null
    const sync = () => {
      if (!battery) return
      const low = !battery.charging && battery.level <= 0.2
      document.documentElement.toggleAttribute('data-low-battery', low)
    }
    void nav.getBattery().then((b) => {
      battery = b
      sync()
      b.addEventListener('levelchange', sync)
      b.addEventListener('chargingchange', sync)
    })
    return () => {
      battery?.removeEventListener('levelchange', sync)
      battery?.removeEventListener('chargingchange', sync)
    }
  }, [])
  // Weekly nudge to export a backup (everything lives in this browser).
  const [backupDue, setBackupDue] = useState(() => {
    try {
      const last = Number(localStorage.getItem('bloom-last-backup')) || Number(localStorage.getItem('bloom-first-seen'))
      if (!last) localStorage.setItem('bloom-first-seen', String(Date.now()))
      const snoozed = Number(localStorage.getItem('bloom-backup-snooze'))
      return !!last && Date.now() - last > 7 * 864e5 && Date.now() > snoozed
    } catch {
      return false
    }
  })
  const snoozeBackup = () => {
    setBackupDue(false)
    try {
      localStorage.setItem('bloom-backup-snooze', String(Date.now() + 7 * 864e5))
    } catch {
      /* optional */
    }
  }
  // A tiny shared toast: window.dispatchEvent(new CustomEvent('bloom:toast', { detail: 'text' })).
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    let timer = 0
    const on = (e: Event) => {
      setToast(String((e as CustomEvent).detail ?? ''))
      clearTimeout(timer)
      timer = window.setTimeout(() => setToast(null), 2600)
    }
    window.addEventListener('bloom:toast', on)
    return () => {
      window.removeEventListener('bloom:toast', on)
      clearTimeout(timer)
    }
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
    // Top bar: tucks away while you scroll down, slides back when you scroll up.
    let lastY = window.scrollY
    const onScroll = () => {
      setShowTop(window.scrollY > window.innerHeight * 2)
      const y = window.scrollY
      if (Math.abs(y - lastY) > 8) {
        document.documentElement.toggleAttribute('data-topbar-hidden', y > lastY && y > 140)
        lastY = y
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      // Links to other sites open in a new tab so Bloom (and any timer) stays put.
      const a = t?.closest?.('a[href]') as HTMLAnchorElement | null
      if (a && !a.target && !a.hasAttribute('download') && a.origin !== location.origin && /^https?:/.test(a.href)) {
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
      }
      if (t?.closest('#page-heading')) window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    document.addEventListener('click', onClick)
    // Text cut off with an ellipsis gets its full wording as a tooltip.
    const onOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      if (!el || el.title || el.children.length > 2) return
      const text = el.textContent?.trim()
      if (text && text.length < 400 && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 2) && getComputedStyle(el).overflow !== 'visible') el.title = text
    }
    document.addEventListener('mouseover', onOver, { passive: true })
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
      document.removeEventListener('mouseover', onOver)
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
      {backupDue && (
        <div className="backup-nudge" role="status">
          <span>💾 It’s been over a week since your last backup.</span>
          <button type="button" onClick={() => { snoozeBackup(); location.hash = 'settings'; setTimeout(() => document.getElementById('json-heading')?.scrollIntoView({ behavior: 'smooth' }), 600) }}>Back up</button>
          <button type="button" onClick={snoozeBackup}>Later</button>
        </div>
      )}
      {toast && <div className="offline-pill quick-toast" role="status">{toast}</div>}
      {offline && <div className="offline-pill" role="status">Offline · everything still saves on this device</div>}
      {showTop && <button type="button" className="to-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>↑</button>}
    </>
  )
}
