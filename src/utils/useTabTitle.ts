import { useEffect, useState } from 'react'

const routeOf = () => (typeof location === 'undefined' ? '' : location.hash.slice(1).split('/')[0])

/**
 * Shows `text · page` in the browser tab while that page is the current route
 * (`route` is its hash key, e.g. 'habits'). Some pages stay mounted in the
 * background, so the route check keeps their titles from leaking elsewhere.
 */
export function useTabTitle(text: string, page: string, route?: string) {
  const [current, setCurrent] = useState(routeOf)
  useEffect(() => {
    const on = () => setCurrent(routeOf())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const showing = !route || current === route
  useEffect(() => {
    if (!text || !showing) return
    const before = document.title
    const mine = `${text} · ${page}`
    document.title = mine
    return () => {
      // Only undo our own title; if the app already set the next page's title, keep it.
      if (document.title === mine) document.title = before
    }
  }, [text, page, showing])
}
