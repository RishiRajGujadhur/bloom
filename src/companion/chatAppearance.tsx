import { useSyncExternalStore } from 'react'
import { avatarStyles, type AvatarStyle } from '../components/ui/avatarStyle'

type ChatAvatar = 'glass' | AvatarStyle
const listeners = new Set<() => void>()
function read(key: string) {
  try { return localStorage.getItem(key) } catch { return null }
}
function subscribe(listener: () => void) {
  listeners.add(listener)
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}
function save(key: string, value: string) {
  try { localStorage.setItem(key, value) } catch { /* optional persistence */ }
  listeners.forEach((listener) => listener())
}
export function useChatAppearance() {
  const avatar = useSyncExternalStore(subscribe, () => {
    const value = read('bloom-chat-avatar')
    return avatarStyles.some((style) => style.id === value) ? value as AvatarStyle : 'glass'
  }, () => 'glass' as ChatAvatar)
  const followTheme = useSyncExternalStore(subscribe,
    () => read('bloom-chat-follow-theme') === '1', () => false)
  return { avatar, followTheme }
}

export function ChatAppearanceSettings() {
  const { avatar, followTheme } = useChatAppearance()
  return (
    <fieldset className="chat-appearance-settings">
      <legend>Bloom chat appearance</legend>
      <label>
        Chat avatar
        <select value={avatar} onChange={(event) => save('bloom-chat-avatar', event.target.value)}>
          <option value="glass">Glass orb</option>
          {avatarStyles.map((style) => <option key={style.id} value={style.id}>{style.label}</option>)}
        </select>
      </label>
      <label className="chat-theme-option">
        <input type="checkbox" checked={followTheme}
          onChange={(event) => save('bloom-chat-follow-theme', event.target.checked ? '1' : '0')} />
        Use my app theme for Bloom chat
      </label>
      <small>Changes apply immediately and are remembered on this device.</small>
    </fieldset>
  )
}
