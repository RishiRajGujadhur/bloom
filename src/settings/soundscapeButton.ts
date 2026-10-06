import { useSyncExternalStore } from 'react'
import { applyDisplayToggles } from '../components/ui/Flow'

const key = 'bloom-hide-soundscape'
let fallback = true
function read() {
  try { return localStorage.getItem(key) !== '1' } catch { return fallback }
}
function subscribe(listener: () => void) {
  window.addEventListener('bloom-display-change', listener)
  window.addEventListener('storage', listener)
  return () => { window.removeEventListener('bloom-display-change', listener); window.removeEventListener('storage', listener) }
}
export const useSoundscapeButton = () => useSyncExternalStore(subscribe, read, () => true)
export function setSoundscapeButton(visible: boolean) {
  fallback = visible
  try { localStorage.setItem(key, visible ? '0' : '1') } catch { /* session preference still works */ }
  applyDisplayToggles()
}
