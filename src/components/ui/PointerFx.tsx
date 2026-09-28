import { prefersReducedMotion } from '../../utils/motion'
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import MouseFollower from 'mouse-follower'
import 'mouse-follower/dist/mouse-follower.min.css'
import {
  bubbleCursor,
  emojiCursor,
  fairyDustCursor,
  rainbowCursor,
  snowflakeCursor,
  springyEmojiCursor,
  type CursorEffectResult,
} from 'cursor-effects'
import { readStore, writeStore } from '../studio/Studio'
import { subOn } from '../../features/subFeatures'
import './pointer.css'

/**
 * Pointer customisation. A pointer has a *shape* (the arrow itself, drawn as
 * an SVG cursor in your colour and size) and an optional *effect*: a GSAP
 * follower dot (mouse-follower) with labels and magnetic buttons, or a trail
 * from cursor-effects. "Match the page" picks an effect per page.
 */
export type Effect = 'auto' | 'none' | 'follower' | 'emoji' | 'springy' | 'fairy' | 'rainbow' | 'bubbles' | 'snow'
export type Shape = 'system' | 'arrow' | 'dot' | 'pen' | 'leaf' | 'hand'
export type PointerPrefs = { effect: Effect; shape: Shape; size: number; color: string; emoji: string }
export const POINTER_KEY = 'bloom-pointer-v1'
export const POINTER_EVENT = 'bloom:pointer-changed'
export const defaultPointer: PointerPrefs = { effect: 'auto', shape: 'system', size: 1, color: '#e0703f', emoji: '🌸' }
export const readPointer = (): PointerPrefs => ({ ...defaultPointer, ...readStore<Partial<PointerPrefs>>(POINTER_KEY, {}) })
export function savePointer(p: PointerPrefs) {
  writeStore(POINTER_KEY, p)
  window.dispatchEvent(new Event(POINTER_EVENT))
}

export const effectNames: Record<Effect, string> = {
  auto: 'Match the page',
  none: 'No effect',
  follower: 'Follower dot',
  emoji: 'Emoji trail',
  springy: 'Springy buddy',
  fairy: 'Fairy dust',
  rainbow: 'Rainbow ribbon',
  bubbles: 'Bubbles',
  snow: 'Snowflakes',
}
export const shapeNames: Record<Shape, string> = { system: 'System', arrow: 'Arrow', dot: 'Dot', pen: 'Ink pen', leaf: 'Leaf', hand: 'Hand' }

/** What "Match the page" means on each page. */
export const pageEffects: Record<string, { effect: Exclude<Effect, 'auto'>; emoji?: string[] }> = {
  overview: { effect: 'follower' },
  focus: { effect: 'follower' },
  todos: { effect: 'follower' },
  daybook: { effect: 'fairy' },
  journal: { effect: 'fairy' },
  growth: { effect: 'emoji', emoji: ['🌱', '🌸', '🍃'] },
  gratitude: { effect: 'emoji', emoji: ['💛', '✨'] },
  habits: { effect: 'emoji', emoji: ['💧', '🌱'] },
  shop: { effect: 'emoji', emoji: ['🌸', '💎'] },
  dojo: { effect: 'springy', emoji: ['🥋'] },
  games: { effect: 'rainbow' },
  urges: { effect: 'bubbles' },
  sleep: { effect: 'snow' },
  meditate: { effect: 'fairy' },
}

