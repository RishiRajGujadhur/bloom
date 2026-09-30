import { useCallback, useEffect, useRef, useState } from 'react'
import type { SetStateAction } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from './i18n'
import type { AppData } from './model'
import { loadData, STORAGE_KEY } from './model'
import { initializeGame, syncGame } from './rpg/engine'

export function useCoach() {
  const { t } = useTranslation(undefined, { i18n })
  const [initial] = useState(() => loadData(i18n.resolvedLanguage ?? 'en'))
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
  // Cross-tab sync: another Bloom tab saved, so adopt its data (QoL #228).
  const remote = useRef<string | null>(null)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      const next = loadData(i18n.resolvedLanguage ?? 'en')
      if (next.error) return
      remote.current = e.newValue
      window.dispatchEvent(new Event('bloom:remote-sync'))
      rawSetData(initializeGame(next.data))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  useEffect(() => {
    if (blocked) return
    const json = JSON.stringify(data)
    // Don't echo a change that just arrived from another tab.
    if (remote.current === json) { remote.current = null; return }
    remote.current = null
    try {
      localStorage.setItem(STORAGE_KEY, json)
      setError('')
    } catch {
      setError(t('errors.storage'))
    }
  }, [data, blocked, t])
  return {
    data,
    setData,
    error,
    blocked,
    resumeSaving: () => setBlocked(false),
  }
}