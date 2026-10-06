import { useEffect, useState, type RefObject } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { frameThrottle } from '../../utils/frameThrottle'
import { prefersReducedMotion } from '../../utils/motion'
import './sectionNavigator.css'

type Section = { node: HTMLElement; label: string }
type Navigation = {
  sections: Section[]
  previous: number
  next: number
  canUp: boolean
  canDown: boolean
}

const empty: Navigation = { sections: [], previous: -1, next: -1, canUp: false, canDown: false }
const topInset = () => {
  const bar = document.querySelector<HTMLElement>('.topbar')
  if (!bar) return 20
  const style = getComputedStyle(bar)
  const pinned = style.position === 'fixed' || (style.position === 'sticky' && style.top !== 'auto')
  // The bar can be offscreen before a jump; reserve its pinned height at the destination.
  return (pinned ? Math.max(0, Number.parseFloat(style.top) || 0) + bar.getBoundingClientRect().height : 0) + 20
}

/** Shared section controls make long pages discoverable without scrollbar chrome. */
export function SectionNavigator({ root, page }: { root: RefObject<HTMLDivElement | null>; page: string }) {
  const [navigation, setNavigation] = useState<Navigation>(empty)
  const [space, setSpace] = useState({ left: 0, width: 360, covered: false })

  useEffect(() => {
    const content = root.current
    if (!content) return
    const update = frameThrottle(() => {
      const bounds = (content.closest('main') ?? content).getBoundingClientRect()
      let left = Math.max(16, bounds.left + 16)
      let right = Math.min(window.innerWidth - 16, bounds.right - 16)
      const panel = document.querySelector<HTMLElement>('.bc-panel')?.getBoundingClientRect()
      const bottom = window.innerWidth <= 720 ? 168 : 18
      const rowTop = window.innerHeight - bottom - 64
      if (panel && panel.bottom > rowTop && panel.top < window.innerHeight - bottom) {
        if (panel.left <= left) left = Math.max(left, panel.right + 16)
        else if (panel.right >= right) right = Math.min(right, panel.left - 16)
        else if (panel.left - left > right - panel.right) right = panel.left - 16
        else left = panel.right + 16
      }
      const available = Math.max(0, right - left)
      setSpace(current => {
        const next = { left: (left + right) / 2, width: Math.min(360, available), covered: available < 160 }
        return current.left === next.left && current.width === next.width && current.covered === next.covered ? current : next
      })
      const inset = topInset()
      const sections: Section[] = []
      const positions: number[] = []
      for (const node of content.querySelectorAll<HTMLElement>('h2, h3, summary, .fold-head strong, [data-section-title]')) {
        if (!node.getClientRects().length || getComputedStyle(node).visibility === 'hidden') continue
        const label = (node.dataset.sectionTitle || node.textContent || '').replace(/\s+/g, ' ').trim()
        if (!label) continue
        const top = node.getBoundingClientRect().top
        // A card title and its disclosure summary can describe the same stop.
        if (sections.some((section, index) => section.label === label && Math.abs(positions[index] - top) < 48)) continue
        sections.push({ node, label })
        positions.push(top)
      }
      // Grid columns can put DOM siblings at the same height; navigate in visual order.
      const ordered = sections.map((section, index) => ({ section, top: positions[index] })).sort((a, b) => a.top - b.top)
      const next = ordered.findIndex(item => item.top > inset + 24)
      const previous = ordered.findLastIndex(item => item.top < inset - 24)
      const scroller = document.scrollingElement
      const maximum = Math.max(0, (scroller?.scrollHeight ?? 0) - Math.max(scroller?.clientHeight ?? 0, window.innerHeight))
      const scrollTop = scroller?.scrollTop ?? window.scrollY
      const canUp = scrollTop > 2
      const canDown = scrollTop < maximum - 2
      const sorted = ordered.map(item => item.section)
      setNavigation(current => {
        const sameSections = current.sections.length === sorted.length && current.sections.every((section, index) => section.node === sorted[index].node && section.label === sorted[index].label)
        if (sameSections && current.previous === previous && current.next === next && current.canUp === canUp && current.canDown === canDown) return current
        return { sections: sorted, previous, next, canUp, canDown }
      })
    })
    update()
    const observer = new MutationObserver(update)
    observer.observe(content, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'aria-expanded'] })
    const layoutObserver = new MutationObserver(update)
    layoutObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bloom-docked', 'data-bloom-open', 'data-bloom-right', 'style'] })
    layoutObserver.observe(document.body, { childList: true })
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    resize?.observe(content)
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    content.addEventListener('toggle', update, true)
    return () => {
      observer.disconnect()
      layoutObserver.disconnect()
      resize?.disconnect()
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      content.removeEventListener('toggle', update, true)
      update.cancel()
    }
  }, [root, page])

  const jump = (index: number, direction: number) => {
    const section = navigation.sections[index]
    const top = section
      ? window.scrollY + section.node.getBoundingClientRect().top - topInset()
      : direction < 0 ? 0 : window.scrollY + window.innerHeight * 0.75
    window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() || document.documentElement.dataset.bloomMotion === 'paused' ? 'instant' : 'smooth' })
  }
  const move = (direction: number) => {
    // Re-read positions at activation, including clicks immediately after a menu jump.
    const inset = topInset()
    const index = direction > 0
      ? navigation.sections.findIndex(section => section.node.getBoundingClientRect().top > inset + 24)
      : navigation.sections.findLastIndex(section => section.node.getBoundingClientRect().top < inset - 24)
    jump(index, direction)
  }

  if (!navigation.canUp && !navigation.canDown) return null
  const nextLabel = navigation.sections[navigation.next]?.label ?? 'More below'
  const previousLabel = navigation.sections[navigation.previous]?.label ?? 'Page top'
  return (
    <nav className="section-navigator" aria-label="Page sections" hidden={space.covered} style={{ left: space.left, width: space.width }}>
      <button type="button" disabled={!navigation.canUp} aria-label={`Previous section: ${previousLabel}`} title={previousLabel} onClick={() => move(-1)}>
        <ArrowUp size={18} aria-hidden="true" />
      </button>
      <div className="section-navigator-copy">
        <span aria-hidden="true">{navigation.canDown ? nextLabel : 'End of page'}</span>
        {navigation.sections.length > 0 && <select aria-label="Jump to page section" value="" onChange={event => jump(Number(event.target.value), 1)}>
          <option value="" disabled>Jump to section…</option>
          {navigation.sections.map((section, index) => <option key={index} value={index}>{section.label}</option>)}
        </select>}
      </div>
      <button type="button" disabled={!navigation.canDown} aria-label={`Next section: ${nextLabel}`} title={nextLabel} onClick={() => move(1)}>
        <ArrowDown size={18} aria-hidden="true" />
      </button>
    </nav>
  )
}
