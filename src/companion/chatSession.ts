/** Optional tab-local recovery; blocked storage never prevents chatting. */
export function readDraft(key: string): string {
  try { return (sessionStorage.getItem(key) ?? '').slice(0, 1000) } catch { return '' }
}
export function writeSession(key: string, value: string) {
  try { sessionStorage.setItem(key, value) } catch { /* Continue without recovery. */ }
}
