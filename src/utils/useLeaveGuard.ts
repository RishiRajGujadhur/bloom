import { useEffect } from 'react'

/** While `active`, closing or reloading the tab asks for confirmation (a timer would be lost). */
export function useLeaveGuard(active: boolean) {
  useEffect(() => {
    if (!active) return
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])
}
