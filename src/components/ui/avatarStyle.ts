import { useSyncExternalStore } from 'react'
import { useMatrix } from './MatrixRain'

/**
 * Which Bloom avatar to draw:
 *   auto  – Bloom, or the robot while the Matrix theme is on
 *   bloom – the coral diamond (Koji-style)
 *   robot – the green terminal robot
 *   orb   – a soft, blurry colour orb with a tiny face that drifts through moods
 */
export type AvatarStyle = 'auto' | 'bloom' | 'robot' | 'orb' | 'spark' | 'beacon' | 'tinker' | 'pixel' | 'globe'
export const AVATAR_KEY = 'bloom-avatar-style'
export const avatarStyles: { id: AvatarStyle; label: string; hint: string }[] = [
  { id: 'auto', label: 'Automatic', hint: 'Bloom, or the robot in the Matrix theme' },
  { id: 'bloom', label: 'Bloom', hint: 'The coral diamond with a window eye' },
  { id: 'robot', label: 'Robot', hint: 'A green terminal robot' },
  { id: 'orb', label: 'Mood orb', hint: 'A soft glowing orb whose colour follows its mood' },
  { id: 'spark', label: 'Sparky', hint: 'Orange robot: crackling antenna, pulsing ring eyes' },
  { id: 'beacon', label: 'Beacon', hint: 'Orange robot: spinning radar and a scanner eye' },
  { id: 'tinker', label: 'Tinker', hint: 'Orange robot: turning gear and puffs of steam' },
  { id: 'pixel', label: 'Pixel Bloom', hint: '8-bit Bloom with stepped frames and twinkling pixels' },
  { id: 'globe', label: 'Globe', hint: 'A glossy 3D sphere that turns its head, with an orbiting moon' },
]

const listeners = new Set<() => void>()
const read = (): AvatarStyle => {
  try {
    const v = localStorage.getItem(AVATAR_KEY) as AvatarStyle | null
    return v && avatarStyles.some((s) => s.id === v) ? v : 'auto'
  } catch {
    return 'auto'
  }
}
export function setAvatarStyle(v: AvatarStyle) {
  try {
    localStorage.setItem(AVATAR_KEY, v)
  } catch {
    /* storage blocked */
  }
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => {
  listeners.add(l)
  window.addEventListener('storage', l)
  return () => {
    listeners.delete(l)
    window.removeEventListener('storage', l)
  }
}
export const useAvatarStyle = () => useSyncExternalStore(subscribe, read, () => 'auto' as AvatarStyle)

/** The drawing actually used right now. */
export type AvatarDrawing = Exclude<AvatarStyle, 'auto'>
export function useAvatarDrawing(): AvatarDrawing {
  const style = useAvatarStyle()
  const matrix = useMatrix()
  return style === 'auto' ? (matrix ? 'robot' : 'bloom') : style
}
