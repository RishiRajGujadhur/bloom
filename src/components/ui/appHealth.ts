/**
 * Quality basics that run once at start-up:
 *   - ask the browser to keep Bloom's storage (so journals and progress are not evicted)
 *   - a small pill tells you when you go offline / come back online
 *   - remember the install prompt so Settings can offer "Install Bloom"
 */
let installEvent: (Event & { prompt: () => Promise<void> }) | null = null
export const canInstall = () => !!installEvent
export async function promptInstall() {
  if (!installEvent) return false
  await installEvent.prompt()
  installEvent = null
  return true
}

function pill(text: string, tone: 'warn' | 'ok') {
  document.querySelector('.net-pill')?.remove()
  const el = document.createElement('div')
  el.className = `net-pill ${tone}`
  el.setAttribute('role', 'status')
  el.textContent = text
  document.body.appendChild(el)
  if (tone === 'ok') window.setTimeout(() => el.remove(), 3000)
}

export function installAppHealth() {
  if (typeof window === 'undefined') return
  void navigator.storage?.persist?.().catch(() => {})
  window.addEventListener('offline', () => pill('You’re offline — Bloom keeps working and saves on this device.', 'warn'))
  window.addEventListener('online', () => pill('Back online ✓', 'ok'))
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as typeof installEvent
    window.dispatchEvent(new Event('bloom:installable'))
  })
}
