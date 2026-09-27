import { useSyncExternalStore } from 'react'

/**
 * Head slot: a page with its own tab row (Studio) offers a spot on the right
 * of that row; the page title bar moves into it so the page needs one row
 * less.
 */
let headSlot: HTMLElement | null = null
const slotListeners = new Set<() => void>()
export function setHeadSlot(el: HTMLElement | null) {
  if (headSlot === el) return
  headSlot = el
  slotListeners.forEach((l) => l())
}
export function useHeadSlot() {
  return useSyncExternalStore(
    (l) => {
      slotListeners.add(l)
      return () => void slotListeners.delete(l)
    },
    () => headSlot,
    () => null,
  )
}
