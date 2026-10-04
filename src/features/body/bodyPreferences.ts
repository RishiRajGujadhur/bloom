import { useSyncExternalStore } from 'react'
const EVENT = 'bloom-body-preferences'
const subscribe = (listener: () => void) => { window.addEventListener(EVENT, listener); window.addEventListener('storage', listener); return () => { window.removeEventListener(EVENT, listener); window.removeEventListener('storage', listener) } }
export function bodySeated() { try { return localStorage.getItem('bloom-coach-accessible') === 'true' } catch { return false } }
export function setBodySeated(value: boolean) { try { localStorage.setItem('bloom-coach-accessible', String(value)) } catch { /* session preference */ }; window.dispatchEvent(new Event(EVENT)) }
export function useBodySeated() { return useSyncExternalStore(subscribe, bodySeated, () => false) }
export function bodySilent() { try { return localStorage.getItem('bloom-body-silent') !== 'false' } catch { return true } }
export function setBodySilent(value: boolean) { try { localStorage.setItem('bloom-body-silent', String(value)) } catch { /* session preference */ }; if (value) window.speechSynthesis?.cancel(); window.dispatchEvent(new Event(EVENT)) }
export function useBodySilent() { return useSyncExternalStore(subscribe, bodySilent, () => true) }
