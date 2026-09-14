import { useCallback, useEffect, useState } from 'react'
import type { SetStateAction } from 'react'
import type { AppData } from './model'
import { loadData, STORAGE_KEY } from './model'
import { initializeGame, syncGame } from './rpg/engine'

export function useCoach() {
  const [initial] = useState(loadData)
  const [data, rawSetData] = useState(() => initializeGame(initial.data))
  const setData = useCallback((action: SetStateAction<AppData>) => {
    const now = Date.now()
    rawSetData(previous => syncGame(typeof action === 'function' ? action(previous) : action, previous, now))
  }, [])
  const [error, setError] = useState(initial.error)
  const [blocked, setBlocked] = useState(Boolean(initial.error))
  useEffect(() => {
    const tick = () => setData(d => d)
    tick()
    const timer = setInterval(tick, 60000)
    window.addEventListener('focus', tick)
    return () => { clearInterval(timer); window.removeEventListener('focus', tick) }
  }, [setData])
  useEffect(() => {
    if (blocked) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      setError('')
    } catch {
      setError(
        'Changes are in memory only. Browser storage is unavailable or full. Export a backup before closing this page.',
      )
    }
  }, [data, blocked])
  return {
    data,
    setData,
    error,
    blocked,
    resumeSaving: () => setBlocked(false),
  }
}
