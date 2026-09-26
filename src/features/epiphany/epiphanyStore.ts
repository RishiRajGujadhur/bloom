import { useEffect, useState } from 'react'
import { EPIPHANY_EVENT, EPIPHANY_KEY, type Epiphany } from './epiphanyModel'

export function readEpiphanies(): Epiphany[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(EPIPHANY_KEY) ?? '[]')
    return Array.isArray(value) ? (value as Epiphany[]) : []
  } catch {
    return []
  }
}

export function saveEpiphanies(list: Epiphany[]) {
  try {
    localStorage.setItem(EPIPHANY_KEY, JSON.stringify(list))
  } catch {
    /* kept for this visit only */
  }
  window.dispatchEvent(new Event(EPIPHANY_EVENT))
}

export function addEpiphany(item: Epiphany) {
  saveEpiphanies([item, ...readEpiphanies()])
}

/** Live list shared by the gate, the page and the extract button. */
export function useEpiphanies() {
  const [list, setList] = useState(readEpiphanies)
  useEffect(() => {
    const sync = () => setList(readEpiphanies())
    window.addEventListener(EPIPHANY_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(EPIPHANY_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])
  const update = (next: Epiphany[]) => {
    saveEpiphanies(next)
    setList(next)
  }
  return [list, update] as const
}
