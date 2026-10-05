/** Optional tab-local recovery; blocked storage never prevents chatting. */
export function readDraft(key: string): string {
  try { return (sessionStorage.getItem(key) ?? '').slice(0, 1000) } catch { return '' }
}
export function writeSession(key: string, value: string) {
  try { sessionStorage.setItem(key, value) } catch { /* Continue without recovery. */ }
}

export function readConversation<T>(key: string, valid: (value: unknown) => value is T): T[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(key) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(valid).slice(-60) : []
  } catch { return [] }
}

export function exportConversation(lines: { speaker: string; text: string }[], name: string) {
  const blob = new Blob([`Bloom conversation\n\n${lines.map((line) => `${line.speaker}: ${line.text}`).join('\n\n')}`], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