/** An SVG cursor for a shape, colour and size (1 = 24 px). */
export function cursorCss(shape: Shape, color: string, size: number) {
  if (shape === 'system') return ''
  const s = Math.round(24 * size)
  const c = encodeURIComponent(color)
  const paths: Record<Exclude<Shape, 'system'>, [string, number, number]> = {
    arrow: [`<path d='M3 2 L3 20 L8 15 L11 22 L14 21 L11 14 L18 14 Z' fill='${c}' stroke='white' stroke-width='1.5'/>`, 3, 2],
    dot: [`<circle cx='12' cy='12' r='6' fill='${c}' stroke='white' stroke-width='2'/>`, 12, 12],
    pen: [`<path d='M3 21 L5 15 L16 4 L20 8 L9 19 Z' fill='${c}' stroke='white' stroke-width='1.5'/><path d='M3 21 L5 15 L9 19Z' fill='%23333'/>`, 3, 21],
    leaf: [`<path d='M4 20 C4 9 11 3 21 3 C21 13 15 20 4 20 Z' fill='${c}' stroke='white' stroke-width='1.5'/><path d='M4 20 L14 10' stroke='white' stroke-width='1.2'/>`, 4, 20],
    hand: [`<path d='M9 3 a2 2 0 0 1 4 0 v7 h1 v-2 a2 2 0 0 1 4 0 v8 a6 6 0 0 1 -6 6 h-1 a6 6 0 0 1 -5 -3 l-3 -5 a1.8 1.8 0 0 1 3 -2 l2 2 Z' fill='${c}' stroke='white' stroke-width='1.3'/>`, 11, 2],
  }
  const [body, hx, hy] = paths[shape]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 24 24'>${body}</svg>`
  return `url("data:image/svg+xml;utf8,${svg}") ${Math.round(hx * size)} ${Math.round(hy * size)}, auto`
}

const canHover = () => typeof window !== 'undefined' && !!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches
const reduced = () => !!prefersReducedMotion()

let registered = false

/** Mount once: applies the shape and runs the effect for the current page. */
export function PointerFx({ page }: { page: string }) {
  const [prefs, setPrefs] = useState(readPointer)
  useEffect(() => {
    const sync = () => setPrefs(readPointer())
    window.addEventListener(POINTER_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(POINTER_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  // Shape: a CSS variable used by the stylesheet for body and clickables.
  useEffect(() => {
    const root = document.documentElement
    const on = subOn('pointerFx', 'shapes') && prefs.shape !== 'system'
    root.toggleAttribute('data-pointer', on)
    root.style.setProperty('--bloom-cursor', on ? cursorCss(prefs.shape, prefs.color, prefs.size) : 'auto')
    return () => root.removeAttribute('data-pointer')
  }, [prefs.shape, prefs.color, prefs.size])

  // Effect for this page.
  useEffect(() => {
    if (!canHover() || reduced() || !subOn('pointerFx', 'effects')) return
    const auto = (subOn('pointerFx', 'pageMatch') && pageEffects[page]) || { effect: 'follower' as const }
    const effect = prefs.effect === 'auto' ? auto.effect : prefs.effect
    const emoji = prefs.effect === 'auto' && auto.emoji ? auto.emoji : [prefs.emoji]
    if (effect === 'none') return
    if (effect === 'follower') {
      if (!registered) {
        MouseFollower.registerGSAP(gsap)
        registered = true
      }
      const f = new MouseFollower({ className: 'mf-cursor bloom-follower', stickDelta: subOn('pointerFx', 'magnetic') ? 0.2 : 0, skewing: 2, speed: 0.6, dataAttr: subOn('pointerFx', 'labels') ? 'cursor' : null })
      document.documentElement.style.setProperty('--bloom-follower', prefs.color)
      return () => f.destroy()
    }
    let fx: CursorEffectResult | null = null
    const colors = [prefs.color, '#ffd54f', '#81d4fa', '#f48fb1']
    if (effect === 'emoji') fx = emojiCursor({ emoji })
    if (effect === 'springy') fx = springyEmojiCursor({ emoji: emoji[0] })
    if (effect === 'fairy') fx = fairyDustCursor({ colors })
    if (effect === 'rainbow') fx = rainbowCursor({ colors, length: 16, size: 3 })
    if (effect === 'bubbles') fx = bubbleCursor()
    if (effect === 'snow') fx = snowflakeCursor()
    return () => fx?.destroy()
  }, [page, prefs.effect, prefs.emoji, prefs.color])

  return null
}
