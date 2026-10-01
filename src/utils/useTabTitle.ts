import { useEffect } from 'react'

/** Shows `text · page` in the browser tab while the page is open (nothing when text is empty). */
export function useTabTitle(text: string, page: string) {
  useEffect(() => {
    if (!text) return
    const before = document.title
    document.title = `${text} · ${page}`
    return () => {
      document.title = before
    }
  }, [text, page])
}
